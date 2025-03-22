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

const API_URL = `${API.defaults.baseURL}/medicalrecord`;

const MedicalRecords = () => {
  const { isAuthenticated, userRole } = useContext(AuthContext);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const [currentRecord, setCurrentRecord] = useState({
    patientId: "",
    doctorId: "",
    amka: "",
    disease: "",
    medicalHistory: "",
    medications: "",
    id: ""
  });
  const [errors, setErrors] = useState({});
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [deleteRecord, setDeleteRecord] = useState(null)
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedMenuRecord, setSelectedMenuRecord] = useState(null); // To store selected doctor for menu

  const [anchorEl, setAnchorEl] = useState(null);

  const fetchMedicalRecords = async () => {
    try {
      const response = await axios.get(API_URL, { withCredentials: true });
      setMedicalRecords(Array.isArray(response.data.$values) ? response.data.$values : []);
    }
    catch (error) {
      console.error("Error fetching medical records:", error);
      setMedicalRecords([]);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMedicalRecords();
    }
  }, [isAuthenticated]);

  const handleOpen = (record = null) => {
    setEditing(!!record);
    setCurrentRecord(
      record || {
        patientId: "",
        doctorId: "",
        amka: "",
        disease: "",
        medicalHistory: "",
        medications: "",
        id: ""
      }
    );
    setErrors({}); // Clear previous validation errors
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleViewOpen = (record) => {
    setSelectedRecord(record);
    setViewOpen(true);
  };

  const handleViewClose = () => {
    setSelectedRecord(null);
    setViewOpen(false);
  };

  const handleChange = (e) => {
    setCurrentRecord({ ...currentRecord, [e.target.name]: e.target.value });
  };

  // Validation function
  const validate = () => {
    const newErrors = {};

    // AMKA: required and 11 digits
    if (!currentRecord.amka) {
      newErrors.amka = "Identification number (AMKA) is required.";
    } else if (!/^\d{11}$/.test(currentRecord.amka)) {
      newErrors.amka = "Identification number (AMKA) must be exactly 11 digits.";
    }

    if (!currentRecord.patientId) {
      newErrors.patientId = "Patiend ID is required.";
    }

    if (!currentRecord.doctorId) {
      newErrors.doctorId = "Doctor ID is required.";
    }

    if (!currentRecord.disease) {
      newErrors.disease = "Disease is required.";
    }

    if (!currentRecord.medications) {
      newErrors.medications = "Medications are required.";
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      try {
        console.log("Submitting medical record:", currentRecord);

        if (editing) {
          await axios.put(`${API_URL}/${currentRecord.id}`, currentRecord, {
            withCredentials: true,
          });
        } else {
          await axios.post(API_URL, currentRecord, { withCredentials: true });
        }

        fetchMedicalRecords();
        setSnackbarMessage("Medical record saved successfully!");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        handleClose();
      } catch (error) {
        console.error("Error saving medical record:", error.response?.data || error.message);

        // Extract server error message if available
        let errorMessage = "Error saving medical record.";
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message; // Server-defined error message
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error; // Alternative error key
        }
        else if (error.response?.data) {
          errorMessage = error.response?.data;
        }

        setSnackbarMessage(errorMessage);
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
    setDeleteRecord(id);
    setSnackbarMessage(
      <Box>
        <Typography sx={{ fontWeight: "bold" }}>
          Are you sure you want to delete this medical record?
        </Typography>
        <Button
          onClick={async () => {
            try {
              const response = await axios.delete(`${API_URL}/${id}`, {
                withCredentials: true,
              });

              if (response.status === 200) {
                // Assuming the response is a success and medical record is deleted
                fetchMedicalRecords();
                setSnackbarMessage("Medical record deleted successfully!");
                setSnackbarSeverity("success");
              } else {
                // Handle case if the server returns a non-200 status
                setSnackbarMessage("Error deleting medical record.");
                setSnackbarSeverity("error");
              }
            } catch (error) {
              console.error("Error during deletion:", error);  // Log error for debugging
              setSnackbarMessage("Error deleting medical record.");
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
  const handleMenuClick = (event, record) => {
    setAnchorEl(event.currentTarget);
    setSelectedMenuRecord(record);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMenuRecord(null);
  };

  return (
    <Box sx={{ p: 2, width: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4">Medical Records</Typography>
        <Button variant="contained"
          sx={{ color: "white", bgcolor: "#ffb74d" }}
          onClick={() => handleOpen()}
          disabled={userRole !== "Admin" && userRole !== "Doctor"}>
          + New Record
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ mt: 2, maxWidth: "100%", overflowX: "auto" }}>
        <Table>
          <TableHead sx={{ bgcolor: "black" }}>
            <TableRow>
              <TableCell sx={{ color: "white" }}>Patient ID</TableCell>
              <TableCell sx={{ color: "white" }}>Doctor ID</TableCell>
              <TableCell sx={{ color: "white" }}>AMKA</TableCell>
              <TableCell sx={{ color: "white" }}>Disease</TableCell>
              <TableCell sx={{ color: "white" }}>Medical History</TableCell>
              <TableCell sx={{ color: "white" }}>Medications</TableCell>
              <TableCell sx={{ color: "white" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {medicalRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.patientId}</TableCell>
                <TableCell>{record.doctorId}</TableCell>
                <TableCell>{record.amka}</TableCell>
                <TableCell>{record.disease}</TableCell>
                <TableCell>{record.medicalHistory}</TableCell>
                <TableCell>{record.medications}</TableCell>
                <TableCell>
                  <IconButton onClick={(e) => handleMenuClick(e, record)}>
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
                        handleViewOpen(selectedMenuRecord);
                        handleMenuClose();
                      }}
                    >View
                    </MenuItem>

                    <MenuItem sx={{ fontWeight: "bold", color: "#4fc3f7" }}
                      onClick={() => {
                        handleOpen(selectedMenuRecord);
                        handleMenuClose();
                      }}
                      disabled={userRole !== "Admin" && userRole !== "Doctor"}
                    >Edit
                    </MenuItem>
                    <MenuItem sx={{ fontWeight: "bold", color: "#ef5350" }}
                      onClick={() => {
                        handleDelete(selectedMenuRecord.id);
                        handleMenuClose();
                      }}
                      disabled={userRole != "Admin"}
                    >Delete
                    </MenuItem>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editing ? "Edit Record" : "New Record"}</DialogTitle>
        <DialogContent>
          {["patientId", "doctorId", "amka", "disease", "medicalHistory", "medications"].map((field) => (
            <TextField
              key={field}
              label={field}
              name={field}
              fullWidth
              margin="dense"
              required
              value={currentRecord[field]}
              onChange={handleChange}
              error={Boolean(errors[field])}
              helperText={errors[field]}
            />
          ))}

          {/* {editing && currentRecord.updatedAt && (
            <TextField
              label="Updated At"
              value={new Date(currentRecord.updatedAt).toLocaleString()}
              fullWidth
              margin="dense"
              disabled
            />
          )} */}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ color: "white", bgcolor: "#ffb74d" }}>
            {editing ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Modal */}
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
          
          <Typography variant="h6" sx={{ mb: 2 }}>Medical Record Details</Typography>
          <Typography><strong>ID:</strong> {selectedRecord?.id}</Typography>
          <Typography><strong>Patient ID:</strong> {selectedRecord?.patientId}</Typography>
          <Typography><strong>Doctor ID:</strong> {selectedRecord?.doctorId}</Typography>
          <Typography><strong>AMKA:</strong> {selectedRecord?.amka}</Typography>
          <Typography><strong>Disease:</strong> {selectedRecord?.disease}</Typography>
          <Typography><strong>Medical History:</strong> {selectedRecord?.medicalHistory}</Typography>
          <Typography><strong>Medications:</strong> {selectedRecord?.medications}</Typography>
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

export default MedicalRecords;
