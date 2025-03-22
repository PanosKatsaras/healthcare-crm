import React, { useEffect, useState, useContext } from "react";
import {
  Box, Button, Typography, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Snackbar,
  Alert, Modal, IconButton, Menu, MenuItem
} from "@mui/material";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import API from "../api";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert"; // 3-dot icon

const API_URL = `${API.defaults.baseURL}/doctor`;

const Doctors = () => {
  const { isAuthenticated, userRole } = useContext(AuthContext);
  const [doctors, setDoctors] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentDoctor, setCurrentDoctor] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
    city: "",
    specialization: "",
    amka: "",
  });
  const [errors, setErrors] = useState({});
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [deleteDoctor, setDeleteDoctor] = useState(null)
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null); // Anchor for menu
  const [selectedMenuDoctor, setSelectedMenuDoctor] = useState(null); // To store selected doctor for menu

  useEffect(() => {
    if (isAuthenticated) {
      fetchDoctors();
    }
  }, [isAuthenticated]);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get(API_URL, { withCredentials: true });
      if (Array.isArray(response.data.doctors?.$values)) {
        setDoctors(response.data.doctors.$values);
      } else {
        console.error("Doctors data is not an array:", response.data);
        setDoctors([]);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setDoctors([]); // Ensure state does not break UI
    }
  };

  const handleOpen = (doctor = null) => {
    setEditing(!!doctor);
    setCurrentDoctor(
      doctor || {
        fullName: "",
        email: "",
        phoneNumber: "",
        address: "",
        city: "",
        specialization: "",
        amka: "",
      }
    );
    setErrors({}); // Clear previous validation errors
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  // Function to open the View modal with selected doctor details
  const handleViewOpen = (doctor) => {
    setSelectedDoctor(doctor);
    setViewOpen(true);
  };

  // Function to close the View modal
  const handleViewClose = () => {
    setViewOpen(false);
    setSelectedDoctor(null);
  };

  const handleChange = (e) => {
    setCurrentDoctor({ ...currentDoctor, [e.target.name]: e.target.value });
  };

  // Validation function
  const validate = () => {
    const newErrors = {};

    // AMKA: required and 11 digits
    if (!currentDoctor.amka) {
      newErrors.amka = "Identification number (AMKA) is required.";
    } else if (!/^\d{11}$/.test(currentDoctor.amka)) {
      newErrors.amka = "Identification number (AMKA) must be exactly 11 digits.";
    }

    // FullName: required and max 50 characters
    if (!currentDoctor.fullName) {
      newErrors.fullName = "Full name is required.";
    } else if (currentDoctor.fullName.length > 50) {
      newErrors.fullName = "Full name cannot exceed 50 characters.";
    }

    // Email: required and valid email format
    if (!currentDoctor.email) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(currentDoctor.email)) {
      newErrors.email = "Invalid email format.";
    }

    // PhoneNumber: required and valid phone number format
    if (!currentDoctor.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required.";
    } else if (!/^\+?[0-9]{10,14}$/.test(currentDoctor.phoneNumber)) {
      newErrors.phoneNumber = "Invalid phone number format.";
    }

    // Address: required and max 100 characters
    if (!currentDoctor.address) {
      newErrors.address = "Address is required.";
    } else if (currentDoctor.address.length > 100) {
      newErrors.address = "Address cannot exceed 100 characters.";
    }

    // City: required and max 50 characters
    if (!currentDoctor.city) {
      newErrors.city = "City is required.";
    } else if (currentDoctor.city.length > 50) {
      newErrors.city = "City cannot exceed 50 characters.";
    }

    // Specialization: required and max 50 characters
    if (!currentDoctor.specialization) {
      newErrors.specialization = "Specialization is required.";
    } else if (currentDoctor.specialization.length > 50) {
      newErrors.specialization = "Specialization cannot exceed 50 characters.";
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      try {
        console.log("Submitting doctor:", currentDoctor);
        if (editing) {
          await axios.put(`${API_URL}/${currentDoctor.id}`, currentDoctor, {
            withCredentials: true,
          });
        } else {
          await axios.post(API_URL, currentDoctor, { withCredentials: true });
        }
        fetchDoctors();
        setSnackbarMessage("Doctor saved successfully!");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        handleClose();
      } catch (error) {
        console.error("Error saving doctor:", error.response?.data || error.message);
        setSnackbarMessage("Error saving doctor.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      }
    } else {
      setErrors(formErrors);
      setSnackbarMessage("Please fix the errors in the form.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleDelete = (id) => {
    setDeleteDoctor(id);
    setSnackbarMessage(
      <Box>
        <Typography sx={{ fontWeight: "bold" }}>
          Are you sure you want to delete this doctor?
        </Typography>
        <Button
          onClick={async () => {
            try {
              const response = await axios.delete(`${API_URL}/${id}`, {
                withCredentials: true,
              });

              if (response.status === 200) {
                // Assuming the response is a success and doctor is deleted
                fetchDoctors();
                setSnackbarMessage("Doctor deleted successfully!");
                setSnackbarSeverity("success");
              } else {
                // Handle case if the server returns a non-200 status
                setSnackbarMessage("Error deleting doctor.");
                setSnackbarSeverity("error");
              }
            } catch (error) {
              console.error("Error during deletion:", error);  // Log error for debugging
              setSnackbarMessage("Error deleting doctor.");
              setSnackbarSeverity("error");
            }
          }}
          color="error"
          variant="contained"
          sx={{ mt: 1 }}
        >
          Confirm
        </Button>
      </Box>
    );
    setSnackbarSeverity("warning");
    setOpenSnackbar(true);
  };

  // Handle the 3-dot menu open/close
  const handleMenuClick = (event, doctor) => {
    setAnchorEl(event.currentTarget);
    setSelectedMenuDoctor(doctor);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMenuDoctor(null);
  };

  return (
    <Box sx={{ p: 2, width: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4">Doctors</Typography>

        <Button variant="contained"
          sx={{ color: "white", bgcolor: "#ffb74d" }}
          onClick={() => handleOpen()}
          disabled={userRole === "Staff" || userRole === "Doctor"}>
          + New Doctor
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ mt: 2, maxWidth: "100%", overflowX: "auto" }}>
        <Table>
          <TableHead sx={{ bgcolor: "black" }}>
            <TableRow>
              <TableCell sx={{ color: "white", width: "15%" }}>Full Name</TableCell>
              <TableCell sx={{ color: "white", width: "15%" }}>Email</TableCell>
              <TableCell sx={{ color: "white", width: "15%" }}>Phone</TableCell>
              <TableCell sx={{ color: "white", width: "10%" }}>Address</TableCell>
              <TableCell sx={{ color: "white", width: "10%" }}>City</TableCell>
              <TableCell sx={{ color: "white", width: "15%" }}>Specialization</TableCell>
              <TableCell sx={{ color: "white", width: "15%" }}>AMKA</TableCell>
              <TableCell sx={{ color: "white", width: "10%" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(doctors) && doctors.length > 0 ? (
              doctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell>{doctor.fullName}</TableCell>
                  <TableCell>{doctor.email}</TableCell>
                  <TableCell>{doctor.phoneNumber}</TableCell>
                  <TableCell>{doctor.address}</TableCell>
                  <TableCell>{doctor.city}</TableCell>
                  <TableCell>{doctor.specialization}</TableCell>
                  <TableCell>{doctor.amka}</TableCell>
                  <TableCell>
                    <IconButton onClick={(e) => handleMenuClick(e, doctor)}>
                      <MoreVertIcon />
                    </IconButton>
                    {/* 3-dot Menu */}
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={handleMenuClose}
                      anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                    >
                      <MenuItem sx={{ fontWeight: "bold", color: "#ed45e5" }}
                        onClick={() => {
                          handleViewOpen(selectedMenuDoctor);
                          handleMenuClose();
                        }}
                      >View
                      </MenuItem>

                      <MenuItem sx={{ fontWeight: "bold", color: "#4fc3f7" }}
                        onClick={() => {
                          handleOpen(selectedMenuDoctor);
                          handleMenuClose();
                        }}
                        disabled={userRole === "Staff" || userRole === "Doctor"}
                      >Edit
                      </MenuItem>

                      <MenuItem sx={{ fontWeight: "bold", color: "#ef5350" }}
                        onClick={() => {
                          handleDelete(selectedMenuDoctor.id);
                          handleMenuClose();
                        }}
                        disabled={userRole != "Admin"}
                      >Delete
                      </MenuItem>
                    </Menu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  No doctors found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editing ? "Edit Doctor" : "New Doctor"}</DialogTitle>
        <DialogContent>
          {["fullName", "email", "phoneNumber", "address", "city", "specialization", "amka"].map((field) => (
            <TextField
              key={field}
              label={field}
              name={field}
              fullWidth
              margin="dense"
              required
              value={currentDoctor[field] || ""}
              onChange={handleChange}
              error={Boolean(errors[field])}
              helperText={errors[field]}
            />
          ))}

        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ color: "white", bgcolor: "#ffb74d" }}>
            {editing ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Doctor Modal */}
      <Modal
        open={viewOpen}
        onClose={handleViewClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: 3,
            backgroundColor: '#ffb74d',
            width: '100%',
            maxWidth: 600,
            borderRadius: 2, // Optional for rounded corners
          }}
        >
          {/* Close Icon Button */}
          <IconButton
            onClick={handleViewClose}
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              color: 'black',
              '&:hover': {
                backgroundColor: 'transparent', // No background color on hover
              },
            }}
          >
            <CloseIcon />
          </IconButton>

          <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ marginBottom: 2 }}>
            {selectedDoctor?.fullName}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>ID:</strong> {userRole !== "Staff" && selectedDoctor?.id}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Email:</strong> {selectedDoctor?.email}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Phone:</strong> {selectedDoctor?.phoneNumber}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Address:</strong> {selectedDoctor?.address}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>City:</strong> {selectedDoctor?.city}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Specialization:</strong> {selectedDoctor?.specialization}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>AMKA:</strong> {selectedDoctor?.amka}
          </Typography>
        </Box>
      </Modal>

      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Doctors;
