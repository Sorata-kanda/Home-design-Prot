import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ name:'', email:'', phone:'', city:'', password:'' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created!');
      navigate('/visualizer');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div style={{ minHeight:'calc(100vh - 64px)', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--cream)', padding:'2rem 1rem' }}>
      <div style={{ width:'100%', maxWidth:440 }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ width:52, height:52, background:'var(--gold)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
            <Layers size={24} color="white" />
          </div>
          <h2>Create your account</h2>
          <p style={{ margin:'0.5rem 0 0' }}>Save renders, track quotes, share with clients</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
            <div>
              <label>Full name *</label>
              <input type="text" value={form.name} onChange={set('name')} required placeholder="Your name" />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.875rem' }}>
              <div>
                <label>Email *</label>
                <input type="email" value={form.email} onChange={set('email')} required placeholder="you@email.com" />
              </div>
              <div>
                <label>Phone</label>
                <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98xxx xxxxx" />
              </div>
            </div>
            <div>
              <label>City</label>
              <input type="text" value={form.city} onChange={set('city')} placeholder="Ludhiana, Tarn Taran…" />
            </div>
            <div>
              <label>Password *</label>
              <input type="password" value={form.password} onChange={set('password')} required placeholder="At least 6 characters" minLength={6} />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ justifyContent:'center', marginTop:4 }}>
              {loading ? <><div className="spinner" style={{ width:18, height:18, borderWidth:2 }} /> Creating account…</> : 'Create account'}
            </button>
          </form>
        </div>
        <p style={{ textAlign:'center', marginTop:'1.25rem', fontSize:'0.875rem' }}>
          Already have an account? <Link to="/login" style={{ color:'var(--gold-dark)', fontWeight:500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
