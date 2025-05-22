// systemUsers.jsx
import React, { useState, useEffect, useRef } from 'react';
import userApi from "../api/user";
import Notifier from '../components/notifier';
import { SquarePen, Trash } from 'lucide-react';


const SystemUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const notifierRef = useRef();
  
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'supervisor'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userApi.getAllUsers();
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      notifierRef.current.show(
        error.response?.data?.message || 'Failed to fetch users',
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

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await userApi.register(formData);
      notifierRef.current.show('User successfully registered', 'success');
      setShowAddForm(false);
      setFormData({
        username: '',
        first_name: '',
        last_name: '',
        password: '',
        role: 'supervisor'
      });
      fetchUsers();
    } catch (error) {
      notifierRef.current.show(
        error.response?.data?.message || 'Failed to register user',
        'error'
      );
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      await userApi.updateUser(currentUser.id_uuid, formData);
      notifierRef.current.show('User successfully updated', 'success');
      setShowEditForm(false);
      setCurrentUser(null);
      fetchUsers();
    } catch (error) {
      notifierRef.current.show(
        error.response?.data?.message || 'Failed to update user',
        'error'
      );
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userApi.deleteUser(userId);
        notifierRef.current.show('User successfully deleted', 'success');
        fetchUsers();
      } catch (error) {
        notifierRef.current.show(
          error.response?.data?.message || 'Failed to delete user',
          'error'
        );
      }
    }
  };

  const openEditForm = (user) => {
    setCurrentUser(user);
    setFormData({
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      password: '', 
      role: user.role
    });
    setShowEditForm(true);
  };

  const getRoleDisplay = (role) => {
    const roles = {
      'admin': 'Админ',
      'user': 'Хэрэглэгч',
      'supervisor': 'Хянагч'
    };
    return roles[role] || role;
  };


  return (
    <div className="container mx-auto p-4">
      <Notifier ref={notifierRef} />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Системийн хэрэглэгчид</h1>
        <button 
          onClick={() => {
            setFormData({
              username: '',
              first_name: '',
              last_name: '',
              password: '',
              role: 'supervisor'
            });
            setShowAddForm(true)}}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Хэрэглэгч нэмэх
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Хэрэглэгчийн нэр
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Нэр
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Овог
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Эрх
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Үйлдэл
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id_uuid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.first_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.last_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                      user.role === 'supervisor' ? 'bg-blue-100 text-blue-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {getRoleDisplay(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openEditForm(user)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <SquarePen/>
                  </button>
                    <button
                      onClick={() => handleDeleteUser(user.id_uuid)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showAddForm && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Шинэ хэрэглэгч бүртгэх</h3>
            <form onSubmit={handleAddUser}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Хэрэглэгчийн нэр</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Нэр</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Овог</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Нууц үг</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Эрх</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="user">Хэрэглэгч</option>
                  <option value="supervisor">Хянагч</option>
                  <option value="admin">Админ</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded mr-2"
                >
                  Цуцлах
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Бүртгэх
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditForm && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Хэрэглэгчийн мэдээлэл засах</h3>
            <form onSubmit={handleEditUser}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Хэрэглэгчийн нэр</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Нэр</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Овог</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Нууц үг (хоосон орхивол хэвээр үлдэнэ)</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Эрх</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="user">Хэрэглэгч</option>
                  <option value="supervisor">Хянагч</option>
                  <option value="admin">Админ</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemUsers;