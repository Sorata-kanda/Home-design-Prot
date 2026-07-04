import { Link } from 'react-router-dom';
import { Camera, Palette, Download, Star, ArrowRight, Layers } from 'lucide-react';

const steps = [
  { icon: Camera, title: 'Upload your room', desc: 'Take a photo of any space — living room, lobby, staircase, elevation.' },
  { icon: Palette, title: 'Select our stones', desc: 'Browse marble, Gwalior stone, Moca Crema, columns, mouldings and more.' },
  { icon: Layers, title: 'AI applies it', desc: 'Our AI maps the material onto your exact space with realistic lighting.' },
  { icon: Download, title: 'Download & quote', desc: 'Save the render, share it, or request a quote with one tap.' }
];

const products = [
  { name: 'Italian Marble', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz9Peg_M9DBrM8hsvefw2l-lZ4z9ZOZc5W27DwGvub9BPPkLfRs6Nqzbo&s=10', tag: 'From ₹450/sq.ft' },
  { name: 'Gwalior Stone', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgP1hfI32AsJpGEoPy-il7ML8TC1z38BS1k9WNTVSCxg&s=10', tag: 'From ₹85/sq.ft' },
  { name: 'Moca Crema', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-knVFgHpPZjc3IEPt6QXhAWOBS2XTp-McTh_XUWRvnQ&s=10', tag: 'From ₹320/sq.ft' },
  { name: 'Ionic Columns', img: 'https://media.istockphoto.com/id/1352319348/photo/architectural-detail-of-marble-ionic-order-columns.jpg?s=612x612&w=0&k=20&c=tebnyOBnSWBNv5SkKWWwhrpLNsqj1sEKHwHfM5lF22k=', tag: 'Custom quote' }
];


export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section style={{ padding: '5rem 0 4rem', textAlign: 'center', background: 'linear-gradient(180deg, var(--warm-white) 0%, var(--cream) 100%)' }}>
        <div className="container">
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'0.375rem 1rem', background:'rgba(201,168,76,0.12)', borderRadius:20, marginBottom:'1.5rem' }}>
            <Star size={14} color="var(--gold)" fill="var(--gold)" />
            <span style={{ fontSize:'0.8125rem', color:'var(--gold-dark)', fontWeight:500 }}>AI-powered room visualizer</span>
          </div>
          <h1 style={{ marginBottom:'1.25rem', color:'var(--charcoal)' }}>
            See our stone in<br />
            <span style={{ color:'var(--gold)' }}>your space</span> — before you buy
          </h1>
          <p style={{ maxWidth:520, margin:'0 auto 2.5rem', fontSize:'1.0625rem', color:'var(--charcoal-light)', lineHeight:1.7 }}>
            Upload a photo of your room. Our AI places Arteffects marble, stone, and mouldings exactly where you want them — with real lighting, texture, and finish.
          </p>
          <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/visualizer" className="btn btn-primary btn-lg">
              Try the visualizer <ArrowRight size={18} />
            </Link>
            <Link to="/products" className="btn btn-secondary btn-lg">
              Browse products
            </Link>
          </div>
        </div>
      </section>

      {/* Sample renders teaser */}
      <section style={{ padding: '3rem 0', background: 'var(--charcoal)', overflow: 'hidden' }}>
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'0.75rem', borderRadius:16, overflow:'hidden' }}>
            {products.map((p, i) => (
              <div key={i} style={{ position:'relative', aspectRatio:'4/3', overflow:'hidden', cursor:'pointer' }}>
                <img src={p.img} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s ease' }}
                  onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(44,36,32,0.7) 0%, transparent 60%)' }} />
                <div style={{ position:'absolute', bottom:12, left:12 }}>
                  <p style={{ color:'white', fontWeight:500, fontSize:'0.875rem', margin:0 }}>{p.name}</p>
                  <p style={{ color:'var(--gold-light)', fontSize:'0.75rem', margin:0 }}>{p.tag}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section" style={{ background:'var(--warm-white)' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:'3rem' }}>
            <p style={{ color:'var(--gold)', fontSize:'0.8125rem', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>The process</p>
            <h2>From photo to vision in under 15 seconds</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'2rem' }}>
            {steps.map((step, i) => (
              <div key={i} style={{ textAlign:'center' }}>
                <div style={{ width:56, height:56, background:'rgba(201,168,76,0.12)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
                  <step.icon size={24} color="var(--gold)" />
                </div>
                <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:24, height:24, background:'var(--gold)', borderRadius:'50%', marginBottom:8 }}>
                  <span style={{ color:'white', fontSize:'0.75rem', fontWeight:700 }}>{i + 1}</span>
                </div>
                <h3 style={{ marginBottom:8, fontSize:'1.1rem' }}>{step.title}</h3>
                <p style={{ fontSize:'0.875rem', lineHeight:1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign:'center', marginTop:'3rem' }}>
            <Link to="/visualizer" className="btn btn-primary btn-lg">
              Start visualizing free <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Neoclassical presets callout */}
      <section className="section" style={{ background:'var(--charcoal)', color:'white' }}>
        <div className="container" style={{ textAlign:'center' }}>
          <h2 style={{ color:'var(--gold-light)', marginBottom:'1rem' }}>Neoclassical one-click presets</h2>
          <p style={{ color:'rgba(255,255,255,0.7)', maxWidth:480, margin:'0 auto 2rem' }}>
            Add Ionic columns, ornate cornices, and Gwalior wainscoting to any photo instantly — no manual selection needed.
          </p>
          <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
            {['Ionic Columns', 'Cornice Moulding', 'Wainscoting', 'Full Neoclassical'].map(preset => (
              <span key={preset} style={{ padding:'0.5rem 1.25rem', border:'1px solid rgba(201,168,76,0.4)', borderRadius:20, fontSize:'0.875rem', color:'var(--gold-light)' }}>
                {preset}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding:'2rem 0', borderTop:'1px solid var(--border)', background:'var(--cream)' }}>
        <div className="container" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:28, height:28, background:'var(--gold)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Layers size={14} color="white" />
            </div>
            <span style={{ fontFamily:'var(--font-display)', fontWeight:600, color:'var(--charcoal)' }}>Arteffects</span>
          </div>
          <p style={{ fontSize:'0.8125rem', margin:0 }}>
            Stone &amp; Moulding Specialists · Ludhiana / Tarn Taran
          </p>
          <p style={{ fontSize:'0.8125rem', margin:0 }}>
            © {new Date().getFullYear()} Arteffects. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
