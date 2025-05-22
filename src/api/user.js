//user api frontend

import axios from 'axios';
const url = import.meta.env.VITE_BACK_URL || 'http://localhost:3000';

export default {
  async login(username, password) {
    return axios.post(`${url}/user/login`, { username, password }, { withCredentials: true });
  },
  
  async register(userData) {
    return axios.post(`${url}/user/register`, userData, { withCredentials: true });
  },
  
  async logout() {
    return axios.get(`${url}/user/logout`, { withCredentials: true });
  },
  
  async getProfile() {
    return axios.get(`${url}/user/profile`, { withCredentials: true });
  },
  
  async getAllSupervisors() {
    return axios.get(`${url}/user/supervisors`, { withCredentials: true });
  },
  
  async getAllUsers() {
    return axios.get(`${url}/user/all`, { withCredentials: true });
  },
  
  async updateUser(userId, userData) {
    return axios.put(`${url}/user/${userId}`, userData, { withCredentials: true });
  },
  
  async deleteUser(userId) {
    return axios.delete(`${url}/user/${userId}`, { withCredentials: true });
  }
};