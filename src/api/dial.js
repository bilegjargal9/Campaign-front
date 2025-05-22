//dial front end api
import axios from 'axios';
const url = import.meta.env.VITE_BACK_URL || 'http://localhost:3000';

export default {
  async getAllPhoneNumbers() {
    const response = await axios.get(`${url}/dial/getAllPhoneNumbers`, { withCredentials: true });
    return response.data;
  },
  
  async addPhoneNumber(number, SID, token) {
    const response = await axios.post(
      `${url}/dial/addNumber`,
      { number, SID, token },
      { withCredentials: true }
    );
    return response.data;
  },
  
  async deletePhoneNumber(number) {
    const response = await axios.delete(`${url}/dial/numbers/${number}`, { withCredentials: true });
    return response.data;
  },
  
  async changePhoneNumber(number) {
    const response = await axios.post(
      `${url}/dial/changePhoneNumber`,
      { number },
      { withCredentials: true }
    );
    return response.data;
  },
  
  async makeCall(phoneNumber, message, audioUrl = null) {
    const response = await axios.post(
      `${url}/dial/call`,
      { phoneNumber, message, audioUrl },
      { withCredentials: true }
    );
    return response.data;
  },
  
  async makeCallBulk(phoneList, template_id, campaign_id = null, segment_id = null) {
    const response = await axios.post(
      `${url}/dial/bulk`,
      { phoneList, template_id, campaign_id, segment_id },
      { withCredentials: true }
    );
    return response.data;
  },
  
  async getAllSchedule() {
    const response = await axios.get(`${url}/dial/getAllSchedule`, { withCredentials: true });
    return response.data;
  },
  
  async getAllTemplates() {
    const response = await axios.get(`${url}/dial/getAllTemplate`, { withCredentials: true });
    return response.data;
  },

  async getAllUploadedTemplates(){
    const res = await axios.get(`${url}/dial/getAllUploadedAudio`, {withCredentials: true});
    return res.data;
  },

  async createTemplateForUploadedAudio(audio_path, audio_name){
    const res = await axios.post(`${url}/dial/uploadAudio`,{audio_path, audio_name}, {withCredentials: true});
    return res.data;
  },
  
  async createTemplate({ channel, message, subject = null, audio_url = null, attachment = null }) {
    const response = await axios.post(
      `${url}/dial/createTemplate`,
      { channel, message, subject, audio_url, attachment },
      { withCredentials: true }
    );
    return response.data;
  },
  
  async getTemplateById(id) {
    const response = await axios.get(`${url}/dial/template/${id}`, { withCredentials: true });
    return response.data;
  },
  
  async updateTemplate(id, templateData) {
    const response = await axios.put(
      `${url}/dial/template/${id}`,
      templateData,
      { withCredentials: true }
    );
    return response.data;
  },
  
  async deleteTemplate(id) {
    const response = await axios.delete(`${url}/dial/template/${id}`, { withCredentials: true });
    return response.data;
  },
  
  async createSchedule(channel, segment_id = null, campaign_id = null, template_id, customers_id, description = null, date) {
    console.log( channel, segment_id, campaign_id, template_id, customers_id, description, date );
    const response = await axios.post(
      `${url}/dial/createSchedule`,
      { channel, segment_id, campaign_id, template_id, customers_id, description, date },
      { withCredentials: true }
    );
    return response.data;
  },
  
  async deleteSchedule(id) {
    console.log(id);
    const response = await axios.delete(`${url}/dial/deleteSchedule/${id}`, { withCredentials: true });
    return response.data;
  },
  
  async retryCall(id) {
    const response = await axios.post(`${url}/dial/retryCall/${id}`, {}, { withCredentials: true });
    return response.data;
  },
  
  async findGroup(id) {
    try {
      const response = await axios.get(
        `${url}/dial/group/${id}`,
        { withCredentials: true }
      );
      return response;
    } catch (error) {
      console.error("Error fetching group:", error);
      throw error;
    }
  }
};