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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

function ProductBalanceList() {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [qtyChange, setQtyChange] = useState();
  const [operationId, setOperationId] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const theme = useTheme();
  const AlertSnackbar = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    fetch('http://localhost:3001/api/product-balance')
      .then((res) => res.json())
      .then((data) => {
        setBalances(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching product balances:', error);
        setLoading(false);
      });
  };

  const handleEditClick = (item) => {
    setEditItem(item);
    setQtyChange(item.TotalReceiveQty);
    setOperationId('');
  };

  const handleUpdate = async () => {
    if (!operationId || !qtyChange) {
      alert('กรุณาเลือก Operation และใส่จำนวน');
      return;
    }
  
    const qtyChangeValue = parseInt(qtyChange);
  
    if (isNaN(qtyChangeValue)) {
      alert('กรุณากรอกจำนวนที่ถูกต้อง');
      return;
    }
  
    let reqty = 0;
    if (operationId === 1) {
      reqty = qtyChangeValue;
    } else if (operationId === 2 || operationId === 3) {
      reqty = qtyChangeValue * -1;
    }
  
    console.log(reqty, qtyChangeValue, operationId);
  
    try {
      const res = await fetch(`http://localhost:3001/api/product-balance-type`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: editItem.ItemID, 
          poNo: editItem.PO_No,
          doNo: editItem.Do_No,
          quantity: editItem.Quantity,
          orderDate: editItem.OrderDate || null,
          receiveDate: editItem.ReceiveDate || null,
          receiveQty: reqty,
          username: localStorage.getItem('username'),
          password: localStorage.getItem('password'),
          operationid: operationId
        })
      });
  
      if (res.ok) {
        setMessage('บันทึกข้อมูลใหม่สำเร็จ!');
        setMessageType('success');
        setSnackbarOpen(true);
        setEditItem(null);
        fetchData();
      } else {
        setMessage('บันทึกข้อมูลใหม่ไม่สำเร็จ');
        setMessageType('error');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error(err);
      setMessage('Server error');
      setMessageType('error');
      setSnackbarOpen(true);
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
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 5, p: 2, marginTop: 10 }}>
      <Typography variant="h4" component="h2" gutterBottom align="center">
        รายการคงเหลือสินค้า (Product Balance)
      </Typography>

      <TableContainer component={Paper} elevation={3}>
  <Table>
    <TableHead>
      <TableRow sx={{ bgcolor: theme.palette.secondary.main }}>
        <TableCell>Item Name</TableCell>
        <TableCell>PO No</TableCell>
        <TableCell>DO No</TableCell>
        <TableCell>Quantity</TableCell>
        <TableCell>Ordered Date</TableCell>
        <TableCell>Receive Date</TableCell>
        <TableCell>Receive Qty</TableCell>
        <TableCell>Diff Qty</TableCell>
        <TableCell>Registered</TableCell>
        <TableCell>Updated</TableCell>
        <TableCell>Action</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {balances.map((item) => (
        <TableRow key={item.ProductBalanceID}>
          <TableCell>{item.ItemName}</TableCell>
          <TableCell>{item.PO_No}</TableCell>
          <TableCell>{item.Do_No}</TableCell>
          <TableCell>{item.Quantity}</TableCell>
          <TableCell>{item.OrderDate ? new Date(item.OrderDate).toLocaleDateString() : '-'}</TableCell>
          <TableCell>{item.ReceiveDate ? new Date(item.ReceiveDate).toLocaleDateString() : '-'}</TableCell>
          <TableCell>{item.TotalReceiveQty}</TableCell>
          <TableCell>{item.TotalDiffQty}</TableCell>
          <TableCell>{new Date(item.registered_at).toLocaleString()}</TableCell>
          <TableCell>{new Date(item.updated_at).toLocaleString()}</TableCell>
          <TableCell>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleEditClick(item)}
            >
              แก้ไข
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>


      <Dialog open={!!editItem} onClose={() => setEditItem(null)}>
        <DialogTitle>แก้ไข Receive Qty</DialogTitle>
        <DialogContent>
          <TextField
            label="จำนวน"
            type="number"
            fullWidth
            value={qtyChange}
            onChange={(e) => setQtyChange(e.target.value)}
            sx={{ mt: 1 }}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Operation</InputLabel>
            <Select
              value={operationId}
              label="Operation"
              onChange={(e) => setOperationId(parseInt(e.target.value))}
            >
              <MenuItem value={1}>Stock In (+)</MenuItem>
              <MenuItem value={2}>Stock Out (-)</MenuItem>
              <MenuItem value={3}>Borrow (-)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditItem(null)}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleUpdate}>บันทึก</Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar Alert */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        <AlertSnackbar onClose={() => setSnackbarOpen(false)} severity={messageType} sx={{ width: '100%' }}>
          {message}
        </AlertSnackbar>
      </Snackbar>
    </Box>
  );
}

export default ProductBalanceList;
