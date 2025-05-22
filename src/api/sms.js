//sms api(frontend)

import axios from 'axios';

const url = import.meta.env.VITE_BACK_URL || 'http://localhost:3000';

export default {
  async getAllPhoneNumbers() {
    const response = await axios.get(`${url}/sms/getAllPhoneNumbers`, { withCredentials: true });
    return response.data;
  },

  async addPhoneNumber( number, SID, token ) {
    const response = await axios.post(
      `${url}/sms/addNumber`, 
      { number, SID, token }, 
      { withCredentials: true }
    );
    return response.data;
  },

  async deletePhoneNumber(number) {
    const response = await axios.delete(`${url}/sms/numbers/${number}`, { withCredentials: true });
    return response.data;
  },

  async sendSMS(smsData) {
    const response = await axios.post(`${url}/sms/single`, smsData, { withCredentials: true });
    return response.data;
  },

  async sendBulk(phoneList, template_id, campaign_id, segment_id) {
    const response = await axios.post(
      `${url}/sms/bulk`,
      { phoneList, template_id, campaign_id, segment_id },
      { withCredentials: true }
    );
    return response.data;
  },

  async findGroup(id) {
    try {
      const response = await axios.get(
        `${url}/sms/group/${id}`, 
        { withCredentials: true }
      );
      return response;
    } catch (error) {
      console.error("Error fetching group:", error);
      throw error;
    }
  },

  async changePhoneNumber(number) {
    const response = await axios.post(
      `${url}/sms/changePhoneNumber`, 
      {number}, 
      { withCredentials: true }
    );
    return response.data;
  },

  async getSchedule() {
    const response = await axios.get(`${url}/sms/getAllSchedule`, { withCredentials: true });
    return response.data;
  },

  async getAllTemplates() {
    const response = await axios.get(`${url}/sms/getAllTemplate`, { withCredentials: true });
    return response.data;
  },

  async createTemplate({ channel, message, subject = null, audio_url = null, attachment = null }) {
    const response = await axios.post(
      `${url}/sms/createTemplate`, 
      {channel, message, subject, audio_url, attachment},
      { withCredentials: true }
    );
    return response.data;
  },

  async createSchedule(channel, segment_id = null, campaign_id =null, template_id, customers_id, description = null, date ) {
    console.log(customers_id);
    const response = await axios.post(
      `${url}/sms/createSchedule`, 
      {channel, segment_id, campaign_id, template_id, customers_id, description, date},
      { withCredentials: true }
    );
    return response.data;
  },

  async deleteSchedule(id) {
    const response = await axios.delete(`${url}/sms/deleteSchedule/${id}`, { withCredentials: true });
    return response.data;
  }
};