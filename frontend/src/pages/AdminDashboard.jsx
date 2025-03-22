import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api";
import {
  Container, Typography, Button, Select, MenuItem,
  Card, CardContent, Alert, Box, FormControl
} from "@mui/material";

const AdminDashboard = () => {
  const { userRole } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedRoles, setSelectedRoles] = useState({});
  const availableRoles = ["Admin", "Manager", "Doctor", "Staff"];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/auth/all-users", { withCredentials: true });
      if (Array.isArray(response.data?.$values)) {
        setUsers(response.data?.$values);
      } else {
        console.error("Unexpected response format:", response.data);
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleRoleChange = async (userId) => {
    const newRole = selectedRoles[userId];
    if (!newRole) return;

    try {
      await api.post("/auth/change-role", { userId, newRole }, { withCredentials: true });
      setSuccessMessage("Role updated successfully!");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
      fetchUsers();
    } catch (error) {
      console.error("Error changing role:", error);
      setSuccessMessage("Failed to update role.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await api.delete(`/auth/delete-user/${userId}`, { withCredentials: true });
      setSuccessMessage("User deleted successfully!");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      setSuccessMessage("Failed to delete user.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
    }
  };

  return (
    <Container
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      {showAlert && (
        <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>

      {userRole !== "Admin" ? (
        <Typography color="error">Access Denied: Admins Only</Typography>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            maxWidth: "1200px",
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>List of Users</Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              justifyContent: "center",
              width: "100%",
            }}
          >
            {users.length > 0 ? (
              users.map((user) => (
                <Box
                  key={user.id}
                  sx={{
                    flex: "1 1 calc(25% - 24px)",
                    minWidth: "300px", // Minimum width before wrapping
                    maxWidth: "25%", // Restricts to 25% max
                    boxSizing: "border-box"
                  }}
                >
                  <Card variant="outlined"
                    sx={{
                      p: 2,
                      textAlign: "center",
                      bgcolor: "#0e9e99",
                      color: "white",
                      transition: "all 0.3s ease-in-out",
                      "&:hover": {
                        boxShadow: "8px 8px 15px rgba(0, 0, 0, 0.7)", // Bottom-right shadow
                        border: "1px solid black", // Border on hover
                      },
                    }}>
                    <CardContent>
                      <Typography>
                        {user.email} - {user.roles?.$values?.join(", ") || "No roles"}
                      </Typography>
                      <FormControl variant="outlined" fullWidth >
                        <Select
                          value={selectedRoles[user.id] || ""}
                          onChange={(e) =>
                            setSelectedRoles({ ...selectedRoles, [user.id]: e.target.value })
                          }
                          displayEmpty
                          sx={{
                            mt: 1, mb: 1, color: "#f2ac50", width: "100%",
                            "& .MuiOutlinedInput-root": {
                              "& fieldset": { borderColor: "#d0d0d0" },
                              "&.Mui-focused fieldset": { borderColor: "#f2ac50" },
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#f2ac50" },
                          }}
                        >
                          <MenuItem value="" disabled>Select Role</MenuItem>
                          {availableRoles.map((role) => (
                            <MenuItem key={role} value={role}>
                              {role}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {/* Buttons in a column */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 1, // Space between buttons
                          mt: 1,
                        }}
                      >
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleRoleChange(user.id)}
                          disabled={!selectedRoles[user.id]}
                          sx={{
                            backgroundColor: "#f2ac50",
                            "&:hover": { backgroundColor: "#e3a046" },
                          }}
                        >
                          Update Role
                        </Button>

                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => handleDeleteUser(user.id)}
                          sx={{
                            backgroundColor: "#d32f2f",
                            "&:hover": { backgroundColor: "#b71c1c" },
                          }}
                        >
                          Delete
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))
            ) : (
              <Typography>No users found.</Typography>
            )}
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default AdminDashboard;
