//segmentation api(frontend)

import axios from 'axios';

const url = import.meta.env.VITE_BACK_URL || 'http://localhost:3000';

export default {
    async getAllSegments() {
        const response = await axios.get(`${url}/segmentation`, { withCredentials: true });
        return response.data;
    },

    async createSegment(name, description) {
        const response = await axios.post(
            `${url}/segmentation/create`, 
            { name, description }, 
            { withCredentials: true }
        );
        return response.data;
    },

    async getSegmentDetails(segment_id) {
        const response = await axios.post(
            `${url}/segmentation/getSegmentation`,
            { segment_id },
            { withCredentials: true }
        );
        return response.data;
    },

    async addCustomerToSegment(segment_id, customer_ids) {
        const response = await axios.post(
            `${url}/segmentation/addCustomer`,
            { segment_id, customer_ids },
            { withCredentials: true }
        );
        return response.data;
    },

    async removeCustomerFromSegment(segment_id, customer_id) {
        const response = await axios.post(
            `${url}/segmentation/removeCustomer`,
            { segment_id, customer_id },
            { withCredentials: true }
        );
        return response.data;
    },

    async deleteSegment(segment_id) {
        const response = await axios.post(
            `${url}/segmentation/deleteSegmentation`,
            { segment_id },
            { withCredentials: true }
        );
        return response.data;
    },

    async importCustomer(segment_id, users){
        return axios.post(
            `${url}/segmentation/bulkUpload`,
            {segment_id, users},
            { withCredentials: true }
        );
    }
};