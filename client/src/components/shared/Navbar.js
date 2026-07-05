import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Layers, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
    setOpen(false);
  };

  const isActive = path => location.pathname === path;

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(250, 248, 243, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      fontFamily: 'var(--font-body)'
    }}>
      <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:'64px' }}>
        {/* Logo */}
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:'10px', textDecoration:'none' }}>
          <div style={{ width:36, height:36, background:'var(--gold)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Layers size={18} color="white" />
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap:'4px' }}>
            <span style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:800, color:'var(--charcoal)', letterSpacing:'0.03em', textTransform:'uppercase' }}>
              Stratum
            </span>
            <span style={{ fontFamily:'var(--font-body)', fontSize:'0.625rem', fontWeight:600, color:'var(--gold-dark)', letterSpacing:'0.05em', textTransform:'uppercase' }}>
              by DSYN
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div style={{ display:'flex', alignItems:'center', gap:'2rem' }} className="desktop-nav">
          {[
            { path:'/', label:'Home' },
            { path:'/visualizer', label:'Visualizer' },
            { path:'/products', label:'Products' },
          ].map(({ path, label }) => (
            <Link key={path} to={path} style={{
              textDecoration:'none',
              fontSize:'0.875rem',
              fontWeight: isActive(path) ? 600 : 400,
              color: isActive(path) ? 'var(--gold-dark)' : 'var(--charcoal-light)',
              borderBottom: isActive(path) ? '2px solid var(--gold)' : '2px solid transparent',
              paddingBottom:'2px',
              transition:'all 0.15s'
            }}>
              {label}
            </Link>
          ))}
        </div>

        {/* Auth area */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          {user ? (
            <div className="desktop-nav" style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <Link to="/dashboard" className="btn btn-ghost btn-sm" style={{ display:'flex', alignItems:'center', gap:6 }}>
                <User size={15} />
                <span className="hidden-mobile">
                  {user.name.split(' ')[0]}
                </span>
              </Link>
              {isAdmin && (
                <Link to="/admin" className="btn btn-secondary btn-sm">
                  <Settings size={14} />
                </Link>
              )}
              <button onClick={handleLogout} className="btn btn-ghost btn-sm" title="Sign out">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="desktop-nav" style={{ display:'flex', gap:'0.75rem' }}>
              <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="btn btn-ghost btn-sm"
            style={{ display: 'none' }}
            aria-label="Toggle menu"
            id="mobile-menu-btn"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{
          background: 'var(--cream)',
          borderTop: '1px solid var(--border)',
          padding: '1rem'
        }}>
          {[
            { path:'/', label:'Home' },
            { path:'/visualizer', label:'AI Visualizer' },
            { path:'/products', label:'Products' },
            ...(user ? [{ path:'/dashboard', label:'My Renders' }] : []),
            ...(isAdmin ? [{ path:'/admin', label:'Admin Panel' }] : [])
          ].map(({ path, label }) => (
            <Link key={path} to={path} onClick={() => setOpen(false)} style={{
              display:'block', padding:'0.625rem 0',
              textDecoration:'none', color:'var(--charcoal)',
              borderBottom:'1px solid var(--border)',
              fontSize:'0.9375rem'
            }}>
              {label}
            </Link>
          ))}
          {user ? (
            <button onClick={handleLogout} style={{
              display:'block', width:'100%', textAlign:'left',
              padding:'0.625rem 0', background:'none', border:'none',
              color:'var(--charcoal-light)', fontSize:'0.9375rem', cursor:'pointer', marginTop:'0.5rem'
            }}>
              Sign out
            </button>
          ) : (
            <div style={{ display:'flex', gap:'0.75rem', marginTop:'1rem' }}>
              <Link to="/login" className="btn btn-secondary" style={{ flex:1, justifyContent:'center' }} onClick={() => setOpen(false)}>Sign in</Link>
              <Link to="/register" className="btn btn-primary" style={{ flex:1, justifyContent:'center' }} onClick={() => setOpen(false)}>Register</Link>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
