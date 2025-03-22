import React, { useEffect, useState, useContext } from "react";
import {
  Box,Button,Typography,Table,TableBody,TableCell,TableContainer,TableHead,
  TableRow,Paper,Dialog,DialogActions,DialogContent,DialogTitle,TextField,Snackbar,
  Alert,Modal,IconButton,Menu,MenuItem
  } from "@mui/material";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import API from "../api";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const API_URL = `${API.defaults.baseURL}/patient`;

const Patients = () => {
  const { isAuthenticated, userRole } = useContext(AuthContext);
  const [patients, setPatients] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentPatient, setCurrentPatient] = useState({
    fullName: "",
    email: null,
    phoneNumber: "",
    address: "",
    city: "",
    doctorId: "",
    medicalRecordId: null,
    αμκα: "",
    id: ""
  });
  const [errors, setErrors] = useState({});
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [deletePatient, setDeletePatient] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMenuPatient, setSelectedMenuPatient] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPatients();
    }
  }, [isAuthenticated]);

  const fetchPatients = async () => {
    try {
      const response = await axios.get(API_URL, { withCredentials: true });
      if (Array.isArray(response.data.patients?.$values)) {
        setPatients(response.data.patients.$values);
      } else {
        console.error("Patients data is not an array:", response.data);
        setPatients([]);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      setPatients([]); // Ensure state does not break UI
    }
  };

  const handleOpen = (patient = null) => {
    setEditing(!!patient);
    setCurrentPatient(
      patient || {
        fullName: "",
        email: null,
        phoneNumber: "",
        address: "",
        city: "",
        doctorId: "",
        medicalRecordId: null,
        αμκα: "",
        id: ""
      }
    );
    setErrors({}); // Clear previous validation errors
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  // Function to open the view modal with a specific patient's details
  const handleViewOpen = (patient) => {
    setSelectedPatient(patient);
    setViewOpen(true);
  };

  // Function to close the view modal
  const handleViewClose = () => {
    setViewOpen(false);
    setSelectedPatient(null);
  };

  const handleChange = (e) => {
    setCurrentPatient({ ...currentPatient, [e.target.name]: e.target.value });
  };

  // Validation function
  const validate = () => {
    const newErrors = {};

    // AMKA: required and 11 digits
    if (!currentPatient.αμκα) {
      newErrors.amka = "Identification number (AMKA) is required.";
    } else if (!/^\d{11}$/.test(currentPatient.αμκα)) {
      newErrors.αμκα = "Identification number (AMKA) must be exactly 11 digits.";
    }

    // FullName: required and max 50 characters
    if (!currentPatient.fullName) {
      newErrors.fullName = "Full name is required.";
    } else if (currentPatient.fullName.length > 50) {
      newErrors.fullName = "Full name cannot exceed 50 characters.";
    }

    // PhoneNumber: required and valid phone number format
    if (!currentPatient.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required.";
    } else if (!/^\+?[0-9]{10,14}$/.test(currentPatient.phoneNumber)) {
      newErrors.phoneNumber = "Invalid phone number format.";
    }

    // Address: required and max 100 characters
    if (!currentPatient.address) {
      newErrors.address = "Address is required.";
    } else if (currentPatient.address.length > 100) {
      newErrors.address = "Address cannot exceed 100 characters.";
    }

    // City: required and max 50 characters
    if (!currentPatient.city) {
      newErrors.city = "City is required.";
    } else if (currentPatient.city.length > 50) {
      newErrors.city = "City cannot exceed 50 characters.";
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    const formErrors = validate();
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      console.log("Form validation errors:", formErrors);
      setSnackbarMessage("Please fix the errors in the form.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    try {
      console.log("Sending patient data:", currentPatient);
      if (editing) {
        await axios.put(`${API_URL}/${currentPatient.id}`, currentPatient, {
          withCredentials: true,
        });
      } else {
        await axios.post(API_URL, currentPatient, {
          withCredentials: true,
        });
      }

      fetchPatients();
      setSnackbarSeverity("success");
      setSnackbarMessage("Patient submitted successfully!");
      setOpenSnackbar(true);
      handleClose();
    } catch (error) {
      console.error("Error saving patient:", error.response?.data || error.message);
      setSnackbarMessage(`Error: ${error.response?.data?.message || "Invalid data submitted."}`);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleDelete = (id) => {
    setDeletePatient(id);
    setSnackbarMessage(
      <Box>
        <Typography sx={{ fontWeight: "bold" }}>
          Are you sure you want to delete this patient?
        </Typography>
        <Button
          onClick={async () => {
            try {
              await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
              fetchPatients();
              setSnackbarMessage("Patient deleted successfully!");
              setSnackbarSeverity("success");
            } catch (error) {
              setSnackbarMessage("Error deleting patient.");
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

  const handleMenuClick = (event, patient) => {
    setAnchorEl(event.currentTarget);
    setSelectedMenuPatient(patient);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMenuPatient(null);
  };

  return (
    <Box sx={{ p: 2, width: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4">Patients</Typography>
        <Button variant="contained" 
        sx={{ color: "white", bgcolor: "#ffb74d" }} 
        onClick={() => handleOpen()} 
        disabled={userRole === "Staff"}>
          + New Patient
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ mt: 2, maxWidth: "100%", overflowX: "auto" }}>
        <Table>
          <TableHead sx={{ bgcolor: "black" }}>
            <TableRow>
              <TableCell sx={{ color: "white", width: "15%" }}>Full Name</TableCell>
              <TableCell sx={{ color: "white", width: "15%" }}>Email</TableCell>
              <TableCell sx={{ color: "white", width: "15%" }}>Phone</TableCell>
              <TableCell sx={{ color: "white", width: "15%" }}>Address</TableCell>
              <TableCell sx={{ color: "white", width: "10%" }}>City</TableCell>
              <TableCell sx={{ color: "white", width: "10%" }}>AMKA</TableCell>
              <TableCell sx={{ color: "white", width: "10%" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell>{patient.fullName}</TableCell>
                <TableCell>{patient.email}</TableCell>
                <TableCell>{patient.phoneNumber}</TableCell>
                <TableCell>{patient.address}</TableCell>
                <TableCell>{patient.city}</TableCell>
                <TableCell>{patient.αμκα}</TableCell>
                <TableCell>
                  <IconButton onClick={(e) => handleMenuClick(e, patient)}>
                    <MoreVertIcon />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl) && selectedMenuPatient?.id === patient.id}
                    onClose={handleMenuClose}
                  >
                    <MenuItem
                      sx={{ fontWeight: "bold", color: "#ed45e5" }}
                      onClick={() => {
                        handleViewOpen(selectedMenuPatient);
                        handleMenuClose();
                      }}
                    >
                      View
                    </MenuItem>
                    <MenuItem
                      sx={{ fontWeight: "bold", color: "#4fc3f7" }}
                      onClick={() => {
                        handleOpen(selectedMenuPatient);
                        handleMenuClose();
                      }}
                      disabled={userRole === "" || userRole === "Staff"}
                    >
                      Edit
                    </MenuItem>
                    <MenuItem
                      sx={{ fontWeight: "bold", color: "#ef5350" }}
                      onClick={() => {
                        handleDelete(selectedMenuPatient.id);
                        handleMenuClose();
                      }}
                      disabled={userRole != "Admin"}
                    >
                      Delete
                    </MenuItem>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editing ? "Edit Patient" : "New Patient"}</DialogTitle>
        <DialogContent>
          {["fullName", "email", "phoneNumber", "address", "city", "doctorId", "medicalRecordId", "αμκα"].map((field) => (
            <TextField
              key={field}
              label={field}
              name={field}
              fullWidth
              margin="dense"
              required={["fullName", "phoneNumber", "address", "city", "doctorId", "αμκα"].includes(field)}
              value={currentPatient[field] || ""}
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

      {/* View Patient Modal */}
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
            {selectedPatient?.fullName}
          </Typography>
          <Typography id="modal-modal-title" sx={{ marginBottom: 2 }}>
          <strong>ID:</strong> {userRole !== "Staff" && selectedPatient?.id}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Email:</strong> {selectedPatient?.email}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Phone:</strong> {selectedPatient?.phoneNumber}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Address:</strong> {selectedPatient?.address}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>City:</strong> {selectedPatient?.city}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Doctor ID:</strong> {userRole !== "Staff" && selectedPatient?.doctorId}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Medical Record ID:</strong> {userRole !== "Staff" && selectedPatient?.medicalRecordId}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>AMKA:</strong> {selectedPatient?.αμκα}
          </Typography>
        </Box>
      </Modal>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Patients;
