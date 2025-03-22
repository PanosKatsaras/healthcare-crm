import React, { useContext } from "react";
import { Box, Typography, List, ListItem, ListItemText } from "@mui/material";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext"; // Importing context

const Dashboard = () => {
  const { isAuthenticated, logout, userRole } = useContext(AuthContext); // Access logout from AuthContext
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    navigate("/login");
    return null; // Prevent the rest of the code from executing
  }

  const isAppointmentsPage = location.pathname.includes("appointments");
  const isPatientsPage = location.pathname.includes("patients");
  const isDoctorsPage = location.pathname.includes("doctors");
  const isExaminationsPage = location.pathname.includes("examinations");
  const isRecordsPage = location.pathname.includes("records");

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Box sx={{ width: 200, bgcolor: "#0e9e99", fontWeight: "bold", height: "100vh", p: 2, overflowY: "auto" }}>
        <List>
          <Typography sx={{ px: 2, color: "white" }}>Role: <span style={{ fontWeight: "bold", color: "#ffb74d" }}>{userRole}</span></Typography>
          {[

            { text: "Appointments", path: "/dashboard/appointments" },
            { text: "Patients", path: "/dashboard/patients" },
            { text: "Doctors", path: "/dashboard/doctors" },
            { text: "Examinations", path: "/dashboard/examinations" },
            userRole !== "Staff" && { text: "Records", path: "/dashboard/records" }
          ].filter(Boolean).map((item, index) => (
            <ListItem
              key={index}
              sx={{
                cursor: "pointer",
                bgcolor: location.pathname === item.path ? "#10918d" : "transparent", // Highlight active link
                "&:hover": {
                  bgcolor: "#10918d",
                  color: "#fccb17",
                },
              }}
            >
              <Link to={item.path} style={{ color: "white", textDecoration: "none" }}>
                <ListItemText primary={item.text} />
              </Link>
            </ListItem>
          ))}

          {/* Logout Option */}
          <ListItem
            sx={{
              cursor: "pointer",
              "&:hover": {
                bgcolor: "#10918d",
              },
              color: "#fccb17",
            }}
            onClick={logout} // Call logout function
          >
            <ListItemText primary={
              <Typography sx={{ fontWeight: "bold" }}>
                Logout
              </Typography>
            } />
          </ListItem>
        </List>
      </Box>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, alignItems: "center", display: "flex", flexDirection: "column" }}>
        {/* Only render the dashboard content if we're NOT on the appointments, patients, doctors, examinations, or medical records page */}
        {!isAppointmentsPage && !isPatientsPage && !isDoctorsPage && !isExaminationsPage && !isRecordsPage && (
          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography variant="h2">Dashboard</Typography>
            <Typography variant="h4" sx={{ color: "#0e9e99" }} >Welcome to the Dashboard!</Typography>
            <Typography variant="body1">
              Use the sidebar to access different sections of the dashboard.
            </Typography>
          </Box>
        )}

        {/* Render the nested route content here */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default Dashboard;
