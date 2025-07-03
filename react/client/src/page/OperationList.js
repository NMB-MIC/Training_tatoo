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

function OperationList() {
  const navigate = useNavigate();
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    fetch('http://localhost:3001/api/operation')
      .then((res) => res.json())
      .then((data) => {
        setOperations(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching operations:', error);
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
        รายการประเภทการทำงาน (Operation Types)
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          color="success"
          onClick={() => navigate('/InsertOperation')}
        >
          Insert
        </Button>
      </Box>
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.secondary.main }}>
              <TableCell>ชื่อประเภท</TableCell>
              <TableCell>วันที่เพิ่ม</TableCell>
              <TableCell>อัปเดตล่าสุด</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {operations.map((op) => (
              <TableRow key={op.OperationID}>
                <TableCell>{op.OperationName?.trim()}</TableCell>
                <TableCell>{new Date(op.registered_at).toLocaleString()}</TableCell>
                <TableCell>{new Date(op.updated_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default OperationList;
