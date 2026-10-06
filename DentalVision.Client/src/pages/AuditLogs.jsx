import React, { useState, useEffect } from 'react';
import { FaHistory, FaSearch, FaShieldAlt, FaDatabase } from 'react-icons/fa';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('System'); // 'System' or 'Security'

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/auditlogs');
      setLogs(response.data);
    } catch (err) {
      console.error("Error loading audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    const matchesTab = (l.logType || 'System') === activeTab;
    const term = search.toLowerCase();
    const matchesSearch = 
      (l.action || '').toLowerCase().includes(term) ||
      (l.tableName || '').toLowerCase().includes(term) ||
      (l.userEmail && l.userEmail.toLowerCase().includes(term));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="container-fluid p-4 animate-fade-in" style={{ maxWidth: '1440px' }}>
      {/* Page Header */}
      <PageHeader
        title="System & Security Audit Logs"
        subtitle="Immutable audit trail of database operations, clinician logins, and data modifications."
        icon={FaHistory}
      />

      {/* Tabs & Search Card */}
      <div className="card shadow-sm border-0 p-4 mb-4 bg-white" style={{ borderRadius: '16px' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          {/* Tabs */}
          <div className="btn-group p-1 bg-light rounded" role="group" style={{ width: 'fit-content' }}>
            <button 
              type="button"
              onClick={() => setActiveTab('System')}
              className={`btn btn-sm ${activeTab === 'System' ? 'btn-white bg-white shadow-sm font-weight-bold text-primary' : 'text-muted'}`}
            >
              <FaDatabase className="me-1.5" /> System Operations
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('Security')}
              className={`btn btn-sm ${activeTab === 'Security' ? 'btn-white bg-white shadow-sm font-weight-bold text-warning-emphasis' : 'text-muted'}`}
            >
              <FaShieldAlt className="me-1.5" /> Security & Auth
            </button>
          </div>

          {/* Search Box */}
          <div className="input-group input-group-sm" style={{ maxWidth: '360px' }}>
            <span className="input-group-text bg-light border-end-0 text-muted">
              <FaSearch size={12} />
            </span>
            <input 
              type="text" 
              className="form-control border-start-0" 
              placeholder={`Search ${activeTab.toLowerCase()} logs...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="btn btn-outline-secondary border-start-0"
                onClick={() => setSearch('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card shadow-sm border-0 overflow-hidden bg-white" style={{ borderRadius: '16px' }}>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mx-auto mb-2" role="status" />
            <div className="small text-muted">Loading audit records...</div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-5 text-muted small">
            No {activeTab.toLowerCase()} log entries recorded.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 text-start" style={{ fontSize: '13px' }}>
              <thead className="table-light" style={{ backgroundColor: '#F8FAFC' }}>
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3">User / Email</th>
                  <th className="py-3">Action</th>
                  <th className="py-3">Domain Type</th>
                  <th className="py-3">Target Table</th>
                  <th className="py-3">Record ID</th>
                  <th className="py-3 text-end px-4">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(l => (
                  <tr key={l.id} className="border-bottom">
                    <td className="py-3 px-4 text-muted">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="py-3 font-weight-bold text-dark">{l.userEmail || 'System Core'}</td>
                    <td className="py-3">
                      <span className={`badge ${
                        l.action?.startsWith('LOGIN_FAILED') || l.action?.startsWith('DELETE') ? 'bg-danger-subtle text-danger' : 
                        l.action?.startsWith('LOGIN_SUCCESS') || l.action?.startsWith('CREATE') ? 'bg-success-subtle text-success' : 
                        'bg-primary-subtle text-primary'
                      } px-2.5 py-1 font-weight-bold`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 text-muted">{l.logType || 'System'}</td>
                    <td className="py-3"><code>{l.tableName}</code></td>
                    <td className="py-3 text-muted">{l.recordId || 'N/A'}</td>
                    <td className="py-3 text-end px-4 text-muted">{l.ipAddress || '127.0.0.1'}</td>
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
