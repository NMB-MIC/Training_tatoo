import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
const API_URL = process.env.REACT_APP_API_URL;

const AlertSnackbar = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function BorrowList() {
  const [borrowLogs, setBorrowLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const username = localStorage.getItem('username');
  const password = localStorage.getItem('password');

useEffect(() => {
  fetch(`${API_URL}/api/borrow-log`)
    .then((res) => res.json())
    .then((data) => {
      const onlyBorrowReturn = data.filter((item) => item.OperationID === 3 || item.OperationID === 4);

      const merged = onlyBorrowReturn.reduce((acc, curr) => {
        const found = acc.find((item) => item.ItemID === curr.ItemID);
        if (found) {
          found.Quantity += curr.Quantity;
        } else {
          acc.push({ ...curr });
        }
        return acc;
      }, []);

      const filtered = merged.filter((item) => item.Quantity !== 0);

      setBorrowLogs(filtered);
      setLoading(false);
    })
    .catch((err) => {
      console.error('Error fetching borrow logs:', err);
      setLoading(false);
    });
}, []);



const handleReturn = async (item) => {
    try {
      const res = await fetch(`${API_URL}/api/return-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.ItemID,
          quantity: (item.Quantity)*-1,
          username,
          password,
        }),

      });

      if (res.ok) {
        setMessage('บันทึกการคืนสำเร็จ!');
        setMessageType('success');
        setSnackbarOpen(true);

        setBorrowLogs((prev) =>
          prev.filter((log) => log.ProductLogID !== item.ProductLogID)
        );
      } else {
        setMessage('บันทึกการคืนไม่สำเร็จ');
        setMessageType('error');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Error returning:', err);
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
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 5, marginTop: 10}}>
      <Typography variant="h4" align="center" gutterBottom>
        Borrow List (รายการยืม)
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell>Item Name</TableCell>
              <TableCell>Serial No</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Mac No</TableCell>
              <TableCell>Returned</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {borrowLogs.map((log) => (
              <TableRow key={log.ProductLogID}>
                <TableCell>{log.CategoryName}</TableCell>
                <TableCell>{log.ItemName}</TableCell>
                <TableCell>{log.SerialNo}</TableCell>
                <TableCell>{log.Quantity}</TableCell>
                <TableCell>{log.MacNo}</TableCell>
                <TableCell>
                  <Checkbox
                    checked={log.returned || false}
                    disabled={log.returned}
                    onChange={() => handleReturn(log)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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

export default BorrowList;
