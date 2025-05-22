//report api front end
import axios from 'axios';

const url = import.meta.env.VITE_BACK_URL || 'http://localhost:3000';

export default {
    async createReport(reportData) {
        return axios.post(`${url}/report`, reportData, { withCredentials: true });
    },
    
    async getReports() {
        return axios.get(`${url}/report`, { withCredentials: true });
    },
    
    async getReportById(id) {
        return axios.get(`${url}/report/${id}`, { withCredentials: true });
    },
    
    async updateReport(id, reportData) {
        return axios.put(`${url}/report/${id}`, reportData, { withCredentials: true });
    },
    
    async deleteReport(id) {
        return axios.delete(`${url}/report/${id}`, { withCredentials: true });
    }
};