//UserProfile.jsx

import React, { useState, useEffect, useRef } from 'react';
import userApi from "../api/user";
import Notifier from '../components/notifier';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const notifierRef = useRef();
  
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'supervisor'
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await userApi.getProfile();
      setUser(response.data.user);
      console.log(response.data.user);
      
      setFormData({
        username: response.data.username || '',
        first_name: response.data.first_name || '',
        last_name: response.data.last_name || '',
        password: '',
        confirm_password: ''
      });
      
      setLoading(false);
    } catch (error) {
      notifierRef.current.show(
        error.response?.data?.message || 'Профайл мэдээлэл авахад алдаа гарлаа',
        'error'
      );
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.confirm_password) {
      notifierRef.current.show('Нууц үг таарахгүй байна', 'error');
      return;
    }
    
    try {
      const { confirm_password, ...dataToSend } = formData;
      
      if (dataToSend.password === '') {
        delete dataToSend.password;
      }
      
      await userApi.updateUser(user.id, dataToSend);
      setIsEditing(false);
      fetchUserProfile(); 
      notifierRef.current.show('Профайл амжилттай шинэчлэгдлээ', 'success');
      window.location.reload();
    } catch (error) {
      notifierRef.current.show(
        error.response?.data?.message || 'Профайл шинэчлэхэд алдаа гарлаа',
        'error'
      );
    }
  };

  const getRoleDisplay = (role) => {
    const roles = {
      'admin': 'Админ',
      'user': 'Хэрэглэгч',
      'supervisor': 'Хянагч'
    };
    return roles[role] || role;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Notifier ref={notifierRef} />
      
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Хэрэглэгчийн профайл</h1>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Засах
            </button>
          )}
        </div>
        
        {!isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Хэрэглэгчийн нэр</h3>
                <p className="text-lg">{user.username}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Эрх</h3>
                <p className="text-lg">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                    user.role === 'supervisor' ? 'bg-blue-100 text-blue-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    {getRoleDisplay(user.role)}
                  </span>
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Нэр</h3>
                <p className="text-lg">{user.first_name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Овог</h3>
                <p className="text-lg">{user.last_name}</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Хэрэглэгчийн нэр</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Эрх</label>
                <p className="text-lg">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                    user.role === 'supervisor' ? 'bg-blue-100 text-blue-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    {getRoleDisplay(user.role)}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">Эрхийг зөвхөн админ өөрчлөх боломжтой</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Нэр</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Овог</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium mb-2">Нууц үг өөрчлөх</h3>
              <p className="text-sm text-gray-500 mb-3">Нууц үг өөрчлөхгүй бол хоосон орхино уу</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Шинэ нууц үг</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Нууц үг давтах</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={formData.confirm_password || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    username: user.username || '',
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    password: '',
                    confirm_password: ''
                  });
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded mr-2"
              >
                Цуцлах
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Хадгалах
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserProfile;