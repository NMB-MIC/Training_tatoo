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
  TablePagination,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

function ProductLogList() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0); // สำหรับเลขหน้า
  const [rowsPerPage, setRowsPerPage] = useState(5); // จำนวนแถวต่อหน้า
  const theme = useTheme();

  useEffect(() => {
    fetch('http://localhost:3001/api/product-log')
      .then((res) => res.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching product logs:', error);
        setLoading(false);
      });
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage); // เปลี่ยนหน้า
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10)); // เปลี่ยนจำนวนแถวต่อหน้า
    setPage(0); // รีเซ็ตหน้าเป็นหน้าแรก
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1300, mx: 'auto', mt: 5, p: 2, marginTop: 10 }}>
      <Typography variant="h4" component="h2" gutterBottom align="center">
        ประวัติการทำงาน (Product Log)
      </Typography>

      <TableContainer component={Paper} elevation={3}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.secondary.main }}>
              <TableCell>ID</TableCell>
              <TableCell>ItemName</TableCell>
              <TableCell>Emp_No</TableCell>
              <TableCell>SerialNo</TableCell>
              <TableCell>MacNo</TableCell>
              <TableCell>PO No</TableCell>
              <TableCell>DO No</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Operation</TableCell>
              <TableCell>Issued Date</TableCell>
              <TableCell>Plan Return</TableCell>
              <TableCell>Registered</TableCell>
              <TableCell>Updated</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {logs
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((item) => (
                <TableRow key={item.ProductLogID}>
                  <TableCell>{item.ProductLogID}</TableCell>
                  <TableCell>{item.ItemName?.trim()}</TableCell>
                  <TableCell>{item.EMP_no}</TableCell>
                  <TableCell>{item.SerialNo}</TableCell>
                  <TableCell>{item.MacNo}</TableCell>
                  <TableCell>{item.PO_No}</TableCell>
                  <TableCell>{item.Do_No}</TableCell>
                  <TableCell>{item.Quantity}</TableCell>
                  <TableCell>{item.OperationName}</TableCell>
                  <TableCell>
                    {item.Issued_date ? new Date(item.Issued_date).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    {item.Plan_return ? new Date(item.Plan_return).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>{new Date(item.registered_at).toLocaleString()}</TableCell>
                  <TableCell>{new Date(item.updated_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Table Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]} // ตัวเลือกจำนวนแถวต่อหน้า
        component="div"
        count={logs.length} // จำนวนทั้งหมด
        rowsPerPage={rowsPerPage} // จำนวนแถวที่แสดงในแต่ละหน้า
        page={page} // หน้า
        onPageChange={handleChangePage} // เปลี่ยนหน้า
        onRowsPerPageChange={handleChangeRowsPerPage} // เปลี่ยนจำนวนแถวต่อหน้า
      />
    </Box>
  );
}

export default ProductLogList;
