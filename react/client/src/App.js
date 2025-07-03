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
import HomePage from './page/HomePage';
import AddProductBalance from './page/AddProductBalance';
import InsertItem from './page/InsertItem';
import InsertCategory from './page/InsertCategory';
import InsertOperation from './page/InsertOperation';
import Register from './page/Register';

function App() {
  const location = useLocation();
  const hideNavbarPaths = ['/', '/login','/register'];

  return (
    <>
      {!hideNavbarPaths.includes(location.pathname) && <Navbar />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/HomePage" element={<HomePage />} />
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
      </Routes>
    </>
  );
}

export default App;
