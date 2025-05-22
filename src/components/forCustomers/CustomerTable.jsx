// CustomerTable.js
import React from 'react';
import { List, ArrowUpDown, PlusCircle, SquarePen, Trash } from 'lucide-react';
import customerController from '../../controller/customerController';

const CustomerTable = ({ 
    loading, 
    displayedCustomers, 
    selectedCustomers, 
    onCheckboxChange, 
    onSelectAll,
    onDelete,
    onEdit
}) => {
    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-4">
                <div className="text-center py-4">Уншиж байна...</div>
            </div>
        );
    }

    const handleDelete = (customerId) => {
        customerController.deleteCustomer(customerId, () => onDelete(customerId));
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full table-auto">
                <thead className="bg-white">
                    <tr className="border-b-[#7d7d7d]">
                        <th className="w-10 p-3 text-left">
                            <input
                                type="checkbox"
                                checked={
                                    displayedCustomers.length > 0 &&
                                    displayedCustomers.every((c) => selectedCustomers.includes(c.id_uuid))
                                }
                                onChange={() => onSelectAll(displayedCustomers)}
                                className="custom-checkbox"
                            />
                        </th>
                        <th className="p-3 text-left">
                            <div className="flex items-center text-[#192F5D]">
                                Нэр
                            </div>
                        </th>
                        <th className="p-3 text-left">
                            <div className="flex items-center font-medium">
                                Имэйл
                                <button className="ml-1">
                                    <List className="text-[#262A2E] h-5 ml-20"/>
                                </button>
                            </div>
                        </th>
                        <th className="p-3 text-left">
                            <div className="flex items-center font-medium">
                                Утасны Дугаар
                                <button className="ml-1">
                                    <ArrowUpDown className="text-[#262A2E] h-5"/>
                                </button>
                            </div>
                        </th>
                        <th className="p-3 text-left">
                            <div className="flex items-center font-medium">
                                Сегмент
                                <button className="ml-1">
                                    <ArrowUpDown className="text-[#262A2E] h-5"/>
                                </button>
                            </div>
                        </th>
                        <th className="p-3 text-left">
                            <div className="flex items-center font-medium">
                                Нас
                                <button className="ml-1">
                                    <ArrowUpDown className="text-[#262A2E] h-5"/>
                                </button>
                            </div>
                        </th>
                        <th className="p-3 text-center font-medium">Үйлдэл</th>
                    </tr>
                </thead>
                <tbody>
                    {displayedCustomers.length > 0 ? (
                        displayedCustomers.map((customer) => (
                            <tr key={customer.id_uuid || customer._id} className="border-[#c3bfbf] hover:bg-gray-50">
                                <td className="p-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedCustomers.includes(customer.id_uuid)}
                                        onChange={() => onCheckboxChange(customer.id_uuid)}
                                        className="custom-checkbox"
                                    />
                                </td>
                                <td className="p-3">{customer.first_name}</td>
                                <td className="p-3">{customer.email}</td>
                                <td className="p-3">{customer.phone_number}</td>
                                <td className="p-3">{customer.Segment_audience}</td>
                                <td className="p-3">{customer.age}</td>
                                <td className="p-3 flex justify-center gap-2">
                                    <PlusCircle className="w-6 h-6 text-[#262A2E] flex items-center justify-center cursor-pointer hover:text-blue-500 transition-colors duration-200"/>
                                    <SquarePen 
                                        className="w-6 h-6 text-[#262A2E] flex items-center justify-center cursor-pointer hover:text-blue-500 transition-colors duration-200"
                                        onClick={() => onEdit(customer)}
                                    />
                                    <Trash
                                        className="w-6 h-6 text-[#262A2E] flex items-center justify-center cursor-pointer hover:text-red-500 transition-colors duration-200"
                                        onClick={() => handleDelete(customer.id_uuid)}
                                    />
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7" className="text-center text-gray-500 py-4">
                                Хэрэглэгч олдсонгүй
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default CustomerTable;
