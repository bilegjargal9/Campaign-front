// components/forCampaigns/AddCampaignForm.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../api/campaign'

const AddCampaignForm = ({ onClose, onCampaignCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedChannel, setChannel] = useState('all');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!name.trim()) {
            return;
        }
        
        setLoading(true);
        try {
            const response = await api.createCampaign(name, description, selectedChannel);
            if (onCampaignCreated) {
                onCampaignCreated(response.data);
            }
            onClose();
        } catch (error) {
            console.error('Error creating campaign:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-lg font-medium">Кампанит ажил нэмэх</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-4">
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Кампанит ажлын нэр *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                            required
                        />
                    </div>

                    <div className=' mb-4'>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                            Түгээх суваг
                        </label>

                        <select
                        className="border border-gray-300 px-3 py-2 rounded-lg w-48"
                        value={selectedChannel}
                        onChange={(e) => setChannel(e.target.value)}
                        >
                        <option value="all">Бүгд</option>
                        <option value="email">Имэйл</option>
                        <option value="sms_dial">Дуудлага болон мессэж</option>
                        </select>



                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Тайлбар
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                            rows="3"
                        />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
                        >
                            Цуцлах
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className={`px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 ${
                                (loading || !name.trim()) ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            {loading ? 'Хадгалж байна...' : 'Хадгалах'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCampaignForm;