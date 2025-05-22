//camapaign api(frontend)

import axios from 'axios';
const url = import.meta.env.VITE_BACK_URL || 'http://localhost:3000';

export default {
    async getAllCampaigns() {
        const response = await axios.get(`${url}/campaign`, { withCredentials: true });
        return response.data;
    },
    
    async getCampaignDetails(campaign_id) {
        const response = await axios.post(
            `${url}/campaign/getCampaign`,
            { campaign_id },
            { withCredentials: true }
        );
        return response.data;
    },
    
    async createCampaign(name, description, channel) {
        return axios.post(
            `${url}/campaign/create`,
            { name, description, channel },
            { withCredentials: true }
        );
    },
    
    async setCampaignTeam(name, description, campaign_id, user_ids) {
        return axios.post(
            `${url}/campaign/setTeam`,
            { name, description, campaign_id, user_ids },
            { withCredentials: true }
        );
    },
    
    async setCampaignAudience(campaign_id, audiences_id) {
        return axios.post(
            `${url}/campaign/setAudience`,
            { campaign_id, audiences_id },
            { withCredentials: true }
        );
    },
    
    async deleteCampaign(campaign_id) {
        return axios.delete(
            `${url}/campaign/deleteCampaign`,
            {
                data: { campaign_id },
                withCredentials: true
            }
        );
    },
    

    async removeTeamMember(user_id, campaign_id) {
        return axios.delete(
            `${url}/campaign/removeTeamMember`,
            {
                data: {campaign_id, member_id: user_id},
                withCredentials: true
            }
        );
    },
    

    async removeAudiences(campaign_id, customer_id) {
        return axios.delete(`${url}/campaign/removeAudience`, {
            data: { campaign_id, audience_id: customer_id },
            withCredentials: true
        });
    },

    async importCustomer(campaign_id, users){
        return axios.post(
            `${url}/campaign/bulkUpload`,
            {campaign_id, users},
            { withCredentials: true }
        );
    }
    
};