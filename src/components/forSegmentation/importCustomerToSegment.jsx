//importCustomer.jsx

import React, { useState, useRef } from 'react';
import { X, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../api/segmentation';

const ImportCustomer = ({ onClose, segment_id}) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Check if file is Excel
    if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
      setError('Зөвхөн Excel (.xlsx, .xls) файл оруулна уу');
      return;
    }

    setFile(selectedFile);
    setError(null);
    processExcel(selectedFile);
  };

  const processExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Validate headers
        const headerRow = jsonData[0];
        const requiredHeaders = ['first_name', 'last_name', 'age', 'phone_number', 'email'];
        const headerMap = {};
        
        headerRow.forEach((header, index) => {
          const normalizedHeader = header.toLowerCase().trim().replace(/\s+/g, '_');
          if (requiredHeaders.includes(normalizedHeader)) {
            headerMap[index] = normalizedHeader;
          }
        });

        if (Object.keys(headerMap).length < 2) {
          setError('Excel файл дор хаяж first_name, phone_number эсвэл email багана агуулсан байх ёстой');
          setPreview([]);
          return;
        }

        // Process data rows
        const processedData = [];
        for (let i = 1; i < Math.min(jsonData.length, 6); i++) {
          const row = jsonData[i];
          if (!row.length) continue;
          
          const customer = {};
          Object.entries(headerMap).forEach(([index, field]) => {
            if (row[index] !== undefined) {
              customer[field] = row[index].toString();
            }
          });

          if (customer.first_name || customer.email || customer.phone_number) {
            processedData.push(customer);
          }

          console.log(customer);
        }

        setPreview(processedData);
        
        if (processedData.length === 0) {
          setError('Боловсруулах өгөгдөл олдсонгүй');
        }
      } catch (err) {
        console.error('Error processing Excel:', err);
        setError('Excel файл уншихад алдаа гарлаа');
        setPreview([]);
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      // Check if file is Excel
      if (!droppedFile.name.match(/\.(xlsx|xls)$/)) {
        setError('Зөвхөн Excel (.xlsx, .xls) файл оруулна уу');
        return;
      }
      setFile(droppedFile);
      setError(null);
      processExcel(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const uploadExcel = async () => {
    if (!file) return;
    
    try {
      setUploading(true);
      setError(null);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Map headers to fields
          const headerRow = jsonData[0];
          const headerMap = {};
          
          headerRow.forEach((header, index) => {
            const normalizedHeader = header.toLowerCase().trim().replace(/\s+/g, '_');
            if (['first_name', 'last_name', 'age', 'phone_number', 'email'].includes(normalizedHeader)) {
              headerMap[index] = normalizedHeader;
            }
          });
          
          // Process all data rows
          const users = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row.length) continue;
            
            const customer = {};
            Object.entries(headerMap).forEach(([index, field]) => {
              if (row[index] !== undefined) {
                customer[field] = row[index].toString();
              }
            });
            
            // Ensure required fields
            if (customer.first_name && (customer.email || customer.phone_number)) {
              users.push(customer);
            }
          }
          
          if (users.length === 0) {
            throw new Error('Боловсруулах өгөгдөл олдсонгүй');
          }
          
          const response = await api.importCustomer(segment_id, users);
          console.log(response);

          setSuccess(`${response.data?.message}. 
            ${response.data?.added} Хэрэглэгч шинээр нэмэгдлээ.
            ${response.data?.duplicates} давхацсан байна.`);
          
          // Clear form after successful upload
          setTimeout(() => {
            onClose();
            window.location.reload();
          }, 2500);
          
        } catch (err) {
            console.error('Error uploading customers:', err);
          
            // Check if error response has validation errors and format them
            if (err.response && err.response.data.errors) {
              const errorMessages = err.response.data.errors.join(', '); // Join all errors into a single string
              setError(`Хэрэглэгч нэмэхэд алдаа гарлаа: ${errorMessages}`);
            } else {
              setError(err.message || 'Хэрэглэгч нэмэхэд алдаа гарлаа');
            }
          } finally {
            setUploading(false);
          }
      };
      
      reader.readAsArrayBuffer(file);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError('Файл боловсруулахад алдаа гарлаа');
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Excel файлаас хэрэглэгч нэмэх</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <span>{success}</span>
          </div>
        )}

        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4 cursor-pointer hover:bg-gray-50"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />
          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600 mb-1">Excel файлаа энд чирч оруулна уу эсвэл</p>
          <button className="text-blue-600 font-medium">Хуулахаар сонгох</button>
          <p className="text-sm text-gray-500 mt-2">
            Зөвхөн .xlsx, .xls файлууд зөвшөөрөгдөнө
          </p>
        </div>

        {file && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 p-2 rounded">
                <Upload className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setFile(null);
                setPreview([]);
                setError(null);
              }}
              className="text-gray-500 hover:text-red-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {preview.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Урьдчилан харах ({preview.length} мөр):</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(preview[0]).map((key) => (
                      <th key={key} className="p-2 text-left border">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      {Object.values(row).map((value, j) => (
                        <td key={j} className="p-2 border">{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {preview.length === 5 && 'Эхний 5 мөрийг харуулж байна...'}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={uploading}
          >
            Цуцлах
          </button>
          <button
            onClick={uploadExcel}
            disabled={!file || uploading}
            className={`px-4 py-2 rounded-lg bg-blue-600 text-white ${
              !file || uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {uploading ? 'Оруулж байна...' : 'Хэрэглэгч нэмэх'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportCustomer;