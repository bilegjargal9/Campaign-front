import React, { useState, useEffect, useRef } from 'react';
import { 
  Filter, 
  Download, 
  ChevronDown, 
  ChevronUp,
  FileText,
  User,
  Users,
  Mail,
  Phone,
  Megaphone
} from 'lucide-react';
import Notifier from '../components/notifier';
import campaignApi from '../api/campaign';
import segmentationApi from '../api/segmentation';
import reportApi from '../api/report';
import { useFetcher } from 'react-router-dom';

const Report = () => {
  const [reportType, setReportType] = useState('campaign');
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [filters, setFilters] = useState({});
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [segments, setSegments] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [entityId, setEntityId] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [channels, setChannels] = useState(['email', 'sms', 'voice', 'all']);
  const [statuses, setStatuses] = useState(['success', 'failed', 'pending']);
  const [savedReports, setSavedReports] = useState([]);
  const [loadedReport, setLoadedReport] = useState(null);
  
  const notifierRef = useRef();

  useEffect(() => {    
    fetchEntities();
  }, []);

  useEffect(()=>{
    fetchEntities();
  }, [reportData]);
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

      const fetchEntities = async () => {
        try {
          const campaignsRes = await campaignApi.getAllCampaigns();
          setCampaigns(campaignsRes);
  
          
          const segmentsRes = await segmentationApi.getAllSegments();
          setSegments(segmentsRes);
          
          const reportsRes = await reportApi.getReports();
          setSavedReports(reportsRes.data);
        } catch (error) {
          notifierRef.current.show('Error fetching entities: ' + error.message, 'error');
        }
      };
  
  const generateReport = async () => {
    if (!title.trim()) {
      notifierRef.current.show('Please enter a report title', 'warning');
      return;
    }
    
    setLoading(true);
    
    try {
      const reportPayload = {
        title,
        type: reportType,
        startDate,
        endDate,
        filters,
        description,
        entityId: entityId || null
      };
      
      const response = await reportApi.createReport(reportPayload);
      
      setReportData(response.data.data);
      setLoadedReport(response.data.report);
      notifierRef.current.show(response.data.message || 'Report generated successfully!', 'success');
    } catch (error) {
      notifierRef.current.show('Error generating report: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const loadReport = async (reportId) => {
    setLoading(true);
    try {
      const response = await reportApi.getReportById(reportId);
      
      const report = response.data.report;
      setTitle(report.title);
      setReportType(report.type);
      setStartDate(new Date(report.start_date).toISOString().split('T')[0]);
      setEndDate(new Date(report.end_date).toISOString().split('T')[0]);
      setDescription(report.description || '');
      setEntityId(report.entity_id || '');
      setFilters(JSON.parse(report.filters || '{}'));
      
      setReportData(response.data.data);
      setLoadedReport(report);
      
      notifierRef.current.show('Report loaded successfully!', 'success');
    } catch (error) {
      notifierRef.current.show('Error loading report: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const downloadReport = () => {
    if (!reportData) return;
    
    const convertToCSV = (data) => {
      if (!data) return '';
      
      let csv = '';
      let headers = [];
      
      switch (reportType) {
        case 'campaign':
          headers = ['Campaign', 'Audience', 'Success', 'Failed', 'Pending', 'Total'];
          break;
        case 'delivery':
          headers = ['Date', 'Channel', 'Status', 'Template'];
          break;
        case 'customer':
          headers = ['Name', 'Email', 'Phone', 'Age', 'Segments', 'Deliveries'];
          break;
        case 'segment':
          headers = ['Segment Name', 'Audience', 'With Email', 'With Phone', 'Deliveries', 'Success Rate'];
          break;
        default:
          return '';
      }
      
      csv += headers.join(',') + '\r\n';
      
      switch (reportType) {
        case 'campaign':
          data.campaigns.forEach(camp => {
            csv += [
              `"${camp.name}"`,
              camp.audienceCount,
              camp.deliveries.success,
              camp.deliveries.failed,
              camp.deliveries.pending,
              camp.deliveries.total
            ].join(',') + '\r\n';
          });
          break;
          
        case 'delivery':
          data.deliveries.forEach(delivery => {
            csv += [
              `"${new Date(delivery.date).toLocaleString()}"`,
              `"${delivery.channel}"`,
              `"${delivery.status}"`,
              `"${delivery.template?.subject || 'N/A'}"`
            ].join(',') + '\r\n';
          });
          break;
          
        case 'customer':
          data.customers.forEach(customer => {
            csv += [
              `"${customer.name}"`,
              `"${customer.email || '—'}"`,
              `"${customer.phone || '—'}"`,
              customer.age || '—',
              `"${customer.segments.length ? customer.segments.slice(0, 2).join(', ') + (customer.segments.length > 2 ? '...' : '') : '—'}"`,
              `"${customer.deliveries.success}/${customer.deliveries.failed}/${customer.deliveries.total}"`
            ].join(',') + '\r\n';
          });
          break;
          
        case 'segment':
          data.segments.forEach(segment => {
            const successRate = segment.deliveries.total ? 
              ((segment.deliveries.success / segment.deliveries.total) * 100).toFixed(1) + '%' : 
              '—';
            
            csv += [
              `"${segment.name}"`,
              segment.audienceCount,
              segment.audienceWithEmail,
              segment.audienceWithPhone,
              `"${segment.deliveries.success}/${segment.deliveries.failed}/${segment.deliveries.total}"`,
              `"${successRate}"`
            ].join(',') + '\r\n';
          });
          break;
      }
      
      return csv;
    };
    
    const csvData = convertToCSV(reportData);
    

    const dataBlob = new Blob([csvData], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    notifierRef.current.show('Report downloaded as Excel file!', 'success');
  };
  
  const renderReportContent = () => {
    if (!reportData) return null;
    
    switch (reportType) {
      case 'campaign':
        return renderCampaignReport();
      case 'delivery':
        return renderDeliveryReport();
      case 'customer':
        return renderCustomerReport();
      case 'segment':
        return renderSegmentReport();
      default:
        return <div className="text-center py-10">Select a report type</div>;
    }
  };
  
  const renderCampaignReport = () => {
    const { summary, campaigns, dateRange } = reportData;
    
    const deliveryStatusData = campaigns.map(camp => ({
      name: camp.name,
      success: camp.deliveries.success,
      failed: camp.deliveries.failed,
      pending: camp.deliveries.pending
    }));
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Кампанит ажлын хураангуй</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-blue-800 text-sm font-medium">Нийт Кампанит ажил</div>
              <div className="text-2xl font-bold mt-1">{summary.totalCampaigns}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-green-800 text-sm font-medium">Нийт Илээлт</div>
              <div className="text-2xl font-bold mt-1">{summary.totalDeliveries}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-purple-800 text-sm font-medium">Амжилттай илгээлтийн хувь</div>
              <div className="text-2xl font-bold mt-1">{summary.successRate}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Илээлтийн статус Кампанит ажилаар</h3>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Кампанит ажил</th>
                  <th className="px-4 py-2 text-right">Хүлээн авагч</th>
                  <th className="px-4 py-2 text-right">Амжилттай</th>
                  <th className="px-4 py-2 text-right">Амжилтгүй</th>
                  <th className="px-4 py-2 text-right">Хүлээгдэж буй</th>
                  <th className="px-4 py-2 text-right">Нийт</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((camp, idx) => (
                  <tr key={camp.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="px-4 py-2">{camp.name}</td>
                    <td className="px-4 py-2 text-right">{camp.audienceCount}</td>
                    <td className="px-4 py-2 text-right text-green-600">{camp.deliveries.success}</td>
                    <td className="px-4 py-2 text-right text-red-600">{camp.deliveries.failed}</td>
                    <td className="px-4 py-2 text-right text-yellow-600">{camp.deliveries.pending}</td>
                    <td className="px-4 py-2 text-right font-semibold">{camp.deliveries.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Дэлгэрэнгүй</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Огноо</p>
              <p className="font-medium">
                {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Generated On</p>
              <p className="font-medium">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderDeliveryReport = () => {
    const { summary, timeline, deliveries, dateRange } = reportData;
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Илээлтийн хураангуй</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-blue-800 text-sm font-medium">Нийт илээлт</div>
              <div className="text-2xl font-bold mt-1">{summary.totalDeliveries}</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-green-800 text-sm font-medium">Амжилттай</div>
              <div className="text-2xl font-bold mt-1">{summary.byStatus.success || 0}</div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-red-800 text-sm font-medium">Амжилтгүй</div>
              <div className="text-2xl font-bold mt-1">{summary.byStatus.failed || 0}</div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Төлвөөр</h3>
            <div className="h-60">
              {/* Placeholder for pie chart visualization */}
              <div className="flex h-full justify-around items-center">
                {Object.entries(summary.byStatus).map(([status, count]) => (
                  <div key={status} className="text-center">
                    <div className={`inline-block w-4 h-4 rounded-full ${
                      status === 'success' ? 'bg-green-500' : 
                      status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></div>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-gray-600 capitalize">{status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Сувгаар</h3>
            <div className="h-60">
              {/* Placeholder for pie chart visualization */}
              <div className="flex h-full justify-around items-center">
                {Object.entries(summary.byChannel).map(([channel, count]) => (
                  <div key={channel} className="text-center">
                    <div className={`inline-block w-4 h-4 rounded-full ${
                      channel === 'email' ? 'bg-blue-500' : 
                      channel === 'sms' ? 'bg-purple-500' : 
                      channel === 'voice' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}></div>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-gray-600 capitalize">{channel}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Өдөр тутмын илгээлтийн хэмжээ</h3>
          <div className="h-60">
            {/* Placeholder for timeline chart visualization */}
            <div className="flex h-full items-end justify-between">
              {timeline.map((day) => (
                <div key={day.date} className="flex flex-col items-center" style={{width: `${100/timeline.length}%`}}>
                  <div className="bg-blue-500 w-full max-w-md" style={{height: `${day.count * 2}px`}}></div>
                  <div className="text-xs mt-1 text-gray-600">{new Date(day.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Ойрын илээлт</h3>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Огноо</th>
                  <th className="px-4 py-2 text-left">Суваг</th>
                  <th className="px-4 py-2 text-left">Төлөв</th>
                  <th className="px-4 py-2 text-left">Template</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.slice(0, 10).map((delivery, idx) => (
                  <tr key={delivery.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="px-4 py-2">{new Date(delivery.date).toLocaleString()}</td>
                    <td className="px-4 py-2 capitalize">{delivery.channel}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        delivery.status === 'success' ? 'bg-green-100 text-green-800' : 
                        delivery.status === 'failed' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {delivery.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{delivery.template?.subject || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  const renderCustomerReport = () => {
    const { summary, customers, dateRange } = reportData;
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Хүлээн авагчийн хураангуй</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-blue-800 text-sm font-medium">Нийт хүлээн авагч</div>
              <div className="text-2xl font-bold mt-1">{summary.totalCustomers}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-green-800 text-sm font-medium">Имэйлтэй</div>
              <div className="text-2xl font-bold mt-1">{summary.withEmail}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-purple-800 text-sm font-medium">Утастай</div>
              <div className="text-2xl font-bold mt-1">{summary.withPhone}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Нас</h3>
          <div className="h-60">
            {/* Placeholder for age demographics chart */}
            <div className="flex h-full justify-around items-end">
              {Object.entries(summary.ageDemographics).map(([ageGroup, count]) => (
                <div key={ageGroup} className="flex flex-col items-center" style={{width: `${100/Object.keys(summary.ageDemographics).length}%`}}>
                  <div className="bg-blue-500 w-full max-w-md rounded-t-md" style={{height: `${(count/summary.totalCustomers) * 200}px`}}></div>
                  <div className="text-xs mt-1">{ageGroup}</div>
                  <div className="text-sm font-semibold mt-1">{count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Хүлээн авагчийн жагсаалт</h3>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Нэр</th>
                  <th className="px-4 py-2 text-left">Имэйл</th>
                  <th className="px-4 py-2 text-left">Утасны дугаар</th>
                  <th className="px-4 py-2 text-left">Нас</th>
                  <th className="px-4 py-2 text-left">Сегмент</th>
                  <th className="px-4 py-2 text-right">Илээлт</th>
                </tr>
              </thead>
              <tbody>
                {customers.slice(0, 10).map((customer, idx) => (
                  <tr key={customer.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="px-4 py-2">{customer.name}</td>
                    <td className="px-4 py-2">{customer.email || '—'}</td>
                    <td className="px-4 py-2">{customer.phone || '—'}</td>
                    <td className="px-4 py-2">{customer.age || '—'}</td>
                    <td className="px-4 py-2">
                      {customer.segments.length ? 
                        customer.segments.slice(0, 2).join(', ') + (customer.segments.length > 2 ? '...' : '') : 
                        '—'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className="text-green-600">{customer.deliveries.success}</span>
                      {' / '}
                      <span className="text-red-600">{customer.deliveries.failed}</span>
                      {' / '}
                      <span className="font-semibold">{customer.deliveries.total}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {customers.length > 10 && (
              <div className="text-center mt-4 text-gray-600">
                Showing 10 of {customers.length} customers
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const renderSegmentReport = () => {
    const { summary, segments, dateRange } = reportData;
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Сегмент хураангуй</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-blue-800 text-sm font-medium">Нийт Сегмент</div>
              <div className="text-2xl font-bold mt-1">{summary.totalSegments}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-green-800 text-sm font-medium">Дундаж. Хүлээн авагчийн хэмжээ</div>
              <div className="text-2xl font-bold mt-1">{summary.averageAudienceSize}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Сегмент Дэлгэрэнгүй</h3>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Сегментийн Нэр</th>
                  <th className="px-4 py-2 text-right">Хүлээн авагч</th>
                  <th className="px-4 py-2 text-right">Имэйлтэй</th>
                  <th className="px-4 py-2 text-right">Утастай</th>
                  <th className="px-4 py-2 text-right">Хүлээн авагч</th>
                  <th className="px-4 py-2 text-right">Амжилттай хувь</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((segment, idx) => (
                  <tr key={segment.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="px-4 py-2">{segment.name}</td>
                    <td className="px-4 py-2 text-right">{segment.audienceCount}</td>
                    <td className="px-4 py-2 text-right">{segment.audienceWithEmail}</td>
                    <td className="px-4 py-2 text-right">{segment.audienceWithPhone}</td>
                    <td className="px-4 py-2 text-right">
                      <span className="text-green-600">{segment.deliveries.success}</span>
                      {' / '}
                      <span className="text-red-600">{segment.deliveries.failed}</span>
                      {' / '}
                      <span className="font-semibold">{segment.deliveries.total}</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {segment.deliveries.total ? 
                        ((segment.deliveries.success / segment.deliveries.total) * 100).toFixed(1) + '%' : 
                        '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Audience Distribution</h3>
          <div className="h-60">
            {/* Placeholder for audience distribution chart */}
            <div className="flex h-full justify-around items-end">
              {segments.slice(0, 5).map((segment) => (
                <div key={segment.id} className="flex flex-col items-center" style={{width: `${100/Math.min(segments.length, 5)}%`}}>
                  <div className="bg-blue-500 w-full max-w-md rounded-t-md" style={{height: `${segment.audienceCount * 2}px`}}></div>
                  <div className="text-xs mt-1 truncate max-w-full px-2">{segment.name}</div>
                  <div className="text-sm font-semibold mt-1">{segment.audienceCount}</div>
                </div>
              ))}
            </div>
          </div>
          {segments.length > 5 && (
            <div className="text-center mt-4 text-gray-600">
              Showing top 5 of {segments.length} segments
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Notifier ref={notifierRef} />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Тайлан</h1>
        <div className="flex space-x-2">
        {reportData && (
          <button
            onClick={downloadReport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download size={16} className="mr-2" />
            Export файл болгон авах
          </button>
        )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Тайлангийн тохируулга</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тайлан</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Гарчиг өгнө үү"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тайлангийн төрөл</label>
              <select 
                value={reportType} 
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="campaign">Кампанит ажлын Тайлан</option>
                <option value="delivery">Илээлтийн Тайлан</option>
                <option value="customer">Хүлээн авагчийн Тайлан</option>
                <option value="segment">Сегментийн Тайлан</option>
              </select>
            </div>
            
            {(reportType === 'campaign' || reportType === 'segment') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {reportType === 'campaign' ? 'Кампанит ажил сонгох' : 'Сегмент сонгох'}
                </label>
                <select 
                  value={entityId} 
                  onChange={(e) => setEntityId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Бүх {reportType === 'campaign' ? 'Кампанит ажлууд' : 'Сегментүүд'}</option>
                  {reportType === 'campaign' 
                    ? campaigns.map(camp => (
                        <option key={camp.id_uuid} value={camp.id_uuid}>{camp.name}</option>
                      ))
                    : segments.map(seg => (
                        <option key={seg.id_uuid} value={seg.id_uuid}>{seg.name}</option>
                      ))
                  }
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Огноо</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500">Эхлэх Огноо</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Дуусах Огноо</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <Filter size={16} className="mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
                {showFilters ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
              </button>
              
              {showFilters && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium mb-3">Шүүх</h3>
                  
                  {reportType === 'delivery' && (
                    <>
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Суваг</label>
                        <div className="flex flex-wrap gap-2">
                          {channels.map(channel => (
                            <button
                              key={channel}
                              onClick={() => handleFilterChange('channel', channel)}
                              className={`px-3 py-1 text-xs rounded-full ${
                                filters.channel === channel
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : 'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}
                            >
                              {channel === 'email' ? (
                                <Mail size={12} className="inline mr-1" />
                              ) : channel === 'sms' ? (
                                <Phone size={12} className="inline mr-1" />
                              ) : channel === 'voice' ? (
                                <Megaphone size={12} className="inline mr-1" />
                              ) : null}
                              {channel !== 'all' ? channel.toUpperCase() : 'Бүх сувууд'}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Төлөв</label>
                        <div className="flex flex-wrap gap-2">
                          {statuses.map(status => (
                            <button
                              key={status}
                              onClick={() => handleFilterChange('status', status)}
                              className={`px-3 py-1 text-xs rounded-full ${
                                filters.status === status
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : 'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  
                  {reportType === 'customer' && (
                    <>
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Холбогдох</label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleFilterChange('hasEmail', !filters.hasEmail)}
                            className={`px-3 py-1 text-xs rounded-full ${
                              filters.hasEmail
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}
                          >
                            <Mail size={12} className="inline mr-1" /> Имэйлтэй
                          </button>
                          <button
                            onClick={() => handleFilterChange('hasPhone', !filters.hasPhone)}
                            className={`px-3 py-1 text-xs rounded-full ${
                              filters.hasPhone
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}
                          >
                            <Phone size={12} className="inline mr-1" /> Утастай
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Нас</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            placeholder="Min"
                            value={filters.minAge || ''}
                            onChange={(e) => handleFilterChange('minAge', e.target.value)}
                            className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
                          />
                          <input
                            type="number"
                            placeholder="Max"
                            value={filters.maxAge || ''}
                            onChange={(e) => handleFilterChange('maxAge', e.target.value)}
                            className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тайлбар (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Тайлангийн тайлбарыг оруулна уу"
              />
            </div>
            
            <div className="pt-2">
              <button
                onClick={generateReport}
                disabled={loading}
                className={`w-full px-4 py-2 rounded-lg flex items-center justify-center ${
                  loading
                    ? 'bg-gray-400 text-gray-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    боловсруулаж байна...
                  </>
                ) : (
                  <>Тайлан боловсруулах</>
                )}
              </button>
            </div>
          </div>
          
          {savedReports.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Хадгалагдсан Тайлан</h3>
              <div className="max-h-60 overflow-y-auto">
                {savedReports.map(report => (
                  <div 
                    key={report.id_uuid}
                    onClick={() => loadReport(report.id_uuid)}
                    className={`p-2 cursor-pointer mb-1 rounded-md border flex items-start ${
                      loadedReport?.id === report.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <FileText size={16} className="mr-2 mt-1 shrink-0" />
                    <div>
                      <div className="font-medium text-sm">{report.title}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(report.created_at).toLocaleDateString()} · {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
              <div className="text-center">
                <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div className="mt-4 text-gray-600">Тайланг боловсруулаж байна...</div>
              </div>
            </div>
          ) : reportData ? (
            <div>
              <div className="mb-4 bg-white rounded-lg shadow p-4">
                <h2 className="text-xl font-semibold">{loadedReport?.title || title}</h2>
                {(loadedReport?.description || description) && (
                  <p className="text-gray-600 mt-1">{loadedReport?.description || description}</p>
                )}
              </div>
              {renderReportContent()}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
              <div className="text-center text-gray-500">
                <div className="mb-2">
                  {reportType === 'campaign' ? (
                    <Megaphone size={40} className="mx-auto text-gray-400" />
                  ) : reportType === 'delivery' ? (
                    <Mail size={40} className="mx-auto text-gray-400" />
                  ) : reportType === 'customer' ? (
                    <User size={40} className="mx-auto text-gray-400" />
                  ) : (
                    <Users size={40} className="mx-auto text-gray-400" />
                  )}
                </div>
                Configure and generate a {reportType} report
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Report;