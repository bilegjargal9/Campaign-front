import React, { useState, useEffect, useRef } from 'react';
import dashboardApi from '../api/dashboard';
import Notifier from '../components/notifier';
import { 
  MessageSquare, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  FileText,
  Phone,
  BarChart2,
  PieChart,
  RefreshCw,
  Inbox,
  X
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const notifierRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [channelData, setChannelData] = useState([]);
  const [trendsData, setTrendsData] = useState([]);
  const [scheduleStats, setScheduleStats] = useState(null);
  const [trendsPeriod, setTrendsPeriod] = useState('7days');
  const [refreshing, setRefreshing] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [allDeliveryLogs, setAllDeliveryLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (stats) {
      fetchTrendsData();
    }
  }, [trendsPeriod, stats]);

  const showError = (message) => {
    setError(message);
    if (notifierRef.current && typeof notifierRef.current.show === 'function') {
      notifierRef.current.show(message, 'error');
    } else {
      console.error(message);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dashboardStats = await dashboardApi.getDashboardStats();
      setStats(dashboardStats);
      
      const channels = await dashboardApi.getChannelBreakdown();
      setChannelData(channels);
      
      const schedules = await dashboardApi.getScheduleStats();
      setScheduleStats(schedules);
      
      setLoading(false);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to load dashboard data';
      showError(errorMessage);
      setLoading(false);
    }
  };

  const fetchAllDeliveryLogs = async () => {
    try {
      setLoadingLogs(true);
      setError(null);
      
      const allLogs = await dashboardApi.getAllDeliveryLogs();
      setAllDeliveryLogs(allLogs);
      setLoadingLogs(false);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to load all delivery logs';
      showError(errorMessage);
      setLoadingLogs(false);
    }
  };

  const fetchTrendsData = async () => {
    try {
      setError(null);
      
      const trends = await dashboardApi.getDeliveryTrends(trendsPeriod);
      
      const processedData = processTrendsDataForChart(trends);
      setTrendsData(processedData);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to load trends data';
      showError(errorMessage);
    }
  };

  const processTrendsDataForChart = (data) => {
    const groupedByDay = {};
    
    if (!Array.isArray(data)) {
      return [];
    }
    
    data.forEach(item => {
      if (!groupedByDay[item.day]) {
        groupedByDay[item.day] = {
          day: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          successful: 0,
          failed: 0,
          pending: 0
        };
      }
      
      groupedByDay[item.day][item.status] = item.count;
    });
    
    return Object.values(groupedByDay);
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      await fetchDashboardData();
      
      if (notifierRef.current && typeof notifierRef.current.show === 'function') {
        notifierRef.current.show('Dashboard data refreshed successfully', 'success');
      }
    } catch (error) {
      const errorMessage = 'Failed to refresh dashboard data';
      showError(errorMessage);
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleViewAllLogs = () => {
    if (!showAllLogs) {
      fetchAllDeliveryLogs();
    }
    setShowAllLogs(!showAllLogs);
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'successful':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      case 'pending':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  // Helper function to get status badge
  const StatusBadge = ({ status }) => {
    const badgeConfig = {
      successful: { bg: 'bg-green-100', text: 'text-green-800', label: 'Successful' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
    };

    const config = badgeConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const mockData = {
    summary: {
      total: 1254,
      successful: 1052,
      failed: 148,
      pending: 54
    },
    counts: {
      customers: 423,
      templates: 18,
      phoneNumbers: 5
    },
    recentDeliveries: [
      { id: 1, date: new Date(), channel: 'sms', status: 'successful', info: 'Delivery confirmation sent' },
      { id: 2, date: new Date(), channel: 'sms', status: 'failed', info: 'Invalid phone number' },
      { id: 3, date: new Date(), channel: 'sms', status: 'successful', info: 'Appointment reminder sent' }
    ]
  };

  const mockTrendsData = [
    { day: 'Apr 12', successful: 45, failed: 5, pending: 2 },
    { day: 'Apr 13', successful: 52, failed: 3, pending: 0 },
    { day: 'Apr 14', successful: 38, failed: 7, pending: 1 },
    { day: 'Apr 15', successful: 65, failed: 2, pending: 3 },
    { day: 'Apr 16', successful: 47, failed: 8, pending: 0 },
    { day: 'Apr 17', successful: 58, failed: 4, pending: 2 },
    { day: 'Apr 18', successful: 44, failed: 6, pending: 5 }
  ];

  const mockScheduleStats = {
    scheduleStats: [
      { status: 'successful', _count: { id_uuid: 245 } },
      { status: 'failed', _count: { id_uuid: 32 } },
      { status: 'pending', _count: { id_uuid: 54 } }
    ],
    upcomingSchedules: [
      { 
        id_uuid: '1', 
        description: 'Appointment reminder', 
        date: new Date(Date.now() + 86400000), 
        customer: { first_name: 'John', last_name: 'Doe' }
      },
      { 
        id_uuid: '2', 
        description: 'Order confirmation', 
        date: new Date(Date.now() + 172800000), 
        customer: { first_name: 'Jane', last_name: 'Smith' }
      }
    ]
  };

  const displayStats = stats || mockData;
  const displayTrendsData = trendsData.length > 0 ? trendsData : mockTrendsData;
  const displayScheduleStats = scheduleStats || mockScheduleStats;

  return (
    <div className="container mx-auto px-4 py-8">
      {notifierRef && <Notifier ref={notifierRef} />}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">Алдаа: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Хяналтын самбар</h1>
        <button 
          onClick={refreshData} 
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Нийт илгээлт (30d)</p>
              <h2 className="text-3xl font-bold mt-2">{displayStats?.summary?.total || 0}</h2>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Inbox size={24} className="text-blue-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Амжилттай илгээлт</p>
              <h2 className="text-3xl font-bold mt-2 text-green-500">{displayStats?.summary?.successful || 0}</h2>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle size={24} className="text-green-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Амжилтгүй илгээлт</p>
              <h2 className="text-3xl font-bold mt-2 text-red-500">{displayStats?.summary?.failed || 0}</h2>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle size={24} className="text-red-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Хүлээгдэж буй хуваарь</p>
              <h2 className="text-3xl font-bold mt-2 text-yellow-500">{displayStats?.summary?.pending || 0}</h2>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock size={24} className="text-yellow-500" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Resources Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Шинжилгээ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users size={24} className="text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Хүлээн авагчид</p>
              <h3 className="text-xl font-bold">{displayStats?.counts?.customers || 0}</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <FileText size={24} className="text-indigo-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Templates</p>
              <h3 className="text-xl font-bold">{displayStats?.counts?.templates || 0}</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-100 rounded-lg">
              <Phone size={24} className="text-teal-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Утасны дугаар</p>
              <h3 className="text-xl font-bold">{displayStats?.counts?.phoneNumbers || 0}</h3>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trends Chart - UPDATED WITH RECHARTS */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Хүргэлтийн трэнд</h2>
            <div className="flex rounded-md overflow-hidden">
              <button 
                onClick={() => setTrendsPeriod('7days')}
                className={`px-3 py-1 text-sm ${trendsPeriod === '7days' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                7 Хоног
              </button>
              <button 
                onClick={() => setTrendsPeriod('30days')}
                className={`px-3 py-1 text-sm ${trendsPeriod === '30days' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                30 Хоног
              </button>
              <button 
                onClick={() => setTrendsPeriod('90days')}
                className={`px-3 py-1 text-sm ${trendsPeriod === '90days' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                90 Хоног
              </button>
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayTrendsData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 30,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="successful" name="Амжилттай" fill="#10B981" stackId="stack" />
                <Bar dataKey="failed" name="Амжилтгүй" fill="#EF4444" stackId="stack" />
                <Bar dataKey="pending" name="Хүлээгдэж байгаа" fill="#F59E0B" stackId="stack" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Upcoming Schedules */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Ойрын хуваарь</h2>
          
          {displayScheduleStats?.upcomingSchedules?.length > 0 ? (
            <div className="space-y-4">
              {displayScheduleStats.upcomingSchedules.map((schedule) => (
                <div key={schedule.id_uuid} className="border-b pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">
                        {schedule.customer?.first_name} {schedule.customer?.last_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {schedule.description || 'No description'}
                      </p>
                    </div>
                    <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {new Date(schedule.date).toLocaleDateString('en-US', { 
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-56 text-gray-500">
              <Calendar size={40} className="mb-2 opacity-50" />
              <p>Ойрын хуваарь алга байна.</p>
            </div>
          )}
          
          {displayScheduleStats?.upcomingSchedules?.length > 0 && (
            <div className="mt-4 text-center">
              <a href="/sms" className="text-blue-500 hover:underline text-sm">Бүх хуваарийг харахы</a>
            </div>
          )}
          
          {/* Schedule Status Summary */}
          {displayScheduleStats?.scheduleStats?.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="text-sm font-medium mb-3">Хуваарийн төлөв</h3>
              <div className="flex justify-between">
                {displayScheduleStats.scheduleStats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className={`text-xl font-bold ${getStatusColor(stat.status)}`}>
                      {stat._count.id_uuid}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">{stat.status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Delivery Logs Section - Updated to show all logs */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {showAllLogs ? "All Delivery Logs" : "Recent Deliveries"}
          </h2>
          <button 
            onClick={handleViewAllLogs}
            className="text-blue-500 hover:underline text-sm flex items-center"
          >
            {showAllLogs ? (
              <>
                <X size={14} className="mr-1" />
                Нуух
              </>
            ) : (
              "View all delivery logs"
            )}
          </button>
        </div>
        
        {loadingLogs && showAllLogs ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Огноо
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Суваг
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Төлөв
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Мэдээлэл
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {showAllLogs ? (
                  allDeliveryLogs.length > 0 ? (
                    allDeliveryLogs.map((delivery, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(delivery.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {delivery.channel === 'sms' ? (
                              <MessageSquare size={16} className="mr-2 text-blue-500" />
                            ) : (
                              <MessageSquare size={16} className="mr-2 text-green-500" />
                            )}
                            <span className="text-sm font-medium capitalize">{delivery.channel}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={delivery.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                          {delivery.info || 'No additional information'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                        Бүртгэл олдсонгүй
                      </td>
                    </tr>
                  )
                ) : (
                  displayStats?.recentDeliveries?.length > 0 ? (
                    displayStats.recentDeliveries.map((delivery, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(delivery.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {delivery.channel === 'sms' ? (
                              <MessageSquare size={16} className="mr-2 text-blue-500" />
                            ) : (
                              <MessageSquare size={16} className="mr-2 text-green-500" />
                            )}
                            <span className="text-sm font-medium capitalize">{delivery.channel}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={delivery.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                          {delivery.info || 'No additional information'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                      Бүртгэл олдсонгүй
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;