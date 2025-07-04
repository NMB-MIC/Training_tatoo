import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Snackbar,
  Alert,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function InsertOperation() {
  const [operationName, setOperationName] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState('success');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:3001/api/operation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ OperationName: operationName }),
      });

      if (res.ok) {
        setSnackbarMessage('เพิ่มประเภทการทำงานสำเร็จ!');
        setSnackbarType('success');
        setSnackbarOpen(true);

        setTimeout(() => {
          navigate('/OperationList');
        }, 1500);
      } else {
        setSnackbarMessage('เพิ่มประเภทการทำงานไม่สำเร็จ');
        setSnackbarType('error');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Error inserting operation:', err);
      setSnackbarMessage('เกิดข้อผิดพลาด');
      setSnackbarType('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 500,
        mx: 'auto',
        mt: 10,
        p: 2,
        boxShadow: 3,
        borderRadius: 2,
        position: 'relative',
      }}
    >
      <IconButton
        onClick={() => navigate('/OperationList')}
        sx={{ position: 'absolute', top: 8, left: 8 }}
        color="primary"
      >
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h6" align="center" gutterBottom>
        เพิ่มประเภทการทำงานใหม่
      </Typography>

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          size="small"
          label="Operation Name"
          value={operationName}
          onChange={(e) => setOperationName(e.target.value)}
          margin="dense"
          required
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
        >
          บันทึก
        </Button>
      </form>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarType}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default InsertOperation;
