import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api"; // API helper

// Create and export the context
const AuthContext = createContext();

// Function to provide authentication context to the app
// This component will wrap around the parts of the app that need access to authentication state
function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(""); // Store the user role
  const [user, setUser] = useState(null); // Store user data
  const navigate = useNavigate();

  // Check authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if the user is authenticated by calling /auth/check-auth
        await api.get("/auth/check-auth", { withCredentials: true });

        // If the check passes, then fetch the user data
        const response = await api.get("/auth/user", { withCredentials: true });
        if (response.data) {
          setUser(response.data);

          // Assuming roles are part of the user data
          const roles = response.data.roles?.$values ?? response.data.roles;
          setUserRole(roles && roles.length > 0 ? roles[0] : ""); // Default to the first role
        } else {
          console.log("No user data returned.");
          setUser(null);
          setUserRole("");
        }

        setIsAuthenticated(true); // User is authenticated
      } catch (error) {
        console.error("Authentication or user data fetch failed:", error);
        setIsAuthenticated(false); // Not authenticated
        setUser(null);
        setUserRole("");
      }
    };

    // Run this check on page load
    if (isAuthenticated) {
      checkAuth(); // Call checkAuth when the user is authenticated
    }
  }, [isAuthenticated]); // Dependency array to ensure checkAuth runs when isAuthenticated state changes

  // Login function
  const login = async (email, password) => {
    try {
      await api.post("/auth/login", { email, password }, { withCredentials: true });
      setIsAuthenticated(true);
      navigate("/dashboard"); // Redirect after login
      return null;  // No error, so return null
    } catch (error) {
      // Return the error message to be handled in the component
      if (error.response && error.response.data.message) {
        return error.response.data.message;  // Return the specific error message from the backend
      }
      console.error("Login failed:", error.response ? error.response.data : error.message);
      return "An unexpected error occurred";  // Return a generic error message
    }
  };


  // Logout function
  const logout = async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
      setIsAuthenticated(false);
      setUserRole(""); // Clear user role on logout
      setUser(null); // Clear user data
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error.response ? error.response.data : error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
