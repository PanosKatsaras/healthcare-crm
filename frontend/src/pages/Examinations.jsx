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

const API_URL = `${API.defaults.baseURL}/examination`;
const EXAM_TYPES_URL = `${API.defaults.baseURL}/examination/exam-types`;
const EXAM_STATUSES_URL = `${API.defaults.baseURL}/examination/exam-statuses`;

const Examinations = () => {
  const { isAuthenticated, userRole } = useContext(AuthContext);
  const [examinations, setExaminations] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [examTypes, setExamTypes] = useState([]);
  const [examStatuses, setExamStatuses] = useState([]);
  const [currentExamination, setCurrentExamination] = useState({
    patientId: "",
    doctorId: "",
    type: "",
    status: "",
    price: null,
    description: "",
    resultPdf: null, // Store the file
    createdAt: "",
    updatedAt: "",
  });
  const [errors, setErrors] = useState({});
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [deleteExamination, setDeleteExamination] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedExamination, setSelectedExamination] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMenuExamination, setSelectedMenuExamination] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchExaminations();
      fetchEnumData();
    }
  }, [isAuthenticated]);

  const fetchExaminations = async () => {
    try {
      const response = await axios.get(API_URL, { withCredentials: true });
      setExaminations(Array.isArray(response.data.$values) ? response.data.$values : []);
    }
    catch (error) {
      console.error("Error fetching examinations:", error);
      setExaminations([]);
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

  const handleOpen = (examination = null) => {
    setEditing(!!examination);
    setCurrentExamination(
      examination || {
        patientId: "",
        doctorId: "",
        type: "",
        status: "",
        price: null,
        description: "",
        resultPdf: null, // Reset the PDF file when opening dialog
        createdAt: "",
        updatedAt: "",
      }
    );
    setErrors({}); // Clear previous validation errors
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    setCurrentExamination({ ...currentExamination, [e.target.name]: e.target.value });
  };

  // Handle PDF file change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCurrentExamination((prevState) => ({
        ...prevState,
        resultPdf: file, // Store the file object, not base64
      }));
    }
  };

  // Validation function
  const validate = () => {
    const newErrors = {};

    if (!currentExamination.price || currentExamination.price < 0) {
      newErrors.price = "Price is required and should be a positive number.";
    }

    if (!currentExamination.type) {
      newErrors.type = "Exam type is required.";
    }

    if (!currentExamination.status) {
      newErrors.status = "Status is required.";
    }

    if (!currentExamination.description) {
      newErrors.status = "Description is required.";
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      try {
        const payload = new FormData();

        // Convert values to strings before appending
        payload.append("patientId", String(currentExamination.patientId || ""));
        payload.append("doctorId", String(currentExamination.doctorId || ""));
        payload.append("type", String(currentExamination.type));
        payload.append("status", String(currentExamination.status));
        payload.append("price", String(currentExamination.price));
        payload.append("description", String(currentExamination.description));

        // Append PDF file if present
        if (currentExamination.resultPdf) {
          payload.append("resultPdf", currentExamination.resultPdf);
        }

        const config = {
          headers: {
            "Content-Type": "multipart/form-data"
          },
          withCredentials: true
        };

        if (editing) {
          await axios.put(`${API_URL}/${currentExamination.id}`, payload, config);
        } else {
          await axios.post(API_URL, payload, config);
        }

        fetchExaminations();
        setSnackbarMessage("Examination saved successfully!");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        handleClose();
      } catch (error) {
        console.error("Error saving examination:", error.response?.data.errors || error.response?.data || error.message);

        if (error.response?.data?.errors) {
          const apiErrors = error.response.data.errors;
          const newErrors = {};

          if (apiErrors.PatientId) {
            newErrors.patientId = apiErrors.PatientId[0];
          }
          if (apiErrors.DoctorId) {
            newErrors.doctorId = apiErrors.DoctorId[0];
          }
          setErrors(newErrors);
        }
        setSnackbarMessage("Error saving examination.");
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
    setDeleteExamination(id);
    setSnackbarMessage(
      <Box>
        <Typography sx={{ fontWeight: "bold" }}>
          Are you sure you want to delete this examination?
        </Typography>
        <Button
          onClick={async () => {
            try {
              await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
              fetchExaminations();
              setSnackbarMessage("Examination deleted successfully!");
              setSnackbarSeverity("success");
            } catch (error) {
              setSnackbarMessage("Error deleting examination.");
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
      const response = await axios.get(`${API_URL}/${id}/download-pdf`, {
        responseType: "blob", // For handling binary data
        withCredentials: true, // Ensure credentials are sent with the request
      });

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

  const handleViewOpen = (examination) => {
    setSelectedExamination(examination);
    setViewOpen(true);
  };

  const handleViewClose = () => {
    setViewOpen(false);
    setSelectedExamination(null);
  };

  const handleClick = (event, examination) => {
    setAnchorEl(event.currentTarget);
    setSelectedMenuExamination(examination);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedMenuExamination(null);
  };

  return (
    <Box sx={{ p: 2, width: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4">Examinations</Typography>
        <Button variant="contained"
          sx={{ color: "white", bgcolor: "#ffb74d" }}
          onClick={() => handleOpen()}
          disabled={userRole === "Doctor"}>
          + New Examination
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ mt: 2, maxWidth: "100%", overflowX: "auto" }}>
        <Table>
          <TableHead sx={{ bgcolor: "black", borderRight: "1px solid white", fontWeight: "bold" }}>
            <TableRow>
              <TableCell sx={{ color: "white" }}>Exam Type</TableCell>
              <TableCell sx={{ color: "white" }}>Status</TableCell>
              <TableCell sx={{ color: "white" }}>Price</TableCell>
              <TableCell sx={{ color: "white" }}>Description</TableCell>
              <TableCell sx={{ color: "white", width: "10%" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(examinations) && examinations.length > 0 ? (
              examinations.map((examination) => (
                <TableRow key={examination.id}>
                  <TableCell>{examTypes[examination.type]}</TableCell>
                  <TableCell>{examStatuses[examination.status]}</TableCell>
                  <TableCell>{examination.price}</TableCell>
                  <TableCell>{examination.description}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {examination.resultPdf && examination.resultPdf.length > 0 ? (
                        <Button
                          onClick={() => handleDownloadPdf(examination.id)}
                          sx={{ fontWeight: "bold", color: "#4caf50", backgroundColor: "white", "&:hover": { backgroundColor: "#eceff1" } }}
                        >
                          PDF
                        </Button>
                      ) : (
                        <Typography sx={{ color: "#d6d6d6", fontWeight: "bold", px: 2 }}>PDF</Typography>
                      )}
                      <IconButton onClick={(e) => handleClick(e, examination)}>
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No examinations found.
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
        <MenuItem sx={{ fontWeight: "bold", color: "#e449f2" }}
          onClick={() => {
            handleViewOpen(selectedMenuExamination);
            handleCloseMenu();
          }}
        >View
        </MenuItem>

        <MenuItem sx={{ fontWeight: "bold", color: "#4fc3f7" }}
          onClick={() => {
            handleOpen(selectedMenuExamination);
            handleCloseMenu();
          }}
        >Edit
        </MenuItem>

        <MenuItem sx={{ fontWeight: "bold", color: "#ef5350" }}
          onClick={() => {
            handleDelete(selectedMenuExamination.id);
            handleCloseMenu();
          }} disabled={userRole != "Admin"}
        >Delete
        </MenuItem>
      </Menu>

      {/* Dialog for Add/Edit */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editing ? "Edit Examination" : "New Examination"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Patient ID"
            name="patientId"
            fullWidth
            margin="dense"
            value={currentExamination.patientId}
            onChange={handleChange}
            error={!!errors.patientId}
            helperText={errors.patientId}
          />

          <TextField
            label="Doctor ID"
            name="doctorId"
            fullWidth
            margin="dense"
            value={currentExamination.doctorId}
            onChange={handleChange}
            error={!!errors.doctorId}
            helperText={errors.doctorId}
          />

          <FormControl fullWidth margin="dense">
            <Select
              name="type"
              value={currentExamination.type || ""}
              onChange={handleChange}
              error={!!errors.type}
            >
              {Object.entries(examTypes).map(([value, label]) => (
                <MenuItem key={value} value={parseInt(value, 10)}>
                  {label}
                </MenuItem>
              ))}
            </Select>
            {errors.type && <span style={{ color: 'red' }}>{errors.type}</span>}
          </FormControl>

          <FormControl fullWidth margin="dense">
            <Select
              name="status"
              value={currentExamination.status || ""}
              onChange={handleChange}
              error={!!errors.status}
            >
              {Object.entries(examStatuses).map(([value, label]) => (
                <MenuItem key={value} value={parseInt(value, 10)}>
                  {label}
                </MenuItem>
              ))}
            </Select>
            {errors.status && <span style={{ color: 'red' }}>{errors.status}</span>}
          </FormControl>

          <TextField
            label="Price"
            name="price"
            fullWidth
            margin="dense"
            type="number"
            value={currentExamination.price}
            onChange={handleChange}
            error={!!errors.price}
            helperText={errors.price}
          />

          <TextField
            label="Description"
            name="description"
            fullWidth
            margin="dense"
            value={currentExamination.description}
            onChange={handleChange}
            error={!!errors.description}
            helperText={errors.description}
          />

          {/* File input for PDF */}
          <FormControl fullWidth margin="dense">
            <TextField
              type="file"
              name="resultPdf"
              fullWidth
              margin="dense"
              onChange={handleFileChange}
              error={!!errors.resultPdf}
              helperText={errors.resultPdf}
              accept="application/pdf" // Directly setting accept attribute for PDF files
            />
          </FormControl>
          {editing && currentExamination.createdAt && (
            <TextField
              label="CreatedAt At"
              value={new Date(currentExamination.createdAt).toLocaleString()}
              fullWidth
              margin="dense"
              disabled
            />
          )}

          {editing && currentExamination.updatedAt && (
            <TextField
              label="Updated At"
              value={new Date(currentExamination.updatedAt).toLocaleString()}
              fullWidth
              margin="dense"
              disabled
            />
          )}

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
          <Typography variant="h6" sx={{ mb: 2 }}>Examination Details</Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>ID:</strong> {selectedExamination?.id}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Exam Type:</strong> {examTypes[selectedExamination?.type]}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Status:</strong> {examStatuses[selectedExamination?.status]}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Price:</strong> {selectedExamination?.price}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Patient ID:</strong> {userRole !== "Staff" && selectedExamination?.patientId}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Doctor ID:</strong> {userRole !== "Staff" && selectedExamination?.doctorId}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Description:</strong> {selectedExamination?.description}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Created At:</strong> {selectedExamination?.createdAt}
          </Typography>
          <Typography id="modal-modal-description" sx={{ marginBottom: 2 }}>
            <strong>Updated At:</strong> {selectedExamination?.updatedAt}
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

export default Examinations;
