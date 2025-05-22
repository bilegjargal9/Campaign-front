import React, { Component } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/user";

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

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      password: "",
      loading: true,
      error: null,
      redirectToHome: false
    };
  }

  async componentDidMount() {
    try {
      const response = await api.getProfile();
      const user = response.data.user;
      if (user) {
        user.permissions = permissionsByRole[user.role] || [];
        this.props.setUser(user);
        this.setState({ redirectToHome: true });
      }
    } catch (error) {
      console.log("User not logged in.");
    } finally {
      this.setState({ loading: false });
    }
  }

  loginHandler = async () => {
    this.setState({ error: null });
    try {
      await api.login(this.state.username, this.state.password);
      const response = await api.getProfile();
      const user = response.data.user;
      if (!user || !user.role) {
        throw new Error("Invalid user data.");
      }
      user.permissions = permissionsByRole[user.role] || [];
      this.props.setUser(user);
      this.setState({ redirectToHome: true });
    } catch (error) {
      this.setState({
        error: error.response?.data?.message || "Нэвтрэхэд алдаа гарлаа."
      });
    }
  };

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  render() {
    if (this.state.redirectToHome) {
      return <Navigate to="/"/>;
    }

    if (this.state.loading) {
      return (
        <div className="h-screen flex items-center justify-center">
          Түр хүлээнэ үү...
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-screen bg-blue-100">
        <div className="bg-white p-6 rounded-lg shadow-lg w-80">
          <h3 className="text-lg font-semibold mb-4 text-center">Нэвтрэх</h3>
          <input
            className="w-full p-2 border border-gray-300 rounded mb-2"
            placeholder="Username"
            name="username"
            value={this.state.username}
            onChange={this.handleChange}
          />
          <input
            type="password"
            className="w-full p-2 border border-gray-300 rounded mb-2"
            placeholder="Password"
            name="password"
            value={this.state.password}
            onChange={this.handleChange}
          />
          {this.state.error && (
            <div className="text-red-500 text-sm mb-2">{this.state.error}</div>
          )}
          <button
            className="w-full p-2 bg-blue-900 text-white rounded hover:bg-blue-600 transition"
            onClick={this.loginHandler}
          >
            Нэвтрэх
          </button>
        </div>
      </div>
    );
  }
}

export default Login;