//customer api
import axios from 'axios';

const url = import.meta.env.VITE_BACK_URL || 'http://localhost:3000';

export default {
    async getAllCustomers() {
        const response = await axios.get(`${url}/customer/getAll`, { withCredentials: true });
        return response.data;
    },

    async findById(customer_id) {
        const response = await axios.post(
            `${url}/customer/getById`,
            { customer_id },
            { withCredentials: true }
        );
        return response.data;
    },

    async postSingle(first_name, last_name, age, phone_number, email) {
        return axios.post(
            `${url}/customer/single`,
            { first_name, last_name, age, phone_number, email },
            { withCredentials: true }
        );
    },

    async postBulk(users) {
        return axios.post(
            `${url}/customer/bulk`,
            { users },
            { withCredentials: true }
        );
    },

    async deleteSingle(customer_id) {
        return axios.delete(
            `${url}/customer/single`,
            {
                data: { customer_id },
                withCredentials: true
            }
        );
    },

    async deleteBulk(customer_ids) {
        return axios.delete(
            `${url}/customer/bulk`,
            {
                data: { customer_ids },
                withCredentials: true
            }
        );
    },

    async search(str) {
        return axios.post(
            `${url}/customer/search`,
            { str },
            { withCredentials: true }
        );
    },

    async updateCustomer(customer_id, customerData) {
        return axios.put(
            `${url}/customer/update`,
            {
                customer_id,
                ...customerData
            },
            { withCredentials: true }
        );
    }
};