import React, { useState, useRef, useEffect } from 'react';

export default function BeforeAfterSlider({ beforeImage, afterImage, overlay }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);

  // Auto-slide effect on mount
  useEffect(() => {
    let timeout;
    timeout = setTimeout(() => {
      setSliderPos(75);
    }, 1000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: '16px', boxShadow: 'var(--shadow-lg)' }}>
      {/* Before Image */}
      <img src={beforeImage} alt="Before" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      
      {/* After Image */}
      <img src={afterImage} alt="After" style={{ 
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover',
          clipPath: `inset(0 ${100 - sliderPos}% 0 0)`
      }} />

      {/* Optional Overlay (goes over images, under handle) */}
      {overlay && <div style={{ position: 'absolute', inset: 0, background: overlay, pointerEvents: 'none' }} />}
      
      {/* Invisible Range Slider */}
      <input 
        type="range" 
        min="0" max="100" 
        value={sliderPos} 
        onChange={(e) => setSliderPos(e.target.value)}
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          opacity: 0, cursor: 'ew-resize', zIndex: 10
        }}
      />
      
      {/* Visual Slider Line */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${sliderPos}%`, width: '2px', background: 'var(--gold)', transform: 'translateX(-50%)', pointerEvents: 'none', transition: 'left 0.1s ease-out' }}>
        <div style={{ 
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
          width: '40px', height: '40px', background: 'var(--gold)', borderRadius: '50%', 
          display: 'flex', alignItems: 'center', justifyContent: 'space-around', 
          padding: '0 8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', border: '2px solid white' 
        }}>
          {/* Arrows inside handle */}
          <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderRight: '5px solid white' }} />
          <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '5px solid white' }} />
        </div>
      </div>
      
      {/* Labels */}
      <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', pointerEvents: 'none', opacity: sliderPos > 20 ? 1 : 0, transition: 'opacity 0.3s' }}>
        After
      </div>
      <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', pointerEvents: 'none', opacity: sliderPos < 80 ? 1 : 0, transition: 'opacity 0.3s' }}>
        Before
      </div>
    </div>
  );
}
