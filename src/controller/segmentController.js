//segmentationController.js(frontend)

import api from '../api/segmentation';

let notifierRef = null;

const segmentController = {
    setNotifier: (ref) => {
        notifierRef = ref;
    },

    createSegment: async (name, description) => {
        try {
            const response = await api.createSegment(name, description);
            notifierRef?.show('Сегмент амжилттай үүсгэгдлээ', 'success');
            return response;
        } catch (error) {
            const msg = error.response?.data?.message || 'Серверийн алдаа';
            notifierRef?.show(msg, 'error');
            throw error;
        }
    },

    deleteSegment: async (segment_id) => {
        try {
            const response = await api.deleteSegment(segment_id);
            notifierRef?.show('Сегмент амжилттай устгагдлаа', 'success');
            return response;
        } catch (error) {
            const msg = error.response?.data?.message || 'Устгах явцад алдаа гарлаа';
            notifierRef?.show(msg, 'error');
            throw error;
        }
    },

    addCustomersToSegment: async (segment_id, customer_ids) => {
        try {
            const response = await api.addCustomerToSegment(segment_id, customer_ids);
            notifierRef?.show('Хэрэглэгчид амжилттай нэмэгдлээ', 'success');
            return response;
        } catch (error) {
            const msg = error.response?.data?.message || 'Хэрэглэгч нэмэх явцад алдаа гарлаа';
            notifierRef?.show(msg, 'error');
            throw error;
        }
    },

    removeCustomerFromSegment: async (segment_id, customer_id) => {
        try {
            const response = await api.removeCustomerFromSegment(segment_id, customer_id);
            notifierRef?.show('Хэрэглэгч амжилттай хасагдлаа', 'success');
            return response;
        } catch (error) {
            const msg = error.response?.data?.message || 'Хэрэглэгч хасах явцад алдаа гарлаа';
            notifierRef?.show(msg, 'error');
            throw error;
        }
    },

    importCustomerToSegment: async ()=>{
        try{
            const response = await api.importCustomer();
            notifierRef?.show(response.data.message);
        } catch(error) {
            notifierRef?.show(error.response?.data?.message|| 'Хэрэглэгч нэмэх явцад алдаа гарлаа');
        }
    }
};

export default segmentController;