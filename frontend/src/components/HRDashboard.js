import React, { useState, useEffect } from 'react';
import axios from 'axios';

function HRDashboard({ token, user }) {
  const [employees, setEmployees] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState('');
  
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    password: '',
    basic: '',
    allowances: '',
    deductions: ''
  });

  const [payrollMonth, setPayrollMonth] = useState('');
  const [payrollYear, setPayrollYear] = useState('2024');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:5001/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data);
    } catch (err) {
      console.log('Error fetching employees:', err);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(
        'http://localhost:5001/employees',
        newEmployee,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage('Employee added successfully!');
      setShowAddForm(false);
      
      setNewEmployee({
        name: '',
        email: '',
        password: '',
        basic: '',
        allowances: '',
        deductions: ''
      });

      fetchEmployees();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error adding employee: ' + err.response?.data?.message);
    }
  };

  const handleRunPayroll = async () => {
    if (!payrollMonth || !payrollYear) {
      setMessage('Please select month and year');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:5001/payroll/run',
        { month: payrollMonth, year: payrollYear },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(`Payroll processed successfully! ${response.data.results.length} employees processed.`);
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setMessage('Error processing payroll: ' + err.response?.data?.message);
    }
  };

  return (
    <div className="dashboard">
      <h1>HR Dashboard</h1>

      {message && <div className="message-box">{message}</div>}

      <div className="card">
        <h2>Run Payroll</h2>
        <div className="payroll-controls">
          <select 
            value={payrollMonth} 
            onChange={(e) => setPayrollMonth(e.target.value)}
          >
            <option value="">Select Month</option>
            <option value="01">January</option>
            <option value="02">February</option>
            <option value="03">March</option>
            <option value="04">April</option>
            <option value="05">May</option>
            <option value="06">June</option>
            <option value="07">July</option>
            <option value="08">August</option>
            <option value="09">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>

          <input
            type="text"
            placeholder="Year"
            value={payrollYear}
            onChange={(e) => setPayrollYear(e.target.value)}
          />

          <button onClick={handleRunPayroll} className="btn-primary">
            Run Payroll
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Employees</h2>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary"
          >
            {showAddForm ? 'Cancel' : 'Add Employee'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddEmployee} className="add-employee-form">
            <input
              type="text"
              placeholder="Full Name"
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={newEmployee.email}
              onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={newEmployee.password}
              onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
              required
            />
            <input
              type="number"
              placeholder="Basic Salary"
              value={newEmployee.basic}
              onChange={(e) => setNewEmployee({...newEmployee, basic: e.target.value})}
              required
            />
            <input
              type="number"
              placeholder="Allowances"
              value={newEmployee.allowances}
              onChange={(e) => setNewEmployee({...newEmployee, allowances: e.target.value})}
              required
            />
            <input
              type="number"
              placeholder="Deductions"
              value={newEmployee.deductions}
              onChange={(e) => setNewEmployee({...newEmployee, deductions: e.target.value})}
              required
            />
            <button type="submit" className="btn-primary">Add Employee</button>
          </form>
        )}

        <table className="employee-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>
                  No employees found
                </td>
              </tr>
            ) : (
              employees.map(emp => (
                <tr key={emp.id}>
                  <td>{emp.id}</td>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.role}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HRDashboard;
