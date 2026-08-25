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
  const [severityAdjustment, setSeverityAdjustment] = useState('none');
  const [customPrice, setCustomPrice] = useState('');
  const [specialTools, setSpecialTools] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const [activeTooltip, setActiveTooltip] = useState(null); // Track custom nodes edit tooltip

  const fdiTeeth = [
    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
    38, 37, 36, 35, 34, 33, 32, 31, 48, 47, 46, 45, 44, 43, 42, 41
  ];

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
    const fetchSecureImage = async (imageId) => {
      try {
        const response = await api.get(`/plaque/analysis/image/${imageId}`, {
          responseType: 'blob'
        });
        const blobUrl = URL.createObjectURL(response.data);
        setImagePath(blobUrl);
      } catch (err) {
        console.error("Failed to load secure dental image:", err);
      }
    };

    const fetchAnalysisData = async () => {
      try {
        const response = await api.get(`/plaque/analysis/${analysisId}`);
        const data = response.data;
        setAnalysis(data);
        setCoveragePercentage(data.coveragePercentage);
        setMappings(data.mappings || []);
        
        if (data.imageId) {
          await fetchSecureImage(data.imageId);
        } else {
          setImagePath('');
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
          ctx.fillStyle = m.plaqueLevel === 'High' 
            ? 'rgba(0, 255, 0, 0.52)'   // Bright neon green
            : m.plaqueLevel === 'Medium' 
              ? 'rgba(50, 255, 50, 0.42)' // Mid neon green
              : 'rgba(100, 255, 100, 0.32)'; // Soft neon green
          
          ctx.strokeStyle = 'rgba(0, 255, 0, 0.75)';
          ctx.lineWidth = 1.5;
          
          ctx.beginPath();
          coords.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          if (coords.length > 2) {
            ctx.closePath();
          }
          ctx.fill(); 
          ctx.stroke();
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

    // Draw vector anchor circles at all plaque coordinates
    mappings.forEach(m => {
      try {
        const coords = JSON.parse(m.coordinatesJson);
        if (Array.isArray(coords)) {
          coords.forEach(pt => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4.5, 0, 2 * Math.PI);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#10B981';
            ctx.lineWidth = 1.8;
            ctx.stroke();
          });
        }
      } catch (err) {}
    });
  }, [mappings]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Scale client click coordinates to the internal canvas coordinate space (600x400)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const displayX = e.clientX - rect.left;
    const displayY = e.clientY - rect.top;

    // Check if clicking near an existing anchor node (edit mode)
    let foundNode = null;
    mappings.forEach(m => {
      try {
        const coords = JSON.parse(m.coordinatesJson);
        if (Array.isArray(coords)) {
          coords.forEach((pt, idx) => {
            const dist = Math.sqrt((pt.x - x) ** 2 + (pt.y - y) ** 2);
            if (dist < 15) { // Radius of 15 internal coordinates
              foundNode = {
                x: pt.x,
                y: pt.y,
                displayX,
                displayY,
                toothNumber: m.toothNumber,
                plaqueLevel: m.plaqueLevel,
                gumlineRegion: m.gumlineRegion,
                isEdit: true,
                originalCoordIndex: idx,
                originalMapping: m
              };
            }
          });
        }
      } catch (err) {}
    });

    if (foundNode) {
      setActiveTooltip(foundNode);
    } else {
      // Find closest tooth centroid to pre-select
      let closestTooth = 11;
      let minDistance = Infinity;
      mappings.forEach(m => {
        try {
          const coords = JSON.parse(m.coordinatesJson);
          if (Array.isArray(coords)) {
            coords.forEach(pt => {
              const dist = Math.sqrt((pt.x - x) ** 2 + (pt.y - y) ** 2);
              if (dist < minDistance) {
                minDistance = dist;
                closestTooth = m.toothNumber;
              }
            });
          }
        } catch (e) {}
      });

      setActiveTooltip({
        x,
        y,
        displayX,
        displayY,
        toothNumber: closestTooth,
        plaqueLevel: 'High',
        gumlineRegion: 'Cervical',
        isEdit: false
      });
    }
  };

  const handleSaveTooltipNode = () => {
    if (!activeTooltip) return;
    const { x, y, toothNumber, plaqueLevel, gumlineRegion, isEdit, originalCoordIndex, originalMapping } = activeTooltip;

    if (isEdit) {
      const updatedMappings = mappings.map(m => {
        if (m.toothNumber === originalMapping.toothNumber) {
          const coords = JSON.parse(m.coordinatesJson);
          if (toothNumber !== originalMapping.toothNumber) {
            // Remove from current tooth coordinates
            coords.splice(originalCoordIndex, 1);
            return { ...m, coordinatesJson: JSON.stringify(coords) };
          } else {
            return { ...m, plaqueLevel, gumlineRegion };
          }
        }
        return m;
      }).filter(m => {
        try {
          const coords = JSON.parse(m.coordinatesJson);
          return coords.length > 0;
        } catch (e) { return false; }
      });

      if (toothNumber !== originalMapping.toothNumber) {
        const targetMapping = updatedMappings.find(m => m.toothNumber === toothNumber);
        if (targetMapping) {
          const targetCoords = JSON.parse(targetMapping.coordinatesJson);
          targetCoords.push({ x, y });
          targetMapping.coordinatesJson = JSON.stringify(targetCoords);
        } else {
          updatedMappings.push({
            toothNumber,
            plaqueLevel,
            gumlineRegion,
            coordinatesJson: JSON.stringify([{ x, y }])
          });
        }
      }
      setMappings(updatedMappings);
    } else {
      const targetMapping = mappings.find(m => m.toothNumber === toothNumber);
      if (targetMapping) {
        const coords = JSON.parse(targetMapping.coordinatesJson);
        coords.push({ x, y });
        targetMapping.coordinatesJson = JSON.stringify(coords);
        setMappings([...mappings]);
      } else {
        const newMapping = {
          toothNumber,
          plaqueLevel,
          gumlineRegion,
          coordinatesJson: JSON.stringify([{ x, y }])
        };
        setMappings([...mappings, newMapping]);
      }
      setCoveragePercentage(prev => Math.min(100, Math.round((parseFloat(prev) + 1.5) * 10) / 10));
    }
    setActiveTooltip(null);
  };

  const handleDeleteTooltipNode = () => {
    if (!activeTooltip || !activeTooltip.isEdit) return;
    const { originalCoordIndex, originalMapping } = activeTooltip;

    const updatedMappings = mappings.map(m => {
      if (m.toothNumber === originalMapping.toothNumber) {
        const coords = JSON.parse(m.coordinatesJson);
        coords.splice(originalCoordIndex, 1);
        return { ...m, coordinatesJson: JSON.stringify(coords) };
      }
      return m;
    }).filter(m => {
      try {
        const coords = JSON.parse(m.coordinatesJson);
        return coords.length > 0;
      } catch (e) { return false; }
    });

    setMappings(updatedMappings);
    setCoveragePercentage(prev => Math.max(0, Math.round((parseFloat(prev) - 1.5) * 10) / 10));
    setActiveTooltip(null);
  };

  const handleResetMap = () => {
    setMappings([]);
    setCoveragePercentage(12.5);
    setActiveTooltip(null);
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
  };

  const handleApprove = async () => {
    setSaving(true);
    setError('');

    const activeNodes = [];
    mappings.forEach(m => {
      try {
        const coords = JSON.parse(m.coordinatesJson);
        if (Array.isArray(coords)) {
          coords.forEach(pt => {
            activeNodes.push({ toothNumber: m.toothNumber, x: pt.x, y: pt.y });
          });
        }
      } catch (e) {}
    });

    let finalRecommendations = recommendations;
    if (severityAdjustment !== 'none' || specialTools.trim()) {
      let amount = 0;
      let reason = '';
      if (severityAdjustment === 'moderate') {
        amount = 1000;
        reason = 'Deep Scaling for Moderate Plaque';
      } else if (severityAdjustment === 'severe') {
        amount = 2000;
        reason = 'Ultrasonic Scaling for Severe Plaque';
      } else if (severityAdjustment === 'custom') {
        amount = parseFloat(customPrice) || 0;
        reason = 'Custom Clinical Pricing';
      } else {
        reason = 'Fixed Rate';
      }
      
      if (specialTools.trim()) {
        reason += ` - Tools: ${specialTools.trim()}`;
      }
      
      finalRecommendations += `\n\n[BillingRecommendation: ${amount} | Reason: ${reason}]`;
    }

    const payload = {
      approvedPercentage: parseFloat(coveragePercentage),
      approvedRegions: JSON.stringify(activeNodes),
      mappings: mappings.map(m => ({
        toothNumber: m.toothNumber,
        plaqueLevel: m.plaqueLevel,
        gumlineRegion: m.gumlineRegion,
        coordinatesJson: m.coordinatesJson
      })),
      dentistNotes,
      recommendations: finalRecommendations
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
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <h3 className="font-weight-bold m-0">Dentist Validation Panel</h3>
        {/* {analysis && (
          <div className="d-flex align-items-center gap-2 bg-light border rounded px-3 py-1 shadow-sm">
            <span className="small text-muted font-weight-bold">Status:</span>
            <span className="badge bg-success text-white">Active</span>
            <div className="vr mx-1" style={{ height: '15px' }}></div>
            <span className="small text-muted font-weight-bold">Segmenter:</span>
            <span className={`badge ${
              analysis.engineUsed?.includes("Roboflow") ? "bg-info text-dark" :
              analysis.engineUsed?.includes("YOLO") ? "bg-primary text-white" : "bg-secondary text-white"
            } px-2 py-1 font-weight-bold`} style={{ fontSize: '0.8rem' }}>
              {analysis.engineUsed || "OpenCV (HSV Fallback)"}
            </span>
          </div>
        )} */}
      </div>

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
                    objectFit: 'fill',
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
                style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
              />

              {/* Floating Inline Hotspot Annotation popover tooltip */}
              {activeTooltip && (
                <div 
                  className="plaque-editor-tooltip shadow-lg border"
                  style={{
                    position: 'absolute',
                    left: `${activeTooltip.displayX}px`,
                    top: `${activeTooltip.displayY}px`,
                    transform: 'translate(-50%, -100%) translateY(-15px)',
                    background: 'rgba(15, 23, 42, 0.94)',
                    backdropFilter: 'blur(12px)',
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '12px',
                    zIndex: 1000,
                    width: '210px',
                    color: '#f8fafc'
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom border-secondary">
                    <span className="small font-weight-bold" style={{ letterSpacing: '0.5px' }}>
                      {activeTooltip.isEdit ? 'Modify Plaque Spot' : 'Annotate Spot'}
                    </span>
                    <button 
                      onClick={() => setActiveTooltip(null)} 
                      style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', outline: 'none' }}
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="mb-2">
                    <label className="text-muted mb-1" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Tooth Number</label>
                    <select 
                      value={activeTooltip.toothNumber}
                      onChange={(e) => setActiveTooltip({ ...activeTooltip, toothNumber: parseInt(e.target.value) })}
                      className="form-select form-select-sm"
                      style={{ background: '#1e293b', border: '1px solid #475569', color: '#f8fafc', fontSize: '11px', borderRadius: '6px' }}
                    >
                      {fdiTeeth.map(num => (
                        <option key={num} value={num}>Tooth #{num}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-2">
                    <label className="text-muted mb-1" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Plaque Level</label>
                    <select 
                      value={activeTooltip.plaqueLevel}
                      onChange={(e) => setActiveTooltip({ ...activeTooltip, plaqueLevel: e.target.value })}
                      className="form-select form-select-sm"
                      style={{ background: '#1e293b', border: '1px solid #475569', color: '#f8fafc', fontSize: '11px', borderRadius: '6px' }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="text-muted mb-1" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Tooth Region</label>
                    <select 
                      value={activeTooltip.gumlineRegion}
                      onChange={(e) => setActiveTooltip({ ...activeTooltip, gumlineRegion: e.target.value })}
                      className="form-select form-select-sm"
                      style={{ background: '#1e293b', border: '1px solid #475569', color: '#f8fafc', fontSize: '11px', borderRadius: '6px' }}
                    >
                      <option value="Cervical">Cervical</option>
                      <option value="Middle">Middle</option>
                      <option value="Incisal">Incisal</option>
                      <option value="Interproximal">Interproximal</option>
                      <option value="Margin">Margin</option>
                    </select>
                  </div>

                  <div className="d-flex gap-2">
                    {activeTooltip.isEdit && (
                      <button 
                        onClick={handleDeleteTooltipNode}
                        className="btn btn-sm btn-danger py-1"
                        style={{ flex: 1, fontSize: '11px', fontWeight: 'bold', borderRadius: '6px' }}
                      >
                        Delete
                      </button>
                    )}
                    <button 
                      onClick={handleSaveTooltipNode}
                      className="btn btn-sm btn-success py-1"
                      style={{ flex: 2, fontSize: '11px', fontWeight: 'bold', borderRadius: '6px' }}
                    >
                      {activeTooltip.isEdit ? 'Save Node' : 'Confirm'}
                    </button>
                  </div>

                  {/* Downward triangle arrow pointing to coordinates click */}
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: '-7px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '7px solid transparent',
                      borderRight: '7px solid transparent',
                      borderTop: '7px solid rgba(15, 23, 42, 0.94)',
                      pointerEvents: 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Calculations & Form Values */}
        <div className="col-md-5">
          {/* Coverage Summary styled to match document screenshots */}
          <div className="clinic-card text-center py-4 bg-white">
            <div className="text-muted small mb-2">Calculated Plaque Coverage</div>
            <div className="display-3 font-weight-normal text-danger mb-2" style={{ color: '#EF4444', fontFamily: 'Outfit, sans-serif' }}>
              {coveragePercentage}%
            </div>
            <div className="text-muted small">
              Status: <strong className="text-secondary">{analysis?.status === 'Approved' || analysis?.status === 1 ? 'Approved' : 'Pending Approval'}</strong>
            </div>
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
                            <option value="Middle">Middle</option>
                            <option value="Incisal">Incisal</option>
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

            <div className="mb-4 p-3 bg-light rounded border text-start">
              <label className="form-label xsmall font-weight-bold text-teal d-flex align-items-center mb-1" style={{ color: '#0D9488' }}>
                Billing Adjustments & Special Tools
              </label>
              <p className="xsmall text-muted mb-2">Pre-recommend adjustments based on case severity and special instruments used. This will pop up in the receptionist's billing panel.</p>
              
              <div className="row g-2">
                <div className="col-sm-6">
                  <label className="form-label xsmall font-weight-bold text-secondary">Severity Pricing</label>
                  <select 
                    className="form-select form-select-sm"
                    value={severityAdjustment}
                    onChange={(e) => setSeverityAdjustment(e.target.value)}
                  >
                    <option value="none">Fixed / Standard Clinic Rate</option>
                    <option value="moderate">Moderate Case (+₱1,000 deep scale)</option>
                    <option value="severe">Severe Case (+₱2,000 ultrasonic & tools)</option>
                    <option value="custom">Custom recommended rate...</option>
                  </select>
                </div>
                {severityAdjustment === 'custom' && (
                  <div className="col-sm-6">
                    <label className="form-label xsmall font-weight-bold text-secondary">Recommended Rate (₱)</label>
                    <input 
                      type="number" 
                      className="form-control form-control-sm"
                      placeholder="e.g. 1500"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                    />
                  </div>
                )}
                <div className="col-12">
                  <label className="form-label xsmall font-weight-bold text-secondary">Special Instruments Required</label>
                  <input 
                    type="text" 
                    className="form-control form-control-sm"
                    placeholder="e.g. Ultrasonic scaler, laser sterilization, subgingival curettes"
                    value={specialTools}
                    onChange={(e) => setSpecialTools(e.target.value)}
                  />
                </div>
              </div>
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
