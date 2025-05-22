//email schedules component
import React, { useState, useEffect } from 'react';
import { Calendar, Check, X, Mail, AlertCircle, ChevronDown, ChevronRight, Receipt } from 'lucide-react';
import emailApi from '../api/email';
import scheduleApi from '../api/emailSchedule';
import '../styles/customer.css';


const EmailSchedulesComponent = ({ notifierRef }) => {
  const [scheduleData, setScheduleData] = useState({
    pending: [],
    sent: [],
    failed: []
  });

  const [schedulesGroup, setSchedulesGroup] = useState({
    groups: {}
  });

  const [loading, setLoading] = useState(false);
  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    sent: 0,
    failed: 0,
    byDate: {}
  });

  useEffect(() => {
    loadSchedules();
    findSchedulesGroup();
  }, []);

  useEffect(() => {
    updateStats();
  }, [scheduleData]);

  useEffect(() => {
    if (scheduleData.pending.length > 0 || scheduleData.sent.length > 0 || scheduleData.failed.length > 0) {
      findSchedulesGroup();
    }
  }, [scheduleData]);
  

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await emailApi.getSchedule();
      setScheduleData({
        pending: data.pending || [],
        sent: data.sent || [],
        failed: data.failed || []
      });
    } catch (error) {
      notifierRef.current.show(
        error.response?.data?.message || 'Error loading schedules'
      );
    } finally {
      setLoading(false);
    }
  };

  const findSchedulesGroup = async () => {
    try {
      setLoading(true);
      const groupsMap = {};
      
      const allSchedules = [
        ...scheduleData.pending,
        ...scheduleData.sent,
        ...scheduleData.failed
      ];
      
      const uniqueGroupIds = new Set();
      allSchedules.forEach(schedule => {
        const groupId = schedule.campaign_id || schedule.segment_id;
        if (groupId) uniqueGroupIds.add(groupId);
      });
      
      for (const groupId of uniqueGroupIds) {
        try {
          const response = await emailApi.findGroup(groupId);
          if (response && response.data) {
            groupsMap[groupId] = response.data;
          }
        } catch (error) {
          console.error(`Error fetching group ${groupId}:`, error);
        }
      }
      
      setSchedulesGroup({ groups: groupsMap });
    } catch (error) {
      notifierRef.current.show(
        error.response?.data?.message || 'Error loading schedules group'
      );
    } finally {
      setLoading(false);
    }
  };


  

  const updateStats = () => {
    const newStats = {
      total: scheduleData.pending.length + scheduleData.sent.length + scheduleData.failed.length,
      pending: scheduleData.pending.length,
      sent: scheduleData.sent.length,
      failed: scheduleData.failed.length,
      byDate: {}
    };
    
    scheduleData.pending.forEach(schedule => {
      const date = new Date(schedule.date).toLocaleDateString();
      if (!newStats.byDate[date]) {
        newStats.byDate[date] = { count: 0 };
      }
      newStats.byDate[date].count++;
    });
    
    setStats(newStats);
  };
  
  const handleSelectAll = () => {
    if (selectedSchedules.length === scheduleData.pending.length) {
      setSelectedSchedules([]);
    } else {
      setSelectedSchedules(scheduleData.pending.map(schedule => schedule.id_uuid));
    }
  };
  
  const handleSelectSchedule = (id) => {
    if (selectedSchedules.includes(id)) {
      setSelectedSchedules(selectedSchedules.filter(scheduleId => scheduleId !== id));
    } else {
      setSelectedSchedules([...selectedSchedules, id]);
    }
  };

  const handleSelectGroup = (ids) => {
    // Check if all IDs in the group are already selected
    const allSelected = ids.every(id => selectedSchedules.includes(id));
    
    if (allSelected) {
      // If all are selected, deselect them
      setSelectedSchedules(selectedSchedules.filter(id => !ids.includes(id)));
    } else {
      // Otherwise, add all the ones that aren't already selected
      const newIds = ids.filter(id => !selectedSchedules.includes(id));
      setSelectedSchedules([...selectedSchedules, ...newIds]);
    }
  };

  const handleDeleteSelectedSchedule = async () => {
    if (selectedSchedules.length === 0) {
      return notifierRef.current.show('No schedules selected for deletion', 'warning');
    }

    try {
      setLoading(true);
      // Delete schedules one by one
      for (const scheduleId of selectedSchedules) {
        await scheduleApi.deleteSchedule(scheduleId);
      }
      
      notifierRef.current.show(`${selectedSchedules.length} scheduled emails deleted`, 'success');
      loadSchedules();
      setSelectedSchedules([]);
    } catch (error) {
      notifierRef.current.show(
        error.response?.data?.message || 'Failed to delete schedules',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleGroupExpanded = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Combine all schedules for display
  const allSchedules = [
    ...scheduleData.pending,
    ...scheduleData.sent,
    ...scheduleData.failed
  ];

  // Group schedules by date, then by time, then by campaign or segment
  const groupSchedules = (schedules) => {
    const grouped = {};
    
    if (!Array.isArray(schedules)) return grouped;
  
    schedules.forEach(schedule => {
      const scheduleDate = new Date(schedule.date);
      const date = scheduleDate.toDateString();
      const time = scheduleDate.toLocaleTimeString();
      
      // Create entry for this date if it doesn't exist
      if (!grouped[date]) {
        grouped[date] = {};
      }
      
      // Create entry for this time if it doesn't exist
      if (!grouped[date][time]) {
        grouped[date][time] = [];
      }
      
      // Create a unique group ID based on campaign or segment
      const groupId = schedule.campaign_id || schedule.segment_id || 'individual';
      
      // Check if we already have a group for this campaign/segment at this time
      let existingGroup = grouped[date][time].find(g => g.groupId === groupId);
      
      if (!existingGroup) {
        existingGroup = {
          groupId,
          campaignId: schedule.campaign_id,
          segmentId: schedule.segment_id,
          schedules: [],
          count: 0
        };
        grouped[date][time].push(existingGroup);
      }
      
      existingGroup.schedules.push(schedule);
      existingGroup.count++;
    });
    
    return grouped;
  };
  
  const groupedSchedules = groupSchedules(allSchedules);

  const getStatusBadge = (schedule) => {
    if (scheduleData.pending.some(s => s.id_uuid === schedule.id_uuid)) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Хүлээгдэж буй</span>;
    } else if (scheduleData.sent.some(s => s.id_uuid === schedule.id_uuid)) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Илгээгдсэн</span>;
    } else {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1">
        <AlertCircle size={12} />Амжилтгүй
      </span>;
    }
  };

  const getGroupStatus = (schedules) => {
    const statuses = {
      pending: 0,
      sent: 0,
      failed: 0
    };
    
    schedules.forEach(schedule => {
      if (scheduleData.pending.some(s => s.id_uuid === schedule.id_uuid)) {
        statuses.pending++;
      } else if (scheduleData.sent.some(s => s.id_uuid === schedule.id_uuid)) {
        statuses.sent++;
      } else {
        statuses.failed++;
      }
    });
    
    if (statuses.pending > 0) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
        Хүлээгдэж буй ({statuses.pending}/{schedules.length})
      </span>;
    } else if (statuses.sent === schedules.length) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
        Илгээгдсэн
      </span>;
    } else if (statuses.failed === schedules.length) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1">
        <AlertCircle size={12} />Амжилтгүй
      </span>;
    } else {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
        ({statuses.sent} Илгээгдсэн, {statuses.failed} Амжилтгүй)
      </span>;
    }
  };

  const getCampaignOrSegmentName = (group) => {
    if (!group) return 'Individual';
    
    const groupId = group.campaignId || group.segmentId;
    if (!groupId) return 'Individual';
    
    const groupData = schedulesGroup.groups?.[groupId];
    
    if (groupData) {
      return groupData.name || `${group.campaignId ? 'Campaign' : 'Segment'}: ${groupId.substring(0, 8)}...`;
    } else {
      return `${group.campaignId ? 'Campaign' : 'Segment'}: ${groupId.substring(0, 8)}...`;
    }
  };


  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Mail size={20} />
          Имэйлийн хуваарь
        </h2>
        <div className="flex gap-2">
          <button
            onClick={loadSchedules}
            disabled={loading}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : Object.keys(groupedSchedules).length === 0 ? (
        <div className="text-center py-6 bg-gray-50 border border-gray-100 rounded-lg">
          <Calendar size={40} className="mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">Хуваарилагдсан имэйл байхгүй байна.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-600 mb-1">Нийт хуваарь</h3>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-600 mb-1">Хүлээгдэж буй</h3>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-600 mb-1">Илгээгдсэн</h3>
              <p className="text-2xl font-bold">{stats.sent}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-red-600 mb-1">Амжилтгүй</h3>
              <p className="text-2xl font-bold">{stats.failed}</p>
            </div>
          </div>

          {scheduleData.pending.length > 0 && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="select-all"
                    checked={selectedSchedules.length === scheduleData.pending.length && scheduleData.pending.length > 0}
                    onChange={handleSelectAll}
                    className="custom-checkbox"
                    />
                  <label htmlFor="select-all" className="text-sm font-medium">
                  Бүх хүлээгдэж буй хуваарийг сонгох ({scheduleData.pending.length})
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteSelectedSchedule}
                    disabled={selectedSchedules.length === 0 || loading}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm flex items-center gap-1"
                  >
                    <X size={14} />
                    Устгах ({selectedSchedules.length})
                  </button>
                </div>
              </div>
            </div>
          )}

          {Object.entries(groupedSchedules).map(([date, timeGroups]) => (
            <div key={date} className="mb-6">
              <h3 className="text-md font-medium mb-2 flex items-center gap-2 bg-gray-50 p-2 rounded">
                <Calendar size={16} />
                {date} ({Object.values(timeGroups).flat().reduce((acc, group) => acc + group.schedules.length, 0)} имэйл)
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-2 px-3 text-left" width="40">
                        <input
                          type="checkbox"
                          className="custom-checkbox"
                          checked={
                            Object.values(timeGroups).flat()
                              .flatMap(group => group.schedules)
                              .filter(s => scheduleData.pending.some(p => p.id_uuid === s.id_uuid))
                              .every(schedule => selectedSchedules.includes(schedule.id_uuid))
                          }
                          onChange={() => {
                            const pendingSchedulesForDay = Object.values(timeGroups).flat()
                              .flatMap(group => group.schedules)
                              .filter(s => scheduleData.pending.some(p => p.id_uuid === s.id_uuid));
                            
                            const allSelected = pendingSchedulesForDay.every(
                              schedule => selectedSchedules.includes(schedule.id_uuid)
                            );
                            
                            if (allSelected) {
                              setSelectedSchedules(selectedSchedules.filter(
                                id => !pendingSchedulesForDay.some(schedule => schedule.id_uuid === id)
                              ));
                            } else {
                              const newScheduleIds = pendingSchedulesForDay
                                .map(schedule => schedule.id_uuid)
                                .filter(id => !selectedSchedules.includes(id));
                              
                              setSelectedSchedules([...selectedSchedules, ...newScheduleIds]);
                            }
                          }}
                        />
                      </th>
                      <th className="py-2 px-3 text-left" width="160">Огноо</th>
                      <th className="py-2 px-3 text-left" width="300">Бүлэг</th>
                      <th className="py-2 px-3 text-left">Хүлээн авагчид</th>
                      <th className="py-2 px-3 text-left" width="250">Гарчиг</th>
                      <th className="py-2 px-3 text-left" width="200">Төлөв</th>
                    </tr>
                  </thead>


                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(timeGroups).map(([time, groups]) => 
                      groups.map((group, groupIndex) => {
                        const isGroupPending = group.schedules.some(s => 
                          scheduleData.pending.some(p => p.id_uuid === s.id_uuid)
                        );
                        
                        const pendingIds = group.schedules
                          .filter(s => scheduleData.pending.some(p => p.id_uuid === s.id_uuid))
                          .map(s => s.id_uuid);
                        
                        const allSelected = pendingIds.length > 0 && 
                          pendingIds.every(id => selectedSchedules.includes(id));
                        
                        const groupId = `${date}-${time}-${group.groupId}-${groupIndex}`;
                        const isExpanded = expandedGroups[groupId];
                        
                        return (
                          <React.Fragment key={groupId}>
                            <tr 
                              className={`${isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'} cursor-pointer`}
                              onClick={() => toggleGroupExpanded(groupId)}
                            >
                              <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                {isGroupPending && (
                                  <input
                                    type="checkbox"
                                    className="custom-checkbox"
                                    checked={allSelected}
                                    onChange={() => handleSelectGroup(pendingIds)}
                                  />
                                )}
                              </td>
                              <td className="py-2 px-3 text-sm">
                                {time}
                              </td>
                              <td className="py-2 px-3 flex items-center">
                                {isExpanded ? 
                                  <ChevronDown size={16} className="mr-2" /> : 
                                  <ChevronRight size={16} className="mr-2" />
                                }
                                {getCampaignOrSegmentName(group)}
                                <span className="ml-2 text-xs text-gray-500">
                                  ({group.schedules.length} имэйл)
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                {group.schedules.length > 1 ? 
                                  `${group.schedules.length} recipients` : 
                                  group.schedules[0]?.customer?.first_name+ " : "+ group.schedules[0]?.customer?.email   || 'Unknown recipient'
                                }
                              </td>
                              <td className="py-2 px-3">
                                {group.schedules[0]?.template?.subject || 'No subject'}
                                {group.schedules.length > 1 && group.schedules.some(
                                  s => s.template?.subject !== group.schedules[0]?.template?.subject
                                ) && ' (multiple)'}
                              </td>
                              <td className="py-2 px-3">
                                {getGroupStatus(group.schedules)}
                              </td>
                            </tr>
                            
                            {isExpanded && group.schedules.map(schedule => (
                              <tr key={schedule.id_uuid} className="bg-gray-100">
                                <td className="py-2 px-3 text-center pl-10">
                                  {scheduleData.pending.some(s => s.id_uuid === schedule.id_uuid) && (
                                    <input
                                      type="checkbox"
                                      className="custom-checkbox"
                                      checked={selectedSchedules.includes(schedule.id_uuid)}
                                      onChange={() => handleSelectSchedule(schedule.id_uuid)}
                                    />
                                  )}
                                </td>
                                <td className="py-2 px-3 text-sm">
                                  {time}
                                </td>
                                <td className="py-2 px-3 pl-10">
                                  {schedule.id_uuid.substring(0, 8)}...
                                </td>
                                <td className="py-2 px-3">
                                  {schedule.customer?.first_name + " : "+ schedule.customer?.email|| 'Unknown recipient'}
                                </td>
                                <td className="py-2 px-3">
                                  {schedule.template?.subject || 'No subject'}
                                </td>
                                <td className="py-2 px-3">
                                  {getStatusBadge(schedule)}
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default EmailSchedulesComponent;