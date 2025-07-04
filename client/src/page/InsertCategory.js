import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Snackbar,
  IconButton,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
const API_URL = process.env.REACT_APP_API_URL;
const AlertSnackbar = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function InsertCategory() {
  const [categoryName, setCategoryName] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_URL}/category`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ CategoryName: categoryName }),
      });

      if (res.ok) {
        setMessage('เพิ่มหมวดหมู่สำเร็จ!');
        setMessageType('success');
        setSnackbarOpen(true);

        setTimeout(() => {
          navigate('/CategoryList');
        }, 1500);
      } else {
        setMessage('เพิ่มหมวดหมู่ไม่สำเร็จ');
        setMessageType('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error inserting:', error);
      setMessage('เกิดข้อผิดพลาด');
      setMessageType('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 400,
        mx: 'auto',
        mt: 10,
        p: 3,
        boxShadow: 3,
        borderRadius: 2,
        position: 'relative',
      }}
    >
      <IconButton
        onClick={() => navigate('/CategoryList')}
        sx={{ position: 'absolute', top: 8, left: 8 }}
        color="primary"
      >
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h6" align="center" gutterBottom>
        เพิ่มหมวดหมู่ใหม่
      </Typography>

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          size="small"
          label="ชื่อหมวดหมู่"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          margin="dense"
          required
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          size="small"
        >
          บันทึก
        </Button>
      </form>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <AlertSnackbar
          onClose={() => setSnackbarOpen(false)}
          severity={messageType}
          sx={{ width: '100%' }}
        >
          {message}
        </AlertSnackbar>
      </Snackbar>
    </Box>
  );
}

export default InsertCategory;
