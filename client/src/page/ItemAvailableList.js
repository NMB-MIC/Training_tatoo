import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
const API_URL = process.env.REACT_APP_API_URL;

function ItemAvailableList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [qty, setQty] = useState('');
  const [operationType, setOperationType] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const AlertSnackbar = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });

  useEffect(() => {
    fetch(`${API_URL}/product-balance2`)
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching items:', error);
        setLoading(false);
      });
  }, []);

  const handleActionClick = (item, type) => {
    setSelectedItem(item);
    setOperationType(type);
    setQty('');
  };

  const handleSubmit = async () => {
    if (!qty) {
      alert('กรุณาใส่จำนวน');
      return;
    }

    const qtyValue = parseInt(qty);

    if (isNaN(qtyValue) || qtyValue <= 0) {
      alert('กรุณาใส่จำนวนที่ถูกต้อง');
      return;
    }

    if (qtyValue > selectedItem.TotalReceiveQty) {
      alert('จำนวนเกินกว่าที่มีอยู่');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/product-balance-type`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItem.ItemID,
          poNo: selectedItem.PO_No,
          doNo: selectedItem.Do_No,
          quantity: selectedItem.Quantity,
          orderDate: selectedItem.OrderDate,
          receiveDate: selectedItem.ReceiveDate,
          receiveQty: qtyValue * -1,
          username: localStorage.getItem('username'),
          password: localStorage.getItem('password'),
          operationid: operationType
        })
      });

      if (res.ok) {
        setMessage('บันทึกข้อมูลสำเร็จ');
        setMessageType('success');
        setSnackbarOpen(true);
        setSelectedItem(null);
        fetch(`${API_URL}/product-balance2`)
          .then((res) => res.json())
          .then((data) => setItems(data))
          .catch((error) => console.error('Error fetching items:', error));
      } else {
        setMessage('บันทึกข้อมูลไม่สำเร็จ');
        setMessageType('error');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error(err);
      setMessage('เกิดข้อผิดพลาด');
      setMessageType('error');
      setSnackbarOpen(true);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        กำลังโหลด...
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 5, marginTop: 10 }}>
      <Typography variant="h4" align="center" gutterBottom>
        รายการสินค้าคงเหลือ (Available Items)
      </Typography>

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item Name</TableCell>
              <TableCell>PO No</TableCell>
              <TableCell>DO No</TableCell>
              <TableCell align="center">คงเหลือ</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
        <TableBody>
        {items
            .filter((item) => item.TotalReceiveQty > 0)
            .map((item) => (
            <TableRow key={item.ProductBalanceID}>
                <TableCell>{item.ItemName}</TableCell>
                <TableCell>{item.PO_No}</TableCell>
                <TableCell>{item.Do_No}</TableCell>
                <TableCell align="center">{item.TotalReceiveQty}</TableCell>
                <TableCell align="center">
                <Button
                    variant="outlined"
                    size="small"
                    color="warning"
                    sx={{ mr: 1 }}
                    onClick={() => handleActionClick(item, 2)}
                >
                    Stock Out
                </Button>
                <Button
                    variant="outlined"
                    size="small"
                    color="secondary"
                    onClick={() => handleActionClick(item, 3)}
                >
                    Borrow
                </Button>
                </TableCell>
            </TableRow>
            ))}
        </TableBody>
        </Table>
      </TableContainer>


      <Dialog open={!!selectedItem} onClose={() => setSelectedItem(null)}>
        <DialogTitle>{operationType === 2 ? 'Stock Out' : 'Borrow'}</DialogTitle>
        <DialogContent>
          <TextField
            label="จำนวน"
            type="number"
            fullWidth
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedItem(null)}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSubmit}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

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

export default ItemAvailableList;
