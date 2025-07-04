const express = require('express');
const app = express();
const cors = require('cors');
const sql = require('mssql');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dbUser = process.env.DB_USER || 'sa';
const dbPassword = process.env.DB_PASSWORD || 'DmX08775416421';
const dbServer = process.env.DB_SERVER || 'db';
const dbDatabase = process.env.DB_DATABASE || 'stock_t';
const ensureDatabaseAndTables = require('./initDb');

app.use(cors()); 
app.use(express.json()); 

const masterConfig = {
  user: dbUser,
  password: dbPassword,
  server: dbServer,
  database: 'master',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

const config = {
  user: dbUser,
  password: dbPassword,
  server: dbServer,
  database: dbDatabase,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

(async () => {
  try {
    await ensureDatabaseAndTables();
    app.listen(3001, () => {
      console.log('Backend running on port 3001');
    });
  } catch (err) {
    console.error('❌ Server start failed:', err);
  }
})();


app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    await sql.connect(config);

    const result = await sql.query`
      SELECT * FROM [user] 
      WHERE UserName = ${username} AND Password = ${password}
    // `;

    if (result.recordset.length > 0) {
      res.json({ success: true, username: result.recordset[0].UserName,  password: result.recordset[0].Password });
    } else {
      res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

  } catch (err) {
    console.error('Login SQL error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});
app.post('/api/register', async (req, res) => {
  const { emp_no, username, password } = req.body;

  try {
    await sql.connect(config);

    // ตรวจสอบว่าชื่อซ้ำหรือไม่
    const checkResult = await sql.query`
      SELECT * FROM [user] WHERE EMP_no = ${emp_no}
    `;

    if (checkResult.recordset.length > 0) {
      return res.status(400).json({ error: 'มีผู้ใช้นี้อยู่แล้ว' });
    }

    await sql.query`
      INSERT INTO [user] (EMP_no, UserName, Password, registered_at, updated_at)
      VALUES (${emp_no}, ${username}, ${password}, GETDATE(), GETDATE())
    `;

    res.status(200).json({ message: 'ลงทะเบียนสำเร็จ' });
  } catch (err) {
    console.error('SQL error (register):', err);
    res.status(500).json({ error: 'Database error' });
  }
});


app.get('/api/item-master', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query(`
      SELECT 
        im.ItemID, 
        im.ItemName, 
        im.SerialNo, 
        im.MacNo, 
        im.MinStock, 
        im.CategoryID, 
        c.CategoryName, 
        im.registered_at, 
        im.updated_at, 
        im.pic
      FROM itemMaster im
      LEFT JOIN Category c ON im.CategoryID = c.CategoryID
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/item-master/:id', async (req, res) => {
  const { id } = req.params;
  const { MacNo, MinStock } = req.body;

  try {
    await sql.connect(config);
    await sql.query`
      UPDATE itemMaster 
      SET MacNo = ${MacNo}, MinStock = ${MinStock}, updated_at = GETDATE()
      WHERE ItemID = ${id}
    `;
    res.status(200).json({ message: 'Updated successfully' });
  } catch (err) {
    console.error('SQL error (update item):', err);
    res.status(500).json({ error: 'Database error' });
  }
});
app.delete('/api/item-master/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await sql.connect(config);

    // ✅ ตรวจสอบก่อนว่ามีใน ProductBalance หรือไม่
    const balanceCheck = await sql.query`
      SELECT COUNT(*) AS countCheck 
      FROM ProductBalance 
      WHERE ItemID = ${id}
    `;

    const count = balanceCheck.recordset[0].countCheck;

    if (count > 0) {
      // ถ้ามีใน ProductBalance ไม่อนุญาตให้ลบ
      return res.status(400).json({ error: 'ไม่สามารถลบได้: มีข้อมูลใน ProductBalance' });
    }

    // ✅ ถ้าไม่มี สามารถลบได้
    await sql.query`
      DELETE FROM itemMaster WHERE ItemID = ${id}
    `;

    res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('SQL error (delete item):', err);
    res.status(500).json({ error: 'Database error' });
  }
});
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });
app.post('/api/item-master', upload.single('pic'), async (req, res) => {
  const { ItemName, SerialNo, MacNo, MinStock, CategoryID } = req.body;
  const pic = req.file ? req.file.filename : null;

  try {
    await sql.connect(config);
    await sql.query`
      INSERT INTO itemMaster
      (ItemName, SerialNo, MacNo, MinStock, CategoryID, registered_at, updated_at, pic)
      VALUES
      (${ItemName}, ${SerialNo}, ${MacNo}, ${MinStock}, ${CategoryID}, GETDATE(), GETDATE(), ${pic})
    `;

    res.status(200).json({ message: 'เพิ่มข้อมูลสำเร็จ' });
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


app.get('/api/category', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query(`
      SELECT [CategoryID], [CategoryName], [registered_at], [updated_at]
      FROM Category
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error (category):', err);
    res.status(500).json({ error: 'Database error' });
  }
});
app.post('/api/category', async (req, res) => {
  const { CategoryName } = req.body;

  try {
    await sql.connect(config);

    await sql.query`
      INSERT INTO Category
      (CategoryName, registered_at, updated_at)
      VALUES
      (${CategoryName}, GETDATE(), GETDATE())
    `;

    res.status(200).json({ message: 'เพิ่มหมวดหมู่สำเร็จ' });
  } catch (err) {
    console.error('SQL error (insert category):', err);
    res.status(500).json({ error: 'Database error' });
  }
});


app.get('/api/operation', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query(`
      SELECT [OperationID], [OperationName], [registered_at], [updated_at]
      FROM OperationType
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error (operation):', err);
    res.status(500).json({ error: 'Database error' });
  }
});
app.post('/api/operation', async (req, res) => {
  const { OperationName } = req.body;

  try {
    await sql.connect(config);

    await sql.query`
      INSERT INTO OperationType
      (OperationName, registered_at, updated_at)
      VALUES
      (${OperationName}, GETDATE(), GETDATE())
    `;

    res.status(200).json({ message: 'เพิ่มประเภทการทำงานสำเร็จ' });
  } catch (err) {
    console.error('SQL error (insert operation):', err);
    res.status(500).json({ error: 'Database error' });
  }
});


app.get('/api/product-balance', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query(`
      SELECT 
          MIN(pb.ProductBalanceID) AS ProductBalanceID,
          pb.ItemID, 
          im.ItemName,  
          pb.PO_No, 
          pb.Do_No, 
          pb.Quantity, 
          SUM(CASE WHEN pb.ReceiveQty > 0 THEN pb.ReceiveQty ELSE 0 END) AS TotalReceiveQty,  
          (pb.Quantity - SUM(CASE WHEN pb.ReceiveQty > 0 THEN pb.ReceiveQty ELSE 0 END)) AS TotalDiffQty,
          MIN(pb.OrderDate) AS OrderDate,  
          MIN(pb.ReceiveDate) AS ReceiveDate,  
          MIN(pb.registered_at) AS registered_at,
          MAX(pb.updated_at) AS updated_at
      FROM 
          ProductBalance pb
      LEFT JOIN 
          itemMaster im ON pb.ItemID = im.ItemID  
      GROUP BY 
          pb.ItemID, 
          im.ItemName,  
          pb.PO_No, 
          pb.Do_No, 
          pb.Quantity;
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error (product balance):', err);
    res.status(500).json({ error: 'Database error' });
  }
});
app.get('/api/product-log', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query(`
      SELECT 
        pl.ProductLogID, 
        pl.ItemID, 
        pl.ItemName, 
        pl.SerialNo, 
        pl.MacNo, 
        pl.PO_No, 
        pl.Do_No, 
        pl.Quantity, 
        pl.OperationID, 
        ot.OperationName,
        pl.Issued_date, 
        pl.Plan_return, 
        pl.registered_at, 
        pl.updated_at,
        e.EmpID,
        e.EMP_no
      FROM ProductLog pl
      LEFT JOIN OperationType ot ON pl.OperationID = ot.OperationID
      LEFT JOIN [user] e ON pl.EmpID = e.EmpID
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error (product log):', err);
    res.status(500).json({ error: 'Database error' });
  }
});
app.get('/api/product-balance2', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query(`
      SELECT 
          MIN(pb.ProductBalanceID) AS ProductBalanceID,
          pb.ItemID, 
          im.ItemName,  
          pb.PO_No, 
          pb.Do_No, 
          pb.Quantity, 
          SUM(pb.ReceiveQty) AS TotalReceiveQty,  
          (pb.Quantity - SUM(ReceiveQty)) AS TotalDiffQty,
          MIN(pb.OrderDate) AS OrderDate,  
          MIN(pb.ReceiveDate) AS ReceiveDate,  
          MIN(pb.registered_at) AS registered_at,
          MAX(pb.updated_at) AS updated_at
      FROM 
          ProductBalance pb
      LEFT JOIN 
          itemMaster im ON pb.ItemID = im.ItemID  
      GROUP BY 
          pb.ItemID, 
          im.ItemName,  
          pb.PO_No, 
          pb.Do_No, 
          pb.Quantity;
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error (product balance):', err);
    res.status(500).json({ error: 'Database error' });
  }
});



app.post('/api/product-balance', async (req, res) => {
  const { username, password, itemId, poNo, doNo, quantity, orderDate, receiveDate, receiveQty } = req.body;

  try {
    await sql.connect(config);

    const empResult = await sql.query`
      SELECT EmpID 
      FROM [user]
      WHERE UserName = ${username} AND Password = ${password}
    `;

    if (empResult.recordset.length === 0) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    const empId = empResult.recordset[0].EmpID;

    const itemResult = await sql.query`
      SELECT TOP 1 ItemName, SerialNo, MacNo 
      FROM itemMaster
      WHERE ItemID = ${itemId}
    `;

    const item = itemResult.recordset[0];

    const diffQuantity = quantity - receiveQty;

    if (diffQuantity < 0) {
      return res.status(400).json({ error: 'diffQuantity cannot be negative' });
    }

    await sql.query`
      INSERT INTO ProductBalance 
      (ItemID, EmpID, Quantity, PO_No, Do_No, OrderDate, ReceiveDate, ReceiveQty, diffQuantity, registered_at, updated_at)
      VALUES 
      (${itemId}, ${empId}, ${quantity}, ${poNo}, ${doNo}, ${orderDate}, ${receiveDate}, ${receiveQty}, ${diffQuantity}, GETDATE(), GETDATE())
    `;

    await sql.query`
      INSERT INTO ProductLog
      (ItemID, ItemName, SerialNo, MacNo, PO_No, Do_No, Quantity, OperationID, EmpID, Issued_date, Plan_return, registered_at, updated_at)
      VALUES
      (
        ${itemId},
        ${item.ItemName},
        ${item.SerialNo},
        ${item.MacNo},
        ${poNo},
        ${doNo},
        ${receiveQty},
        1,               -- OperationID = 1 (Stock in)
        ${empId},
        ${orderDate},
        ${receiveDate},
        GETDATE(),
        GETDATE()
      )
    `;

    res.status(200).json({ message: 'Inserted successfully and log created' });
  } catch (err) {
    console.error('SQL error (insert product balance & log):', err);
    res.status(500).json({ error: 'Database error' });
  }
});
app.post('/api/product-balance-type', async (req, res) => {
  const { username, password, itemId, poNo, doNo, quantity, orderDate, receiveDate, receiveQty,operationid } = req.body;

  try {
    await sql.connect(config);

    const empResult = await sql.query`
      SELECT EmpID 
      FROM [user]
      WHERE UserName = ${username} AND Password = ${password}
    `;

    if (empResult.recordset.length === 0) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    const empId = empResult.recordset[0].EmpID;

    const itemResult = await sql.query`
      SELECT TOP 1 ItemName, SerialNo, MacNo 
      FROM itemMaster
      WHERE ItemID = ${itemId}
    `;

    const item = itemResult.recordset[0];

    const diffQuantity = quantity - receiveQty;

    if (diffQuantity < 0) {
      return res.status(400).json({ error: 'diffQuantity cannot be negative' });
    }

    await sql.query`
      INSERT INTO ProductBalance 
      (ItemID, EmpID, Quantity, PO_No, Do_No, OrderDate, ReceiveDate, ReceiveQty, diffQuantity, registered_at, updated_at)
      VALUES 
      (${itemId}, ${empId}, ${quantity}, ${poNo}, ${doNo}, ${orderDate}, ${receiveDate}, ${receiveQty}, ${diffQuantity}, GETDATE(), GETDATE())
    `;

    await sql.query`
      INSERT INTO ProductLog
      (ItemID, ItemName, SerialNo, MacNo, PO_No, Do_No, Quantity, OperationID, EmpID, Issued_date, Plan_return, registered_at, updated_at)
      VALUES
      (
        ${itemId},
        ${item.ItemName},
        ${item.SerialNo},
        ${item.MacNo},
        ${poNo},
        ${doNo},
        ${receiveQty},
        ${operationid},
        ${empId},
        ${orderDate},
        ${receiveDate},
        GETDATE(),
        GETDATE()
      )
    `;

    res.status(200).json({ message: 'Inserted successfully and log created' });
  } catch (err) {
    console.error('SQL error (insert product balance & log):', err);
    res.status(500).json({ error: 'Database error' });
  }
});
app.get('/api/product-balance-remaining', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query(`
      SELECT 
          MIN(pb.ProductBalanceID) AS ProductBalanceID,
          pb.ItemID, 
          im.ItemName,  
          pb.PO_No, 
          pb.Do_No, 
          pb.Quantity, 
          SUM(CASE WHEN pb.ReceiveQty > 0 THEN pb.ReceiveQty ELSE 0 END) AS TotalReceiveQty,  
          (pb.Quantity - SUM(CASE WHEN pb.ReceiveQty > 0 THEN pb.ReceiveQty ELSE 0 END)) AS TotalDiffQty,  
          MIN(pb.OrderDate) AS OrderDate,  
          MIN(pb.ReceiveDate) AS ReceiveDate,  
          MIN(pb.registered_at) AS registered_at,
          MAX(pb.updated_at) AS updated_at
      FROM 
          ProductBalance pb
      LEFT JOIN 
          itemMaster im ON pb.ItemID = im.ItemID  
      GROUP BY 
          pb.ItemID, 
          im.ItemName,  
          pb.PO_No, 
          pb.Do_No, 
          pb.Quantity;
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error (product balance remaining):', err);
    res.status(500).json({ error: 'Database error' });
  }
});


app.get('/api/summary', async (req, res) => {
  try {
    await sql.connect(config);

    const result = await sql.query(`
      SELECT 
        im.ItemID,
        c.CategoryName,
        im.ItemName,
        im.SerialNo,
        im.MinStock,
        ISNULL(pb.Quantity, 0) AS Quantity,

        -- Receive Qty (Stock In)
        ISNULL((
          SELECT SUM(pl.Quantity)
          FROM ProductLog pl
          WHERE pl.ItemID = im.ItemID AND pl.OperationID = 1
        ), 0) AS totalReceiveQty,

        -- Stock Out
        ISNULL((
          SELECT SUM(pl.Quantity)
          FROM ProductLog pl
          WHERE pl.ItemID = im.ItemID AND pl.OperationID = 2
        ), 0) AS totalStockOut,

        -- Borrow + Return
        ISNULL((
          SELECT SUM(pl.Quantity)
          FROM ProductLog pl
          WHERE pl.ItemID = im.ItemID AND pl.OperationID IN (3, 4)
        ), 0) AS totalBorrow,

        -- Diff Quantity
        ISNULL(pb.Quantity, 0) - ISNULL((
          SELECT SUM(pl.Quantity)
          FROM ProductLog pl
          WHERE pl.ItemID = im.ItemID AND pl.OperationID = 1
        ), 0) AS diffQuantity

      FROM itemMaster im
      LEFT JOIN Category c ON im.CategoryID = c.CategoryID
      LEFT JOIN ProductBalance pb ON im.ItemID = pb.ItemID
      GROUP BY im.ItemID, c.CategoryName, im.ItemName, im.SerialNo, im.MinStock, pb.Quantity
    `);

    // คำนวณ Total Quantity ตามสูตร
    const data = result.recordset.map(row => ({
      ...row,
      totalQuantity: (row.totalReceiveQty || 0) + (row.totalBorrow || 0) + (row.totalReturn || 0),
    }));

    res.json(data);
  } catch (err) {
    console.error('SQL error (summary):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/borrow-log', async (req, res) => {
  try {
    await sql.connect(config);

    const result = await sql.query(`
    SELECT 
      pl.ProductLogID,
      pl.ItemID,
      pl.Quantity,
      pl.OperationID,
      pl.EmpID,
      pl.Issued_date,
      pl.Plan_return,
      pl.registered_at,
      pl.updated_at,
      im.ItemName,
      im.SerialNo,
      im.MacNo,
      c.CategoryName,
      ISNULL((
        SELECT SUM(pl2.Quantity)
        FROM ProductLog pl2
        WHERE pl2.ItemID = pl.ItemID AND pl2.OperationID IN (3, 4)
      ), 0) AS totalBorrow
    FROM ProductLog pl
    LEFT JOIN itemMaster im ON pl.ItemID = im.ItemID
    LEFT JOIN Category c ON im.CategoryID = c.CategoryID
    WHERE pl.OperationID = 3 OR pl.OperationID = 4

    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error (borrow-log):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/return-log', async (req, res) => {
  const { itemId, quantity, username, password, poNo, doNo, macNo } = req.body;

  try {
    await sql.connect(config);

    // 🔎 Query หา EmpID
    const empResult = await sql.query`
      SELECT EmpID 
      FROM [user]
      WHERE UserName = ${username} AND Password = ${password}
    `;
    if (empResult.recordset.length === 0) {
      return res.status(401).json({ error: 'Invalid user' });
    }
    const empId = empResult.recordset[0].EmpID;

    // 🔎 Query หา ItemName, SerialNo, MacNo จาก itemMaster
    const itemResult = await sql.query`
      SELECT TOP 1 ItemName, SerialNo, MacNo
      FROM itemMaster
      WHERE ItemID = ${itemId}
    `;
    if (itemResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const { ItemName, SerialNo, MacNo } = itemResult.recordset[0];

    // ✅ Insert เข้า ProductLog
    await sql.query`
      INSERT INTO ProductLog
        (ItemID, ItemName, SerialNo, MacNo, PO_No, Do_No, Quantity, OperationID, EmpID, Issued_date, registered_at, updated_at)
      VALUES
        (${itemId}, ${ItemName}, ${SerialNo}, ${MacNo || macNo}, ${poNo}, ${doNo}, ${quantity}, 4, ${empId}, GETDATE(), GETDATE(), GETDATE())
    `;

    res.json({ success: true });
  } catch (err) {
    console.error('SQL error (return-log):', err);
    res.status(500).json({ error: 'Database error' });
  }
});





app.listen(3001, () => {
  console.log('Backend running on port 3001');
});
// INSERT INTO itemMaster (ItemName, SerialNo, MacNo, MinStock, CategoryID, registered_at, updated_at)
// VALUES 
// ('SMM001', 'br-01', NULL, 2, 1, GETDATE(), GETDATE()),
// ('Computer', 'sv-01', NULL, 4, 2, GETDATE(), GETDATE()),
// ('SMM001-cover', 'br-02', NULL, 2, 1, GETDATE(), GETDATE()),
// ('SMM001A', 'br-03', NULL, 3, 1, GETDATE(), GETDATE()),
// ('SMM001A-cover', 'br-04', NULL, 1, 1, GETDATE(), GETDATE()),
// ('SMM002', 'br-05', NULL, 4, 1, GETDATE(), GETDATE()),
// ('SMM002-cover', 'br-06', NULL, 3, 1, GETDATE(), GETDATE()),
// ('SMM002A', 'br-07', NULL, 5, 1, GETDATE(), GETDATE()),
// ('SMM002A-cover', 'br-08', NULL, 5, 1, GETDATE(), GETDATE()),
// ('SMM003', 'br-09', NULL, 4, 1, GETDATE(), GETDATE()),
// ('SMM003-cover', 'br-10', NULL, 3, 1, GETDATE(), GETDATE()),
// ('IRC-001A', 'br-11', NULL, 1, 1, GETDATE(), GETDATE()),
// ('IRC-001A-cover', 'br-12', NULL, 1, 1, GETDATE(), GETDATE())
