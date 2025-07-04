import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
const AlertSnackbar = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });
  

function InsertItem() {
  const [itemName, setItemName] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [macNo, setMacNo] = useState('');
  const [minStock, setMinStock] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [picFile, setPicFile] = useState(null);
  const [picPreview, setPicPreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    fetch('http://localhost:3001/api/category')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error('Error loading categories:', err));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setPicFile(file);

    if (file) {
      setPicPreview(URL.createObjectURL(file));
    } else {
      setPicPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const formData = new FormData();
    formData.append('ItemName', itemName);
    formData.append('SerialNo', serialNo);
    formData.append('MacNo', macNo);
    formData.append('MinStock', minStock);
    formData.append('CategoryID', categoryId);
    formData.append('pic', picFile);
  
    try {
      const res = await fetch('http://localhost:3001/api/item-master', {
        method: 'POST',
        body: formData,
      });
  
      if (res.ok) {
        setMessage('เพิ่มข้อมูลสำเร็จ!');
        setMessageType('success');
        setSnackbarOpen(true);
        setTimeout(() => {
          navigate('/ItemMasterList');
        }, 1500);
      } else {
        setMessage('เพิ่มข้อมูลไม่สำเร็จ');
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
  onClick={() => navigate('/ItemMasterList')}
  sx={{ position: 'absolute', top: 8, left: 8 }}
  color="primary"
>
  <ArrowBackIcon />
</IconButton>
      <Typography variant="h6" align="center" gutterBottom>
        เพิ่มสินค้าใหม่
      </Typography>

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          size="small"
          label="Item Name"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          margin="dense"
          required
        />

        <TextField
          fullWidth
          size="small"
          label="Serial No"
          value={serialNo}
          onChange={(e) => setSerialNo(e.target.value)}
          margin="dense"
        />

        <TextField
          fullWidth
          size="small"
          label="Mac No"
          value={macNo}
          onChange={(e) => setMacNo(e.target.value)}
          margin="dense"
        />

        <TextField
          fullWidth
          size="small"
          label="Min Stock"
          type="number"
          value={minStock}
          onChange={(e) => setMinStock(e.target.value)}
          margin="dense"
        />

        <FormControl fullWidth margin="dense" size="small">
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryId}
            label="Category"
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            {categories.map((cat) => (
              <MenuItem key={cat.CategoryID} value={cat.CategoryID}>
                {cat.CategoryName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          component="label"
          fullWidth
          sx={{ mt: 1 }}
          size="small"
        >
          Upload Picture
          <input
            type="file"
            hidden
            onChange={handleFileChange}
          />
        </Button>

        {picPreview && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <img
              src={picPreview}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: 8 }}
            />
          </Box>
        )}

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
        <AlertSnackbar onClose={() => setSnackbarOpen(false)} severity={messageType} sx={{ width: '100%' }}>
            {message}
        </AlertSnackbar>
        </Snackbar>
    </Box>
  );
}

export default InsertItem;
