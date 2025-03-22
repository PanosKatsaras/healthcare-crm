import React, { useContext } from 'react';
import { Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Import the image from the assets folder
import backgroundImage from '../assets/mri.jpg';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  const login = () => {
    navigate("/login")
  }
  const changePassword = () => {
    navigate("/change-password")
  }

  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        width: '100%',
        height: '100vh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Background Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}>
      </div>

      {/* Green-Yellow Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: "linear-gradient(to bottom, rgba(14, 158, 153, 0.7), rgba(247, 206, 52, 0.7))",
          zIndex: 0 // Ensures overlay is behind text
        }}>
      </div>

      {/* Content on top */}
      <Typography variant="h3" gutterBottom sx={{ color: '#202120', zIndex: 1 }}>
        Welcome to the HealthCRM System
      </Typography>
      <Typography variant="h5" gutterBottom sx={{ color: '#202120', zIndex: 1, fontWeight: 'bold' }}>
        This is the main page for the HealthCRM application.
      </Typography>
      {!isAuthenticated && (
        <Button
          variant="contained"
          color="secondary"
          onClick={login}
          sx={{
            mt: 2,
            bgcolor: "#323333",
            fontWeight: "bold",
            color: "white",
            "&:hover": { color: "#fccb17" },
            zIndex: 1, // Ensures button stays above background
          }}
        >
          Login
        </Button>
      )}
      {isAuthenticated && (
        <Button
          variant="contained"
          color="secondary"
          onClick={changePassword}
          sx={{
            mt: 2,
            bgcolor: "#323333",
            fontWeight: "bold",
            color: "white",
            "&:hover": { color: "#fccb17" },
            zIndex: 1, // Ensures button stays above background
          }}
        >
          Change Password
        </Button>
      )}
    </div>
  );
};

export default Home;
