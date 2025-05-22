//Notifier component jsx

import React, { forwardRef, useImperativeHandle, useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  X
} from 'lucide-react';

const Notifier = forwardRef((props, ref) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [visible, setVisible] = useState(false);

  useImperativeHandle(ref, () => ({
    show(msg, type = 'info') {
      setMessage(msg);
      setType(type);
      setVisible(true);
      setTimeout(() => setVisible(false), 4000);
    }
  }));

  const config = {
    success: {
      bg: 'bg-green-100 border-green-300',
      title: 'SUCCESS!',
      icon: <CheckCircle className="text-green-600" />
    },
    warning: {
      bg: 'bg-yellow-100 border-yellow-300',
      title: 'WARNING!',
      icon: <AlertTriangle className="text-yellow-600" />
    },
    error: {
      bg: 'bg-red-100 border-red-300',
      title: 'ERROR!',
      icon: <XCircle className="text-red-600" />
    },
    info: {
      bg: 'bg-blue-100 border-blue-300',
      title: 'INFO!',
      icon: <Info className="text-blue-600" />
    }
  };

  const current = config[type] || config.info;

  return (
    <div
      className={`
        fixed top-6 right-6 w-80 p-4 rounded-xl shadow-md z-50 border
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5 pointer-events-none'}
        ${current.bg}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className="mt-1">{current.icon}</div>
          <div>
            <h3 className="font-semibold text-gray-800">{current.title}</h3>
            <p className="text-sm text-gray-700 mt-1">{message}</p>
          </div>
        </div>
        <button onClick={() => setVisible(false)} className="text-gray-500 hover:text-gray-800">
          <X size={18} />
        </button>
      </div>
    </div>
  );
});

export default Notifier;
