//customer.jsx

import React, { useState, useEffect } from 'react';
import customerApi from '../api/customer';
import segmentationApi from '../api/segmentation';
import campaignApi from '../api/campaign.js';
import '../styles/customer.css';
import { List, ArrowUpDown, PlusCircle, SquarePen, Trash, ChevronDown } from 'lucide-react';
import customerController from '../controller/customerController';
import AddCustomerForm from '../components/forCustomers/addCustomerForm.jsx';
import AddCustomerExcel from '../components/forCustomers/addCustomerExcel.jsx';
import Notifier from '../components/notifier';
import CustomerSearch from '../components/forCustomers/customerSearch.jsx';
import CustomerTable from '../components/forCustomers/CustomerTable.jsx';
import CustomerFilter from '../components/forCustomers/CustomerFilter.jsx';
import CustomerPagination from '../components/forCustomers/CustomerPagination.jsx';
import CustomerOptions from '../components/forCustomers/CustomerOptions.jsx';
import CustomerProfile from '../components/forCustomers/CustomerProfile.jsx';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [segmentation, setSegmentation] = useState([]);
    const [selectedSegmentation, setSelectedSegmentation] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(50);
    const [showOptions, setShowOptions] = useState(false);
    const [showSingleForm, setShowSingleForm] = useState(false);
    const [showExcelForm, setShowExcelForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [showCustomerProfile, setShowCustomerProfile] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedSegmentationDetail, setSelectedSegmentationDetail] = useState(null);
    const [selectedCampaign, setSelectedCampaign] = useState('');
    const [selectedCampaignDetail, setSelectedCampaignDetail] = useState(null);
    
    const notifierRef = React.useRef();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const response = await customerApi.getAllCustomers();
            const customersData = Array.isArray(response) ? response : response?.data;
            
            if (customersData) {
                setCustomers(customersData);
                setLoading(false);
            } else {
                setError("Invalid data format received from server");
                setLoading(false);
            }
            
            customerController.setNotifier({
                show: (msg, type) => notifierRef.current?.show(msg, type),
            });

            const segmentationRes = await segmentationApi.getAllSegments();
            const segmentations = Array.isArray(segmentationRes) ? segmentationRes : segmentationRes?.data;
            setSegmentation(segmentations || []);
            
        } catch (error) {
            console.error("Error loading customers:", error);
            setError(error.message || "Failed to load customers");
            setLoading(false);
        }
    };

    const handleSegmentationChange = async (event) => {
        const selectedId = event.target.value;
        setSelectedSegmentation(selectedId);

        setCurrentPage(1);
    
        try {
            const response = await segmentationApi.getSegmentDetails(selectedId);
            setSelectedSegmentationDetail(response);
        } catch (err) {
            console.error("Segment details load error:", err);
            setSelectedSegmentationDetail(null);
        }
    };
    

    const toggleOptions = () => {
        setShowOptions(prevState => !prevState);
    };

    const handleSingleForm = () => {
        setShowSingleForm(prevState => !prevState);
        setShowOptions(false);
    };

    const handleExcelForm = () => {
        setShowExcelForm(prevState => !prevState);
        setShowOptions(false);
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    const removeCustomerFromList = (customer_id) => {
        setCustomers(prev => prev.filter(c => c.id_uuid !== customer_id));
    };

    const handleCheckboxChange = (customerId) => {
        setSelectedCustomers(prev => {
            const isSelected = prev.includes(customerId);
            return isSelected
                ? prev.filter((id) => id !== customerId)
                : [...prev, customerId];
        });
    };

    const handleSelectAll = (displayedCustomers) => {
        const displayedIds = displayedCustomers.map((c) => c.id_uuid);
        const allSelected = displayedIds.every(id => selectedCustomers.includes(id));
        
        setSelectedCustomers(prev => {
            return allSelected
                ? prev.filter(id => !displayedIds.includes(id))
                : [...new Set([...prev, ...displayedIds])];
        });
    };

    const handleBulkDelete = async () => {
        await customerController.deleteBulk(selectedCustomers);
        const newCustomers = customers.filter(c => !selectedCustomers.includes(c.id_uuid));
        
        const totalPages = Math.ceil(newCustomers.length / itemsPerPage);
        const newPage = Math.min(currentPage, totalPages || 1);
        
        setCustomers(newCustomers);
        setSelectedCustomers([]);
        setCurrentPage(newPage);
    };

    const openCustomerProfile = (customer) => {
        setSelectedCustomer(customer);
        setShowCustomerProfile(true);
    };

    const closeCustomerProfile = () => {
        setShowCustomerProfile(false);
        setSelectedCustomer(null);
    };


    

    

    const handleCampaignChange = async (event) => {
        const selectedId = event.target.value;
        setSelectedCampaign(selectedId);
        setCurrentPage(1);
    
        try {
            if (selectedId) {
                const response = await campaignApi.getCampaignDetails(selectedId);
                setSelectedCampaignDetail(response);
            } else {
                setSelectedCampaignDetail(null);
            }
        } catch (err) {
            console.error("Campaign details load error:", err);
            setSelectedCampaignDetail(null);
        }
    };
    
    const filteredCustomers = customers.filter((customer) => {
        const firstNameMatch = customer.first_name.toLowerCase().includes(searchQuery.toLowerCase());
        const emailMatch = customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
        const phoneNumberMatch = customer.phone_number?.replace(/\D/g, '').includes(searchQuery) || false;
    
        const segmentationMatch = (() => {
            if (!selectedSegmentation || !selectedSegmentationDetail) return true;
            const segmentedIds = selectedSegmentationDetail.customers?.map(aud => aud.customer?.id_uuid) || [];
            return segmentedIds.includes(customer.id_uuid);
        })();
    
        const campaignMatch = (() => {
            if (!selectedCampaign || !selectedCampaignDetail) return true;
            const campaignCustomerIds = selectedCampaignDetail.audiences?.map(aud => 
                aud.customer?.id_uuid
            ) || [];
            return campaignCustomerIds.includes(customer.id_uuid);
        })();
    
        return (firstNameMatch || emailMatch || phoneNumberMatch) && 
               segmentationMatch && 
               campaignMatch;
    });
    
    
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const displayedCustomers = filteredCustomers.slice(startIndex, endIndex);

    return (
        <div className="p-6 pl-10 pr-10">
            <Notifier ref={notifierRef} />
            
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">Хэрэглэгчид</h1>
                
                <CustomerOptions 
                    showOptions={showOptions}
                    toggleOptions={toggleOptions}
                    handleSingleForm={handleSingleForm}
                    handleExcelForm={handleExcelForm}
                />
            </div>
            
            {showSingleForm && <AddCustomerForm closeModal={handleSingleForm} onSuccess={loadData} />}
            {showExcelForm && <AddCustomerExcel closeModal={handleExcelForm} onSuccess={loadData} />}
            
            <CustomerFilter
            onSearch={handleSearch}
            segmentation={segmentation}
            selectedSegmentation={selectedSegmentation}
            onSegmentationChange={handleSegmentationChange}
            selectedCampaign={selectedCampaign}
            onCampaignChange={handleCampaignChange}
            selectedCustomers={selectedCustomers}
            onBulkDelete={handleBulkDelete}
            currentPage={currentPage}
            totalPages={totalPages}
            startIndex={startIndex}
            endIndex={endIndex}
            customersCount={customers.length}
            onPageChange={setCurrentPage}
        />
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>Алдаа:</strong> {error}
                </div>
            )}
            
            <CustomerTable
                loading={loading}
                displayedCustomers={displayedCustomers}
                selectedCustomers={selectedCustomers}
                onCheckboxChange={handleCheckboxChange}
                onSelectAll={handleSelectAll}
                onDelete={removeCustomerFromList}
                onEdit={openCustomerProfile}
            />
            
            <CustomerPagination
                currentPage={currentPage}
                totalPages={totalPages}
                startIndex={startIndex}
                endIndex={endIndex}
                customersCount={customers.length}
                onPageChange={setCurrentPage}
            />
            
            {showCustomerProfile && selectedCustomer && (
                <CustomerProfile 
                    customer={selectedCustomer}
                    onClose={closeCustomerProfile}
                    segmentation={segmentation}
                    onSave={loadData}
                />
            )}
        </div>
    );
};

export default Customers;