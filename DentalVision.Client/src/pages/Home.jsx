import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaClinicMedical, 
  FaArrowRight, 
  FaMicroscope, 
  FaHeartbeat, 
  FaShieldAlt, 
  FaTooth, 
  FaCalendarCheck, 
  FaUsers 
} from 'react-icons/fa';

const Home = () => {
  const { user } = useAuth();
  const [sliderVal, setSliderVal] = useState(50); // percentage for before/after comparison

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#334155', fontFamily: 'Outfit, sans-serif', overflowX: 'hidden' }}>
      
      {/* Premium Public Header/Navbar */}
      <header style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="container d-flex justify-content-between align-items-center py-3">
          <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none" style={{ color: '#0ea5e9' }}>
            <FaClinicMedical size={26} />
            <span className="h4 m-0 font-weight-bold" style={{ letterSpacing: '0.8px', color: '#0f172a' }}>
              Dental<span style={{ color: '#0ea5e9' }}>Vision</span>
            </span>
          </Link>
          <div className="d-flex align-items-center gap-3">
            {user ? (
              <Link 
                to={user.role === 4 || user.role === 'Patient' ? "/my-profile" : "/dashboard"} 
                className="btn btn-sm px-4 text-white"
                style={{
                  background: 'linear-gradient(90deg, #14b8a6, #0ea5e9)',
                  border: 'none',
                  fontWeight: 'bold',
                  borderRadius: '30px',
                  boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)'
                }}
              >
                Go to Portal <FaArrowRight className="ms-1" size={11} />
              </Link>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="btn btn-sm px-4 text-white"
                  style={{
                    background: 'linear-gradient(90deg, #14b8a6, #0ea5e9)',
                    border: 'none',
                    fontWeight: 'bold',
                    borderRadius: '30px',
                    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)'
                  }}
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-5" style={{
        background: 'radial-gradient(circle at 85% 20%, rgba(14, 165, 233, 0.08) 0%, rgba(248, 250, 252, 0) 60%)'
      }}>
        <div className="container py-5">
          <div className="row align-items-center g-5">
            <div className="col-lg-6 text-start">
              {/* <span className="badge mb-3 px-3 py-2" style={{
                background: 'rgba(13, 148, 136, 0.06)',
                border: '1px solid rgba(13, 148, 136, 0.15)',
                color: '#0d9488',
                borderRadius: '30px',
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
              </span> */}
              
              <h1 className="display-4 font-weight-bold mb-4" style={{ lineHeight: '1.15', fontWeight: 800, color: '#0f172a' }}>
                Next-Gen Automated <br />
                <span style={{ 
                  background: 'linear-gradient(90deg, #0ea5e9, #0d9488)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Plaque Segmentation
                </span>
              </h1>
              
              <p className="text-secondary mb-5 lead" style={{ fontSize: '18px', color: '#475569', lineHeight: '1.6' }}>
                DentalVision empowers modern clinics with real-time plaque boundary mapping, automated FDI tooth anatomy classification, and high-fidelity PDF report exporting to elevate patient clinical tracking.
              </p>

              <div className="d-flex flex-wrap gap-3">
                <Link 
                  to="/login" 
                  className="btn btn-lg px-4 py-3 d-flex align-items-center gap-2 text-white"
                  style={{
                    background: 'linear-gradient(90deg, #14b8a6, #0ea5e9)',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    borderRadius: '8px',
                    boxShadow: '0 10px 20px -5px rgba(14, 165, 233, 0.3)'
                  }}
                >
                  Access Platform Portal <FaArrowRight size={13} />
                </Link>
                <a 
                  href="#scanner-demo" 
                  className="btn btn-lg px-4 py-3 border text-secondary"
                  style={{
                    borderColor: '#cbd5e1',
                    background: '#ffffff',
                    fontWeight: '600',
                    fontSize: '15px',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  Interactive AI Demo
                </a>
              </div>

              {/* Technical Stack Meta info */}
              {/* <div className="mt-5 d-flex gap-4 align-items-center">
                <div className="border-end pe-4 border-light-subtle">
                  <div className="h4 font-weight-bold mb-0 text-dark" style={{ color: '#0f172a' }}>Roboflow</div>
                  <div className="xsmall text-muted">Cloud Inference Engine</div>
                </div>
                <div className="border-end pe-4 border-light-subtle">
                  <div className="h4 font-weight-bold mb-0 text-dark" style={{ color: '#0f172a' }}>YOLOv8</div>
                  <div className="xsmall text-muted">Local Failover Model</div>
                </div>
                <div>
                  <div className="h4 font-weight-bold mb-0 text-dark" style={{ color: '#0f172a' }}>QuestPDF</div>
                  <div className="xsmall text-muted">Clinical Exporter</div>
                </div>
              </div>*/}
            </div> 

            <div className="col-lg-6">
              <div className="position-relative" style={{
                borderRadius: '16px',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                background: '#ffffff',
                padding: '10px',
                boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08)'
              }}>
                <img 
                  src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80" 
                  alt="Dental Office Workspace Stock" 
                  className="img-fluid"
                  style={{ borderRadius: '12px', width: '100%', height: '360px', objectFit: 'cover' }}
                />
                
                {/* floating overlay tech badge */}
                <div className="position-absolute p-3 rounded" style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  bottom: '30px',
                  right: '30px',
                  borderRadius: '10px',
                  textAlign: 'left',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}>
                  <div className="xsmall text-muted mb-1" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Model Status</div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="d-inline-block rounded-circle" style={{ width: '8px', height: '8px', background: '#10b981' }} />
                    <span className="small font-weight-bold text-dark" style={{ color: '#0f172a' }}>Active Segmenter Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Plaque Comparison Simulator Section */}
      <section id="scanner-demo" className="py-5" style={{ background: '#ffffff', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
        <div className="container py-5">
          <div className="text-center max-w-xl mx-auto mb-5">
            <span className="text-teal font-weight-bold small uppercase" style={{ color: '#0ea5e9', letterSpacing: '1px' }}>AI Live Demo</span>
            <h2 className="h1 font-weight-bold mt-2 mb-3 text-dark" style={{ color: '#0f172a' }}>Live Disclosing Scanner</h2>
            <p className="text-secondary">Drag the controller slider across the dental clinical photo to witness how the AI isolates plaque disclosing solution stains at the gumline.</p>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-8">
              {/* Slider Container */}
              <div className="position-relative overflow-hidden shadow-sm" style={{
                borderRadius: '16px',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                height: '420px',
                background: '#f8fafc'
              }}>
                {/* Layer 1: Raw Image */}
                <img 
                  src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80" 
                  alt="Raw Dental Stains" 
                  className="position-absolute top-0 left-0 w-100 h-100"
                  style={{ objectFit: 'cover' }}
                />

                {/* Layer 2: Stained Image with Neon Green AI contour overlay */}
                <div 
                  className="position-absolute top-0 left-0 w-100 h-100 overflow-hidden"
                  style={{
                    clipPath: `inset(0 ${100 - sliderVal}% 0 0)`,
                    transition: 'clip-path 0.05s linear'
                  }}
                >
                  <img 
                    src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80" 
                    alt="AI Scanned Plaque" 
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                  />
                  {/* Neon Green overlay mask */}
                  <div className="position-absolute top-0 left-0 w-100 h-100" style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    mixBlendMode: 'multiply'
                  }} />

                  {/* SVG AI Contours Overlay */}
                  <svg 
                    viewBox="0 0 800 500" 
                    className="w-100 h-100 position-absolute top-0 left-0" 
                    style={{ pointerEvents: 'none' }}
                  >
                    {/* Simulated Neon plaque outlines */}
                    <polygon points="120,240 160,200 240,210 260,260 210,290 150,280" fill="rgba(16, 185, 129, 0.45)" stroke="#10b981" strokeWidth="2.5" />
                    <polygon points="310,220 370,180 430,190 450,250 400,280 330,270" fill="rgba(16, 185, 129, 0.45)" stroke="#10b981" strokeWidth="2.5" />
                    <polygon points="500,240 550,200 620,215 640,270 590,300 530,290" fill="rgba(16, 185, 129, 0.45)" stroke="#10b981" strokeWidth="2.5" />
                  </svg>
                </div>

                {/* Vertical Divider bar */}
                <div 
                  className="position-absolute top-0 bottom-0"
                  style={{
                    left: `${sliderVal}%`,
                    width: '3px',
                    background: 'linear-gradient(#0ea5e9, #14b8a6)',
                    boxShadow: '0 0 8px rgba(14, 165, 233, 0.6)',
                    zIndex: 20,
                    pointerEvents: 'none',
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="position-absolute top-50 start-50 translate-middle rounded-circle d-flex align-items-center justify-content-center" style={{
                    width: '32px',
                    height: '32px',
                    background: '#0ea5e9',
                    border: '3px solid #ffffff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}>
                    <span className="small text-white" style={{ fontSize: '9px', fontWeight: 'bold' }}>↔</span>
                  </div>
                </div>

                {/* Slider Input overlay */}
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={sliderVal} 
                  onChange={(e) => setSliderVal(parseInt(e.target.value))}
                  className="position-absolute top-0 left-0 w-100 h-100"
                  style={{
                    opacity: 0,
                    cursor: 'ew-resize',
                    zIndex: 30
                  }}
                />

                {/* Left Side Label (AI Mode) */}
                <div className="position-absolute p-2 rounded" style={{
                  background: '#10b981',
                  top: '20px',
                  left: '20px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  zIndex: 25
                }}>
                  AI SEGMENTATION DETECTED
                </div>

                {/* Right Side Label (Raw Stains) */}
                <div className="position-absolute p-2 rounded" style={{
                  background: '#475569',
                  top: '20px',
                  right: '20px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  zIndex: 25
                }}>
                  RAW PHOTOGRAPHY
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-5" style={{ background: '#f8fafc' }}>
        <div className="container py-5">
          <div className="text-center max-w-xl mx-auto mb-5">
            <span className="text-teal font-weight-bold small uppercase" style={{ color: '#0ea5e9', letterSpacing: '1px' }}>Platform Highlights</span>
            <h2 className="h1 font-weight-bold mt-2 mb-3 text-dark" style={{ color: '#0f172a' }}>Engineered for Precision</h2>
            <p className="text-secondary">A look under the hood of DentalVision's integrated clinical assistant system.</p>
          </div>

          <div className="row g-4 justify-content-center text-start">
            <div className="col-md-4">
              <div className="p-4" style={{
                borderRadius: '12px',
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.05)',
                height: '100%',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
              }}>
                <div className="mb-3 d-inline-flex align-items-center justify-content-center rounded" style={{
                  width: '45px',
                  height: '45px',
                  background: 'rgba(20, 184, 166, 0.08)',
                  color: '#0d9488'
                }}>
                  <FaMicroscope size={22} />
                </div>
                <h5 className="font-weight-bold mb-2 text-dark" style={{ color: '#0f172a' }}>Hybrid Inference Pipeline</h5>
                <p className="text-secondary small mb-0">
                  Integrates with OpenCV for high-fidelity clinical detections to guarantee uninterrupted off-grid performance.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-4" style={{
                borderRadius: '12px',
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.05)',
                height: '100%',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
              }}>
                <div className="mb-3 d-inline-flex align-items-center justify-content-center rounded" style={{
                  width: '45px',
                  height: '45px',
                  background: 'rgba(14, 165, 233, 0.08)',
                  color: '#0ea5e9'
                }}>
                  <FaTooth size={22} />
                </div>
                <h5 className="font-weight-bold mb-2 text-dark" style={{ color: '#0f172a' }}>Solidity Shape Optimization</h5>
                <p className="text-secondary small mb-0">
                  Applies dynamic mathematical shape-smoothing filtering that conditionalizes cv2.convexHull only on low solidity tooth shapes ($S &lt; 0.8$) to preserve authentic anatomical tooth boundaries.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-4" style={{
                borderRadius: '12px',
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.05)',
                height: '100%',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
              }}>
                <div className="mb-3 d-inline-flex align-items-center justify-content-center rounded" style={{
                  width: '45px',
                  height: '45px',
                  background: 'rgba(244, 63, 94, 0.08)',
                  color: '#f43f5e'
                }}>
                  <FaHeartbeat size={22} />
                </div>
                <h5 className="font-weight-bold mb-2 text-dark" style={{ color: '#0f172a' }}>Anatomical Thirds Mapping</h5>
                <p className="text-secondary small mb-0">
                  Calculates exact plaque distribution coordinates relative to individual tooth crowns, placing hotspots inside cervical, middle, or incisal zones instead of simple height estimations.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-4" style={{
                borderRadius: '12px',
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.05)',
                height: '100%',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
              }}>
                <div className="mb-3 d-inline-flex align-items-center justify-content-center rounded" style={{
                  width: '45px',
                  height: '45px',
                  background: 'rgba(168, 85, 247, 0.08)',
                  color: '#a855f7'
                }}>
                  <FaCalendarCheck size={22} />
                </div>
                <h5 className="font-weight-bold mb-2 text-dark" style={{ color: '#0f172a' }}>Practice Calendar & Booking</h5>
                <p className="text-secondary small mb-0">
                  Built-in scheduling utilities, dentist assigning rules, and dentist verification grids make managing clinic check-ups seamless.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-4" style={{
                borderRadius: '12px',
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.05)',
                height: '100%',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
              }}>
                <div className="mb-3 d-inline-flex align-items-center justify-content-center rounded" style={{
                  width: '45px',
                  height: '45px',
                  background: 'rgba(234, 179, 8, 0.08)',
                  color: '#eab308'
                }}>
                  <FaUsers size={22} />
                </div>
                <h5 className="font-weight-bold mb-2 text-dark" style={{ color: '#0f172a' }}>Dentist Validation Panel</h5>
                <p className="text-secondary small mb-0">
                  Interactive vector node canvas editors let dentists quickly add, edit, or delete plaque locations, overriding AI output for optimal clinical accuracy.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-4" style={{
                borderRadius: '12px',
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.05)',
                height: '100%',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
              }}>
                <div className="mb-3 d-inline-flex align-items-center justify-content-center rounded" style={{
                  width: '45px',
                  height: '45px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  color: '#10b981'
                }}>
                  <FaShieldAlt size={22} />
                </div>
                <h5 className="font-weight-bold mb-2 text-dark" style={{ color: '#0f172a' }}>Audit Trails & Security</h5>
                <p className="text-secondary small mb-0">
                  Enforces role-based access control, secure JWT-authenticated PDF exports, and detailed audit logging to meet medical compliance standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-5" style={{
        background: '#ffffff',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <div className="container text-center text-muted small">
          <div className="d-flex justify-content-center align-items-center gap-2 mb-3 text-dark">
            <FaClinicMedical size={18} style={{ color: '#0ea5e9' }} />
            <span className="font-weight-bold" style={{ color: '#0f172a' }}>DentalVision AI Portal</span>
          </div>
          <p className="mb-3">&copy; {new Date().getFullYear()} DentalVision Corp. All rights reserved. Clinical and diagnostic assistance system.</p>
          <div className="d-flex justify-content-center gap-3">
            <a href="#" className="text-secondary text-decoration-none hover:text-dark">Terms of Service</a>
            <span>&bull;</span>
            <a href="#" className="text-secondary text-decoration-none hover:text-dark">Privacy Policy</a>
            <span>&bull;</span>
            <a href="#" className="text-secondary text-decoration-none hover:text-dark">HIPAA Compliance</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
