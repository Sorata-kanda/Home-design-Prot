import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '867552162537735-fakeclientid.apps.googleusercontent.com';

function getGoogleOAuthUrl(page) {
  const redirect = `${window.location.origin}/${page}`;
  const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirect)}&response_type=id_token&scope=openid%20email%20profile&nonce=${nonce}`;
}

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Handle Google OAuth redirect callback
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('id_token=')) {
      const params = new URLSearchParams(hash.substring(1));
      const idToken = params.get('id_token');
      if (idToken) {
        window.history.replaceState(null, '', window.location.pathname);
        setLoading(true);
        loginWithGoogle(idToken)
          .then(user => {
            toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
            navigate(user.role === 'admin' ? '/admin' : '/visualizer');
          })
          .catch(err => {
            toast.error(err.response?.data?.error || 'Google Sign-in failed');
          })
          .finally(() => setLoading(false));
      }
    }
  }, []);

  const handleGoogleSignIn = () => {
    window.location.href = getGoogleOAuthUrl('login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'admin' ? '/admin' : '/visualizer');
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.unverified) {
        toast.error('Email not verified. Redirecting to verification...');
        navigate('/register', { state: { email: err.response.data.email, step: 'verify' } });
      } else {
        toast.error(err.response?.data?.error || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'calc(100vh - 64px)', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--cream)', padding:'2rem 1rem' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ width:52, height:52, background:'var(--gold)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
            <Layers size={24} color="white" />
          </div>
          <h2>Sign in to Stratum</h2>
          <p style={{ margin:'0.5rem 0 0' }}>Access your visualizations and saved renders</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div>
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="your@email.com" required autoComplete="email" />
            </div>
            <div>
              <label>Password</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••" required autoComplete="current-password" />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ justifyContent:'center', marginTop:4 }}>
              {loading ? <><div className="spinner" style={{ width:18, height:18, borderWidth:2 }} /> Signing in…</> : 'Sign in'}
            </button>
          </form>
          
          <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', gap: '0.75rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
            <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          </div>
          
          <button onClick={handleGoogleSignIn} type="button" disabled={loading}
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.625rem', padding:'0.625rem 1rem', background:'white', border:'1px solid var(--border)', borderRadius:8, cursor:'pointer', fontSize:'0.875rem', fontWeight:500, color:'var(--charcoal)', transition:'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8f8f8'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Sign in with Google
          </button>
        </div>
        <p style={{ textAlign:'center', marginTop:'1.25rem', fontSize:'0.875rem' }}>
          Don't have an account? <Link to="/register" style={{ color:'var(--gold-dark)', fontWeight:500 }}>Create one free</Link>
        </p>
      </div>
    </div>
  );
}
