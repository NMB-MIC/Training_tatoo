import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import CategoryIcon from '@mui/icons-material/Category';
import InventoryIcon from '@mui/icons-material/Inventory';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HistoryIcon from '@mui/icons-material/History';
import AddCircleIcon from '@mui/icons-material/AddCircle';

function Navbar() {
  const [value, setValue] = useState(0);
  const navigate = useNavigate();

  const handleChange = (event, newValue) => {
    setValue(newValue);

    switch (newValue) {
      case 0:
        navigate('/HomePage');
        break;
      case 1:
        navigate('/ItemMasterList');
        break;
      case 2:
        navigate('/CategoryList');
        break;
      case 3:
        navigate('/OperationList');
        break;
      case 4:
        navigate('/ProductBalanceList');
        break;
      case 5:
        navigate('/ProductLogList');
        break;
      case 6:
        navigate('/AddProductBalance');
        break;
      case 7:
        localStorage.removeItem('username');
        localStorage.removeItem('password');
        navigate('/login');
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
      <BottomNavigation
        value={value}
        onChange={handleChange}
        showLabels
      >
        <BottomNavigationAction label="หน้าแรก" icon={<HomeIcon />} />
        <BottomNavigationAction label="รายการสินค้า" icon={<InventoryIcon />} />
        <BottomNavigationAction label="หมวดหมู่" icon={<CategoryIcon />} />
        <BottomNavigationAction label="ประเภทการทำงาน" icon={<WorkspacesIcon />} />
        <BottomNavigationAction label="คงเหลือสินค้า" icon={<AssignmentIcon />} />
        <BottomNavigationAction label="ประวัติการทำงาน" icon={<HistoryIcon />} />
        <BottomNavigationAction label="เพิ่มสินค้า" icon={<AddCircleIcon />} />
        <BottomNavigationAction label="ออกจากระบบ" icon={<LogoutIcon />} />
      </BottomNavigation>
    </Paper>
  );
}

export default Navbar;
