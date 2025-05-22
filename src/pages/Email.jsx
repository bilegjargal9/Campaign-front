import React, { useState, useEffect, useRef } from 'react';
import emailApi from '../api/email';
import campaignApi from '../api/campaign';
import segmentationApi from '../api/segmentation';
import scheduleApi from '../api/emailSchedule';
import Notifier from '../components/notifier';
import { Send, Mail, RefreshCw, Calendar, AlertCircle } from 'lucide-react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import EmailSchedulesComponent from '../components/EmailSchedulesComponent';

const Email = () => {
  const notifierRef = useRef();
  const [loading, setLoading] = useState(false);
  const [availableLimit, setAvailableLimit] = useState(100);
    const [emailAccounts, setEmailAccounts] = useState([]);
  const [bulkEmailData, setBulkEmailData] = useState({
    templateId: '',
    campaignId: '',
    segmentId: ''
  });
  const [scheduleData, setScheduleData] = useState({
    scheduleDate: new Date(),
    description: 'Scheduled email campaign',
    requiresApproval: true
  });
  const [isScheduling, setIsScheduling] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [segments, setSegments] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const [templateFormData, setTemplateFormData] = useState({
    subject: '',
    message: '',
    channel: 'email'
  });
  const [showingPreview, setShowingPreview] = useState(false);
  const [schedulingPreview, setSchedulingPreview] = useState({
    totalEmails: 0,
    dayDistribution: []
  });

  const refreshData = () =>{
    setRefreshKey(prevkey => prevkey+1);
  }

  useEffect(() => {
    fetchRecipients();
    fetchEmailAccounts();
    
    if (selectedCampaign) {
      setBulkEmailData(prev => ({
        ...prev,
        campaignId: selectedCampaign.value,
        segmentId: '',
      }));
    } else {
      setBulkEmailData(prev => ({
        ...prev,
        campaignId: null,
        segmentId: null
      }));
    }
  }, [selectedCampaign, selectedSegment]);



  useEffect(() => {
    updateRecipientsList();
  }, [selectedCampaign, selectedSegment]);

  useEffect(() => {
    if (isScheduling && recipients.length > 0) {
      generateSchedulingPreview();
    }
  }, [recipients, availableLimit, isScheduling, scheduleData.scheduleDate]);

  const generateSchedulingPreview = () => {
    if (recipients.length === 0 || !isScheduling) return;

    const preview = {
      totalEmails: recipients.length,
      dayDistribution: []
    };

    const dailyLimit = emailAccounts.at(0).availableLimit || 100; 
    const scheduledDate = new Date(scheduleData.scheduleDate);
    let remainingEmails = recipients.length;
    let currentDay = new Date(scheduledDate);
    let dayCounter = 0;

    while (remainingEmails > 0 && dayCounter < 10) {
      const emailsForDay = Math.min(remainingEmails, dailyLimit);
      preview.dayDistribution.push({
        date: new Date(currentDay),
        count: emailsForDay
      });
      
      remainingEmails -= emailsForDay;
      currentDay.setDate(currentDay.getDate() + 1);
      dayCounter++;
    }

    setSchedulingPreview(preview);
    setShowingPreview(true);
  };

  const updateRecipientsList = async () => {
    try {
      setLoading(true);
      let allRecipients = [];
      
      if (selectedCampaign) {
        const campaignId = selectedCampaign.value;
        const campaign = await campaignApi.getCampaignDetails(campaignId);
        const campaignRecipients = campaign.audiences;
        allRecipients = campaignRecipients;
      } else if (selectedSegment) {
        const segmentId = selectedSegment.value;
        const segment = await segmentationApi.getSegmentDetails(segmentId);
        const segmentRecipients = segment.customers;
        allRecipients = segmentRecipients;
      }
      
      setRecipients(allRecipients);
    } catch (error) {
      notifierRef.current.show('Failed to load recipients', 'error');
      console.error('Error fetching recipients:', error);
    } finally {
      refreshData();
      setLoading(false);
    }
  };
  const fetchEmailAccounts = async () => {
    try {
      setLoading(true);
      const response = await emailApi.getAllEmailAccounts();
      setEmailAccounts(response);
    } catch (error) {
      notifierRef.current.show(
        error.response?.data?.message || 'Failed to fetch email accounts',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };


  const fetchRecipients = async () => {
    try {
      const campaignsData = await campaignApi.getAllCampaigns();
      const filteredCampaigns = campaignsData
        .filter(campaign => campaign.channel !== 'sms_dial')
        .map(c => ({ value: c.id_uuid, label: c.name }));
      setCampaigns(filteredCampaigns);
      
      const segmentsData = await segmentationApi.getAllSegments();
      setSegments(segmentsData.map(s => ({ value: s.id_uuid, label: s.name })));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };


  const handleTemplateInputChange = (e) => {
    const { name, value } = e.target;
    setTemplateFormData({
      ...templateFormData,
      [name]: value
    });
  };

  const handleDateChange = (date) => {
    setScheduleData({
      ...scheduleData,
      scheduleDate: date
    });
  };

  const handleScheduleInputChange = (e) => {
    const { name, value } = e.target;
    setScheduleData({
      ...scheduleData,
      [name]: value
    });
  };

  const handleChangeAccount = async (email) => {
    try {
      setLoading(true);
      const response = await emailApi.changeAccount(email);
      
      // Update the email accounts list to reflect the change
      setEmailAccounts(prevAccounts => 
        prevAccounts.map(account => ({
          ...account,
          isSelected: account.email === email
        }))
      );
      
      // Update available limit based on newly selected account
      const selectedAccount = emailAccounts.find(account => account.email === email);
      if (selectedAccount) {
        setAvailableLimit(selectedAccount.available_limit || selectedAccount.limit);
      }
      
      notifierRef.current.show('Email account changed successfully', 'success');
    } catch (error) {
      notifierRef.current.show(
        error.response?.data?.message || 'Failed to change email account',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateFormData.subject || !templateFormData.message) {
      return notifierRef.current.show('Subject and message are required', 'warning');
    }
    
    try {
      setLoading(true);
      const response = await scheduleApi.createTemplate({
        channel: 'email',
        subject: templateFormData.subject,
        message: templateFormData.message
      });
      
      notifierRef.current.show('Template created successfully', 'success');
      
      // Set the created template as the selected template
      setBulkEmailData({
        ...bulkEmailData,
        templateId: response.template.id_uuid || response.id_uuid
      });
      
      return response.template.id_uuid || response.id_uuid;
    } catch (error) {
      notifierRef.current.show(
        error.response?.data?.message || 'Failed to create template',
        'error'
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSendBulkEmails = async (e) => {
    e.preventDefault();
    
    if (recipients.length === 0) {
      return notifierRef.current.show('Please select at least one campaign or segment with recipients', 'warning');
    }
    
    try {
      setLoading(true);
      
      // Create template first if there's a new template input
      let templateId = bulkEmailData.templateId;
      if (!templateId && (templateFormData.subject || templateFormData.message)) {
        templateId = await handleCreateTemplate();
        if (!templateId) return; // Failed to create template
      }
      
      if (!templateId) {
        return notifierRef.current.show('Please enter template information', 'warning');
      }

      if (isScheduling) {
        await handleCreateSchedules(recipients, templateId);
        return;
      }

      const campaignId = selectedCampaign ? selectedCampaign.value : null;
      const segmentId = selectedSegment ? selectedSegment.value : null;
      console.log("campaignId: "+campaignId, "segment_id:"+ segmentId)

      const emailList = recipients.map(r => r.customer ? r.customer.email : r.email);
      const response = await emailApi.sendBulk(
        emailList,
        templateId,
        campaignId,
        segmentId,
      );
      
      notifierRef.current.show(
        `Emails queued: ${response.stats?.valid || 0} valid, ${response.stats?.invalid || 0} invalid`,
        'success'
      );
      
      // Reset form data
      setBulkEmailData({
        templateId: '',
        campaignId: '',
        segmentId: ''
      });
      setTemplateFormData({
        subject: '',
        message: '',
        channel: 'email'
      });
      setSelectedCampaign(null);
      setSelectedSegment(null);
    } catch (error) {
      notifierRef.current.show(
        error.response?.data?.message || 'Failed to send bulk emails',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedules = async (recipients, templateId) => {
    try {
      const campaignId = selectedCampaign ? selectedCampaign.value : null;
      const segmentId = selectedSegment ? selectedSegment.value : null;
  
      const dailyLimit = availableLimit || 100;
      let scheduledDate = new Date(scheduleData.scheduleDate);
  
      const scheduleSummary = {};
  
      notifierRef.current.show(
        `Creating ${recipients.length} schedules. This might take a moment...`,
        'info'
      );
      
      const recipientsIds = recipients.map(r => r.audience_id || r.id);
  
      for (let i = 0; i < recipientsIds.length; i += dailyLimit) {
        const chunk = recipientsIds.slice(i, i + dailyLimit);
      
        const currentDate = new Date(scheduledDate);
      
        const ubDateStr = new Date(
          currentDate.toLocaleString('en-US', { timeZone: 'Asia/Ulaanbaatar' })
        ).toISOString();
      
        const dateKey = ubDateStr.split('T')[0];
        scheduleSummary[dateKey] = chunk.length;
      
        await scheduleApi.createSchedule(
          'email',
          segmentId,
          campaignId,
          templateId,
          chunk,
          scheduleData.description,
          ubDateStr
        );
      
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }
      
  
      let summaryMessage = `${recipients.length} emails scheduled successfully:\n`;
      Object.entries(scheduleSummary).forEach(([date, count]) => {
        const formattedDate = new Date(date).toLocaleDateString();
        summaryMessage += `- ${formattedDate}: ${count} emails\n`;
      });
  
      notifierRef.current.show(summaryMessage, 'success');
      // Reset form data
      setBulkEmailData({ templateId: '' });
      setTemplateFormData({
        subject: '',
        message: '',
        channel: 'email'
      });
      setSelectedCampaign(null);
      setSelectedSegment(null);
      setShowingPreview(false);
      refreshData()
    } catch (error) {
      notifierRef.current.show(
        error?.response?.data?.message || 'Failed to create schedules',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Notifier ref={notifierRef} />

            {/* Email Account Management Section */}
            <div className="mb-8">
  <h1 className="text-2xl font-bold">Имэйл хаягууд</h1>

  <div className="bg-white rounded-lg shadow-md">
    {loading && !emailAccounts.length ? (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-gray-600">Имэйлийг татаж байна...</p>
      </div>
    ) : emailAccounts.length > 0 ? (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Имэйл
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Үйлчилгээ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Өдрийн хязгаар
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Өнөөдөр боломжтой
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Үйлдэл
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {emailAccounts.map((account) => (
              <tr key={account.email} className={`hover:bg-gray-50 ${account.isSelected ? "bg-blue-50" : ""}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{account.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 capitalize">{account.service}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{account.limit}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {account.available_limit !== null ? account.available_limit : account.limit}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleChangeAccount(account.email)}
                    disabled={account.isSelected || loading}
                    className={`px-3 py-1 text-xs rounded-md ${
                      account.isSelected 
                        ? "bg-blue-100 text-blue-800 cursor-default" 
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    {account.isSelected ? "Selected" : "Select"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="text-center py-8">
        <Mail size={40} className="mx-auto text-gray-400 mb-2" />
        <p className="text-gray-600">Имэйл хаягийг тохируулаагүй байна</p>
        <p className="text-sm text-gray-500 mt-1">Имэйл илгээхийн тулд имэйл хаяг нэмнэ үү</p>
      </div>
    )}
  </div>
</div>
      
      <EmailSchedulesComponent notifierRef={notifierRef}          
      key={refreshKey}
      onRefresh = {refreshData} />

      {/* Send Bulk Email Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Send size={20} />
            Имэйл илгээх
          </h2>
          <div className="flex items-center">
            <span className="mr-2 text-sm">Хуваарь гаргах уу?</span>
            <div className="relative inline-block w-10 mr-2 align-middle select-none">
              <input
                type="checkbox"
                id="schedule-toggle"
                checked={isScheduling}
                onChange={() => setIsScheduling(!isScheduling)}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              />
              <label
                htmlFor="schedule-toggle"
                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                  isScheduling ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              ></label>
            </div>
          </div>
        </div>

        <form onSubmit={handleSendBulkEmails}>
          <h3 className="text-md font-medium mb-2 mt-4">1. Хүлээн авагчийг сонгох (Нэгийг нь сонгоно уу)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
              Кампанит ажлын форм
              </label>
              <Select
                name="campaigns"
                options={campaigns}
                className="basic-select"
                classNamePrefix="select"
                placeholder="Select a campaign..."
                value={selectedCampaign}
                onChange={(option) => {
                  setSelectedCampaign(option);
                  setSelectedSegment(null); // Clear segment when campaign is selected
                }}
                isDisabled={!!selectedSegment}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
              Сегментийн форм
              </label>
              <Select
                name="segments"
                options={segments}
                className="basic-select"
                classNamePrefix="select"
                placeholder="Select a segment..."
                value={selectedSegment}
                onChange={(option) => {
                  setSelectedSegment(option);
                  setSelectedCampaign(null);
                }}
                isDisabled={!!selectedCampaign}
              />
            </div>
          </div>

          {recipients.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{recipients.length}</span> хүлээн авагчид сонгогдсон байна.
              </p>
            </div>
          )}

          <h3 className="text-md font-medium mb-2 mt-4">2. Дуудлагын зурвас</h3>
          <div className="mb-4">
            <div className="border border-gray-200 rounded-md p-4 mb-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Гарчиг
                </label>
                <input
                  type="text"
                  name="subject"
                  value={templateFormData.subject}
                  onChange={handleTemplateInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Мессеж
                </label>
                <textarea
                  name="message"
                  rows="5"
                  value={templateFormData.message}
                  onChange={handleTemplateInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
            </div>
          </div>

          {isScheduling && (
            <>
              <h3 className="text-md font-medium mb-2 mt-4">3. Хуваарийн тохиргоо</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                  Эхлэх огноо
                  </label>
                  <DatePicker
                    selected={scheduleData.scheduleDate}
                    onChange={handleDateChange}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    minDate={new Date()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                  Тайлбар
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={scheduleData.description}
                    onChange={handleScheduleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {showingPreview && recipients.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-md">
                  <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                    <Calendar size={16} />
                    Хуваарь
                  </h4>
                  <p className="text-sm mb-2">
                  Хуваарилагдсан нийт имэйл: <span className="font-medium">{schedulingPreview.totalEmails}</span>
                  </p>
                  
                  <div className="mt-2">
                    <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">Хуваарийн огноо</h5>
                    <ul className="space-y-1">
                      {schedulingPreview.dayDistribution.map((day, index) => (
                        <li key={index} className="text-sm flex items-center">
                          <span className="inline-block w-32">
                            {day.date.toLocaleDateString()}:
                          </span>
                          <span className="ml-2 font-medium">{day.count} имэйл</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading || ((!templateFormData.subject || !templateFormData.message) && !bulkEmailData.templateId) || recipients.length === 0}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : isScheduling ? (
                <Calendar size={16} />
              ) : (
                <Send size={16} />
              )}
              {isScheduling ? "Хуваарилах" : "Илгээх"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Email;