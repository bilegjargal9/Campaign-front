// CustomerOptions.js
import React from 'react';
import { ChevronDown } from 'lucide-react';

const CustomerOptions = ({ showOptions, toggleOptions, handleSingleForm, handleExcelForm }) => {
    return (
        <div className="relative inline-block">
            <div className="flex gap-5">
                <button 
                    className="bg-white text-gray-800 border border-gray-300 px-4 py-2 rounded flex items-center gap-2 transition duration-200 hover:bg-gray-100"
                    onClick={toggleOptions}
                >
                    <span>Хэрэглэгч Нэмэх</span>
                    <ChevronDown />
                </button>
                
                <button className="bg-white text-gray-800 border border-gray-300 px-4 py-2 rounded flex items-center gap-2 transition duration-200 hover:bg-gray-100">
                    <span>Сегмент</span>
                </button>
            </div>
            
            {showOptions && (
                <div className="fixed mt-2 w-48 bg-white border border-gray-300 shadow-md rounded-lg flex flex-col animate-slide-down z-50">
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={handleSingleForm}>
                        Нэг хэрэглэгч нэмэх
                    </button>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={handleExcelForm}>
                        Excel файл оруулах
                    </button>
                </div>
            )}
        </div>
    );
};

export default CustomerOptions;