// CustomerSearch.jsx

import React, { useState } from 'react';

const CustomerSearch = ({ onSearch }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = () => {
        onSearch(searchQuery);
    };

    return (
        <div className="flex items-center gap-2">
            <input
                type="text"
                className="border border-gray-300 px-3 py-2 rounded-lg w-80"
                placeholder="Хэрэглэгч хайх..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
                className="bg-[#405fa3] text-white px-4 py-2 rounded-lg"
                onClick={handleSearch}
            >
                Хайх
            </button>
        </div>
    );
};

export default CustomerSearch;

