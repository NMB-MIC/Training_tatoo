const sql = require('mssql');

const dbUser = process.env.DB_USER || 'sa';
const dbPassword = process.env.DB_PASSWORD || 'DmX08775416421';
const dbServer = process.env.DB_SERVER || 'db';
const dbDatabase = process.env.DB_DATABASE || 'stock_t';

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

async function ensureDatabaseAndTables() {
  try {
    await sql.connect(masterConfig);
    const dbResult = await sql.query`SELECT name FROM sys.databases WHERE name = 'stock_t'`;
    if (dbResult.recordset.length === 0) {
      console.log('Creating database...');
      await sql.query(`CREATE DATABASE stock_t`);
    } else {
      console.log('Database already exists.');
    }
    await sql.close();

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

    // Insert default Category
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

    // Insert default OperationType
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

    // Insert default user
    await sql.query(`
      IF NOT EXISTS (SELECT 1 FROM [user])
      BEGIN
        INSERT INTO [user] (EMP_no, UserName, Password, registered_at, updated_at)
        VALUES ('LE474', 'a', 'a', GETDATE(), GETDATE())
      END
    `);

    console.log('✅ Tables and base data are ready.');
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  } finally {
    await sql.close();
  }
}

// ถ้ารันไฟล์นี้ตรง ๆ ให้ execute function
if (require.main === module) {
  ensureDatabaseAndTables().then(() => {
    console.log('🎉 Init script completed.');
    process.exit(0);
  });
}

