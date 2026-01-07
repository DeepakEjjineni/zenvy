import React, { useState, useEffect } from 'react';
import axios from 'axios';

function EmployeeDashboard({ token, user }) {
  const [attendance, setAttendance] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const attRes = await axios.get(
        `http://localhost:5001/attendance/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAttendance(attRes.data);

      const payRes = await axios.get(
        `http://localhost:5001/payroll/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPayroll(payRes.data);

      setLoading(false);
    } catch (err) {
      console.log('Error fetching data:', err);
      setLoading(false);
    }
  };

  const viewSalarySlip = async (payrollId) => {
    try {
      const response = await axios.get(
        `http://localhost:5001/salary-slip/${payrollId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedSlip(response.data);
    } catch (err) {
      console.log('Error fetching salary slip:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Employee Dashboard</h1>

      <div className="card">
        <h2>My Attendance</h2>
        {attendance.length === 0 ? (
          <p>No attendance records found</p>
        ) : (
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.slice(0, 10).map(att => (
                <tr key={att.id}>
                  <td>{new Date(att.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${att.status.toLowerCase()}`}>
                      {att.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>My Salary Slips</h2>
        {payroll.length === 0 ? (
          <p>No salary slips available yet</p>
        ) : (
          <table className="payroll-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Net Salary</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payroll.map(pay => (
                <tr key={pay.id}>
                  <td>{pay.month}</td>
                  <td>₹{parseFloat(pay.net_salary).toFixed(2)}</td>
                  <td>
                    <button 
                      onClick={() => viewSalarySlip(pay.id)}
                      className="btn-secondary"
                    >
                      View Slip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedSlip && (
        <div className="modal-overlay" onClick={() => setSelectedSlip(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="salary-slip">
              <h2>Salary Slip</h2>
              <div className="slip-header">
                <p><strong>Name:</strong> {selectedSlip.name}</p>
                <p><strong>Month:</strong> {selectedSlip.month}</p>
              </div>

              <table className="slip-table">
                <tbody>
                  <tr>
                    <td>Basic Salary</td>
                    <td>₹{parseFloat(selectedSlip.basic).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Allowances</td>
                    <td>₹{parseFloat(selectedSlip.allowances).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Gross Salary</td>
                    <td>₹{(parseFloat(selectedSlip.basic) + parseFloat(selectedSlip.allowances)).toFixed(2)}</td>
                  </tr>
                  <tr className="deduction-row">
                    <td>Deductions</td>
                    <td>₹{parseFloat(selectedSlip.deductions).toFixed(2)}</td>
                  </tr>
                  <tr className="total-row">
                    <td><strong>Net Salary</strong></td>
                    <td><strong>₹{parseFloat(selectedSlip.net_salary).toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>

              <button 
                onClick={() => setSelectedSlip(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeDashboard;
