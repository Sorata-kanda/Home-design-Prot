import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const location = useLocation();
  const [form, setForm] = useState({ 
    name: '', 
    email: location.state?.email || '', 
    phone: '', 
    city: '', 
    password: '' 
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(location.state?.step || 'register'); // 'register' or 'verify'
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [timer, setTimer] = useState(0);
  const { register, loginWithGoogle, verifyOTP, resendOTP } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google && step === 'register') {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || '867552162537735-fakeclientid.apps.googleusercontent.com',
          callback: handleGoogleCredentialResponse,
        });
        setTimeout(() => {
          const btnDiv = document.getElementById('google-signup-btn');
          if (btnDiv) {
            window.google.accounts.id.renderButton(
              btnDiv,
              { theme: 'outline', size: 'large', width: 336, text: 'signup_with' }
            );
          }
        }, 50);
      }
    };

    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
    } else {
      initializeGoogleSignIn();
    }
  }, [step]);

  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    try {
      await loginWithGoogle(response.credential);
      toast.success('Account created and signed in!');
      navigate('/visualizer');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Google Sign-up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Verification code sent to your email!');
      setStep('verify');
      setTimer(60);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error('Please enter a 6-digit verification code'); return; }
    setVerifying(true);
    try {
      await verifyOTP(form.email, otp);
      toast.success('Email verified successfully! Welcome!');
      navigate('/visualizer');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (timer > 0) return;
    try {
      await resendOTP(form.email);
      toast.success('New verification code sent!');
      setTimer(60);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend code');
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
          {step === 'register' ? (
            <>
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

              <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', gap: '0.75rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div id="google-signup-btn"></div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--charcoal-light)' }}>
                  We sent a 6-digit code to <strong>{form.email}</strong>.
                </p>
              </div>
              <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ textAlign: 'center', display: 'block', marginBottom: '0.5rem' }}>Enter verification code</label>
                  <input 
                    type="text" 
                    value={otp} 
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456" 
                    required 
                    maxLength={6}
                    style={{ fontSize: '1.5rem', letterSpacing: '8px', textAlign: 'center', fontWeight: 'bold' }} 
                  />
                </div>
                <button type="submit" disabled={verifying} className="btn btn-primary btn-lg" style={{ justifyContent: 'center' }}>
                  {verifying ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Verifying…</> : 'Verify Email'}
                </button>
              </form>
              <div style={{ textAlign: 'center', fontSize: '0.8125rem' }}>
                {timer > 0 ? (
                  <span style={{ color: 'var(--charcoal-light)' }}>Resend code in {timer}s</span>
                ) : (
                  <button onClick={handleResendCode} className="btn btn-link" style={{ fontSize: '0.8125rem', padding: 0 }}>
                    Resend verification code
                  </button>
                )}
              </div>
              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <button onClick={() => setStep('register')} className="btn btn-ghost btn-sm">
                  ← Back to registration
                </button>
              </div>
            </div>
          )}
        </div>
        <p style={{ textAlign:'center', marginTop:'1.25rem', fontSize:'0.875rem' }}>
          Already have an account? <Link to="/login" style={{ color:'var(--gold-dark)', fontWeight:500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
