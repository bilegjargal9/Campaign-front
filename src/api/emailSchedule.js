//schedule and template api
import axios from 'axios';

const url = import.meta.env.VITE_BACK_URL || 'http://localhost:3000';

export default {
  async createTemplate({ channel, message, subject, audio_url = null, attachment = null }) {
    const response = await axios.post(
      `${url}/email/createTemplate`,
      {
        channel,
        message,
        subject,
        audio_url,
        attachment
      },
      { withCredentials: true }
    );
    return response.data;
  },

  async getAllTemplates() {
    const response = await axios.get(`${url}/email/getAllTemplates`, { withCredentials: true });
    return response.data;
  },

  async getTemplateById(id) {
    const response = await axios.get(`${url}/email/template/${id}`, { withCredentials: true });
    return response.data;
  },

  async createSchedule(channel, segmentId, campaignId, templateId, customersId, description, date) {
    console.log(date);
    const response = await axios.post(
      `${url}/email/createSchedule`,
      {
        channel,
        segment_id: segmentId,
        campaign_id: campaignId,
        template_id: templateId,
        customers_id: customersId,
        description,
        date
      },
      { withCredentials: true }
    );
    return response.data;
  },

  async getAllSchedules() {
    const response = await axios.get(`${url}/email/getAllSchedules`, { withCredentials: true });
    return response.data;
  },



  async deleteSchedule(id) {
    const response = await axios.delete(`${url}/email/schedule/${id}`, { withCredentials: true });
    return response.data;
  },


};