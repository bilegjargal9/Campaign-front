//sidebar.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Megaphone, MessageCircle,
  Phone, Mail, FileText, Code, Book, BookPlus
} from "lucide-react";
import logo from '../assets/logo2.png';

const Sidebar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const hasPermission = (perm) => user?.permissions?.includes(perm);

  const isActive = (path) => location.pathname === path;

  const MenuItem = ({ icon: Icon, text, path, badge }) => (
    <li
      onClick={() => navigate(path)}
      className={`flex items-center justify-between px-4 py-2 rounded-lg cursor-pointer 
        ${isActive(path) ? "bg-[#CAD3E7] text-[#192F5D]" : "hover:bg-gray-200"}`}
    >
      <div className="flex items-center space-x-2">
        <Icon className={`w-5 h-5 ${isActive(path) ? "text-[#192F5D] font-bold" : "text-gray-600"}`} />
        <span>{text}</span>
      </div>
      {badge && (
        <span className="bg-[#CAD3E7] text-[#192F5D] text-xs font-semibold px-2 py-1 rounded-full">{badge}</span>
      )}
    </li>
  );

  return (
    <div className="w-64 min-h-svw bg-gray-100 p-4">
      {/* Лого ба нэр */}
      <div className="flex items-center space-x-2 mb-6">
        <img src={logo} className="w-10 h-10 object-contain" alt="Logo" />
        <h1 className="text-2xl font-semibold">Tugeey</h1>
      </div>

      {/* Хяналтын самбар */}
      {hasPermission("view_dashboard") && (
        <MenuItem icon={LayoutDashboard} text="Хяналтын самбар" path="/" />
      )}

      {/* Цэс */}
      <div className="mt-4">
        <p className="text-gray-500 text-sm uppercase mb-2">Цэс</p>
        <ul className="space-y-2">
          {hasPermission("view_customers") && (
            <MenuItem icon={Users} text="Хэрэглэгчид" path="/customers" />
          )}
          {hasPermission("view_segmentation") && (
            <MenuItem icon={BookPlus} text="Сегмент" path="/segmentation" />
          )}
          {hasPermission("view_campaign") && (
            <MenuItem icon={Megaphone} text="Кампанит ажил" path="/campaign" />
          )}
          {hasPermission("view_sms") && (
            <MenuItem icon={MessageCircle} text="Мессеж" path="/sms" />
          )}
          {hasPermission("view_dial") && (
            <MenuItem icon={Phone} text="Дуудлага" path="/dial" />
          )}
          {hasPermission("view_email") && (
            <MenuItem icon={Mail} text="Имэйл" path="/email" />
          )}
          {hasPermission("view_report") && (
            <MenuItem icon={FileText} text="Тайлан" path="/report" badge="2" />
          )}
          {hasPermission("view_integration") && (
            <MenuItem icon={Code} text="Холболтууд" path="/integration" />
          )}
        </ul>
      </div>

      {/* Хэрэглэгч хэсэг */}
      {(hasPermission("view_system_users") || hasPermission("view_profile")) && (
        <div className="mt-6">
          <p className="text-gray-500 text-sm uppercase mb-2">Хэрэглэгч</p>
          <ul className="space-y-2">
            {hasPermission("view_system_users") && (
              <MenuItem icon={Users} text="Системийн хэрэглэгч" path="/system-users" />
            )}
            {hasPermission("view_profile") && (
              <MenuItem icon={Users} text="Нүүр" path="/user/profile"/>
            )}
          </ul>
        </div>
      )}

      {/* Гарын авлага */}
      {hasPermission("view_guide") && (
        <div className="mt-6">
          <p className="text-gray-500 text-sm uppercase mb-2">Гарын авлага</p>
          <MenuItem icon={Book} text="Гарын авлага" path="/guide" />
        </div>
      )}
    </div>
  );
};

export default Sidebar;
