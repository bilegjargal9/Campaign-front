//addCustomerForm.jsx

import React, { useState, useRef } from 'react';
import api from '../../api/customer';
import Notifier from '../notifier';

const AddCustomerForm = ({ closeModal }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const notifierRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!firstName || !lastName) {
      notifierRef.current?.show('Овог болон нэрийг заавал бөглөнө үү.', 'error');
      return;
    }

    if (!email && !phone) {
      notifierRef.current?.show('Имэйл эсвэл утасны дугаарын аль нэгийг бөглөнө үү.', 'error');
      return;
    }

    try {
      const response = await api.postSingle(firstName, lastName, age || null, phone || null, email || null);
      const msg = response?.data?.message || 'Хэрэглэгч амжилттай нэмэгдлээ.';
      notifierRef.current?.show(msg, 'success');
      setTimeout(() => {
        closeModal();
        window.location.reload();
      }, 1000);

    } catch (error) {
      const msg = error?.response?.data?.message || error.message || 'Сервертэй холбогдож чадсангүй.';
      notifierRef.current?.show(`Алдаа: ${msg}`, 'error');
    }
  };

  return (
    <>
      <Notifier ref={notifierRef} />

      <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-40 animate-fade-in">

        <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md space-y-5 border border-gray-200 relative animate-fade-in">
          <h2 className="text-xl font-bold text-gray-800 text-center">🧑‍💼 Шинэ хэрэглэгч нэмэх</h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Овог</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Нэр</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Нас</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Имэйл</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Утасны дугаар</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                Цуцлах
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Нэмэх
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddCustomerForm;
