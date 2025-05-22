//segmentation.jsx

import React, { Component } from 'react';
import api from '../api/segmentation';
import '../styles/segmentation.css';
import { List, ChevronDown, PlusCircle, SquarePen, Trash, Users, Download} from 'lucide-react';
import segmentController from '../controller/segmentController';
import AddSegmentForm from '../components/forSegmentation/addSegmentForm';
import Notifier from '../components/notifier';
import CustomerSelector from '../components/forCustomers/customerSelector';
import ImportCustomer from '../components/forSegmentation/importCustomerToSegment';

class Segmentation extends Component {
    constructor(props) {
        super(props);
        this.state = {
            segments: [],
            loading: true,
            error: null,
            currentPage: 1,
            itemsPerPage: 10,
            showAddForm: false,
            showCustomerSelector: false,
            showCustomerImporter: false,
            currentSegment: null,
            segmentDetails: null,
            detailsLoading: false
        };
        this.notifierRef = React.createRef();
    }

    async componentDidMount() {
        try {
            const segments = await api.getAllSegments();
            this.setState({ segments, loading: false });
            
            segmentController.setNotifier({
                show: (msg, type) => this.notifierRef.current?.show(msg, type),
            });
        } catch (error) {
            console.error("Error loading segments:", error);
            this.setState({ 
                loading: false, 
                error: error.message || "Failed to load segments" 
            });
        }
    }

    handleAddSegment = () => {
        this.setState({ showAddForm: !this.state.showAddForm });
    }

    handleSegmentCreated = (newSegment) => {
        this.setState(prevState => ({
            segments: [...prevState.segments, newSegment],
            showAddForm: false
        }));
    }

    handleViewSegmentDetails = async (segmentId) => {
        try {
            this.setState({ detailsLoading: true, currentSegment: segmentId });
            const details = await api.getSegmentDetails(segmentId);
            this.setState({ 
                segmentDetails: details, 
                detailsLoading: false 
            });
        } catch (error) {
            console.error("Error loading segment details:", error);
            this.setState({ 
                detailsLoading: false,
                error: error.message || "Failed to load segment details" 
            });
        }
    }

    handleAddCustomersToSegment = (segmentId) => {
        this.setState({
            showCustomerSelector: true,
            currentSegment: segmentId
        });
    }

    handleCustomersSelected = async (customerIds) => {
        try {
            await api.addCustomerToSegment(this.state.currentSegment, customerIds);
            this.notifierRef.current?.show("Хэрэглэгчид амжилттай нэмэгдлээ", "success");
            
            // Refresh segment details
            if (this.state.currentSegment) {
                this.handleViewSegmentDetails(this.state.currentSegment);
            }
            
            this.setState({ showCustomerSelector: false });
        } catch (error) {
            this.notifierRef.current?.show("Хэрэглэгч нэмэх үед алдаа гарлаа", "error");
        }
    }

    handleRemoveCustomer = async (customerId) => {
        try {
            await api.removeCustomerFromSegment(this.state.currentSegment, customerId);
            this.notifierRef.current?.show("Хэрэглэгч амжилттай устгагдлаа", "success");
            
            // Update the segment details by removing the customer
            this.setState(prevState => ({
                segmentDetails: {
                    ...prevState.segmentDetails,
                    customers: prevState.segmentDetails.customers.filter(c => 
                        c.customer.id_uuid !== customerId
                    )
                }
            }));
        } catch (error) {
            this.notifierRef.current?.show("Хэрэглэгч устгах үед алдаа гарлаа", "error");
        }
    }

    handleDeleteSegment = async (segmentId) => {
        try {
            await segmentController.deleteSegment(segmentId);
            
            this.setState(prevState => ({
                segments: prevState.segments.filter(s => s.id_uuid !== segmentId),
                segmentDetails: null,
                currentSegment: null
            }));
        } catch (error) {
            console.error("Error deleting segment:", error);
        }
    }

    handleImportCustomer = () => {
        this.setState({showCustomerImporter: !this.state.showCustomerImporter});
    }

