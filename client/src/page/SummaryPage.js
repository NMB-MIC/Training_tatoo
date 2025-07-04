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
  CircularProgress,
} from '@mui/material';

function SummaryPage() {
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://192.168.100.124:3001/api/summary')
      .then((res) => res.json())
      .then((data) => {
        const updatedData = data.map((row) => ({
          ...row,
          totalQuantity:
            (Number(row.totalQuantity) || 0) +
            (Number(row.totalStockOut) || 0)
        }));
        setSummaryData(updatedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching summary:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5, marginTop: 30 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 5, marginTop: 10 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Summary Page
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell>Item Name</TableCell>
              <TableCell>Serial No</TableCell>
              <TableCell>Total Quantity</TableCell>
              <TableCell>Min Stock</TableCell>
              <TableCell>Diff Quantity</TableCell>
              <TableCell>Total Stock Out</TableCell>
              <TableCell>Total Borrow</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summaryData
              .filter((row) =>
                (Number(row.totalQuantity) || 0) > 0 ||
                (Number(row.diffQuantity) || 0) > 0 ||
                (Number(row.totalStockOut) || 0) > 0 ||
                (Number(row.totalBorrow) || 0) > 0
              )
              .map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.CategoryName}</TableCell>
                  <TableCell>{row.ItemName}</TableCell>
                  <TableCell>{row.SerialNo}</TableCell>
                  <TableCell>{Number(row.totalQuantity) || 0}</TableCell>
                  <TableCell>{Number(row.MinStock) || 0}</TableCell>
                  <TableCell>{Number(row.diffQuantity) || 0}</TableCell>
                  <TableCell>{Number(row.totalStockOut) || 0}</TableCell>
                  <TableCell>{Number(row.totalBorrow) || 0}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default SummaryPage;
