//customerSelector.jsx

import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import api from '../../api/customer';

const CustomerSelector = ({ onClose, onCustomersSelected, excludeIds = [] }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await api.getAllCustomers();
                const customersData = Array.isArray(response) ? response : response?.data;
                
                if (customersData) {
                    const filteredCustomers = customersData.filter(
                        customer => !excludeIds.includes(customer.id_uuid)
                    );
                    setCustomers(filteredCustomers);
                }
            } catch (error) {
                console.error("Error loading customers:", error);
                setError(error.message || "Failed to load customers");
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, [excludeIds]);

    const handleCheckboxChange = (customerId) => {
        setSelectedCustomers(prev => {
            if (prev.includes(customerId)) {
                return prev.filter(id => id !== customerId);
            } else {
                return [...prev, customerId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedCustomers.length === filteredCustomers.length) {
            setSelectedCustomers([]);
        } else {
            setSelectedCustomers(filteredCustomers.map(c => c.id_uuid));
        }
    };

    const handleSubmit = () => {
        if (selectedCustomers.length > 0) {
            onCustomersSelected(selectedCustomers);
        }
    };

    // Filter customers based on search query
    const filteredCustomers = customers.filter((customer) => {
        if (!searchQuery) return true;
        
        const firstNameMatch = customer.first_name.toLowerCase().includes(searchQuery.toLowerCase());
        const lastNameMatch = customer.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
        const emailMatch = customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
        const phoneNumberMatch = customer.phone_number?.replace(/\D/g, '').includes(searchQuery) || false;
    
        return firstNameMatch || lastNameMatch || emailMatch || phoneNumberMatch;
    });

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-lg font-medium">Хэрэглэгч сонгох</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-4 border-b">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search size={18} className="text-gray-500" />
                            </div>
                            <input
                                type="text"
                                className="w-full pl-10 p-2 border border-gray-300 rounded"
                                placeholder="Хэрэглэгч хайх..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                
                <div className="overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex justify-center items-center p-8">
                            <span>Уншиж байна...</span>
                        </div>
                    ) : error ? (
                        <div className="p-4 text-red-600">
                            {error}
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            Хэрэглэгч олдсонгүй
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="w-10 p-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={
                                                filteredCustomers.length > 0 &&
                                                selectedCustomers.length === filteredCustomers.length
                                            }
                                            onChange={handleSelectAll}
                                            className="rounded"
                                        />
                                    </th>
                                    <th className="p-3 text-left">Нэр</th>
                                    <th className="p-3 text-left">Имэйл</th>
                                    <th className="p-3 text-left">Утасны дугаар</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.id_uuid} className="border-t border-gray-100">
                                        <td className="p-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedCustomers.includes(customer.id_uuid)}
                                                onChange={() => handleCheckboxChange(customer.id_uuid)}
                                                className="rounded"
                                            />
                                        </td>
                                        <td className="p-3">{customer.first_name} {customer.last_name}</td>
                                        <td className="p-3">{customer.email || '-'}</td>
                                        <td className="p-3">{customer.phone_number || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                
                <div className="p-4 border-t flex justify-between items-center">
                    <div>
                        {selectedCustomers.length > 0 && (
                            <span className="text-blue-600">
                                {selectedCustomers.length} хэрэглэгч сонгогдсон
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
                        >
                            Цуцлах
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={selectedCustomers.length === 0}
                            className={`px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 ${
                                selectedCustomers.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
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

export default CustomerSelector;