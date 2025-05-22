//routes.js
import Dashboard from "../pages/Dashboard";
import Customers from "../pages/Customers";
import Campaign from "../pages/Campaign";
import Segmentation from "../pages/segmentation";
import Connections from "../pages/Connections";
import Email from "../pages/Email";
import Sms from "../pages/Sms";
import Dial from "../pages/Dial";
import Report from "../pages/Report";
import SystemUsers from "../pages/SystemUsers";
import Login from "../components/Login";
import UserProfile from "../pages/UserProfile";

import React from "react";

const routes = [
  { path: "/", element: React.createElement(Dashboard) },
  { path: '/login', element: React.createElement(Login)},
  { path: "/customers", element: React.createElement(Customers) },
  { path: "/campaign", element: React.createElement(Campaign) },
  { path: "/segmentation", element: React.createElement(Segmentation) },
  { path: "/integration", element: React.createElement(Connections) },
  { path: "/email", element: React.createElement(Email)},
  { path: "/sms", element: React.createElement(Sms)},
  { path: "/dial", element: React.createElement(Dial)},
  { path: "/report", element: React.createElement(Report)},
  { path: "/dashboard", element: React.createElement(Dashboard)},
  { path: "/system-users", element: React.createElement(SystemUsers)},
  { path: "/user/profile", element: React.createElement(UserProfile)}
];

export default routes;