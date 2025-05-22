//sms page
import React, { useState, useEffect, useRef } from 'react';
import smsApi from '../api/sms';
import campaignApi from '../api/campaign';
import segmentationApi from '../api/segmentation';
import Notifier from '../components/notifier';
import { MessageSquare, Phone, RefreshCw, Calendar, AlertCircle, Send } from 'lucide-react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import SmsSchedulesComponent from '../components/SmsScheduleComponent';

const Sms = () => {
  const notifierRef = useRef();
  const [loading, setLoading] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [bulkSmsData, setBulkSmsData] = useState({
    templateId: '',
    campaignId: '',
    segmentId: ''
  });
  const [scheduleData, setScheduleData] = useState({
    scheduleDate: new Date(),
    description: 'Scheduled SMS campaign',
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
    message: '',
    channel: 'sms'
  });
  const [showingPreview, setShowingPreview] = useState(false);
  const [schedulingPreview, setSchedulingPreview] = useState({
    totalMessages: 0,
    dayDistribution: []
  });
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState(null);

  useEffect(() => {
    fetchRecipients();
    fetchPhoneNumbers();
    
    if (selectedCampaign) {
      setBulkSmsData(prev => ({
        ...prev,
        campaignId: selectedCampaign.value,
        segmentId: '',
      }));
    } else if (selectedSegment) {
      setBulkSmsData(prev => ({
        ...prev,
        campaignId: '',
        segmentId: selectedSegment.value,
      }));
    } else {
      setBulkSmsData(prev => ({
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
  }, [recipients, isScheduling, scheduleData.scheduleDate]);

  const generateSchedulingPreview = () => {
    if (recipients.length === 0 || !isScheduling) return;

    const preview = {
      totalMessages: recipients.length,
      dayDistribution: []
    };

    const scheduledDate = new Date(scheduleData.scheduleDate);
    
    preview.dayDistribution.push({
      date: new Date(scheduledDate),
      count: recipients.length
    });

    setSchedulingPreview(preview);
    setShowingPreview(true);
  };

  const refreshData = () =>{
    setRefreshKey(prevkey => prevkey+1);
  }

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
      setLoading(false);
    }
  };
  
  const fetchPhoneNumbers = async () => {
    try {
      setLoading(true);
      const response = await smsApi.getAllPhoneNumbers();
      setPhoneNumbers(response);
      
      if (response && response.length > 0) {
        const defaultSelected = response.find(phone => phone.isSelected) || response[0];
        setSelectedPhoneNumber(defaultSelected.number);
      }
    } catch (error) {
      notifierRef.current.show(
        error.response?.data?.message || 'Failed to fetch phone numbers',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipients = async () => {
    try {
      const campaignsData = await campaignApi.getAllCampaigns();
      const filteredCampaigns = campaignsData.filter(campaign =>  campaign.channel !== 'email')
      .map(c => ({ value: c.id_uuid, label: c.name }));
      setCampaigns(filteredCampaigns);

      const segmentsData = await segmentationApi.getAllSegments();
      setSegments(segmentsData.map(s => ({ value: s.id_uuid, label: s.name })));
    } catch (error) {
      console.error('Error fetching data:', error);
      notifierRef.current.show('Failed to fetch campaigns or segments', 'error');
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

  const handleChangePhoneNumber = async (phoneNumber) => {
    try {
      setLoading(true);
      const response = await smsApi.changePhoneNumber(phoneNumber);
      
      setPhoneNumbers(prevNumbers => 
        prevNumbers.map(number => ({
          ...number,
          isSelected: number.number === phoneNumber
        }))
      );
      
      notifierRef.current.show('Phone number changed successfully', 'success');
    } catch (error) {
      notifierRef.current.show(
        error.response?.data?.message || 'Failed to change phone number',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateFormData.message) {
      return notifierRef.current.show('Message is required', 'warning');
    }
    
    try {
      setLoading(true);

      const response = await smsApi.createTemplate({
        channel: 'sms',
        message: templateFormData.message
      });
      
      notifierRef.current.show('Template created successfully', 'success');
      
      setBulkSmsData({
        ...bulkSmsData,
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

  const handleSendBulkSMS = async (e) => {
    e.preventDefault();
    
    if (recipients.length === 0) {
      return notifierRef.current.show('Please select at least one campaign or segment with recipients', 'warning');
    }

    if (!selectedPhoneNumber) {
      return notifierRef.current.show('Please select a phone number to send from', 'warning');
    }
    
    try {
      setLoading(true);

      let templateId = bulkSmsData.templateId;

      
      if (templateFormData.message) {
          templateId = await handleCreateTemplate();
        if (!templateId) return;
      }
      
      if (!templateId) {
        return notifierRef.current.show('Please enter message content', 'warning');
      }

      if (isScheduling) {
        await handleCreateSchedules(recipients, templateId);
        return;
      }

      const campaignId = selectedCampaign ? selectedCampaign.value : null;
      const segmentId = selectedSegment ? selectedSegment.value : null;

      const phoneList = recipients.map(r => r.customer ? r.customer.phone_number : r.phone);
      const response = await smsApi.sendBulk(
        phoneList,
        templateId,
        campaignId,
        segmentId,
      );
      
      notifierRef.current.show(
        `SMS queued: ${response.stats?.valid || 0} valid, ${response.stats?.invalid || 0} invalid`,
        'success'
      );
      
      setBulkSmsData({
        templateId: '',
        campaignId: '',
        segmentId: ''
      });
      setTemplateFormData({
        message: '',
        channel: 'sms'
      });
      setSelectedCampaign(null);
      setSelectedSegment(null);
    } catch (error) {
      notifierRef.current.show(
        error.response?.data?.message || 'Failed to send bulk SMS',
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
  
      let scheduledDate = new Date(scheduleData.scheduleDate);
      const recipientsIds = recipients.map(r => r.audience_id || r.id);
  
      notifierRef.current.show(
        `Creating schedule for ${recipients.length} SMS. This might take a moment...`,
        'info'
      );
      
      const currentDate = new Date(scheduledDate);
      const ubDateStr = new Date(
        currentDate.toLocaleString('en-US', { timeZone: 'Asia/Ulaanbaatar' })
      ).toISOString();

      console.log({
        templateId,
        recipientsIds,
        ubDateStr
      });
      
      await smsApi.createSchedule(
        'sms',
        segmentId,
        campaignId,
        templateId,
        recipientsIds,
        scheduleData.description,
        ubDateStr
      );
      
      const formattedDate = new Date(scheduledDate).toLocaleDateString();
      const summaryMessage = `${recipients.length} SMS scheduled successfully for ${formattedDate}`;
  
      notifierRef.current.show(summaryMessage, 'success');
  
      setBulkSmsData({ templateId: '' });
      setTemplateFormData({
        message: '',
        channel: 'sms'
      });
      setSelectedCampaign(null);
      setSelectedSegment(null);
      setShowingPreview(false);
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

      {/* Phone Number Management Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Бүртгэгдсэн Утасны дугаарууд</h1>

        <div className="bg-white rounded-lg shadow-md">
          {loading && !phoneNumbers.length ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Утасны дугааруудыг татаж байна...</p>
            </div>
          ) : phoneNumbers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Утасны дугаар
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Үйлчилгээ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Төлөв
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Үйлдэл
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {phoneNumbers.map((number) => (
                    <tr key={number.number} className={`hover:bg-gray-50 ${number.isSelected ? "bg-blue-50" : ""}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{number.number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 capitalize">Twilio</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          number.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {number.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleChangePhoneNumber(number.number)}
                          disabled={number.isSelected || loading}
                          className={`px-3 py-1 text-xs rounded-md ${
                            number.isSelected 
                              ? "bg-blue-100 text-blue-800 cursor-default" 
                              : "bg-blue-500 text-white hover:bg-blue-600"
                          }`}
                        >
                          {number.isSelected ? "Selected" : "Select"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Phone size={40} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">Утасны дугаарыг тохируулаагүй байна</p>
              <p className="text-sm text-gray-500 mt-1">SMS илгээж эхлэхийн тулд утасны дугаар нэмнэ үү!</p>
            </div>
          )}
        </div>
      </div>
      
      <SmsSchedulesComponent notifierRef={notifierRef}       
      key={refreshKey}
      onRefresh = {refreshData} />

      {/* Send Bulk SMS Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare size={20} />
            SMS илгээх
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

        <form onSubmit={handleSendBulkSMS}>
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
                  setSelectedSegment(null); 
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

          <h3 className="text-md font-medium mb-2 mt-4">2. SMS мессеж</h3>
          <div className="mb-4">
            <div className="border border-gray-200 rounded-md p-4 mb-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  name="message"
                  rows="4"
                  value={templateFormData.message}
                  onChange={handleTemplateInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter your SMS message here..."
                ></textarea>
                <p className="text-xs text-gray-500 mt-2">
                  {templateFormData.message.length}/160 тэмдэгт
                  {templateFormData.message.length > 160 && (
                    <span className="text-yellow-600"> (олон мессеж хэлбэрээр илгээгдэх болно)</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {isScheduling && (
            <>
              <h3 className="text-md font-medium mb-2 mt-4">3. Хуваарь тохиргоо</h3>
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
                    Илгээх хуваарийг харах
                  </h4>
                  <p className="text-sm mb-2">
                  Төлөвлөсөн нийт SMS: <span className="font-medium">{schedulingPreview.totalMessages}</span>
                  </p>
                  
                  <div className="mt-2">
                    <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Төлөвлөсөн огноо
                    </h5>
                    <div className="text-sm">
                      <span className="font-medium">
                        {schedulingPreview.dayDistribution[0]?.date.toLocaleDateString()}:
                      </span>
                      <span className="ml-2">
                        {schedulingPreview.dayDistribution[0]?.count} зурвасууд
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading || !templateFormData.message || recipients.length === 0 || !selectedPhoneNumber}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
          >
              {loading ? (
                <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : isScheduling ? (
                <Calendar size={16} />
              ) : (
                <Send size={16} />
              )}
              {isScheduling ? "Хуваарилах" : "Одоо илгээх"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Sms;