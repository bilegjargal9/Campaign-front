// dashboardApi.js
import axios from 'axios';
const url = import.meta.env.VITE_BACK_URL || 'http://localhost:3000';

export default {
  async getDashboardStats() {
    const response = await axios.get(`${url}/dashboard/stats`, { withCredentials: true });
    return response.data;
  },
  
  async getChannelBreakdown() {
    const response = await axios.get(`${url}/dashboard/channels`, { withCredentials: true });
    return response.data;
  },
  
  async getDeliveryTrends(period = '7days') {
    const response = await axios.get(`${url}/dashboard/trends?period=${period}`, { withCredentials: true });
    return response.data;
  },
  
  async getScheduleStats() {
    const response = await axios.get(`${url}/dashboard/schedules`, { withCredentials: true });
    return response.data;
  },

  async getAllDeliveryLogs(){
    const response = await axios.get(`${url}/dashboard/all-delivery-logs`, {withCredentials: true});
    return response.data;
  }
};