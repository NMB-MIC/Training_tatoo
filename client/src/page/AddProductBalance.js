import { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
} from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL;

function AddProductBalance() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [poNo, setPoNo] = useState('');
  const [doNo, setDoNo] = useState('');
  const [quantity, setQuantity] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [receiveDate, setReceiveDate] = useState('');
  const [receiveQty, setReceiveQty] = useState('');
  const username = localStorage.getItem('username');
  const password = localStorage.getItem('password');

  useEffect(() => {
    fetch(`${API_URL}/api/item-master`)
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
      })
      .catch((error) => {
        console.error('Error fetching items:', error);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newData = {
      username,
      password,
      itemId: selectedItem,
      poNo,
      doNo,
      quantity,
      orderDate,
      receiveDate,
      receiveQty,
    };

    try {
      const res = await fetch(`${API_URL}/api/product-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });

      if (res.ok) {
        alert('เพิ่มข้อมูลสำเร็จ!');
      
        setSelectedItem('');
        setPoNo('');
        setDoNo('');
        setQuantity('');
        setOrderDate('');
        setReceiveDate('');
        setReceiveQty('');
      } else {
        alert('เพิ่มข้อมูลไม่สำเร็จ');
      }
      
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 800,
        mx: 'auto',
        mt: 12,
        p: 3,
        borderRadius: 2,
        boxShadow: 3,
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="h5" align="center" gutterBottom>
        เพิ่มข้อมูลคงเหลือสินค้า
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Item Name</InputLabel>
              <Select
                value={selectedItem}
                label="Item Name"
                onChange={(e) => setSelectedItem(e.target.value)}
                required
              >
                {items.map((item) => (
                  <MenuItem key={item.ItemID} value={item.ItemID}>
                    {item.ItemName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              label="PO No"
              value={poNo}
              onChange={(e) => setPoNo(e.target.value)}
              sx={{ mt: 2  }}
            />

            <TextField
              fullWidth
              size="small"
              label="DO No"
              value={doNo}
              onChange={(e) => setDoNo(e.target.value)}
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              size="small"
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              sx={{ mt: 2 }}
              required
            />

            <TextField
              fullWidth
              size="small"
              label="Ordered Date"
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mt: 2 }}
            />

            <TextField
              fullWidth
              size="small"
              label="Receive Date"
              type="date"
              value={receiveDate}
              onChange={(e) => setReceiveDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mt: 2 }}
            />

            <TextField
              fullWidth
              size="small"
              label="Receive Qty"
              type="number"
              value={receiveQty}
              onChange={(e) => setReceiveQty(e.target.value)}
              sx={{ mt: 2 }}
            />
          </Grid>
        </Grid>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 3 }}
        >
          บันทึก
        </Button>
      </form>
    </Box>
  );
}

export default AddProductBalance;
