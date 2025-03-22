import React, { useEffect, useState, useContext } from "react";
import {
  Box, Button, Typography, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Select,
  MenuItem, Snackbar, Alert, FormControl, Modal, IconButton, Menu
} from "@mui/material";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import API from "../api";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const API_URL = `${API.defaults.baseURL}/appointment`;
const API_URL_EXAM = `${API.defaults.baseURL}/examination`;
const EXAM_TYPES_URL = `${API.defaults.baseURL}/appointment/exam-types`;
const EXAM_STATUSES_URL = `${API.defaults.baseURL}/appointment/exam-statuses`;

const Appointments = () => {
  const { isAuthenticated, userRole } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [examTypes, setExamTypes] = useState([]);
  const [examStatuses, setExamStatuses] = useState([]);
  const [currentAppointment, setCurrentAppointment] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    appointmentDate: "",
    examType: "",
    status: "",
    notes: "",
    patientId: "",
    doctorId: "",
    examinationId: null,
    examination: null,
    medicalRecordId: "",
    totalPrice: null,
    prescriptionCode: "",
  });
  const [errors, setErrors] = useState({});
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [deleteAppointment, setDeleteAppointment] = useState(null)
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMenuAppointment, setSelectedMenuAppointment] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAppointments();
      fetchEnumData();
    }
  }, [isAuthenticated]);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(API_URL, { withCredentials: true });
      if (Array.isArray(response.data.appointments?.$values)) {
        setAppointments(response.data.appointments.$values);
      } else {
        console.error("Appointments data is not an array:", response.data);
        setAppointments([]);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    }
  };

  const fetchEnumData = async () => {
    try {
      const [examTypesResponse, examStatusesResponse] = await Promise.all([
        axios.get(EXAM_TYPES_URL, { withCredentials: true }),
        axios.get(EXAM_STATUSES_URL, { withCredentials: true }),
      ]);
      setExamTypes(examTypesResponse.data || {});
      setExamStatuses(examStatusesResponse.data || {});
    } catch (error) {
      console.error("Error fetching enum data:", error);
    }
  };

  const handleOpen = (appointment = null) => {
    setEditing(!!appointment);
    setCurrentAppointment(
      appointment || {
        fullName: "",
        phoneNumber: "",
        email: "",
        appointmentDate: "",
        examType: "", // default to first examType
        status: "", // default to first status
        notes: "",
        patientId: "",
        doctorId: "",
        examinationId: null,
        examination: null,
        medicalRecordId: "",
        totalPrice: null,
        prescriptionCode: "",
      }
    );
    setErrors({}); // Clear previous validation errors
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    setCurrentAppointment({ ...currentAppointment, [e.target.name]: e.target.value });
  };

  // Helper function to validate GUID format
  const isValidGuid = (guid) => {
    if (!guid) return false;

    // Remove any curly braces and hyphens, then check the length and format
    const cleanedGuid = guid.replace(/[{}-]/g, '');
    return cleanedGuid.length === 32 && /^[0-9a-f]{32}$/i.test(cleanedGuid);
  };

  // Validation function
  const validate = () => {
    const newErrors = {};

    // FullName: required and max 50 characters
    if (!currentAppointment.fullName) {
      newErrors.fullName = "Full name is required.";
    } else if (currentAppointment.fullName.length > 50) {
      newErrors.fullName = "Full name cannot exceed 50 characters.";
    }

    // Email validation
    if (currentAppointment.email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(currentAppointment.email)) {
      newErrors.email = "Invalid email format.";
    }

    // PhoneNumber: required and valid phone number format
    if (!currentAppointment.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required.";
    } else if (!/^\+?[0-9]{10,14}$/.test(currentAppointment.phoneNumber)) {
      newErrors.phoneNumber = "Invalid phone number format.";
    }

    // Appointment Date: required and not in the past
    if (!currentAppointment.appointmentDate) {
      newErrors.appointmentDate = "Appointment date is required.";
    } else {
      const appointmentDateTime = new Date(currentAppointment.appointmentDate);
      const now = new Date();
      if (appointmentDateTime < now) {
        newErrors.appointmentDate = "Appointment date cannot be in the past.";
      }
    }

    // ExamType: required and must be valid enum value
    if (!currentAppointment.examType) {
      newErrors.examType = "Exam type is required.";
    } else if (!Object.keys(examTypes).includes(currentAppointment.examType.toString())) {
      newErrors.examType = "Invalid exam type.";
    }

    // Status: required and must be valid enum value
    if (!currentAppointment.status) {
      newErrors.status = "Status is required.";
    } else if (!Object.keys(examStatuses).includes(currentAppointment.status.toString())) {
      newErrors.status = "Invalid status.";
    }

    // TotalPrice: must be positive if provided
    if (currentAppointment.totalPrice !== null && currentAppointment.totalPrice < 0) {
      newErrors.totalPrice = "Total price must be a positive value.";
    }

    // ExaminationId validation
    if (currentAppointment.examinationId) {
      const examId = parseInt(currentAppointment.examinationId, 10);
      if (isNaN(examId) || examId <= 0) {
        newErrors.examinationId = "Invalid examination ID.";
      }
    }

    // PatientId validation (if provided)
    if (currentAppointment.patientId && !isValidGuid(currentAppointment.patientId)) {
      newErrors.patientId = "Invalid patient ID format.";
    }

    // DoctorId validation (if provided)
    if (currentAppointment.doctorId && !isValidGuid(currentAppointment.doctorId)) {
      newErrors.doctorId = "Invalid doctor ID format.";
    }

    // MedicalRecordId validation (if provided)
    if (currentAppointment.medicalRecordId && !isValidGuid(currentAppointment.medicalRecordId)) {
      newErrors.medicalRecordId = "Invalid medical record ID format.";
    }

    return newErrors;
  };



  const handleSubmit = async () => {
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      try {
        // Convert examType, status, examinationId to integers before sending
        const payload = {
          ...currentAppointment,
          doctorId: currentAppointment.doctorId ? currentAppointment.doctorId : null,
          patientId: currentAppointment.patientId ? currentAppointment.patientId : null,
          medicalRecordId: currentAppointment.medicalRecordId ? currentAppointment.medicalRecordId : null,
          examType: parseInt(currentAppointment.examType, 10), // Convert to integer
          status: parseInt(currentAppointment.status, 10), // Convert to integer
          examinationId: currentAppointment.examinationId
            ? parseInt(currentAppointment.examinationId, 10)
            : null,
          totalPrice: currentAppointment.totalPrice
            ? parseFloat(currentAppointment.totalPrice) // ParseFloat for decimals
            : null,
          examination: null // Remove the examination object from the payload
        };

        if (editing) {
          await axios.put(`${API_URL}/${currentAppointment.id}`, payload, {
            withCredentials: true,
          });
        } else {
          await axios.post(API_URL, payload, {
            withCredentials: true,
          });
        }

        fetchAppointments();
        setSnackbarMessage("Appointment saved successfully!");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        handleClose();
      } catch (error) {
        console.error("Error saving appointment:", error);
        const extraErrors = { ...errors };

        // Handle backend error messages
        if (error.response?.data) {
          let errorMessage;

          // Check if the error message is directly in the response
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          }
          // Check if it's in a message property
          else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          }
          // If neither, use a default message
          else {
            errorMessage = "An error occurred while saving the appointment.";
          }

          // Map specific error messages to form fields
          if (errorMessage.includes("Invalid Examination ID")) {
            extraErrors.examinationId = "This examination ID does not exist.";
          }
          if (errorMessage.includes("This Examination ID is already linked")) {
            extraErrors.examinationId = "This examination ID is already linked to another appointment.";
          }
          if (errorMessage.includes("Patient with the provided ID does not exist")) {
            extraErrors.patientId = "Patient with the provided ID does not exist.";
          }
          if (errorMessage.includes("Doctor with the provided ID does not exist")) {
            extraErrors.doctorId = "Doctor with the provided ID does not exist.";
          }
          if (errorMessage.includes("Total price must be a positive value")) {
            extraErrors.totalPrice = "Total price must be a positive value.";
          }
          if (errorMessage.includes("Appointment date cannot be in the past")) {
            extraErrors.appointmentDate = "Appointment date cannot be in the past.";
          }

          setErrors(extraErrors);
          // Show the first error in the snackbar
          const firstError = Object.values(extraErrors)[0] || errorMessage;
          setSnackbarMessage(firstError);
        } else {
          setSnackbarMessage("Error saving appointment.");
        }

        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      }
    } else {
      setErrors(formErrors);
      const firstError = Object.values(formErrors)[0];
      setSnackbarMessage(firstError);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleDelete = (id) => {
    setDeleteAppointment(id);
    setSnackbarMessage(
      <Box>
        <Typography sx={{ fontWeight: "bold" }}>Are you sure you want to delete this appointment?</Typography>
        <Button
          onClick={async () => {
            try {
              await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
              fetchAppointments();
              setSnackbarMessage("Appointment deleted successfully!");
              setSnackbarSeverity("success");
            } catch (error) {
              setSnackbarMessage("Error deleting appointment.");
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

  const handleDownloadPdf = async (id) => {
    try {
      // Make the API request to download the PDF file
      const response = await axios.get(`${API_URL_EXAM}/${id}/download-pdf`, {
        responseType: "blob", // Important for handling binary data
        withCredentials: true, // Ensure credentials are sent if needed
      });
      console.log("Exam of appointments:", response.data)

      // Create a Blob from the response and download it
      const fileURL = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = fileURL;
      link.setAttribute("download", `Examination_${id}.pdf`); // Set the file name dynamically
      document.body.appendChild(link);
      link.click();
      link.remove(); // Clean up the link element
    } catch (error) {
      console.error("Error downloading PDF:", error);
      setSnackbarMessage("Failed to download PDF.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleViewOpen = (appointment) => {
    setSelectedAppointment(appointment);
    setViewOpen(true);
  };

  const handleViewClose = () => {
    setViewOpen(false);
    setSelectedAppointment(null);
  };

  const handleClick = (event, appointment) => {
    setAnchorEl(event.currentTarget);
    setSelectedMenuAppointment(appointment);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedMenuAppointment(null);
  };

  return (
    <Box sx={{ p: 2, width: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4">Appointments</Typography>
        <Button variant="contained"
          sx={{ color: "white", bgcolor: "#ffb74d" }}
          onClick={() => handleOpen()}
          disabled={userRole === "Doctor"}>
          + New Appointment
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ mt: 2, maxWidth: "100%", overflowX: "auto" }}>
        <Table>
          <TableHead sx={{ bgcolor: "black", borderRight: "1px solid white", fontWeight: "bold" }}>
            <TableRow>
              <TableCell sx={{ color: "white" }}>Full Name</TableCell>
              <TableCell sx={{ color: "white" }}>Phone</TableCell>
              <TableCell sx={{ color: "white" }}>Email</TableCell>
              <TableCell sx={{ color: "white" }}>Appointment Date</TableCell>
              <TableCell sx={{ color: "white" }}>Exam Type</TableCell>
              <TableCell sx={{ color: "white" }}>Status</TableCell>
              <TableCell sx={{ color: "white" }}>Exam ID</TableCell>
              <TableCell sx={{ color: "white" }}>Total Price</TableCell>
              <TableCell sx={{ color: "white" }}>Prescription Code</TableCell>
              <TableCell sx={{ color: "white" }}>Notes</TableCell>
              <TableCell sx={{ color: "white" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(appointments) && appointments.length > 0 ? (
              appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>{appointment.fullName}</TableCell>
                  <TableCell>{appointment.phoneNumber}</TableCell>
                  <TableCell>{appointment.email}</TableCell>
                  <TableCell>{new Date(appointment.appointmentDate).toLocaleString()}</TableCell>
                  <TableCell>{examTypes[appointment.examType]}</TableCell>
                  <TableCell>{examStatuses[appointment.status]}</TableCell>
                  <TableCell>{appointment.examinationId}</TableCell>
                  <TableCell>{appointment.totalPrice}</TableCell>
                  <TableCell>{appointment.prescriptionCode}</TableCell>
                  <TableCell>{appointment.notes}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {appointment.examinationId && appointment.examination?.resultPdf ? (
                        <Button
                          onClick={() => handleDownloadPdf(appointment.examinationId)}
                          sx={{
                            fontWeight: "bold",
                            color: "#4caf50",
                            backgroundColor: "white",
                            "&:hover": { backgroundColor: "#eceff1" },
                          }}
                        >
                          PDF
                        </Button>
                      ) : (
                        <Typography sx={{ color: "#d6d6d6", fontWeight: "bold", px: appointment.examinationId ? 2 : 1.3 }}>
                          {appointment.examinationId ? "PDF" : "Exam"}
                        </Typography>
                      )}
                      <IconButton onClick={(e) => handleClick(e, appointment)}>
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={12} align="center">
                  No appointments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
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
            handleViewOpen(selectedMenuAppointment);
            handleCloseMenu();
          }}
        >View
        </MenuItem>

        <MenuItem sx={{ fontWeight: "bold", color: "#4fc3f7" }}
          onClick={() => {
            handleOpen(selectedMenuAppointment);
            handleCloseMenu();
          }}
          disabled={userRole === "Doctor"}
        >Edit
        </MenuItem>

        <MenuItem sx={{ fontWeight: "bold", color: "#ef5350" }}
          onClick={() => {
            handleDelete(selectedMenuAppointment.id);
            handleCloseMenu();
          }}
          disabled={userRole != "Admin"}
        >Delete
        </MenuItem>
      </Menu>

      {/* Dialog for Add/Edit */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editing ? "Edit Appointment" : "New Appointment"}</DialogTitle>
        <DialogContent>
          {["fullName", "phoneNumber", "email", "patientId", "doctorId", "medicalRecordId", "prescriptionCode", "notes"].map((field) => (
            <TextField
              key={field}
              label={field}
              name={field}
              fullWidth
              margin="dense"
              value={currentAppointment[field]}
              onChange={handleChange}
              error={!!errors[field]}
              helperText={errors[field]}
            />
          ))}

          <TextField
            key="totalPrice"
            label="Total Price"
            name="totalPrice"
            fullWidth
            margin="dense"
            type="number"
            value={currentAppointment.totalPrice || null}
            onChange={handleChange}
            error={!!errors.totalPrice}
            helperText={errors.totalPrice}
          />

          <FormControl fullWidth margin="dense">
            <TextField
              key="examinationId"
              label="Examination ID"
              name="examinationId"
              type="number"
              fullWidth
              margin="dense"
              value={currentAppointment.examinationId || null}
              onChange={handleChange}
              error={!!errors.examinationId}
              helperText={errors.examinationId}
            />
          </FormControl>

          {/* Adjusted Appointment Date field */}
          <FormControl fullWidth margin="dense">
            <TextField
              id="appointmentDate"
              type="datetime-local"
              name="appointmentDate"
              value={currentAppointment.appointmentDate
                ? new Date(currentAppointment.appointmentDate).toISOString().slice(0, 16)
                : ""}
              onChange={handleChange}
              error={!!errors.appointmentDate}
              helperText={errors.appointmentDate}
            />
          </FormControl>

          {/* Exam Type Select */}
          <Select
            name="examType"
            fullWidth
            value={currentAppointment.examType || ""}
            onChange={handleChange}
            margin="dense"
            error={!!errors.examType}
          >
            {Object.entries(examTypes).map(([value, label]) => (
              <MenuItem key={value} value={parseInt(value, 10)}> {/* Integer value */}
                {label}
              </MenuItem>
            ))}
          </Select>

          {/* Status Select */}
          <Select
            name="status"
            fullWidth
            value={currentAppointment.status || ""}
            onChange={handleChange}
            margin="dense"
            error={!!errors.status}
          >
            {Object.entries(examStatuses).map(([value, label]) => (
              <MenuItem key={value} value={parseInt(value, 10)}> {/* Integer value */}
                {label}
              </MenuItem>
            ))}
          </Select>

          <div>{errors.status && <span style={{ color: 'red' }}>{errors.status}</span>}</div>

        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ color: "white", bgcolor: "#ffb74d" }}>
            {editing ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

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
            borderRadius: 2,
          }}
        >
          <IconButton
            onClick={handleViewClose}
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              color: 'black',
              '&:hover': {
                backgroundColor: 'transparent',
              },
            }}
          >
            <CloseIcon />
          </IconButton>

          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Full Name:</strong> {selectedAppointment?.fullName}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Email:</strong> {selectedAppointment?.email}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Phone:</strong> {selectedAppointment?.phoneNumber}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Total Price:</strong> {selectedAppointment?.totalPrice}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Exam Type:</strong> {examTypes[selectedAppointment?.examType]}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Status:</strong> {examStatuses[selectedAppointment?.status]}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Prescription Code:</strong> {selectedAppointment?.prescriptionCode}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Patient ID:</strong> {userRole !== "Staff" && selectedAppointment?.patientId}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Doctor ID:</strong> {(userRole === "Admin" || userRole === "Manager") && selectedAppointment?.doctorId}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Examination ID:</strong> {selectedAppointment?.examinationId}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Med. Record ID:</strong> {(userRole === "Admin" || userRole === "Doctor") && selectedAppointment?.medicalRecordId}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Appointment Date:</strong> {selectedAppointment?.appointmentDate}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Notes:</strong> {selectedAppointment?.notes}
          </Typography>
        </Box>
      </Modal>

      {/* Snackbar for feedback */}
      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Appointments;
