import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';

function ManageMenu() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('password');
    navigate('/login');
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 12, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        จัดการข้อมูล
      </Typography>
      <Button
        variant="contained"
        sx={{ m: 1 }}
        onClick={() => navigate('/ItemMasterList')}
      >
        รายการสินค้า
      </Button>
      <Button
        variant="contained"
        sx={{ m: 1 }}
        onClick={() => navigate('/CategoryList')}
      >
        หมวดหมู่
      </Button>
      <Button
        variant="contained"
        sx={{ m: 1 }}
        onClick={() => navigate('/OperationList')}
      >
        ประเภทการทำงาน
      </Button>
      <Box sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          color="error"
          onClick={handleLogout}
        >
          ออกจากระบบ
        </Button>
      </Box>
    </Box>
  );
}

export default ManageMenu;
