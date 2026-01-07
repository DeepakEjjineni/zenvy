
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 5001;
const SECRET_KEY = 'your_secret_key_here';

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '#Deepak6',
  database: 'zenvy_db',
  port: 3306
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

function checkHRAccess(req, res, next) {
  if (req.user.role !== 'HR' && req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Access denied. HR only.' });
  }
  next();
}

app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, company_id, role } = req.body;
    
    const [existing] = await db.query(
      'SELECT * FROM users WHERE email = ? AND company_id = ?',
      [email, company_id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await db.query(
      'INSERT INTO users (company_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [company_id, name, email, hashedPassword, role || 'Employee']
    );

    res.status(201).json({ 
      message: 'User registered successfully',
      userId: result.insertId 
    });
  } catch (error) {
    console.log('Error in register:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, company_id: user.company_id, role: user.role },
      SECRET_KEY,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_id: user.company_id
      }
    });

  } catch (err) {
    console.error("🔥 Login crash error:", err);
    return res.status(500).json({ message: "Server error", debug: err.message });
  }
});


app.get('/employees', authenticateToken, checkHRAccess, async (req, res) => {
  try {
    const [employees] = await db.query(
      'SELECT id, name, email, role FROM users WHERE company_id = ?',
      [req.user.company_id]
    );
    
    res.json(employees);
  } catch (error) {
    console.log('Error fetching employees:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/employees', authenticateToken, checkHRAccess, async (req, res) => {
  try {
    const { name, email, password, basic, allowances, deductions } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const [userResult] = await db.query(
      'INSERT INTO users (company_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [req.user.company_id, name, email, hashedPassword, 'Employee']
    );

    const employeeId = userResult.insertId;

    if (!basic || !allowances || !deductions) {
      return res.status(400).json({ message: "Salary fields missing!" });
    }
    await db.query(
    'INSERT INTO salary_components (company_id, user_id, basic, allowances, deductions) VALUES (?, ?, ?, ?, ?)',
    [req.user.company_id, employeeId, basic, allowances, deductions]
  );

    await db.query(
    'INSERT INTO audit_logs (company_id, action, performed_by) VALUES (?, ?, ?)',
    [req.user.company_id, `Added employee: ${name}`, req.user.id || null]
  );


    res.status(201).json({ 
      message: 'Employee added successfully',
      employeeId 
    });
  } catch (error) {
    console.log('Error adding employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/attendance', authenticateToken, async (req, res) => {
  try {
    const { user_id, date, status } = req.body;
    
    const [existing] = await db.query(
      'SELECT * FROM attendance WHERE company_id = ? AND user_id = ? AND date = ?',
      [req.user.company_id, user_id, date]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Attendance already marked for this date' });
    }

    await db.query(
      'INSERT INTO attendance (company_id, user_id, date, status) VALUES (?, ?, ?, ?)',
      [req.user.company_id, user_id, date, status]
    );

    res.json({ message: 'Attendance marked successfully' });
  } catch (error) {
    console.log('Attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/attendance/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const [attendance] = await db.query(
      'SELECT * FROM attendance WHERE company_id = ? AND user_id = ? ORDER BY date DESC',
      [req.user.company_id, userId]
    );

    res.json(attendance);
  } catch (error) {
    console.log('Error fetching attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/payroll/run', authenticateToken, checkHRAccess, async (req, res) => {
  try {
    const { month, year } = req.body;

    const [employees] = await db.query(
      `SELECT u.id, u.name, s.basic, s.allowances, s.deductions, u.company_id
       FROM users u 
       JOIN salary_components s ON u.id = s.user_id 
       WHERE u.company_id = ? AND u.role = 'Employee'`,
      [req.user.company_id]
    );

    const payrollResults = [];

    const WORKING_DAYS = 22;

    for (let emp of employees) {
      const basic = Number(emp.basic) || 0;
      const allowances = Number(emp.allowances) || 0;
      const deductions = Number(emp.deductions) || 0;

      const [attendanceRows] = await db.query(
        `SELECT status FROM attendance 
         WHERE company_id = ? AND user_id = ? 
         AND MONTH(date) = ? AND YEAR(date) = ?`,
        [emp.company_id, emp.id, month, year]
      );

      const presentDays = attendanceRows.filter(a => a.status === 'Present').length;
      const absentDays = WORKING_DAYS - presentDays;
      const grossSalary = basic + allowances;
      const perDayDeduction = grossSalary / WORKING_DAYS;
      const absentDeduction = perDayDeduction * absentDays;

      let netSalary = grossSalary - deductions - absentDeduction;
      if (isNaN(netSalary) || netSalary < 0) netSalary = 0;

      await db.query(
        "INSERT INTO payroll (company_id, user_id, month, net_salary) VALUES (?, ?, ?, ?)",
        [emp.company_id, emp.id, `${year}-${month}`, netSalary]
      );

      payrollResults.push({
        employee: emp.name,
        presentDays,
        absentDays,
        grossSalary,
        deductions,
        absentDeduction,
        netSalary
      });
    }

    await db.query(
      'INSERT INTO audit_logs (company_id, action, performed_by) VALUES (?, ?, ?)',
      [req.user.company_id, `Payroll run for ${year}-${month}`, req.user.id]
    );

    res.json({ 
      message: 'Payroll processed successfully',
      results: payrollResults 
    });

  } catch (error) {
    console.error("🔥 Payroll processing error:", error);
    res.status(500).json({ message: "Server error", debug: error.message });
  }
});


app.get('/payroll/:employeeId', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    
    const [payroll] = await db.query(
      'SELECT * FROM payroll WHERE company_id = ? AND user_id = ? ORDER BY month DESC',
      [req.user.company_id, employeeId]
    );

    res.json(payroll);
  } catch (error) {
    console.log('Error fetching payroll:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/salary-slip/:payrollId', authenticateToken, async (req, res) => {
  try {
    const payrollId = req.params.payrollId;
    
    const [result] = await db.query(
      `SELECT p.*, u.name, u.email, s.basic, s.allowances, s.deductions
       FROM payroll p
       JOIN users u ON p.user_id = u.id
       JOIN salary_components s ON u.id = s.user_id
       WHERE p.id = ? AND p.company_id = ?`,
      [payrollId, req.user.company_id]
    );

    if (result.length === 0) {
      return res.status(404).json({ message: 'Salary slip not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.log('Error fetching salary slip:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});