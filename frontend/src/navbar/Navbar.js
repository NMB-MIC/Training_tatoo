import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIcon from '@mui/icons-material/Assignment';


function Navbar() {
  const [value, setValue] = useState(0);
  const navigate = useNavigate();

  const handleChange = (event, newValue) => {
    setValue(newValue);

    switch (newValue) {
      case 0:
        navigate('/UploadExcel');
        break;
      case 1:
        navigate('/CheckParentPartPage');
        break;
      case 2:
        navigate('/RequireTurningPage');
        break;
      default:
        break;
    }
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        margin: 0,
        borderRadius: 0,
        zIndex: 1300
      }}
      elevation={3}
    >
      <BottomNavigation value={value} onChange={handleChange} showLabels>
        <BottomNavigationAction label="หน้าแรก" icon={<HomeIcon />} />
        <BottomNavigationAction label="คงเหลือสินค้า" icon={<AssignmentIcon />} />
        <BottomNavigationAction label="123" icon={<AssignmentIcon />} />
      </BottomNavigation>
    </Paper>
  );
}

export default Navbar;
