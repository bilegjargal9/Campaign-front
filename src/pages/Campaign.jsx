//Campaign.jsx

import React, { Component } from 'react';
import api from '../api/campaign';
import userApi from '../api/user';
import '../styles/campaign.css';
import {Download, PlusCircle, Trash, Users } from 'lucide-react';
import Notifier from '../components/notifier';
import AddCampaignForm from '../components/forCampaign/AddCampaignForm';
import TeamSelector from '../components/forCampaign/TeamSelector';
import AudienceSelector from '../components/forCampaign/customerSelectorCampaign';
import ImportCustomerToCampaign from '../components/forCampaign/importCustomerToCampaign';



class Campaign extends Component {
    constructor(props) {
        super(props);
        this.state = {
            campaigns: [],
            loading: true,
            error: null,
            currentPage: 1,
            itemsPerPage: 10,
            showAddForm: false,
            showTeamSelector: false,
            showAudienceSelector: false,
            showCustomerImporter: false,
            currentCampaign: null,
            campaignDetails: null,
            detailsLoading: false,
            user: null
        };
        this.notifierRef = React.createRef();
    }

    async componentDidMount() {
        try {
            const campaigns = await api.getAllCampaigns();
            this.setState({ campaigns, loading: false });
            const user = await userApi.getProfile();
            this.setState({user: user});

            console.log(user);

        } catch (error) {
            console.error("Error loading campaigns:", error);
            this.setState({ 
                loading: false, 
                error: error.message || "Кампанит ажлуудыг ачаалахад алдаа гарлаа" 
            });
        }
    }

    handleAddCampaign = () => {
        this.setState({ showAddForm: !this.state.showAddForm });
    }

    handleCampaignCreated = (newCampaign) => {
        this.setState(prevState => ({
            campaigns: [...prevState.campaigns, newCampaign],
            showAddForm: false
        }));
    }

    handleViewCampaignDetails = async (campaignId) => {
        try {
            this.setState({ detailsLoading: true, currentCampaign: campaignId });
            const details = await api.getCampaignDetails(campaignId);
            this.setState({ 
                campaignDetails: details, 
                detailsLoading: false 
            });
        } catch (error) {
            console.error("Error loading campaign details:", error);
            this.setState({ 
                detailsLoading: false,
                error: error.message || "Кампанит ажлын дэлгэрэнгүй мэдээллийг ачаалахад алдаа гарлаа" 
            });
        }
    }

    handleAddTeamToCampaign = (campaignId) => {
        this.setState({
            showTeamSelector: true,
            currentCampaign: campaignId
        });
    }

    handleTeamSelected = async (userIds, name, description) => {
        try {
            await api.setCampaignTeam(name, description, this.state.currentCampaign, userIds);
            this.notifierRef.current?.show("Багийн гишүүд амжилттай нэмэгдлээ", "success");
            
            if (this.state.currentCampaign) {
                this.handleViewCampaignDetails(this.state.currentCampaign);
            }
            
            this.setState({ showTeamSelector: false });
        } catch (error) {
            this.notifierRef.current?.show("Багийн гишүүд нэмэх үед алдаа гарлаа", "error");
        }
    }

    handleAddAudienceToCampaign = (campaignId) => {
        this.setState({
            showAudienceSelector: true,
            currentCampaign: campaignId
        });
    }

    handleAudienceSelected = async (audienceIds) => {
        try {
            await api.setCampaignAudience(this.state.currentCampaign, audienceIds);
            this.notifierRef.current?.show("Зорилтот бүлэг амжилттай нэмэгдлээ", "success");
            
            // Refresh campaign details
            if (this.state.currentCampaign) {
                this.handleViewCampaignDetails(this.state.currentCampaign);
            }
            
            this.setState({ showAudienceSelector: false });
        } catch (error) {
            this.notifierRef.current?.show("Зорилтот бүлэг нэмэх үед алдаа гарлаа", "error");
        }
    }

    handleDeleteCampaign = async (campaignId) => {
        try {
            await api.deleteCampaign(campaignId);
            this.notifierRef.current?.show("Кампанит ажил амжилттай устгагдлаа", "success");
            
            // Remove campaign from state
            this.setState(prevState => ({
                campaigns: prevState.campaigns.filter(c => c.id_uuid !== campaignId),
                campaignDetails: null,
                currentCampaign: null
            }));
        } catch (error) {
            console.error("Error deleting campaign:", error);
            this.notifierRef.current?.show("Кампанит ажлыг устгах үед алдаа гарлаа", "error");
        }
    }

