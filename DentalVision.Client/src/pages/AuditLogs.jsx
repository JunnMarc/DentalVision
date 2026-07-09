import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaHistory, FaSearch, FaShieldAlt, FaDatabase } from 'react-icons/fa';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('System'); // 'System' or 'Security'

  const fetchLogs = async () => {
    try {
      const response = await api.get('/admin/auditlogs');
      setLogs(response.data);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter logs by active tab (System/Security) and text search
  const filteredLogs = logs.filter(l => {
    const matchesTab = (l.logType || 'System') === activeTab;
    const matchesSearch = 
      (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.tableName || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.userEmail && l.userEmail.toLowerCase().includes(search.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <div>
      <h3 className="mb-4 font-weight-bold">System & Security Audit Logs</h3>

      {/* Tabs Switcher */}
      <div className="d-flex mb-4 gap-2 border-bottom pb-2">
        <button 
          onClick={() => setActiveTab('System')}
          className={`btn btn-link nav-link pb-2 px-3 font-weight-bold d-flex align-items-center gap-2 border-bottom border-3 ${
            activeTab === 'System' ? 'text-primary border-primary' : 'text-muted border-transparent'
          }`}
          style={{ textDecoration: 'none', transition: 'all 0.2s' }}
        >
          <FaDatabase /> System Audits
        </button>
        <button 
          onClick={() => setActiveTab('Security')}
          className={`btn btn-link nav-link pb-2 px-3 font-weight-bold d-flex align-items-center gap-2 border-bottom border-3 ${
            activeTab === 'Security' ? 'text-warning border-warning' : 'text-muted border-transparent'
          }`}
          style={{ textDecoration: 'none', transition: 'all 0.2s' }}
        >
          <FaShieldAlt /> Security Audits
        </button>
      </div>

      {/* Search and Filters */}
      <div className="clinic-card mb-4 py-3">
        <div className="input-group">
          <span className="input-group-text bg-transparent border-end-0">
            <FaSearch className="text-muted" />
          </span>
          <input 
            type="text" 
            className="form-control border-start-0 ps-0" 
            placeholder={`Search ${activeTab.toLowerCase()} audit events...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="clinic-card">
        <h5 className="font-weight-bold mb-3 d-flex align-items-center gap-2">
          <FaHistory /> {activeTab} Transaction History
        </h5>

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
        ) : filteredLogs.length === 0 ? (
          <p className="text-muted text-center py-4">No {activeTab.toLowerCase()} log entries found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover table-clinic align-middle small">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User / Email</th>
                  <th>Action</th>
                  <th>Domain Type</th>
                  <th>Target Table</th>
                  <th>Record ID</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(l => (
                  <tr key={l.id}>
                    <td>{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="font-weight-bold">{l.userEmail || 'System'}</td>
                    <td>
                      <span className={`badge ${
                        l.action.startsWith('LOGIN_FAILED') || l.action.startsWith('DELETE') ? 'bg-danger' : 
                        l.action.startsWith('LOGIN_SUCCESS') || l.action.startsWith('CREATE') ? 'bg-success' : 'bg-primary'
                      }`}>
                        {l.action}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        (l.logType || 'System') === 'Security' ? 'bg-warning text-dark' : 'bg-info text-dark'
                      }`}>
                        {l.logType || 'System'}
                      </span>
                    </td>
                    <td><code>{l.tableName}</code></td>
                    <td>{l.recordId || 'N/A'}</td>
                    <td>{l.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
