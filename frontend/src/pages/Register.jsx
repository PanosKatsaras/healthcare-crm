import React, { useState, useContext } from "react";
import { TextField, Button, Container, Typography, Box, Alert } from "@mui/material";
import { AuthContext } from "../context/AuthContext";
import api from "../api";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [specialCode, setSpecialCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const navigate = useNavigate();

  const { login } = useContext(AuthContext);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMessage("All fields are required.");
      setShowAlert(true);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
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
      setErrorMessage(`Password must be at least 6 characters long 
        and contain at least one uppercase letter, 
        one lowercase letter, one number, and one special character.`);
      setShowAlert(true);
      return;
    }

    try {
      await api.post("/auth/register", { fullName, email, password, confirmPassword });
      await login(email, password);
      navigate("/dashboard");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Registration failed. Please try again.");
      setShowAlert(true);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 11, textAlign: "center", zIndex: 1 }}>
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
        Register
      </Typography>

      <Box display="flex" flexDirection="column" gap={2} p={3} borderRadius={2} boxShadow={3} bgcolor="#ddebea" style={{ zIndex: 1 }}>
        <TextField
          label="Full Name"
          variant="outlined"
          fullWidth
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          sx={{
            backgroundColor: "#c0cfce",
            "& .MuiOutlinedInput-root": {
              "&:hover fieldset": {
                borderColor: "#f2ac50",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#f2ac50",
              },
            },
            "& .MuiInputLabel-root": {
              color: "#4a4848",
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: "#4a4848",
            },
          }}
          required
        />
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
                borderColor: "#f2ac50",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#f2ac50",
              },
            },
            "& .MuiInputLabel-root": {
              color: "#4a4848",
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: "#4a4848",
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
                borderColor: "#f2ac50",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#f2ac50",
              },
            },
            "& .MuiInputLabel-root": {
              color: "#4a4848",
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: "#4a4848",
            },
          }}
          required
        />
        <TextField
          label="Confirm Password"
          variant="outlined"
          fullWidth
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          type="password"
          sx={{
            backgroundColor: "#c0cfce",
            "& .MuiOutlinedInput-root": {
              "&:hover fieldset": {
                borderColor: "#f2ac50",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#f2ac50",
              },
            },
            "& .MuiInputLabel-root": {
              color: "#4a4848",
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: "#4a4848",
            },
          }}
          required
        />
        <TextField
          label="Special Code"
          variant="outlined"
          fullWidth
          value={specialCode}
          onChange={(e) => setSpecialCode(e.target.value)}
          type="password"
          sx={{
            backgroundColor: "#c0cfce",
            "& .MuiOutlinedInput-root": {
              "&:hover fieldset": {
                borderColor: "#f2ac50",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#f2ac50",
              },
            },
            "& .MuiInputLabel-root": {
              color: "#4a4848",
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: "#4a4848",
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
          onClick={handleRegister}
          disabled={specialCode !== "secret123"}
        >
          Register
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

export default Register;