    handleRemoveTeamMember = async (memberId) => {
        try {
            console.log(memberId, this.state.currentCampaign);

            // API call to remove team member (need to implement this in the API)
            const res = await api.removeTeamMember(memberId, this.state.currentCampaign);
            const msg = res?.data?.message;
            this.notifierRef.current?.show(msg || "Багийн гишүүн амжилттай устгагдлаа", "success");
            
            // Update the campaign details by removing the member
            this.setState(prevState => ({
                campaignDetails: {
                    ...prevState.campaignDetails,
                    teamMembers: prevState.campaignDetails.teamMembers.filter(m => 
                        m.member.id_uuid !== memberId
                    )
                }
            }));
        } catch (error) {
            const msg = error.response?.data?.message;
            this.notifierRef.current?.show(msg || "Багийн гишүүн устгах үед алдаа гарлаа", "error");
        }
    }



    handleRemoveAudience = async (audienceId) => {
        try {
            // API call to remove audience member (need to implement this in the API)
            console.log(this.state.currentCampaign, audienceId);
            const res = await api.removeAudiences(this.state.currentCampaign, audienceId);
            const msg = res?.data?.message;
            this.notifierRef.current?.show(msg||"Зорилтот бүлгийн хэрэглэгч амжилттай устгагдлаа", "success");
            
            // Update the campaign details by removing the audience
            this.setState(prevState => ({
                campaignDetails: {
                    ...prevState.campaignDetails,
                    audiences: prevState.campaignDetails.audiences.filter(a => 
                        a.customer.id_uuid !== audienceId
                    )
                }
            }));
        } catch (error) {
            const msg = error.response?.data?.message;
            this.notifierRef.current?.show(msg ||"Зорилтот бүлгийн хэрэглэгч устгах үед алдаа гарлаа", "error");
        }
    }

    handleImportCustomer = ()=>{this.setState({showCustomerImporter: !this.state.showCustomerImporter})};

