//topbar

import React from "react";
import { Bell, HelpCircle } from "lucide-react";
import userApi from '../api/user'

class Topbar extends React.Component {
  constructor(props) {
    super(props); 
    this.state = {
      user: props.user || { username: "Unknown", role: "admin" }, 
    };
    this.handleLogout = this.handleLogout.bind(this); 
  }
  handleLogout(){
    userApi.logout();
    window.location.reload();
  }

  render() {
    return (
      <div className="flex items-center justify-between px-6 py-2 bg-white border-b border-gray-200 px">
        {/* 🔍 Хайх хэсэг */}
        <div className="w-1/3">
          <input
            type="text"
            placeholder="хайх..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CAD3E7]"
          />
        </div>

        {/* 🛎️ Баруун талын хэсэг */}
        <div className="flex items-center space-x-6">
          {/* Тусламж */}
          <button className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
            <HelpCircle className="w-5 h-5 text-gray-600" />
          </button>

          {/* Мэдэгдэл */}
          <button className="relative p-2 bg-gray-200 rounded-full hover:bg-gray-300">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-[#CAD3E7] rounded-full"></span>
          </button>

          {/* Хэрэглэгчийн мэдээлэл */}
          <div className="flex items-center space-x-2" onClick={this.handleLogout}>
            <div className="w-8 h-8 border-2 border-gray-600 rounded-full"></div>
            <div className="text-sm">
              <p className="font-semibold">{this.state.user.username}</p>
              <p className="text-gray-500">{this.state.user.role}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

}

export default Topbar;
