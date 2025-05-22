//email api(frontend)

import axios from 'axios';

const url = import.meta.env.VITE_BACK_URL || 'http://localhost:3000';

export default {
  async getAllEmailAccounts() {
    const response = await axios.get(`${url}/email/getAllEmailAccounts`, { withCredentials: true });
    return response.data;
  },
  async addAccount(email, password, service, token, limit) {
    const response = await axios.post(`${url}/email/addAccount`, { email, password, service, token, limit}, { withCredentials: true });
    return response.data;
  },
  async deleteAccount(email) {
    const response = await axios.delete(`${url}/email/accounts/${email}`, { withCredentials: true });
    return response.data;
  },
  async sendEmail(emailData) {
    const response = await axios.post(`${url}/email/send`, emailData, { withCredentials: true });
    return response.data;
  },

  async sendBulk(emailList, template_id, campaign_id, segment_id) {
    console.log("campaign_id: "+campaign_id, "segment_id: "+segment_id+"    in api frontend");
    const response = await axios.post(
      `${url}/email/bulk`,
      { emailList, template_id, campaign_id, segment_id},
      { withCredentials: true }
    );
    return response.data;
  },

  async findGroup(id) {
    try {
      const response = await axios.get(
        `${url}/email/group/${id}`, 
        {withCredentials: true}
      );
      return response;
    } catch (error) {
      console.error("Error fetching group:", error);
      throw error;
    }
  },
  async getEmailLimits() {
    const response = await axios.get(`${url}/email/limits`, { withCredentials: true });
    return response.data;
  },

  async changeAccount(email) {
    const response = await axios.post(`${url}/email/changeAccount`, {email}, { withCredentials: true });
    return response.data;
  },

  async approveScheduledEmails(scheduleIds) {
    const response = await axios.post(
      `${url}/email/approveScheduled`,
      { scheduleIds },
      { withCredentials: true }
    );
    return response.data;
  },

  async getSchedule() {
    const response = await axios.get(`${url}/email/getAllSchedule`, { withCredentials: true });
    return response.data;
  }
};