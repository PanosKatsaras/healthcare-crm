import React, { useState, useContext, useEffect } from "react";
import { TextField, Button, Container, Typography, Box, Alert } from "@mui/material";
import { AuthContext } from "../context/AuthContext"; // Import the context
import api from "../api"; // Assuming you have api helper to make requests
import { useNavigate } from "react-router-dom";

const ChangePassword = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate(); // For navigation after password change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setChangePasswordError("All fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePasswordError("New password and confirmation do not match.");
      return;
    }

    try {
      const response = await api.post(
        '/auth/change-password',
        { oldPassword, newPassword, confirmPassword }, // Pass userId from context
        { withCredentials: true }
      );
      setChangePasswordSuccess(response.data.message);
      setChangePasswordError(''); // Clear error message on success
      setTimeout(() => {
        logout();  // Log the user out
        navigate("/login"); // Redirect to login page
      }, 3000); // Logout after 3 seconds

      // Clear input fields
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (error) {
      const errorMsg = error.response?.data?.message || 'An error occurred while changing your password.';
      setChangePasswordError(errorMsg);
      setChangePasswordSuccess(''); // Clear success message on error
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 16, textAlign: "center", zIndex: 1 }}>
      {/* Green-Yellow Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '65px',
          left: 0,
          width: '100%',
          height: '100%',
          background: "linear-gradient(to bottom, rgba(14, 158, 153, 0.7), rgba(247, 206, 52, 0.7))",
          zIndex: -1, // Ensures overlay is behind text
        }}>
      </div>
      <Typography variant="h4" gutterBottom style={{ zIndex: 1, fontWeight: "bold" }}>
        Change Password
      </Typography>

      <Box display="flex" flexDirection="column" gap={2} p={3} borderRadius={2} boxShadow={3} bgcolor="#ddebea">
        <TextField
          label="Password"
          variant="outlined"
          fullWidth
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          margin="normal"
          sx={{
            backgroundColor: "#c0cfce",
            "& .MuiOutlinedInput-root": {
              "&:hover fieldset": {
                borderColor: "#f2ac50", // Border color on hover
              },
              "&.Mui-focused fieldset": {
                borderColor: "#f2ac50", // Border color on focus
              },
            },
            "& .MuiInputLabel-root": {
              color: "#4a4848", // Default label color
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: "#4a4848", // Label color on focus
            },
          }}
          required
        />

        <TextField
          label="New Password"
          variant="outlined"
          fullWidth
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          margin="normal"
          sx={{
            backgroundColor: "#c0cfce",
            "& .MuiOutlinedInput-root": {
              "&:hover fieldset": {
                borderColor: "#f2ac50", // Border color on hover
              },
              "&.Mui-focused fieldset": {
                borderColor: "#f2ac50", // Border color on focus
              },
            },
            "& .MuiInputLabel-root": {
              color: "#4a4848", // Default label color
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: "#4a4848", // Label color on focus
            },
          }}
          required
        />

        <TextField
          label="Confirm Password"
          variant="outlined"
          fullWidth
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          margin="normal"
          sx={{
            backgroundColor: "#c0cfce",
            "& .MuiOutlinedInput-root": {
              "&:hover fieldset": {
                borderColor: "#f2ac50", // Border color on hover
              },
              "&.Mui-focused fieldset": {
                borderColor: "#f2ac50", // Border color on focus
              },
            },
            "& .MuiInputLabel-root": {
              color: "#4a4848", // Default label color
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: "#4a4848", // Label color on focus
            },
          }}
          required
        />

        <Button
          variant="contained"
          fullWidth
          onClick={handleChangePassword}
          sx={{
            backgroundColor: "#f2ac50",
            "&:hover": { backgroundColor: "#e3a046" },
          }}
        >
          Change Password
        </Button>

        {(changePasswordError || changePasswordSuccess) && (
          <Alert severity={changePasswordSuccess ? "success" : "error"} sx={{ mt: 2 }}>
            {changePasswordError || changePasswordSuccess}
          </Alert>
        )}
      </Box>
    </Container>
  );
};

export default ChangePassword;
