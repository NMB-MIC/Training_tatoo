import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReportIcon from '@mui/icons-material/Report';

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
        navigate('/PlanResult');
        break;
      case 2:
        navigate('/PreviewPlanPage');
        break;
      case 3:
        navigate('/Dashboard');
        break;
      case 4:
        navigate('/Report');
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
        <BottomNavigationAction label="Upload" icon={<HomeIcon />} />
        <BottomNavigationAction label="PlanResult" icon={<AssignmentIcon />} />
        <BottomNavigationAction label="PreviewPlan" icon={<AssignmentIcon />} />
        <BottomNavigationAction label="Dashboard" icon={<DashboardIcon />} />
        <BottomNavigationAction label="Report" icon={<ReportIcon />} /> 
      </BottomNavigation>
    </Paper>
  );
}

export default Navbar;
