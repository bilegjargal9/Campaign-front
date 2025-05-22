// CustomerProfile.js
import React, { useState, useEffect } from 'react';
import customerApi from '../../api/customer';
import segmentationApi from '../../api/segmentation';

const CustomerProfile = ({ customer, onClose, onSave }) => {
  const [customerData, setCustomerData] = useState(customer);
  const [availableSegments, setAvailableSegments] = useState([]);
  const [selectedSegments, setSelectedSegments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchSegments = async () => {
      try {
        setLoading(true);
        const segmentationRes = await segmentationApi.getAllSegments();
        const segments = Array.isArray(segmentationRes) ? segmentationRes : segmentationRes?.data;
        
        setAvailableSegments(segments || []);
        
        if (customer.Segment_audience) {
          const currentSegment = segments.find(seg => seg.name === customer.Segment_audience);
          if (currentSegment) {
            setSelectedSegments([currentSegment.id_uuid]);
          }
        }
      } catch (error) {
        console.error("Error loading segments:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSegments();
  }, [customer]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSegmentChange = (segmentId) => {
    setSelectedSegments([segmentId]);
  };
  
  const handleSave = async () => {
    try {
      setLoading(true);
      
      await customerApi.updateCustomer(customerData.id_uuid, customerData);
      
      if (selectedSegments.length > 0) {
        const segmentId = selectedSegments[0];
        await segmentationApi.addCustomerToSegment(segmentId, [customerData.id_uuid]);
      }
      
      onSave({
        ...customerData,
        Segment_audience: selectedSegments.length > 0 
          ? availableSegments.find(s => s.id_uuid === selectedSegments[0])?.name 
          : null
      });
    } catch (error) {
      console.error("Error saving customer:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Хэрэглэгчийн мэдээлэл</h2>
          <button 
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            ✕
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-6">Уншиж байна...</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Нэр
                </label>
                <input
                  name="first_name"
                  value={customerData.first_name || ''}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Овог
                </label>
                <input
                  name="last_name"
                  value={customerData.last_name || ''}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имэйл
                </label>
                <input
                  name="email"
                  type="email"
                  value={customerData.email || ''}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Утасны дугаар
                </label>
                <input
                  name="phone_number"
                  value={customerData.phone_number || ''}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Нас
                </label>
                <input
                  name="age"
                  type="number"
                  value={customerData.age || ''}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Сегмент
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableSegments.map(segment => (
                  <div key={segment.id_uuid} className="flex items-center">
                    <input
                      type="radio"
                      id={`segment-${segment.id_uuid}`}
                      name="segment"
                      checked={selectedSegments.includes(segment.id_uuid)}
                      onChange={() => handleSegmentChange(segment.id_uuid)}
                      className="mr-2"
                    />
                    <label htmlFor={`segment-${segment.id_uuid}`}>
                      {segment.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Буцах
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={loading}
              >
                Хадгалах
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerProfile;