// customerController.js
import customerApi from '../api/customer';

class CustomerController {
  constructor() {
    this.notifier = null;
  }

  setNotifier(notifier) {
    this.notifier = notifier;
  }

  async deleteCustomer(customer_id, callback) {
    try {
      const response = await customerApi.deleteSingle(customer_id);
      
      if (response.status === 200 || response.status === 204) {
        this.notifier?.show('Хэрэглэгч амжилттай устгагдлаа', 'success');
        if (callback) callback(customer_id);
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      this.notifier?.show('Хэрэглэгч устгахад алдаа гарлаа', 'error');
    }
  }

  async deleteBulk(customer_ids) {
    try {
      const response = await customerApi.deleteBulk(customer_ids);
      if (response.status === 200 || response.status === 204) {
        this.notifier?.show('Хэрэглэгчид амжилттай устгагдлаа', 'success');
      }
      return true;
    } catch (error) {
      console.error("Error bulk deleting customers:", error);
      this.notifier?.show('Хэрэглэгчид устгахад алдаа гарлаа', 'error');
      return false;
    }
  }

  async updateCustomer(customerId, customerData, callback) {
    try {
      const response = await customerApi.updateCustomer(customerId, customerData);
      
      if (response.status === 200) {
        this.notifier?.show('Хэрэглэгчийн мэдээлэл амжилттай шинэчлэгдлээ', 'success');
        if (callback) callback(response.data);
        return response.data;
      }
    } catch (error) {
      console.error("Error updating customer:", error);
      this.notifier?.show('Хэрэглэгчийн мэдээлэл шинэчлэхэд алдаа гарлаа', 'error');
      throw error;
    }
  }
}

export default new CustomerController();