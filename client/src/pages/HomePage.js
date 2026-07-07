import { Link } from 'react-router-dom';
import { Camera, Palette, Download, ArrowRight, Layers, Star, Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const steps = [
  { icon: Camera, title: 'Upload Your Space', desc: 'Take a photo of any space — living room, lobby, staircase, or elevation.' },
  { icon: Palette, title: 'Select Our Stones', desc: 'Browse premium Italian marble, Gwalior stone, Moca Crema, columns, and mouldings.' },
  { icon: Zap, title: 'AI Applies It instantly', desc: 'Our AI maps the material onto your exact space with realistic lighting and reflections.' },
  { icon: Download, title: 'Visualize & Purchase', desc: 'Save the render, share it, or purchase the exact material quantities directly.' }
];

const products = [
  { name: 'Italian Carrara Marble', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz9Peg_M9DBrM8hsvefw2l-lZ4z9ZOZc5W27DwGvub9BPPkLfRs6Nqzbo&s=10', tag: 'From ₹450/sq.ft' },
  { name: 'Moca Crema Limestone', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-knVFgHpPZjc3IEPt6QXhAWOBS2XTp-McTh_XUWRvnQ&s=10', tag: 'From ₹320/sq.ft' },
  { name: 'Gwalior Stone', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgP1hfI32AsJpGEoPy-il7ML8TC1z38BS1k9WNTVSCxg&s=10', tag: 'From ₹85/sq.ft' },
  { name: 'Neoclassical Columns', img: 'https://media.istockphoto.com/id/1352319348/photo/architectural-detail-of-marble-ionic-order-columns.jpg?s=612x612&w=0&k=20&c=tebnyOBnSWBNv5SkKWWwhrpLNsqj1sEKHwHfM5lF22k=', tag: 'Custom Quote' }
];

export default function HomePage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* Luxury Hero Section */}
      <section style={{ 
        position: 'relative', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '6rem 1.25rem',
        overflow: 'hidden'
      }}>
        {/* Background Image / Slider */}
        {/* Background Image */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <img 
            src={theme === 'dark' ? "/images/hero-bg-dark.png" : "/images/hero-bg-light.png"} 
            alt="Luxury Interior" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s ease' }} 
          />
          {/* Theme-aware overlay for text readability */}
          <div style={{ position: 'absolute', inset: 0, background: theme === 'dark' ? 'linear-gradient(to bottom, rgba(26,21,18,0.4), rgba(26,21,18,0.85))' : 'linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0.6))', pointerEvents: 'none', transition: 'background 0.3s ease' }} />
        </div>

        {/* Hero Content (Floating Text without the giant box) */}
        <div className="animate-fade-in-up" style={{ 
          position: 'relative', 
          zIndex: 10,
          padding: '2rem',
          marginTop: '64px', // Optically center below navbar
          maxWidth: '800px',
          width: '100%',
          textAlign: 'center',
          color: 'white',
          pointerEvents: 'none'
        }}>
          
          <h1 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: 'clamp(2.5rem, 10vw, 6.5rem)', 
            fontWeight: 600, 
            letterSpacing: '0.08em', 
            lineHeight: 1,
            margin: '0',
            textTransform: 'uppercase',
            color: 'var(--charcoal)',
            textShadow: theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.8)' : '0 4px 30px rgba(255,255,255,1)'
          }}>
            Stratum
          </h1>
          
          <h3 style={{ 
            fontFamily: 'var(--font-body)', 
            fontSize: 'clamp(0.875rem, 2vw, 1.25rem)', 
            fontWeight: 600, 
            letterSpacing: '0.35em', 
            color: 'var(--gold)', 
            textTransform: 'uppercase',
            margin: '0.5rem 0 2.5rem 0.35em',
            textShadow: theme === 'dark' ? '0 2px 10px rgba(0,0,0,0.8)' : '0 2px 15px rgba(255,255,255,0.9)'
          }}>
            by DSYN Luxury
          </h3>
          
          <p style={{ 
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)', 
            color: 'var(--charcoal)', 
            lineHeight: 1.4, 
            maxWidth: '600px', 
            margin: '0 auto 1rem',
            fontWeight: 500,
            textShadow: theme === 'dark' ? '0 2px 10px rgba(0,0,0,0.8)' : '0 2px 20px rgba(255,255,255,1)'
          }}>
            See stone in <span style={{ color: 'var(--gold)' }}>your space</span> before you buy.
          </p>
          
          <p style={{ 
            fontSize: '1rem', 
            color: 'var(--charcoal)', 
            opacity: 0.9,
            lineHeight: 1.7, 
            maxWidth: '600px', 
            margin: '0 auto 2.5rem',
            fontWeight: 500,
            textShadow: theme === 'dark' ? '0 2px 10px rgba(0,0,0,0.8)' : '0 2px 20px rgba(255,255,255,1)'
          }}>
            Upload a photo of your room. Our cutting-edge AI seamlessly maps premium Italian marble, Gwalior stone, and architectural mouldings with hyper-realistic lighting.
          </p>
          
          <div className="hero-btns" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', pointerEvents: 'auto' }}>
            <Link to={user ? "/visualizer" : "/login"} className="btn btn-primary btn-lg" style={{ borderRadius: '30px', padding: '1rem 2.5rem' }}>
              Start Visualizing <ArrowRight size={18} />
            </Link>
            <Link to="/products" className="btn btn-lg" style={{ 
              borderRadius: '30px', 
              padding: '1rem 2.5rem', 
              color: 'var(--charcoal)',
              background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.6)',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.6)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.4)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              Browse Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Editorial Material Showcase (Masonry Grid) */}
      <section style={{ padding: '6rem 0', background: 'var(--cream)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }} className="animate-fade-in-up delay-100">
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--charcoal)' }}>The Stratum Collection</h2>
            <p style={{ color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.875rem', fontWeight: 600 }}>Curated Natural Stone</p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '1.5rem',
            gridAutoRows: '280px'
          }}>
            {products.map((p, i) => (
              <div key={i} className="animate-fade-in-up" style={{ 
                position: 'relative', 
                borderRadius: '16px', 
                overflow: 'hidden', 
                cursor: 'pointer',
                animationDelay: `${(i + 2) * 100}ms`
              }}>
                <img src={p.img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)' }}
                  onMouseEnter={e => e.target.style.transform = 'scale(1.08)'}
                  onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,21,18,0.8) 0%, transparent 50%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '24px', left: '24px', pointerEvents: 'none' }}>
                  <p style={{ color: 'white', fontFamily: 'var(--font-display)', fontSize: '1.5rem', margin: '0 0 4px', letterSpacing: '0.02em' }}>{p.name}</p>
                  <p style={{ color: 'var(--gold-light)', fontSize: '0.875rem', margin: 0, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{p.tag}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Process (Clean minimal cards) */}
      <section className="section" style={{ background: 'var(--warm-white)', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }} className="animate-fade-in-up">
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--charcoal)', marginBottom: '0.5rem' }}>Effortless Transformation</h2>
            <p style={{ color: 'var(--charcoal-light)', maxWidth: '600px', margin: '0 auto', fontSize: '1.125rem' }}>From raw photo to luxurious vision in under 15 seconds.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2.5rem' }}>
            {steps.map((step, i) => (
              <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${(i + 1) * 100}ms` }}>
                <div style={{ 
                  width: '64px', height: '64px', background: 'var(--cream)', border: '1px solid var(--border)', 
                  borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  marginBottom: '1.5rem', position: 'relative' 
                }}>
                  <step.icon size={28} color="var(--gold)" />
                  <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '28px', height: '28px', background: 'var(--charcoal-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.875rem', fontWeight: 600, border: '3px solid var(--warm-white)' }}>
                    {i + 1}
                  </div>
                </div>
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', color: 'var(--charcoal)' }}>{step.title}</h3>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--charcoal-light)' }}>{step.desc}</p>
              </div>
            ))}
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '4rem' }}>
            <Link to="/visualizer" className="btn btn-primary btn-lg" style={{ borderRadius: '30px', padding: '1rem 3rem' }}>
              Experience It Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '1rem 0', background: 'var(--charcoal-bg)', color: 'rgba(255,255,255,0.7)' }}>
        <div className="container footer-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Logo (Left) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <div style={{ width: 28, height: 28, background: 'var(--gold)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={14} color="white" />
            </div>
            <div style={{ display:'flex', alignItems:'baseline', gap:'4px' }}>
              <span style={{ fontFamily:'var(--font-display)', fontSize:'1.25rem', fontWeight:600, color:'white', letterSpacing:'0.05em', textTransform:'uppercase' }}>
                Stratum
              </span>
              <span style={{ fontFamily:'var(--font-body)', fontSize:'0.5625rem', fontWeight:600, color:'var(--gold-light)', letterSpacing:'0.05em', textTransform:'uppercase' }}>
                by DSYN Luxury
              </span>
            </div>
          </div>

          {/* Rights (Middle) */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ fontSize: '0.8125rem', margin: 0, color: 'rgba(255,255,255,0.7)' }}>&copy; {new Date().getFullYear()} Arteffects. All rights reserved.</p>
          </div>
          
          {/* Contact (Right) */}
          <div style={{ flex: 1, textAlign: 'right' }}>
            <p style={{ fontSize: '0.8125rem', margin: 0, color: 'rgba(255,255,255,0.7)' }}>Ludhiana &middot; Tarn Taran</p>
          </div>
          
        </div>
      </footer>
    </div>
  );
}
