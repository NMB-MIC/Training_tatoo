import React from 'react';
import { Typography, Box } from '@mui/material';

function HomePage() {
  return (
    <Box sx={{ mt: 12, textAlign: 'center' }}>
      <Typography variant="h3" gutterBottom>
        หน้าหลัก (Home Page)
      </Typography>
      <Typography variant="body1">
        ยินดีต้อนรับสู่ระบบจัดการสินค้า
      </Typography>
    </Box>
  );
}

export default HomePage;