    render() {
        const { 
            segments, 
            loading, 
            error, 
            showAddForm, 
            showCustomerSelector,
            showCustomerImporter,
            segmentDetails,
            detailsLoading
        } = this.state;

        return (
            <div className="p-6 pl-10 pr-10">
                <Notifier ref={this.notifierRef} />
                
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold">Сегментүүд</h1>
                    <button 
                        onClick={this.handleAddSegment}
                        className="bg-white text-gray-800 border border-gray-300 px-4 py-2 rounded flex items-center gap-2 transition duration-200 hover:bg-gray-100">
                        <PlusCircle size={18} />
                        <span>Сегмент Нэмэх</span>
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <strong>Алдаа:</strong> {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Segments List */}
                    <div className="md:col-span-1 bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium">Сегментийн жагсаалт</h2>
                        </div>
                        <div className="overflow-y-auto max-h-[70vh]">
                            {loading ? (
                                <div className="flex justify-center items-center py-8">
                                    <span>Уншиж байна...</span>
                                </div>
                            ) : segments.length === 0 ? (
                                <div className="flex flex-col justify-center items-center py-8 text-gray-500">
                                    <Users size={48} />
                                    <p className="mt-2">Сегмент олдсонгүй</p>
                                </div>
                            ) : (
                                <ul>
                                    {segments.map(segment => (
                                        <li 
                                            key={segment.id_uuid}
                                            onClick={() => this.handleViewSegmentDetails(segment.id_uuid)}
                                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex justify-between items-center ${
                                                this.state.currentSegment === segment.id_uuid ? 'bg-blue-50' : ''
                                            }`}
                                        >
                                            <div>
                                                <h3 className="font-medium">{segment.name}</h3>
                                                <p className="text-sm text-gray-600">{segment.description}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        this.handleAddCustomersToSegment(segment.id_uuid);
                                                    }}
                                                    className="p-1 hover:text-blue-600"
                                                >
                                                    <PlusCircle size={18} />
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        this.handleDeleteSegment(segment.id_uuid);
                                                    }}
                                                    className="p-1 hover:text-red-600"
                                                >
                                                    <Trash size={18} />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Segment Details */}
                    <div className="md:col-span-2 bg-white rounded-lg shadow">
                        {!this.state.currentSegment ? (
                            <div className="flex flex-col justify-center items-center h-full py-20 text-gray-500">
                                <Users size={64} />
                                <p className="mt-4">Сегментийн дэлгэрэнгүй харахын тулд зүүн талаас сегментийг сонгоно уу</p>
                            </div>
                        ) : detailsLoading ? (
                            <div className="flex justify-center items-center py-20">
                                <span>Уншиж байна...</span>
                            </div>
                        ) : segmentDetails ? (
                            <div>
                                <div className="p-4 border-b border-gray-200">
                                    <h2 className="text-lg font-medium">{segmentDetails.segment.name}</h2>
                                    <p className="text-gray-600">{segmentDetails.segment.description}</p>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-medium">Хэрэглэгчид ({segmentDetails.customers.length})</h3>
                                        <button 
                                            onClick={() => this.handleAddCustomersToSegment(segmentDetails.segment.id_uuid)}
                                            className="text-blue-600 flex items-center gap-1 text-sm">
                                            <PlusCircle size={16} />
                                            <span>Хэрэглэгч нэмэх</span>
                                        </button>

                                        <button 
                                        onClick={this.handleImportCustomer}
                                        className="text-blue-600 flex items-center gap-1 text-sm">
                                        <Download size={16}/>
                                            <span>Excel файл оруулах</span>
                                        </button>
                                    </div>
                                    
                                    {segmentDetails.customers.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>Энэ сегментэд хэрэглэгч байхгүй байна</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full table-auto">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="p-2 text-left">Нэр</th>
                                                        <th className="p-2 text-left">Имэйл</th>
                                                        <th className="p-2 text-left">Утас</th>
                                                        <th className="p-2 text-center">Үйлдэл</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {segmentDetails.customers.map(item => (
                                                        <tr key={item.customer.id_uuid} className="border-t border-gray-100">
                                                            <td className="p-2">{item.customer.first_name} {item.customer.last_name}</td>
                                                            <td className="p-2">{item.customer.email || '-'}</td>
                                                            <td className="p-2">{item.customer.phone_number || '-'}</td>
                                                            <td className="p-2 text-center">
                                                                <button 
                                                                    onClick={() => this.handleRemoveCustomer(item.customer.id_uuid)}
                                                                    className="hover:text-red-600"
                                                                >
                                                                    <Trash size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center items-center py-20">
                                <span>Алдаа гарлаа</span>
                            </div>
                        )}
                    </div>
                </div>

                {showAddForm && (
                    <AddSegmentForm 
                        onClose={this.handleAddSegment}
                        onSegmentCreated={this.handleSegmentCreated}
                    />
                )}

                {showCustomerSelector && (
                    <CustomerSelector
                        onClose={() => this.setState({ showCustomerSelector: false })}
                        onCustomersSelected={this.handleCustomersSelected}
                        excludeIds={segmentDetails?.customers.map(c => c.customer.id_uuid) || []}
                    />
                )}

                {showCustomerImporter &&(
                    <ImportCustomer
                    onClose ={() =>this.setState({showCustomerImporter: false})}
                    segment_id = {segmentDetails.segment.id_uuid}/>
                )}
                
            </div>
        );
    }
}

export default Segmentation;