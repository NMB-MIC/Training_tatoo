// src/page/CategoryList.js
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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

function CategoryList() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    fetch('http://localhost:3001/api/category') // 🔁 แก้ URL ให้ตรงกับ backend
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching categories:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 5, p: 2, marginTop: 10 }}>
      <Typography variant="h4" component="h2" gutterBottom align="center">
        รายการหมวดหมู่สินค้า
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          color="success"
          onClick={() => navigate('/InsertCategory')}
        >
          Insert
        </Button>
      </Box>
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.secondary.main }}>
              <TableCell>ชื่อหมวดหมู่</TableCell>
              <TableCell>วันที่เพิ่ม</TableCell>
              <TableCell>อัปเดตล่าสุด</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.CategoryID}>
                <TableCell>{cat.CategoryName?.trim()}</TableCell>
                <TableCell>{new Date(cat.registered_at).toLocaleString()}</TableCell>
                <TableCell>{new Date(cat.updated_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default CategoryList;
