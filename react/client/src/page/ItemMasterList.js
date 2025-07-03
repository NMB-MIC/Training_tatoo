import React, { useEffect, useState } from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Paper,
  TableContainer,
  CircularProgress,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';

function ItemMasterList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editItemId, setEditItemId] = useState(null);
  const [macNo, setMacNo] = useState('');
  const [minStock, setMinStock] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const theme = useTheme();
  const AlertSnackbar = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });

  useEffect(() => {
    fetch('http://localhost:3001/api/item-master')
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setLoading(false);
      });
  }, []);

  const handleOpenUpdate = (item) => {
    setEditItemId(item.ItemID);
    setMacNo(item.MacNo || '');
    setMinStock(item.MinStock || '');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditItemId(null);
    setMacNo('');
    setMinStock('');
  };

  const handleUpdateSubmit = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/item-master/${editItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ MacNo: macNo, MinStock: minStock }),
      });
      if (res.ok) {
        setMessage('อัปเดตสำเร็จ!');
        setMessageType('success');
        setSnackbarOpen(true);
        setTimeout(() => {
          setMessage('');
        }, 2000);
        setItems(items.map(item => 
          item.ItemID === editItemId ? { ...item, MacNo: macNo, MinStock: minStock } : item
        ));
        handleClose();
      } else {
        setMessage('อัปเดตไม่สำเร็จ');
        setMessageType('error');
        setSnackbarOpen(true);
        
      }      
    } catch (error) {
      console.error('Error updating:', error);
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/item-master/${deleteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMessage('ลบสำเร็จ!');
        setMessageType('success');
        setSnackbarOpen(true);
        setTimeout(() => {
          setMessage('');
        }, 2000);
        setItems(items.filter(item => item.ItemID !== deleteId));
      } else {
        const data = await res.json();
        setMessage(data.error || 'ลบไม่สำเร็จ');
        setMessageType('error');
        setSnackbarOpen(true);
        setTimeout(() => {
          setMessage('');
        }, 2000);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      setMessage('เกิดข้อผิดพลาดขณะลบ');
      setMessageType('error');
      setTimeout(() => {
        setMessage('');
      }, 2000);
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };
    

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 5, p: 2, marginTop: 10 }}>
      <Typography variant="h4" component="h2" gutterBottom align="center">
        รายการสินค้า (Item Master)
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          color="success"
          onClick={() => navigate('/InsertItem')}
        >
          Insert
        </Button>
      </Box>
      <TableContainer component={Paper} elevation={3} >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.secondary.main }}>
              <TableCell>ItemName</TableCell>
              <TableCell>SerialNo</TableCell>
              <TableCell>MacNo</TableCell>
              <TableCell>MinStock</TableCell>
              <TableCell>CategoryID</TableCell>
              <TableCell>Pic</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {items.map((item) => (
              <TableRow key={item.ItemID}>
                <TableCell>{item.ItemName?.trim()}</TableCell>
                <TableCell>{item.SerialNo}</TableCell>
                <TableCell>{item.MacNo}</TableCell>
                <TableCell>{item.MinStock}</TableCell>
                <TableCell>{item.CategoryID}</TableCell>
                <TableCell align="center">
                  {item.pic ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <CancelIcon color="disabled" />
                  )}
                </TableCell>
                <TableCell align="center">
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => handleOpenUpdate(item)}
                    sx={{ mr: 1 }}
                  >
                    Update
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => {
                      setDeleteId(item.ItemID);
                      setConfirmOpen(true);
                    }}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>ยืนยันการลบ</DialogTitle>
        <DialogContent>
          <Typography>คุณต้องการลบข้อมูลนี้หรือไม่?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>ยกเลิก</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            ลบ
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>แก้ไข</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="MacNo"
            fullWidth
            value={macNo}
            onChange={(e) => setMacNo(e.target.value)}
          />
          <TextField
            margin="dense"
            label="MinStock"
            type="number"
            fullWidth
            value={minStock}
            onChange={(e) => setMinStock(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleUpdateSubmit}>บันทึก</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
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

export default ItemMasterList;
