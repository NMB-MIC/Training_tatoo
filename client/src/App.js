// App.js ✅
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './navbar/Navbar';
import Login from './page/Login';
import ItemMasterList from './page/ItemMasterList';
import CategoryList from './page/CategoryList';
import OperationList from './page/OperationList';
import ProductBalanceList from './page/ProductBalanceList';
import ProductLogList from './page/ProductLogList';
import SummaryPage from './page/SummaryPage';
import AddProductBalance from './page/AddProductBalance';
import InsertItem from './page/InsertItem';
import InsertCategory from './page/InsertCategory';
import InsertOperation from './page/InsertOperation';
import Register from './page/Register';
import ManageMenu from './page/ManageMenu';
import BorrowList from './page/BorrowList';
import ItemAvailableList from './page/ItemAvailableList';

function App() {
  const location = useLocation();
  const hideNavbarPaths = ['/', '/login','/register'];

  return (
    <>
      {!hideNavbarPaths.includes(location.pathname) && <Navbar />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/SummaryPage" element={<SummaryPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/ItemMasterList" element={<ItemMasterList />} />
        <Route path="/CategoryList" element={<CategoryList />} />
        <Route path="/OperationList" element={<OperationList />} />
        <Route path="/ProductBalanceList" element={<ProductBalanceList />} />
        <Route path="/ProductLogList" element={<ProductLogList />} />
        <Route path="/AddProductBalance" element={<AddProductBalance />} />
        <Route path="/InsertItem" element={<InsertItem />} />
        <Route path="/InsertCategory" element={<InsertCategory />} />
        <Route path="/InsertOperation" element={<InsertOperation />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/ManageMenu" element={<ManageMenu />} />
        <Route path="/BorrowList" element={<BorrowList />} />
        <Route path="/ItemAvailableList" element={<ItemAvailableList />} />
      </Routes>
    </>
  );
}

export default App;
