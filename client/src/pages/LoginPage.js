import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'admin' ? '/admin' : '/visualizer');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
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
          <h2>Sign in to Arteffects</h2>
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
        </div>
        <p style={{ textAlign:'center', marginTop:'1.25rem', fontSize:'0.875rem' }}>
          Don't have an account? <Link to="/register" style={{ color:'var(--gold-dark)', fontWeight:500 }}>Create one free</Link>
        </p>
      </div>
    </div>
  );
}
