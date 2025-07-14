// App.js ✅
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './navbar/Navbar';
import Login from './page/Login';
import UploadExcel from './page/UploadExcel';
import CheckParentPartPage from './page/CheckParentPartPage';
import RequireTurningPage from './page/RequireTurningPage';

function App() {
  const location = useLocation();
  const hideNavbarPaths = ['/login','/register'];

  return (
    <>
      {!hideNavbarPaths.includes(location.pathname) && <Navbar />}
      <Routes>
        <Route path="/" element={<UploadExcel />} />
        <Route path="/UploadExcel" element={<UploadExcel />} />
        <Route path="/CheckParentPartPage" element={<CheckParentPartPage />} />
        <Route path="/RequireTurningPage" element={<RequireTurningPage />} />      
      </Routes>
    </>
  );
}

export default App;
