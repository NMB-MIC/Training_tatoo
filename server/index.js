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

app.use(cors());
app.use(express.json());

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

async function ensureTables() {
  try {
    await sql.connect(config);

    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user' AND xtype='U')
      CREATE TABLE [user] (
        EmpID INT IDENTITY(1,1) PRIMARY KEY,
        EMP_no VARCHAR(20) NOT NULL,
        UserName VARCHAR(50) NOT NULL,
        Password VARCHAR(50) NOT NULL,
        registered_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      )
    `);

    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Category' AND xtype='U')
      CREATE TABLE Category (
        CategoryID INT IDENTITY(1,1) PRIMARY KEY,
        CategoryName VARCHAR(100),
        registered_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      )
    `);

    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='itemMaster' AND xtype='U')
      CREATE TABLE itemMaster (
        ItemID INT IDENTITY(1,1) PRIMARY KEY,
        ItemName VARCHAR(255),
        SerialNo VARCHAR(100),
        MacNo VARCHAR(100),
        MinStock INT,
        CategoryID INT,
        registered_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        pic VARCHAR(255)
      )
    `);

    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OperationType' AND xtype='U')
      CREATE TABLE OperationType (
        OperationID INT IDENTITY(1,1) PRIMARY KEY,
        OperationName VARCHAR(100),
        registered_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      )
    `);

    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProductBalance' AND xtype='U')
      CREATE TABLE ProductBalance (
        ProductBalanceID INT IDENTITY(1,1) PRIMARY KEY,
        ItemID INT,
        EmpID INT,
        Quantity INT,
        PO_No VARCHAR(50),
        Do_No VARCHAR(50),
        OrderDate DATE,
        ReceiveDate DATE,
        ReceiveQty INT,
        diffQuantity INT,
        registered_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      )
    `);

    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProductLog' AND xtype='U')
      CREATE TABLE ProductLog (
        ProductLogID INT IDENTITY(1,1) PRIMARY KEY,
        ItemID INT,
        ItemName VARCHAR(255),
        SerialNo VARCHAR(100),
        MacNo VARCHAR(100),
        PO_No VARCHAR(50),
        Do_No VARCHAR(50),
        Quantity INT,
        OperationID INT,
        EmpID INT,
        Issued_date DATE,
        Plan_return DATE,
        registered_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      )
    `);

    // Insert default categories
    await sql.query(`
      IF NOT EXISTS (SELECT 1 FROM Category)
      BEGIN
        INSERT INTO Category (CategoryName, registered_at, updated_at)
        VALUES 
        ('IOT Board', GETDATE(), GETDATE()),
        ('Server', GETDATE(), GETDATE()),
        ('PCB Comp.', GETDATE(), GETDATE()),
        ('Network', GETDATE(), GETDATE()),
        ('Other', GETDATE(), GETDATE())
      END
    `);

    // Insert default operations
    await sql.query(`
      IF NOT EXISTS (SELECT 1 FROM OperationType)
      BEGIN
        INSERT INTO OperationType (OperationName, registered_at, updated_at)
        VALUES 
        ('Stock in', GETDATE(), GETDATE()),
        ('Stock out', GETDATE(), GETDATE()),
        ('Borrow', GETDATE(), GETDATE()),
        ('Return', GETDATE(), GETDATE())
      END
    `);

    await sql.query(`
      IF NOT EXISTS (SELECT 1 FROM [user])
      BEGIN
        INSERT INTO [user] (EMP_no, UserName, Password, registered_at, updated_at)
        VALUES ('LE474', 'a', 'a', GETDATE(), GETDATE())
      END
    `);

    console.log('✅ ตรวจสอบและสร้างตารางเรียบร้อยแล้ว');
  } catch (err) {
    console.error('❌ Error creating tables:', err);
    throw err;
  } finally {
    await sql.close();
  }
}

(async () => {
  try {
    await ensureTables();
    app.listen(3001, () => {
      console.log('Backend running on port 3001');
    });
  } catch (err) {
    console.error('❌ Server start failed:', err);
  }
})();

