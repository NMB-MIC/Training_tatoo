import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HistoryIcon from '@mui/icons-material/History';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import InventoryIcon from '@mui/icons-material/Inventory';

function Navbar() {
  const [value, setValue] = useState(0);
  const navigate = useNavigate();

  const handleChange = (event, newValue) => {
    setValue(newValue);

    switch (newValue) {
      case 0:
        navigate('/SummaryPage');
        break;
      case 1:
        navigate('/ProductBalanceList');
        break;
      case 2:
        navigate('/AddProductBalance');
        break;
      case 3:
        navigate('/ItemAvailableList');
        break;
      case 4:
        navigate('/BorrowList');
        break;
      case 5:
        navigate('/ProductLogList');
        break;
      case 6:
        navigate('/ManageMenu');
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
        <BottomNavigationAction label="เพิ่มสินค้า" icon={<AddCircleIcon />} />
        <BottomNavigationAction label="สินค้าพร้อมใช้" icon={<InventoryIcon />} />
        <BottomNavigationAction label="ยืม" icon={<AssignmentReturnIcon />} />
        <BottomNavigationAction label="ประวัติ" icon={<HistoryIcon />} />
        <BottomNavigationAction label="จัดการข้อมูล" icon={<SettingsIcon />} />
      </BottomNavigation>
    </Paper>
  );
}

export default Navbar;
