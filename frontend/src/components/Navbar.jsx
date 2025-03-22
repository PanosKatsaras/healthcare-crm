import React, { useContext } from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext"; // Importing context

const Navbar = () => {
  const { isAuthenticated, userRole, logout } = useContext(AuthContext);
  return (
    <AppBar position="static" sx={{ borderBottom: "1px solid white", bgcolor: "#0e9e99", fontWeight: "bold", zIndex: 1 }}>
      <Toolbar>
        <img
          src="/health_logo2_tr.png"
          alt="HealthCRM Logo"
          style={{ width: 30, height: 30 }}
        />
        <Typography variant="h6" sx={{ flexGrow: 1, mx: 1 }}>
          HealthCRM
        </Typography>

        {!isAuthenticated && (
          <>
            <Button color="inherit" component={Link} to="/">Home</Button>
            <Button color="inherit" component={Link} to="/register">Register</Button>

          </>
        )}
        {isAuthenticated && userRole != "Admin" && (
          <>
            <Button color="inherit" component={Link} to="/">Home</Button>
            <Button color="inherit" component={Link} to="/dashboard">Dashboard</Button>
            <Button
              color="inherit"
              sx={{
                color: "white",
                "&:hover": { color: "#fccb17" }
              }}
              onClick={logout}
            >
              Logout
            </Button>
          </>
        )}
        {isAuthenticated && userRole === "Admin" && (
          <>
            <Button color="inherit" component={Link} to="/">Home</Button>
            <Button color="inherit" component={Link} to="/dashboard">Dashboard</Button>
            <Button color="inherit" component={Link} to="/admin">Admin</Button>
            <Button
              color="inherit"
              sx={{
                color: "white",
                "&:hover": { color: "#fccb17" }
              }}
              onClick={logout}
            >
              Logout
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
