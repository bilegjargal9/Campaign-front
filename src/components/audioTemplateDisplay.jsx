// Add this component to your project to display templates with audio
import React from 'react';

const TemplateDisplay = ({ templates, onSelect, onDelete }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h3 className="text-lg font-medium mb-3">Available Templates</h3>
      
      {templates.length === 0 ? (
        <p className="text-gray-500">No templates available</p>
      ) : (
        <div className="space-y-3">
          {templates.map(template => (
            <div key={template.id_uuid} className="border rounded-md p-3 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium">
                  {template.message 
                    ? template.message.substring(0, 30) + (template.message.length > 30 ? '...' : '')
                    : 'Audio-only template'}
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => onSelect(template.id_uuid)} 
                    className="text-blue-500 hover:text-blue-700 text-sm"
                  >
                    Use
                  </button>
                  <button 
                    onClick={() => onDelete(template.id_uuid)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {template.audio_url && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Audio file:</p>
                  <audio controls className="w-full h-8">
                    <source src={template.audio_url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
              
              <div className="text-xs text-gray-500 mt-2">
                Created: {new Date(template.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateDisplay;