// CustomerFilter.js
import React, { useState, useEffect } from 'react';
import CustomerSearch from './customerSearch';
import campaignApi from '../../api/campaign.js';

const CustomerFilter = ({ 
    onSearch, 
    segmentation, 
    selectedSegmentation, 
    onSegmentationChange,
    selectedCampaign,
    onCampaignChange,
    selectedCustomers,
    onBulkDelete,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    customersCount,
    onPageChange
}) => {
    const [campaigns, setCampaigns] = useState([]);
    const [loadingCampaigns, setLoadingCampaigns] = useState(true);

    useEffect(() => {
        const loadCampaigns = async () => {
            try {
                const response = await campaignApi.getAllCampaigns();
                setCampaigns(response);
                setLoadingCampaigns(false);
            } catch (error) {
                console.error("Error loading campaigns:", error);
                setLoadingCampaigns(false);
            }
        };
        
        loadCampaigns();
    }, []);

    return (
        <div className="flex justify-between items-center bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex items-center gap-2">
                <CustomerSearch onSearch={onSearch} />

                {/* Existing segmentation filter */}
                <select
                    className="border border-gray-300 px-3 py-2 rounded-lg w-48"
                    value={selectedSegmentation}
                    onChange={onSegmentationChange}
                >
                    <option value="">Сегментээр шүүх</option>
                    {segmentation.map((seg) => (
                        <option key={seg.id_uuid} value={seg.id_uuid}>{seg.name}</option>
                    ))}
                </select>

                {/* New campaign filter */}
                <select
                    className="border border-gray-300 px-3 py-2 rounded-lg w-48"
                    value={selectedCampaign}
                    onChange={onCampaignChange}
                    disabled={loadingCampaigns}
                >
                    <option value="">Кампанит ажлаар шүүх</option>
                    {campaigns.map((campaign) => (
                        <option key={campaign.id_uuid} value={campaign.id_uuid}>
                            {campaign.name}
                        </option>
                    ))}
                </select>

                {selectedCustomers.length > 0 && (
                    <button
                        className="bg-red-300 border-red-500 hover:bg-red-400 text-black px-4 py-2 rounded-lg"
                        onClick={onBulkDelete}
                    >
                        Сонгогдсон {selectedCustomers.length} хэрэглэгчийг устгах
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2">
                <span>Хуудас</span>
                <input
                    type="number"
                    value={currentPage}
                    min={1}
                    max={totalPages}
                    onChange={(e) => {
                        const enteredValue = parseInt(e.target.value);
                        if (!isNaN(enteredValue)) {
                            const page = Math.min(Math.max(enteredValue, 1), totalPages);
                            onPageChange(page);
                        }
                    }}
                    className="border border-gray-300 px-3 py-2 rounded-lg w-16 text-center"
                />
                <div className="flex items-center">
                    <span className="text-gray-600">
                        {startIndex + 1} - {Math.min(endIndex, customersCount)} нийт {customersCount}
                    </span>
                    <button
                        className="mx-1 p-1 rounded border border-gray-300"
                        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        &lt;
                    </button>
                    <button
                        className="mx-1 p-1 rounded border border-gray-300"
                        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        &gt;
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerFilter;