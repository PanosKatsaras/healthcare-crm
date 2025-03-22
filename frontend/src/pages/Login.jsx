import React, { useState, useContext } from "react";
import { TextField, Button, Container, Typography, Box, Alert, Link } from "@mui/material";
import { AuthContext } from "../context/AuthContext"; // Import the context

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false); // Track if alert should be shown

  // Consume the context to access login function and authentication state
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage("Email and password are required.");
      setShowAlert(true);
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Invalid email format.");
      setShowAlert(true);
      return;
    }

    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passRegex.test(password)) {
      setErrorMessage("Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
      setShowAlert(true);
      return;
    }

    // Call the login function from context
    const loginResponse = await login(email, password);
    if (loginResponse) {
      setErrorMessage(loginResponse);  // Set the error message to display in the alert
      setShowAlert(true); // Show the alert with the error message
    } else {
      setShowAlert(false); // Hide the alert if login is successful
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 24, textAlign: "center", zIndex: 1 }}>

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
        Login
      </Typography>

      <Box display="flex" flexDirection="column" gap={2} p={3} borderRadius={2} boxShadow={3} bgcolor="#ddebea">
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
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
          label="Password"
          variant="outlined"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
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
          sx={{
            backgroundColor: "#f2ac50",
            "&:hover": { backgroundColor: "#e3a046" },
          }}
          fullWidth
          onClick={handleLogin}
        >
          Login
        </Button>

        {showAlert && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {errorMessage}
          </Alert>
        )}

      </Box>
    </Container>
  );
};

export default Login;
