//Connections page

import React, { useState, useEffect, useRef } from 'react';
import smsApi from '../api/sms';
import emailApi from '../api/email';
import axios from 'axios';
import Notifier from '../components/notifier';
import { Trash } from 'lucide-react';

const Connections = () => {
  const notifierRef = useRef();
  
  const [emailAccounts, setEmailAccounts] = useState([]);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  
  const [emailForm, setEmailForm] = useState({
    email: '',
    password: '',
    service: 'gmail', // Default service
    token: '',
    limit: 100 // Default limit
  });
  
  const [phoneForm, setPhoneForm] = useState({
    number: '',
    SID: '',
    token: ''
  });
  
  // State for form visibility
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  
  // Loading state
  const [loading, setLoading] = useState(false);


  // Fetch data on component mount
  useEffect(() => {
    fetchEmailAccounts();
    fetchPhoneNumbers();
  }, []);

  // Notify function to display messages
  const notify = (message, type) => {
    if (notifierRef.current) {
      notifierRef.current.show(message, type);
    }
  };

  const fetchEmailAccounts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3000/email/getAllEmailAccounts`, { withCredentials: true });
      setEmailAccounts(response.data);
    } catch (err) {
      notify('Failed to fetch email accounts', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhoneNumbers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3000/sms/getAllPhoneNumbers`, { withCredentials: true });
      setPhoneNumbers(response.data);
    } catch (err) {
      notify('Failed to fetch phone numbers', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle email form input changes
  const handleEmailInputChange = (e) => {
    const { name, value } = e.target;
    setEmailForm({
      ...emailForm,
      [name]: value
    });
  };

  const handlePhoneInputChange = (e) => {
    const { name, value } = e.target;
    setPhoneForm({
      ...phoneForm,
      [name]: value
    });
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await emailApi.addAccount(
        emailForm.email,
        emailForm.password,
        emailForm.service,
        emailForm.token,
        emailForm.limit
      );
      
      notify('Email account added successfully', 'success');
      fetchEmailAccounts();
      setEmailForm({
        email: '',
        password: '',
        service: 'gmail',
        token: '',
        limit: 100
      });
      setShowEmailForm(false);
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to add email account', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Submit phone number form
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await smsApi.addPhoneNumber(
        phoneForm.number,
        phoneForm.SID,
        phoneForm.token
      );
      
      notify('Phone number added successfully', 'success');
      fetchPhoneNumbers();
      setPhoneForm({
        number: '',
        SID: '',
        token: ''
      });
      setShowPhoneForm(false);
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to add phone number', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const maskData = (text) => {
    if (!text) return '';
    if (text.length <= 4) return '*'.repeat(text.length);
    return '*'.repeat(text.length - 4) + text.slice(-4);
  };

  const handleDeleteEmail = async (email) => {
    if (!window.confirm('Are you sure you want to delete this email account?')) return;
    
    setLoading(true);
    try {
      await axios.delete(`http://localhost:3000/email/accounts/${email}`, { withCredentials: true });
      notify('Email account removed successfully', 'success');
      fetchEmailAccounts();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to remove email account', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhone = async (number) => {
    if (!window.confirm('Are you sure you want to delete this phone number?')) return;
    
    setLoading(true);
    try {
      await axios.delete(`http://localhost:3000/sms/numbers/${number}`, { withCredentials: true });
      notify('Phone number removed successfully', 'success');
      fetchPhoneNumbers();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to remove phone number', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 pl-10 pr-10">
      {/* Notifier component */}
      <Notifier ref={notifierRef} />
      
      <h1 className="text-xl font-bold">Холболтууд</h1>

      {/* Email Accounts Section */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Имэйл хаягууд</h2>
          <button 
            onClick={() => setShowEmailForm(!showEmailForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {showEmailForm ? 'Cancel' : 'Add Email Account'}
          </button>
        </div>

        {showEmailForm && (
          <div className="bg-gray-50 p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-medium mb-4">Имэйл хаяг нэмэх</h3>
            <form onSubmit={handleEmailSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Имэйл</label>
                  <input
                    type="email"
                    name="email"
                    value={emailForm.email}
                    onChange={handleEmailInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Нууц үг</label>
                  <input
                    type="password"
                    name="password"
                    value={emailForm.password}
                    onChange={handleEmailInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Үйлчилгээ</label>
                  <select
                    name="service"
                    value={emailForm.service}
                    onChange={handleEmailInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="gmail">Gmail</option>
                    <option value="outlook">Outlook</option>
                    <option value="yahoo">Yahoo</option>
                    <option value="mailchimp">Mailchimp</option>
                    <option value="amozon ses">Amozon ses</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">App Token (Optional)</label>
                  <input
                    type="text"
                    name="token"
                    value={emailForm.token}
                    onChange={handleEmailInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Өдрийн хязгаар</label>
                  <input
                    type="number"
                    name="limit"
                    value={emailForm.limit}
                    onChange={handleEmailInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
              <div className="mt-4">
                <button 
                  type="submit" 
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Имэйлийг татаж байна...</p>
          </div>
        ) : emailAccounts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left">Имэйл</th>
                  <th className="py-3 px-4 text-left">Үйлчилгээ</th>
                  <th className="py-3 px-4 text-left">Өдрийн хязгаар</th>
                  <th className="py-3 px-4 text-left">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {emailAccounts.map((account) => (
                  <tr key={account.email} className="hover:bg-gray-50">
                    <td className="py-3 px-4">{account.email}</td>
                    <td className="py-3 px-4 capitalize">{account.service}</td>
                    <td className="py-3 px-4">{account.limit} имэйл/өдөрт</td>
                    <td className="py-3 px-4">
                      <button 
                        className="hover:text-red-700 mr-2 flex gap-2.5"
                        onClick={() => handleDeleteEmail(account.email)}
                        disabled={loading}
                      >
                        <Trash/>Хасах
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 p-8 text-center text-gray-500 rounded-lg">
            Бүртгэгдсэн имэйл хаяг байхгүй. Имэйл илгээж эхлэхийн тулд анхны имэйл хаягаа нэмнэ үү.
          </div>
        )}
      </div>

      {/* Phone Numbers Section */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Twilio Утасны дугаарууд</h2>
          <button 
            onClick={() => setShowPhoneForm(!showPhoneForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {showPhoneForm ? 'Cancel' : 'Add Phone Number'}
          </button>
        </div>

        {showPhoneForm && (
          <div className="bg-gray-50 p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-medium mb-4">Утасны дугаар нэмэх</h3>
            <form onSubmit={handlePhoneSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Утасны дугаар</label>
                  <input
                    type="text"
                    name="number"
                    value={phoneForm.number}
                    onChange={handlePhoneInputChange}
                    placeholder="+15551234567"
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Twilio SID</label>
                  <input
                    type="text"
                    name="SID"
                    value={phoneForm.SID}
                    onChange={handlePhoneInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Twilio Auth Token</label>
                  <input
                    type="password"
                    name="token"
                    value={phoneForm.token}
                    onChange={handlePhoneInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
              <div className="mt-4">
                <button 
                  type="submit" 
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Phone Number'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Утасны дугааруудыг татаж байна...</p>
          </div>
        ) : phoneNumbers.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left">Утасны дугаар</th>
                  <th className="py-3 px-4 text-left">Account SID</th>
                  <th className="py-3 px-4 text-left">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {phoneNumbers.map((phone) => (
                  <tr key={phone.number} className="hover:bg-gray-50">
                    <td className="py-3 px-4">{phone.number}</td>
                    <td className="py-3 px-4">{maskData(phone.SID)}</td>
                    <td className="py-3 px-4">
                      <button 
                        className="hover:text-red-700 mr-2 flex gap-2.5"
                        onClick={() => handleDeletePhone(phone.number)}
                        disabled={loading}
                      >
                       <Trash/>Хасах                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 p-8 text-center text-gray-500 rounded-lg">
           Бүртгэгдсэн утасны дугаар алга. SMS илгээж эхлэхийн тулд анхны Twilio утасны дугаараа нэмнэ үү.
          </div>
        )}
      </div>
    </div>
  );
};

export default Connections;