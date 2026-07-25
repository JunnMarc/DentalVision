import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FaCheckCircle, FaUndo, FaPlus, FaTrash } from 'react-icons/fa';

const PlaqueValidation = () => {
  const { analysisId } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [imagePath, setImagePath] = useState('');
  const [mappings, setMappings] = useState([]);
  const [coveragePercentage, setCoveragePercentage] = useState(0);
  const [dentistNotes, setDentistNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const [markerNodes, setMarkerNodes] = useState([]); // List of custom nodes placed by dentist

  const getUniqueMappings = () => {
    const unique = {};
    mappings.forEach(m => {
      if (!unique[m.toothNumber]) {
        unique[m.toothNumber] = { ...m };
      } else {
        const levelOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        if (levelOrder[m.plaqueLevel] > levelOrder[unique[m.toothNumber].plaqueLevel]) {
          unique[m.toothNumber].plaqueLevel = m.plaqueLevel;
        }
      }
    });
    return Object.values(unique).sort((a, b) => a.toothNumber - b.toothNumber);
  };

  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        const response = await api.get(`/plaque/analysis/${analysisId}`);
        const data = response.data;
        setAnalysis(data);
        setCoveragePercentage(data.coveragePercentage);
        setMappings(data.mappings || []);
        
        // Find path
        // Since the database contains the relative filepath, we map it to the backend host
        setImagePath(data.imageId ? `http://localhost:5098/api/plaque/analysis/image/${data.imageId}` : '');
        // For local demo rendering if backend image is not found, we fallback to a premium placeholder gradient
        
        // Parse mock coordinates nodes
        if (data.mappings && data.mappings.length > 0) {
          const nodes = [];
          data.mappings.forEach(m => {
            try {
              const coords = JSON.parse(m.coordinatesJson);
              if (Array.isArray(coords)) {
                coords.forEach(pt => {
                  nodes.push({ toothNumber: m.toothNumber, x: pt.x, y: pt.y });
                });
              }
            } catch (err) {}
          });
          setMarkerNodes(nodes);
        }
      } catch (error) {
        console.error("Error loading plaque analysis record:", error);
      }
    };
    fetchAnalysisData();
  }, [analysisId]);

  // Redraw canvas markers when nodes update
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear and redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw each mapping contour individually (Clean Heatmap overlay style)
    mappings.forEach(m => {
      try {
        const coords = JSON.parse(m.coordinatesJson);
        if (Array.isArray(coords) && coords.length > 0) {
          // Color code transparent mask based on plaque severity
          ctx.fillStyle = m.plaqueLevel === 'High' 
            ? 'rgba(239, 68, 68, 0.42)'  // Semi-transparent Red
            : m.plaqueLevel === 'Medium' 
              ? 'rgba(245, 158, 11, 0.42)' // Semi-transparent Orange/Yellow
              : 'rgba(20, 184, 166, 0.38)'; // Semi-transparent Teal/Blue
          
          ctx.beginPath();
          coords.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          if (coords.length > 2) {
            ctx.closePath();
          }
          ctx.fill(); // Fill only, no outline stroke to remove mesh clutter
        }
      } catch (err) {}
    });

    // Group mappings by toothNumber to calculate one single centroid label per tooth
    const centroidsByTooth = {};
    mappings.forEach(m => {
      try {
        const coords = JSON.parse(m.coordinatesJson);
        if (Array.isArray(coords) && coords.length > 0) {
          const sumX = coords.reduce((sum, pt) => sum + pt.x, 0);
          const sumY = coords.reduce((sum, pt) => sum + pt.y, 0);
          const cx = sumX / coords.length;
          const cy = sumY / coords.length;

          if (!centroidsByTooth[m.toothNumber]) {
            centroidsByTooth[m.toothNumber] = { x: 0, y: 0, count: 0 };
          }
          centroidsByTooth[m.toothNumber].x += cx;
          centroidsByTooth[m.toothNumber].y += cy;
          centroidsByTooth[m.toothNumber].count += 1;
        }
      } catch (err) {}
    });

    // Draw single clean FDI tooth label for each unique tooth
    Object.entries(centroidsByTooth).forEach(([toothNum, data]) => {
      const cx = data.x / data.count;
      const cy = data.y / data.count;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(toothNum, cx, cy);
      
      // Reset shadow & text styles
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    });

    // Draw manual clicked marker nodes that are not yet saved
    markerNodes.forEach(node => {
      const existsInMappings = mappings.some(m => {
        try {
          const coords = JSON.parse(m.coordinatesJson);
          return coords.some(pt => pt.x === node.x && pt.y === node.y);
        } catch (e) { return false; }
      });

      if (!existsInMappings) {
        ctx.fillStyle = '#10B981'; // Green dot for manual additions
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 2;
        ctx.fillText(node.toothNumber.toString(), node.x - 5, node.y - 10);
        ctx.shadowBlur = 0;
      }
    });
  }, [mappings, markerNodes]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Ask dentist which tooth number this plaque node corresponds to
    const input = prompt("Enter Tooth Number (e.g. 11, 12, 21, 22):", "11");
    const toothNumber = parseInt(input);

    if (toothNumber && toothNumber >= 11 && toothNumber <= 48) {
      const newNode = { toothNumber, x, y };
      setMarkerNodes([...markerNodes, newNode]);
      
      // Update or insert tooth mapping
      const existingMapping = mappings.find(m => m.toothNumber === toothNumber);
      if (!existingMapping) {
        const newMapping = {
          toothNumber,
          plaqueLevel: "High",
          gumlineRegion: "Cervical",
          coordinatesJson: JSON.stringify([{ x, y }])
        };
        setMappings([...mappings, newMapping]);
      } else {
        const coords = JSON.parse(existingMapping.coordinatesJson);
        coords.push({ x, y });
        existingMapping.coordinatesJson = JSON.stringify(coords);
        setMappings([...mappings]);
      }
      
      // Dynamically bump coverage percentage simulating added plaque spots!
      setCoveragePercentage(prev => Math.min(100, Math.round((parseFloat(prev) + 1.5) * 10) / 10));
    }
  };

  const handleResetMap = () => {
    setMarkerNodes([]);
    setMappings([]);
    setCoveragePercentage(12.5); // Default lower bound
  };

  const handleMappingFieldChange = (toothNumber, field, value) => {
    const updated = mappings.map(m => {
      if (m.toothNumber === toothNumber) {
        return { ...m, [field]: value };
      }
      return m;
    });
    setMappings(updated);

    // Dynamically recalculate plaque average percentage based on rating adjustments
    let sum = 0;
    updated.forEach(m => {
      if (m.plaqueLevel === "High") sum += 20;
      if (m.plaqueLevel === "Medium") sum += 12;
      if (m.plaqueLevel === "Low") sum += 5;
    });
    const avg = sum > 0 ? Math.round((sum / (updated.length * 20)) * 100 * 10) / 10 : 10.0;
    setCoveragePercentage(avg);
  };

  const handleDeleteMapping = (toothNumber) => {
    setMappings(mappings.filter(m => m.toothNumber !== toothNumber));
    setMarkerNodes(markerNodes.filter(n => n.toothNumber !== toothNumber));
  };

  const handleApprove = async () => {
    setSaving(true);
    setError('');

    const payload = {
      approvedPercentage: parseFloat(coveragePercentage),
      approvedRegions: JSON.stringify(markerNodes),
      mappings: mappings.map(m => ({
        toothNumber: m.toothNumber,
        plaqueLevel: m.plaqueLevel,
        gumlineRegion: m.gumlineRegion,
        coordinatesJson: m.coordinatesJson
      })),
      dentistNotes,
      recommendations
    };

    try {
      await api.post(`/plaque/analysis/${analysisId}/validate`, payload);
      navigate(`/dashboard`);
    } catch (err) {
      console.error(err);
      setError("Failed to submit dentist plaque validations.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 className="mb-4 font-weight-bold">Dentist Validation Panel</h3>

      {error && (
        <div className="alert alert-danger py-2 small" role="alert">
          {error}
        </div>
      )}

      <div className="row g-4">
        {/* Left Column: Interactive Canvas Drawing Editor */}
        <div className="col-md-7">
          <div className="clinic-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="font-weight-bold m-0">Gumline Plaque Hotspots Editor</h5>
              <button onClick={handleResetMap} className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1">
                <FaUndo /> Reset Map
              </button>
            </div>
            
            <p className="text-muted small">
              Click on the dental image grid below to place red plaque marker nodes and map custom plaque coordinates.
            </p>

            <div className="plaque-mapping-canvas-container" style={{ position: 'relative', width: '100%', height: '400px' }}>
              {/* Backside Dental Image (Render actual photo if loaded, fallback to gradient container if not) */}
              {imagePath ? (
                <img 
                  src={imagePath} 
                  alt="Dental Plaque"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain',
                    borderRadius: '16px',
                    backgroundColor: '#cbd5e1',
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}
                  onError={(e) => {
                    // Fallback to text label representation if static load fails
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    backgroundImage: 'radial-gradient(circle, #e2e8f0 0%, #cbd5e1 100%)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#64748B'
                  }}
                >
                  [ Dental Image Disclosed Canvas View ]
                </div>
              )}

              {/* Overlay Interactive Drawing Canvas */}
              <canvas 
                ref={canvasRef}
                width={600}
                height={400}
                onClick={handleCanvasClick}
                className="plaque-overlay-canvas"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Calculations & Form Values */}
        <div className="col-md-5">
          {/* Coverage Summary */}
          <div className="clinic-card py-4 bg-light">
            <h6 className="text-muted small mb-1 text-start">Calculated Plaque Coverage</h6>
            <h1 className="display-4 font-weight-bold text-danger m-0 text-end">{coveragePercentage}%</h1>
            <p className="text-muted small mt-2 text-start mb-0">Status: <strong>Pending Approval</strong></p>
          </div>

          {/* Tooth mapping list */}
          <div className="clinic-card">
            <h5 className="font-weight-bold mb-3">Teeth Mappings Table</h5>
            {mappings.length === 0 ? (
              <p className="text-muted small">No tooth mapped yet. Click on the canvas to place coordinates.</p>
            ) : (
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <table className="table table-sm table-clinic align-middle small">
                  <thead>
                    <tr>
                      <th>Tooth</th>
                      <th>Level</th>
                      <th>Region</th>
                      <th>Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getUniqueMappings().map(m => (
                      <tr key={m.toothNumber}>
                        <td className="font-weight-bold">#{m.toothNumber}</td>
                        <td>
                          <select 
                            className="form-select form-select-sm py-0"
                            value={m.plaqueLevel}
                            onChange={(e) => handleMappingFieldChange(m.toothNumber, "plaqueLevel", e.target.value)}
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        </td>
                        <td>
                          <select 
                            className="form-select form-select-sm py-0"
                            value={m.gumlineRegion}
                            onChange={(e) => handleMappingFieldChange(m.toothNumber, "gumlineRegion", e.target.value)}
                          >
                            <option value="Cervical">Cervical</option>
                            <option value="Interproximal">Interproximal</option>
                            <option value="Margin">Margin</option>
                          </select>
                        </td>
                        <td className="text-center">
                          <button onClick={() => handleDeleteMapping(m.toothNumber)} className="btn btn-sm btn-link text-danger p-0 border-0">
                            <FaTrash size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Remarks Inputs */}
          <div className="clinic-card">
            <h5 className="font-weight-bold mb-3">Clinical Assessment Remarks</h5>
            <div className="mb-3">
              <label className="form-label small font-weight-bold">Dentist Notes</label>
              <textarea 
                className="form-control" 
                rows="2" 
                placeholder="Write dentist observations..."
                value={dentistNotes}
                onChange={(e) => setDentistNotes(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="form-label small font-weight-bold">Recommendations</label>
              <textarea 
                className="form-control" 
                rows="2" 
                placeholder="e.g. Brush twice daily, chlorhexidine mouthwash..."
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
              />
            </div>

            <button 
              onClick={handleApprove}
              className="btn btn-teal-clinic w-100 py-2 d-flex align-items-center justify-content-center gap-2"
              disabled={saving}
              style={{ backgroundColor: '#14B8A6', borderColor: '#14B8A6' }}
            >
              <FaCheckCircle /> {saving ? 'Saving validations...' : 'Approve & Save Map'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaqueValidation;
