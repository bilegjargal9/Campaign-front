import React, { useState, useEffect } from 'react';
import { X, Search, Check } from 'lucide-react';
import userApi from '../../api/user';

const TeamSelector = ({ onClose, onTeamSelected, excludeIds = [] }) => {
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSupervisors, setSelectedSupervisors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        const response = await userApi.getAllSupervisors();
        const filtered = response.data.filter(
          (user) => !excludeIds.includes(user.id_uuid)
        );
        setSupervisors(filtered);
      } catch (err) {
        console.error('Error fetching supervisors:', err);
        setError('Хэрэглэгчдийг ачаалахад алдаа гарлаа');
      } finally {
        setLoading(false);
      }
    };

    fetchSupervisors();
  }, [excludeIds]);

  const handleSelectUser = (userId) => {
    setSelectedSupervisors((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = () => {
    if (selectedSupervisors.length > 0 && name.trim()) {
      onTeamSelected(selectedSupervisors, name, description);
    }
  };

  const filteredSupervisors = supervisors.filter((user) => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const username = user.username.toLowerCase();
    const term = searchTerm.toLowerCase();
    return fullName.includes(term) || username.includes(term);
  });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-xl font-semibold">Багийн гишүүд нэмэх</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition">
            <X size={24} />
          </button>
        </div>

        <div className="px-6 py-4 border-b space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Багийн нэр *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Тайлбар
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows="2"
            />
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Хэрэглэгч хайх..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 border border-gray-300 rounded-md"
            />
            <Search className="absolute left-3 top-3 text-gray-500" size={18} />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto px-4 py-2 custom-scroll">
          {loading ? (
            <div className="flex justify-center items-center h-full text-sm text-gray-600">
              Уншиж байна...
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-4">{error}</div>
          ) : filteredSupervisors.length === 0 ? (
            <div className="text-center text-gray-500 p-4">Хэрэглэгч олдсонгүй</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredSupervisors.map((user) => (
                <li
                  key={user.id_uuid}
                  onClick={() => handleSelectUser(user.id_uuid)}
                  className={`p-3 flex justify-between items-center transition rounded hover:bg-gray-100 cursor-pointer ${
                    selectedSupervisors.includes(user.id_uuid) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium">{user.first_name} {user.last_name}</p>
                    <p className="text-sm text-gray-500">{user.username}</p>
                  </div>
                  {selectedSupervisors.includes(user.id_uuid) && (
                    <Check className="text-blue-600" size={20} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-white flex justify-between items-center">
          <span className="text-sm text-gray-700">
            {selectedSupervisors.length} хэрэглэгч сонгосон
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Цуцлах
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedSupervisors.length === 0 || !name.trim()}
              className={`px-4 py-2 text-white rounded-md transition ${
                selectedSupervisors.length === 0 || !name.trim()
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Нэмэх
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamSelector;
