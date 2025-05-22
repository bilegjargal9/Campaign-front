import React, { useState, useEffect, useRef } from 'react';
import dialApi from '../api/dial';
import campaignApi from '../api/campaign';
import segmentationApi from '../api/segmentation';
import Notifier from '../components/notifier';
import { Phone, RefreshCw, Calendar, AlertCircle, Send, Globe, Upload, Trash } from 'lucide-react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import DialSchedulesComponent from '../components/DialSchedulesComponent';

const Dial = () => {
  const url = "http://localhost:3000";
  const notifierRef = useRef();
  const [loading, setLoading] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [bulkCallData, setBulkCallData] = useState({
    templateId: '',
    campaignId: '',
    segmentId: ''
  });
  const [scheduleData, setScheduleData] = useState({
    scheduleDate: new Date(),
    description: 'Scheduled Call campaign',
    requiresApproval: true
  });
  const [isScheduling, setIsScheduling] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [segments, setSegments] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [templateFormData, setTemplateFormData] = useState({
    message: '',
    channel: 'dial',
    audio_url: ''
  });
  const [showingPreview, setShowingPreview] = useState(false);
  const [schedulingPreview, setSchedulingPreview] = useState({
    totalCalls: 0,
    dayDistribution: []
  });
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState(null);
  const [language, setLanguage] = useState('en'); 
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [audioName, setAudioName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [uploadedAudios, setUploadedAudios] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  useEffect(() => {
    fetchRecipients();
    fetchPhoneNumbers();
    fetchTemplates();
    
    if (selectedCampaign) {
      setBulkCallData(prev => ({
        ...prev,
        campaignId: selectedCampaign.value,
        segmentId: '',
      }));
    } else if (selectedSegment) {
      setBulkCallData(prev => ({
        ...prev,
        campaignId: '',
        segmentId: selectedSegment.value,
      }));
    } else {
      setBulkCallData(prev => ({
        ...prev,
        campaignId: null,
        segmentId: null
      }));
    }
  }, [selectedCampaign, selectedSegment, refreshKey]);

  useEffect(() => {
    updateRecipientsList();
  }, [selectedCampaign, selectedSegment]);

  useEffect(() => {
    if (isScheduling && recipients.length > 0) {
      generateSchedulingPreview();
    }
  }, [recipients, isScheduling, scheduleData.scheduleDate]);

  // Detect language automatically when message changes
  useEffect(() => {
    const detectMessageLanguage = async () => {
      if (templateFormData.message && templateFormData.message.trim() !== '') {
        setIsDetectingLanguage(true);
        try {
          // Simple check for Mongolian Cyrillic characters (very simplified approach)
          const mongolianPattern = /[өүңөөүйёе]/i;
          const seemsMongolian = mongolianPattern.test(templateFormData.message);
          
          setLanguage(seemsMongolian ? 'mn' : 'en');
        } catch (error) {
          console.error('Error detecting language:', error);
          setLanguage('en'); // Default to English on error
        } finally {
          setIsDetectingLanguage(false);
        }
      }
    };

    // Debounce language detection to avoid too many API calls while typing
    const timer = setTimeout(() => {
      detectMessageLanguage();
    }, 500);

    return () => clearTimeout(timer);
  }, [templateFormData.message]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await dialApi.getAllTemplates();
      const response_audio = await dialApi.getAllUploadedTemplates();

      // Combine templates and uploaded audios into a single array
      const allTemplates = [
        ...response.map(t => ({...t, type: 'template'})),
        ...response_audio.map(a => ({...a, type: 'audio'}))
      ];
      
      setTemplates(allTemplates);
      setUploadedAudios(response_audio);
    } catch (error) {
      notifierRef.current.show(
        error.response?.data?.message || 'Failed to fetch templates',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const generateSchedulingPreview = () => {
    if (recipients.length === 0 || !isScheduling) return;

    const preview = {
      totalCalls: recipients.length,
      dayDistribution: []
    };

    // Since there's no limit for calls, we can schedule them all on the selected date
    const scheduledDate = new Date(scheduleData.scheduleDate);
    
    preview.dayDistribution.push({
      date: new Date(scheduledDate),
      count: recipients.length
    });

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
      setLoading(false);
    }
  };
  
  const fetchPhoneNumbers = async () => {
    try {
      setLoading(true);
      const response = await dialApi.getAllPhoneNumbers();
      setPhoneNumbers(response);
      
      // Set the first phone number as selected if there are any available
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
      const filteredCampaigns = campaignsData
        .filter(campaign => campaign.channel !== 'email')
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

  const handleAudioNameChange = (e) => {
    setAudioName(e.target.value);
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
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
      const response = await dialApi.changePhoneNumber(phoneNumber);
      
      // Update the phone numbers list to reflect the change
      setPhoneNumbers(prevNumbers => 
        prevNumbers.map(number => ({
          ...number,
          isSelected: number.number === phoneNumber
        }))
      );
      
      setSelectedPhoneNumber(phoneNumber);
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
      // Set a default audio name based on the file name (without extension)
      const fileName = e.target.files[0].name;
      const nameWithoutExtension = fileName.split('.').slice(0, -1).join('.');
      setAudioName(nameWithoutExtension || fileName);
    }
  };

  const handleUploadAudio = async () => {
    if (!audioFile) {
      return notifierRef.current.show('Please select an audio file', 'warning');
    }
  
    if (!audioName.trim()) {
      return notifierRef.current.show('Please provide a name for the audio file', 'warning');
    }
  
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('audio_name', audioName);

      const res = await fetch(`${url}/dial/uploadAudio`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
  
      const result = await res.json();

      if (!res.ok) throw new Error(result.message);
  
      setTemplateFormData({
        ...templateFormData,
        audio_url: result.path
      });
  
      fetchTemplates();
      refreshData();
  
      notifierRef.current.show('Audio uploaded and template created successfully', 'success');
  
      return result.path;
    } catch (error) {
      notifierRef.current.show('Failed to upload audio file: ' + error.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTemplateSelection = async (templateId) => {
    try {
      setLoading(true);
      
      if (!templateId) {
        setSelectedTemplate(null);
        setBulkCallData({
          ...bulkCallData,
          templateId: ''
        });
        setTemplateFormData({
          message: '',
          channel: 'dial',
          audio_url: ''
        });
        return;
      }
      
      // Find if it's a regular template or uploaded audio
      const selectedItem = templates.find(item => item.id_uuid === templateId);
      
      if (!selectedItem) return;
      
      setSelectedTemplate(selectedItem);
      setBulkCallData({
        ...bulkCallData,
        templateId: selectedItem.id_uuid
      });
      
      setTemplateFormData({
        message: selectedItem.message || '',
        channel: 'dial',
        audio_url: selectedItem.audio_url || ''
      });
      
    } catch (error) {
      notifierRef.current.show(
        error.response?.data?.message || 'Failed to load template',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateFormData.message && !templateFormData.audio_url && !audioFile) {
      return notifierRef.current.show('Either message or audio is required', 'warning');
    }
    
    try {
      setLoading(true);

      // If there's a file selected but not uploaded yet, upload it first
      if (audioFile && !templateFormData.audio_url) {
        const uploadedPath = await handleUploadAudio();
        if (!uploadedPath) return null;
      }
      
      const response = await dialApi.createTemplate({
        channel: 'dial',
        message: templateFormData.message,
        audio_url: templateFormData.audio_url
      });
      
      notifierRef.current.show('Template created successfully', 'success');
      
      // Set the created template as the selected template
      const newTemplateId = response.template?.id_uuid || response.id_uuid;
      setBulkCallData({
        ...bulkCallData,
        templateId: newTemplateId
      });
      
      // Refresh templates list
      fetchTemplates();
      refreshData();
      
      return newTemplateId;
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

  const handleMakeBulkCall = async (e) => {
    e.preventDefault();
    
    if (recipients.length === 0) {
      return notifierRef.current.show('Please select at least one campaign or segment with recipients', 'warning');
    }

    if (!selectedPhoneNumber) {
      return notifierRef.current.show('Please select a phone number to call from', 'warning');
    }
    
    try {
      setLoading(true);

      let templateId = bulkCallData.templateId;

      // If there's content but no selected template, create a new one
      if ((templateFormData.message || templateFormData.audio_url || audioFile) && !templateId) {
        templateId = await handleCreateTemplate();
        if (!templateId) return;
      }
      
      if (!templateId) {
        return notifierRef.current.show('Please enter message content, provide audio URL, or select a template', 'warning');
      }

      if (isScheduling) {
        // Get the list of customer IDs from recipients
        const customerIds = recipients.map(recipient => recipient.customer.id_uuid);
        
        const scheduleResponse = await dialApi.createSchedule(
          'call',
          bulkCallData.segmentId || null,
          bulkCallData.campaignId || null,
          templateId,
          customerIds,
          scheduleData.description,
          scheduleData.scheduleDate
        );
        
        notifierRef.current.show(`Scheduled ${scheduleResponse.scheduledCount} calls successfully`, 'success');
      } else {
        // Get the list of phone numbers from recipients
        const phoneList = recipients
          .filter(recipient => recipient.customer.phone_number)
          .map(recipient => recipient.customer.phone_number);
          
        if (phoneList.length === 0) {
          return notifierRef.current.show('No valid phone numbers found in selected recipients', 'warning');
        }
        
        const bulkResponse = await dialApi.makeCallBulk(
          phoneList,
          templateId,
          bulkCallData.campaignId || null,
          bulkCallData.segmentId || null
        );
        
        notifierRef.current.show(`${bulkResponse.stats.valid} calls queued successfully`, 'success');
      }
      
      // Reset form after successful submission
      setTemplateFormData({
        message: '',
        channel: 'dial',
        audio_url: ''
      });
      setAudioFile(null);
      setAudioName('');
      setSelectedTemplate(null);
      setBulkCallData({
        templateId: '',
        campaignId: '',
        segmentId: ''
      });
      setShowingPreview(false);
      refreshData();
      
    } catch (error) {
      notifierRef.current.show(
        error.response?.data?.message || 'Failed to process call request',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoneNumber = async (number) => {
    try {
      setLoading(true);
      await dialApi.deletePhoneNumber(number);
      
      // Remove the deleted number from the list
      setPhoneNumbers(phoneNumbers.filter(phone => phone.number !== number));
      
      if (selectedPhoneNumber === number) {
        // If the deleted number was selected, select another one if available
        if (phoneNumbers.length > 1) {
          const newSelected = phoneNumbers.find(phone => phone.number !== number);
          setSelectedPhoneNumber(newSelected?.number || null);
        } else {
          setSelectedPhoneNumber(null);
        }
      }
      
      notifierRef.current.show('Phone number deleted successfully', 'success');
      refreshData();
    } catch (error) {
      notifierRef.current.show(
        error.response?.data?.message || 'Failed to delete phone number',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const getRelativeAudioPath = (fullPath) => {
    const index = fullPath.indexOf('/audio/');
    return index !== -1 ? fullPath.substring(index) : fullPath;
  };
  
  return (
    <div className="container mx-auto p-4">
      <Notifier ref={notifierRef} />
      
      <h1 className="text-3xl font-bold mb-6">Voice Call System</h1>
      
      {/* Phone Number Management Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Бүртгэгдсэн Утасны дугаарууд</h2>

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
                        <div className="flex space-x-2">
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
                          
                          {!number.isSelected && (
                            <button
                              onClick={() => handleDeletePhoneNumber(number.number)}
                              className="px-3 py-1 text-xs rounded-md bg-red-500 text-white hover:bg-red-600"
                            >
                              Delete
                            </button>
                          )}
                        </div>
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
              <p className="text-sm text-gray-500 mt-1">Voice call илгээж эхлэхийн тулд утасны дугаар нэмнэ үү!</p>
            </div>
          )}
        </div>
      </div>

      {/* Schedules Component */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Call Schedules</h2>
        <DialSchedulesComponent 
          notifierRef={notifierRef}
          onRefresh={refreshData} 
        />
      </div>
      
      {/* Call Content Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Phone className="mr-2" size={20} />
          Call Content
        </h2>

        {/* Template Selection - Combined for both templates and audio files */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Existing Template or Audio
          </label>
          <select 
            className="w-full p-2 border rounded-md"
            value={bulkCallData.templateId || ''}
            onChange={(e) => handleTemplateSelection(e.target.value)}
          >
            <option value="">-- Create New Template --</option>
            {templates.map(template => (
              <option key={template.id_uuid} value={template.id_uuid}>
                {template.type === 'audio' ? '🔊 ' : '📝 '}
                {template.message 
                  ? `${template.message.substring(0, 30)}${template.message.length > 30 ? '...' : ''}`
                  : `Audio template ${template.audio_url ? '(with audio)' : ''}`}
              </option>
            ))}
          </select>
        </div>
        
        {/* Language Selection */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Globe className="mr-2" size={16} />
            Message Language
            {isDetectingLanguage && <RefreshCw className="ml-2 animate-spin" size={16} />}
          </label>
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="language"
                value="en"
                checked={language === 'en'}
                onChange={handleLanguageChange}
                className="mr-1"
              />
              <span>English (Twilio TTS)</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="language"
                value="mn"
                checked={language === 'mn'}
                onChange={handleLanguageChange}
                className="mr-1"
              />
              <span>Mongolian (Google TTS)</span>
            </label>
          </div>
        </div>
        
        {/* Message Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message Text
          </label>
          <textarea
            name="message"
            value={templateFormData.message}
            onChange={handleTemplateInputChange}
            className="w-full p-2 border rounded-md"
            rows={4}
            placeholder={`Enter your message in ${language === 'en' ? 'English' : 'Mongolian'}...`}
          ></textarea>
          <p className="text-xs text-gray-500 mt-1">
            {language === 'en' 
              ? 'For English messages, Twilio will convert text to speech automatically' 
              : 'For Mongolian messages, we will generate audio using Google Cloud TTS'}
          </p>
        </div>
        
        {/* Audio File Upload */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Upload size={16} className="mr-2" />
            Upload New Audio File
          </label>
          <div className="flex flex-col space-y-2">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="w-full p-2 border rounded-md"
            />
            
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Enter audio name"
                value={audioName}
                onChange={handleAudioNameChange}
                className="w-full p-2 border rounded-md"
              />
            </div>
            
            <button
              onClick={handleUploadAudio}
              disabled={!audioFile || !audioName.trim() || isUploading}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300 flex items-center justify-center"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="animate-spin mr-2" size={16} />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2" size={16} />
                  Upload Audio
                </>
              )}
            </button>
          </div>
          
          {templateFormData.audio_url && (
            <div className="mt-2">
              <p className="text-sm text-green-600">Audio URL: {getRelativeAudioPath(templateFormData.audio_url)}</p>
              <audio controls className="mt-1 w-full">
                <source src={getRelativeAudioPath(templateFormData.audio_url)} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>
      </div>
      
      {/* Campaign/Segment Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">Recipients</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Campaign (Optional)
            </label>
            <Select
              isClearable
              value={selectedCampaign}
              onChange={(option) => {
                setSelectedCampaign(option);
                if (option) setSelectedSegment(null);
              }}
              options={campaigns}
              placeholder="Select a campaign"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Segment (Optional)
            </label>
            <Select
              isClearable
              value={selectedSegment}
              onChange={(option) => {
                setSelectedSegment(option);
                if (option) setSelectedCampaign(null);
              }}
              options={segments}
              placeholder="Select a segment"
              className="w-full"
              isDisabled={selectedCampaign !== null}
            />
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="text-md font-medium mb-2">Recipients Preview</h3>
          <div className="border rounded-md p-3 bg-gray-50">
            <p>Total recipients: {recipients.length}</p>
            {recipients.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  First few recipients: {recipients.slice(0, 3).map(r => r.name || r.customer.phone_number).join(', ')}
                  {recipients.length > 3 && '...'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Send Now or Schedule Option */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Delivery Options</h2>
        
        <div className="flex items-center space-x-4 mb-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="deliveryOption"
              checked={!isScheduling}
              onChange={() => setIsScheduling(false)}
              className="mr-1"
            />
            <Send size={16} className="mr-1" />
            <span>Send Immediately</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="deliveryOption"
              checked={isScheduling}
              onChange={() => setIsScheduling(true)}
              className="mr-1"
            />
            <Calendar size={16} className="mr-1" />
            <span>Schedule for Later</span>
          </label>
        </div>
        
        {isScheduling && (
          <div className="mb-4">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule Date & Time
              </label>
              <DatePicker
                selected={scheduleData.scheduleDate}
                onChange={handleDateChange}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="MMMM d, yyyy h:mm aa"
                className="w-full p-2 border rounded-md"
                minDate={new Date()}
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                name="description"
                value={scheduleData.description}
                onChange={handleScheduleInputChange}
                className="w-full p-2 border rounded-md"
                placeholder="Enter a description for this scheduled campaign"
              />
            </div>
            
            {showingPreview && (
              <div className="p-3 border rounded-md bg-blue-50">
                <div className="flex items-center mb-2">
                  <AlertCircle size={16} className="text-blue-500 mr-2" />
                  <h4 className="font-medium">Schedule Preview</h4>
                </div>
                <p>Total calls to be scheduled: {schedulingPreview.totalCalls}</p>
                {schedulingPreview.dayDistribution.map((day, idx) => (
                  <p key={idx} className="text-sm">
                    {day.date.toLocaleDateString()}: {day.count} calls
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={handleMakeBulkCall}
          disabled={loading || recipients.length === 0 || (!selectedPhoneNumber)}
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-300 flex items-center"
        >
          {loading && <RefreshCw className="animate-spin mr-2" size={16} />}
          {isScheduling ? 'Schedule Calls' : 'Send Calls Now'}
        </button>
      </div>
      
    </div>
  );
};

export default Dial;