    render() {
        const { 
            campaigns, 
            loading, 
            error, 
            showAddForm, 
            showTeamSelector,
            showAudienceSelector,
            showCustomerImporter,
            campaignDetails,
            detailsLoading,
            user
        } = this.state;

        return (
            <div className="p-6 pl-10 pr-10">
                <Notifier ref={this.notifierRef} />
                
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold">Кампанит ажлууд</h1>
                    <button 
                        onClick={this.handleAddCampaign}
                        className="bg-white text-gray-800 border border-gray-300 px-4 py-2 rounded flex items-center gap-2 transition duration-200 hover:bg-gray-100">
                        <PlusCircle size={18} />
                        <span>Кампанит ажил нэмэх</span>
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <strong>Алдаа:</strong> {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Campaigns List */}
                    <div className="md:col-span-1 bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium">Кампанит ажлуудын жагсаалт</h2>
                        </div>
                        <div className="overflow-y-auto max-h-[70vh]">
                            {loading ? (
                                <div className="flex justify-center items-center py-8">
                                    <span>Уншиж байна...</span>
                                </div>
                            ) : campaigns.length === 0 ? (
                                <div className="flex flex-col justify-center items-center py-8 text-gray-500">
                                    <Users size={48} />
                                    <p className="mt-2">Кампанит ажил олдсонгүй</p>
                                </div>
                            ) : (
                                <ul>
                                    {campaigns.map(campaign => (
                                        <li 
                                            key={campaign.id_uuid}
                                            onClick={() => this.handleViewCampaignDetails(campaign.id_uuid)}
                                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex justify-between items-center ${
                                                this.state.currentCampaign === campaign.id_uuid ? 'bg-blue-50' : ''
                                            }`}
                                        >
                                            <div>
                                                <h3 className="font-medium">{campaign.name}</h3>
                                                <p className="text-l text-gray-600">
                                                    {campaign.channel === "all" ? "Бүх сувгаар" : 
                                                    campaign.channel === "email" ? "Имэйл" : 
                                                    campaign.channel === "sms_dial" ? "Дуудлага, Мессэж" : ""} 
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        this.handleDeleteCampaign(campaign.id_uuid);
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

                    {/* Campaign Details */}
                    <div className="md:col-span-2 bg-white rounded-lg shadow">
                        {!this.state.currentCampaign ? (
                            <div className="flex flex-col justify-center items-center h-full py-20 text-gray-500">
                                <Users size={64} />
                                <p className="mt-4">Кампанит ажлын дэлгэрэнгүй харахын тулд зүүн талаас кампанит ажлыг сонгоно уу</p>
                            </div>
                        ) : detailsLoading ? (
                            <div className="flex justify-center items-center py-20">
                                <span>Уншиж байна...</span>
                            </div>
                        ) : campaignDetails ? (
                            <div>
                                <div className="p-4 border-b border-gray-200">
                                    <h2 className="text-lg font-medium">{campaignDetails.campaign.name}</h2>
                                    <p className="text-gray-600">{campaignDetails.campaign.description}</p>
                                </div>

                            
                                    {/* Team Members Section */}
                                    {user.data.user.role === "admin" ? (
                                        <div className="p-4 border-b border-gray-200">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-medium">Багийн гишүүд ({campaignDetails.teamMembers.length})</h3>
                                                <button 
                                                    onClick={() => this.handleAddTeamToCampaign(campaignDetails.campaign.id_uuid)}
                                                    className="text-blue-600 flex items-center gap-1 text-sm"
                                                >
                                                    <PlusCircle size={16} />
                                                    <span>Багийн гишүүн нэмэх</span>
                                                </button>
                                            </div>
                                            
                                            {campaignDetails.teamMembers.length === 0 ? (
                                                <div className="text-center py-4 text-gray-500">
                                                    <p>Энэ кампанит ажилд багийн гишүүн байхгүй байна</p>
                                                </div>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full table-auto">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="p-2 text-left">Нэр</th>
                                                                <th className="p-2 text-left">Хэрэглэгчийн нэр</th>
                                                                <th className="p-2 text-center">Үйлдэл</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {campaignDetails.teamMembers.map(item => (
                                                                <tr key={item.member.id_uuid} className="border-t border-gray-100">
                                                                    <td className="p-2">{item.member.first_name} {item.member.last_name}</td>
                                                                    <td className="p-2">{item.member.username}</td>
                                                                    <td className="p-2 text-center">
                                                                        <button 
                                                                            onClick={() => this.handleRemoveTeamMember(item.member.id_uuid)}
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
                                    ) : null}
                                
                                {/* Audience Section */}
                                <div className="p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-medium">Зорилтот бүлэг ({campaignDetails.audiences.length})</h3>
                                        <button 
                                            onClick={() => this.handleAddAudienceToCampaign(campaignDetails.campaign.id_uuid)}
                                            className="text-blue-600 flex items-center gap-1 text-sm"
                                        >
                                            <PlusCircle size={16} />
                                            <span>Зорилтот бүлэг нэмэх</span>
                                        </button>

                                        <button 
                                        onClick={this.handleImportCustomer}
                                        className="text-blue-600 flex items-center gap-1 text-sm">
                                        <Download size={16}/>
                                            <span>Excel файл оруулах</span>
                                        </button>

                                    </div>
                                    
                                    {campaignDetails.audiences.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500">
                                            <p>Энэ кампанит ажилд зорилтот бүлэг байхгүй байна</p>
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
                                                    {campaignDetails.audiences.map(item => (
                                                        <tr key={item.customer.id_uuid} className="border-t border-gray-100">
                                                            <td className="p-2">{item.customer.first_name} {item.customer.last_name}</td>
                                                            <td className="p-2">{item.customer.email || '-'}</td>
                                                            <td className="p-2">{item.customer.phone_number || '-'}</td>
                                                            <td className="p-2 text-center">
                                                                <button 
                                                                    onClick={() => this.handleRemoveAudience(item.customer.id_uuid)}
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
                    <AddCampaignForm 
                        onClose={this.handleAddCampaign}
                        onCampaignCreated={this.handleCampaignCreated}
                    />
                )}

                {showTeamSelector && (
                    <TeamSelector
                        onClose={() => this.setState({ showTeamSelector: false })}
                        onTeamSelected={this.handleTeamSelected}
                        excludeIds={campaignDetails?.teamMembers.map(m => m.member.id_uuid) || []}
                    />
                )}

                {showAudienceSelector && (
                    <AudienceSelector
                        onClose={() => this.setState({ showAudienceSelector: false })}
                        onCustomersSelected={this.handleAudienceSelected}
                        excludeIds={campaignDetails?.audiences.map(a => a.customer.id_uuid) || []}
                        channel = {campaignDetails.campaign.channel}
                    />
                )}
                {showCustomerImporter &&(
                    <ImportCustomerToCampaign
                        onClose={()=> this.setState({showCustomerImporter: false})}
                        campaign_id = {campaignDetails.campaign.id_uuid}
                        channel = {campaignDetails.campaign.channel}
                    />
                )}
            </div>
        );
    }
}

export default Campaign;