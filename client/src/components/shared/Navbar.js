import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Layers, LogOut, User, Settings, ShoppingCart, Sun, Moon } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cartAPI } from '../../utils/api';
import CartDrawer from './CartDrawer';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Show if scrolling up or very close to top, hide if scrolling down past 60px
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartAPI.get().then(r => r.data),
    enabled: !!user // Only fetch if logged in
  });
  const cartItemCount = cartData?.cart?.items?.length || 0;

  const handleLogout = () => {
    logout();
    queryClient.clear(); // Clear cached queries (like orders, renders, cart)
    navigate('/');
    setOpen(false);
  };

  const isActive = path => location.pathname === path;

  return (
    <nav style={{
      position: 'fixed', top: showNavbar ? 0 : '-70px', left: 0, right: 0, zIndex: 1000, width: '100%',
      background: 'rgba(var(--cream-rgb), 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      fontFamily: 'var(--font-body)',
      transition: 'top 0.3s ease-in-out'
    }}>
      <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:'64px' }}>
        {/* Logo */}
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:'10px', textDecoration:'none' }}>
          <div style={{ width:36, height:36, background:'var(--gold)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Layers size={18} color="white" />
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap:'4px' }}>
            <span style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.1rem, 5vw, 1.4rem)', fontWeight:900, color:'var(--charcoal)', letterSpacing:'0.03em', textTransform:'uppercase', textShadow: '0.5px 0 0 var(--charcoal)' }}>
              Stratum
            </span>
            <span className="brand-subtitle" style={{ fontFamily:'var(--font-body)', fontSize:'clamp(0.5rem, 2vw, 0.625rem)', fontWeight:600, color:'var(--gold-dark)', letterSpacing:'0.05em', textTransform:'uppercase' }}>
              by DSYN Luxury
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
          
          <button onClick={toggleTheme} className="btn btn-ghost btn-sm" title="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user && (
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={() => setCartOpen(true)}
              style={{ position:'relative', marginRight: '8px' }}
            >
              <ShoppingCart size={18} />
              {cartItemCount > 0 && (
                <span style={{
                  position:'absolute', top:-4, right:-4, background:'red', color:'white',
                  fontSize:'0.6rem', fontWeight:'bold', width:16, height:16, borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center'
                }}>
                  {cartItemCount}
                </span>
              )}
            </button>
          )}

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

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </nav>
  );
}
