import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import routes from "./routes/routes";
import Login from "./components/Login";
import api from "./api/user"; 

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await api.getProfile();
        if (response.data && response.data.user) {
          const userData = response.data.user;
          const permissionsByRole = {
            admin: [
              "view_dashboard",
              "view_customers",
              "view_segmentation",
              "view_campaign",
              "view_sms",
              "view_dial",
              "view_email",
              "view_report",
              "view_integration",
              "view_system_users",
              "view_profile",
              "view_guide"
            ],
            supervisor: [
              "view_dashboard",
              "view_customers",
              "view_segmentation",
              "view_campaign",
              "view_sms",
              "view_dial",
              "view_email",
              "view_report",
              "view_profile",
              "view_guide"
            ]
          };
          
          userData.permissions = permissionsByRole[userData.role] || [];
          setUser(userData);
        }
      } catch (error) {
        console.log("User not logged in", error);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Түр хүлээнэ үү...</div>;
  }
  
  return (
    <Router>
      {!user ? (
        <Routes>
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      ) : (
        <Routes>
          <Route
            path="/login"
            element={<Navigate to="/" replace />}
          />
          <Route
            path="/*"
            element={
              <div className="flex">
                {/* Sidebar */}
                <div className="border-r-2 border-solid border-[#EAEAEA]">
                  <Sidebar user={user} />
                </div>
                {/* Main Content */}
                <div className="flex-1">
                  <Topbar user={user} />
                  <div className="p-4">
                    <Routes>
                      {routes.map((route, index) => (
                        <Route key={index} path={route.path} element={route.element} />
                      ))}
                    </Routes>
                  </div>
                </div>
              </div>
            }
          />
        </Routes>
      )}
    </Router>
  );
}

export default App;