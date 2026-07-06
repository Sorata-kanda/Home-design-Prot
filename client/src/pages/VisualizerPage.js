import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery } from '@tanstack/react-query';
import { Upload, Camera, Wand2, Download, Share2, MessageSquare, X, ChevronLeft, Zap, Check, RefreshCw, Layers, Eye, EyeOff, Loader, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { visualizerAPI, productsAPI, rendersAPI } from '../utils/api';
import QuoteModal from '../components/visualizer/QuoteModal';
import { useAuth } from '../context/AuthContext';

const PRESETS = [
  { id: 'ionic_columns', label: 'Ionic Columns', desc: 'Grand entrance columns', icon: '🏛️' },
  { id: 'cornice', label: 'Cornice Moulding', desc: 'Ceiling edge detail', icon: '🪄' },
  { id: 'wainscoting', label: 'Gwalior Wainscoting', desc: 'Lower wall panels', icon: '🧱' },
  { id: 'full_neoclassical', label: 'Full Neoclassical', desc: 'Complete transformation', icon: '✨' }
];

const CATEGORY_LABELS = {
  marble: 'Marble', gwalior_stone: 'Gwalior Stone', moca_crema: 'Moca Crema',
  white_stone: 'White Stone', moulding: 'Moulding', column: 'Columns',
  limestone: 'Limestone', granite: 'Granite', other: 'Other'
};

// Color map for zone overlay visualization
const ZONE_COLORS = {
  wall:     { bg: 'rgba(201, 168, 76, 0.15)',  border: 'var(--gold)', label: 'Wall' },
  floor:    { bg: 'rgba(139, 115, 85, 0.12)',  border: 'var(--stone)', label: 'Floor' },
  ceiling:  { bg: 'rgba(44, 36, 32, 0.08)',    border: 'var(--charcoal-light)', label: 'Ceiling' },
  window:   { bg: 'rgba(44, 36, 32, 0.08)',    border: 'var(--charcoal-light)', label: 'Window' },
  door:     { bg: 'rgba(139, 115, 85, 0.12)',  border: 'var(--stone)', label: 'Door' },
  column:   { bg: 'rgba(201, 168, 76, 0.15)',  border: 'var(--gold)', label: 'Column' },
  stairs:   { bg: 'rgba(139, 115, 85, 0.12)',  border: 'var(--stone)', label: 'Stairs' },
  pillar:   { bg: 'rgba(201, 168, 76, 0.15)',  border: 'var(--gold)', label: 'Pillar' },
};

export default function VisualizerPage() {
  const { isExistingCustomer } = useAuth();
  const [step, setStep] = useState(1); // 1=upload, 2=select, 3=result
  const [photo, setPhoto] = useState(null);
  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]); // [{productId, zone, estimatedArea}]
  const [activeZone, setActiveZone] = useState(null);
  const [activePreset, setActivePreset] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [detectedZones, setDetectedZones] = useState([]); // Real zones from SegFormer
  const [segmenting, setSegmenting] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [imageSize, setImageSize] = useState(null); // from segmentation
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);

  const { data: productsData } = useQuery({
    queryKey: ['products', activeCategory],
    queryFn: () => productsAPI.getAll(activeCategory !== 'all' ? { category: activeCategory } : {}).then(r => r.data)
  });

  const products = productsData?.products || [];
  const categories = ['all', ...Object.keys(CATEGORY_LABELS)];

  // Auto-select first detected zone when segmentation completes
  useEffect(() => {
    if (detectedZones.length > 0 && !activeZone) {
      setActiveZone(detectedZones[0].type);
    }
  }, [detectedZones, activeZone]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setPhoto(URL.createObjectURL(file));

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await visualizerAPI.uploadPhoto(formData);
      setUploadedPhoto(res.data);
      setStep(2);
      toast.success('Photo uploaded!');

      // Automatically trigger segmentation
      runSegmentation(res.data.photoUrl);
    } catch (err) {
      toast.error('Upload failed. Please try again.');
      setPhoto(null);
    } finally {
      setUploading(false);
    }
  }, []);

  const runSegmentation = async (photoUrl) => {
    setSegmenting(true);
    try {
      const res = await visualizerAPI.segment(photoUrl);
      const zones = res.data.zones || res.data.fallbackZones || [];
      setDetectedZones(zones);
      setImageSize(res.data.imageSize || null);

      if (zones.length > 0) {
        setActiveZone(zones[0].type);
        toast.success(`Detected ${zones.length} zone${zones.length > 1 ? 's' : ''}: ${zones.map(z => z.type).join(', ')}`);
      } else {
        toast('No zones detected — you can still apply materials manually', { icon: '⚠️' });
      }
    } catch (err) {
      console.error('Segmentation error:', err);
      // Use fallback zones from error response or defaults
      const fallback = err.response?.data?.fallbackZones || [
        { type: 'wall', coverage: 0.35, coveragePct: 35, confidence: 0.70 },
        { type: 'floor', coverage: 0.25, coveragePct: 25, confidence: 0.70 },
        { type: 'ceiling', coverage: 0.15, coveragePct: 15, confidence: 0.60 }
      ];
      setDetectedZones(fallback);
      setActiveZone(fallback[0]?.type || 'wall');
      toast('Using approximate zones (AI segmentation unavailable)', { icon: '⚠️' });
    } finally {
      setSegmenting(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 15 * 1024 * 1024
  });

  const toggleProduct = (product) => {
    const exists = selectedProducts.find(p => p.productId === product._id && p.zone === activeZone);
    if (exists) {
      setSelectedProducts(prev => prev.filter(p => !(p.productId === product._id && p.zone === activeZone)));
    } else {
      // Replace existing product in this zone (one product per zone)
      setSelectedProducts(prev => [
        ...prev.filter(p => p.zone !== activeZone),
        { productId: product._id, zone: activeZone, estimatedArea: 100, product }
      ]);
    }
  };

  const isSelected = (productId) =>
    selectedProducts.some(p => p.productId === productId && p.zone === activeZone);

  const handleGenerate = async () => {
    if (selectedProducts.length === 0 && !activePreset) {
      toast.error('Select at least one product or preset first');
      return;
    }
    setGenerating(true);
    try {
      const res = await visualizerAPI.generate({
        photoUrl: uploadedPhoto?.photoUrl,
        photoPublicId: uploadedPhoto?.publicId,
        appliedProducts: selectedProducts.map(p => ({
          productId: p.productId, zone: p.zone, coverage: p.estimatedArea
        })),
        preset: activePreset
      });
      setResult(res.data);
      setStep(3);
      toast.success('Visualization ready!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    setStep(1); setPhoto(null); setUploadedPhoto(null);
    setSelectedProducts([]); setActivePreset(null); setResult(null);
    setDetectedZones([]); setActiveZone(null); setImageSize(null);
  };

  const handleShare = () => {
    if (!result?.shareToken) {
      toast.error('Share link not available');
      return;
    }
    const shareUrl = `${window.location.origin}/view/${result.shareToken}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => toast.success('Share link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy link'));
  };

  // Get the zone that has a product applied
  const getZoneProduct = (zoneType) => {
    return selectedProducts.find(p => p.zone === zoneType);
  };

  const handleShare = async () => {
    if (!result?.renderId) {
      const fallbackUrl = result?.renderedUrl || photo || window.location.href;
      try {
        await navigator.clipboard.writeText(fallbackUrl);
        toast.success('Visualization image link copied!');
      } catch (err) {
        toast.error('Failed to copy link');
      }
      return;
    }

    try {
      const res = await rendersAPI.share(result.renderId);
      await navigator.clipboard.writeText(res.data.shareUrl);
      toast.success('Share link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy share link');
    }
  };

  const handleDownload = async (url, filename) => {
    try {
      const proxyUrl = `/api/renders/download?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback: open in a new tab if fetch fails
      window.open(url, '_blank');
    }
  };

  return (
    <div className={`visualizer-page-wrapper ${step === 2 ? 'locked' : ''}`}>
      {/* Progress bar */}
      <div style={{ flexShrink: 0, background:'var(--warm-white)', borderBottom:'1px solid var(--border)', padding:'0.75rem 0' }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            {[
              { n:1, label:'Upload photo' },
              { n:2, label:'Choose materials' },
              { n:3, label:'Your visualization' }
            ].map(({ n, label }) => (
              <div key={n} style={{ display:'flex', alignItems:'center', gap:8, opacity: step >= n ? 1 : 0.4 }}>
                <div style={{
                  width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  background: step > n ? 'var(--gold)' : step === n ? 'var(--charcoal)' : 'transparent',
                  border: step <= n ? '1.5px solid var(--border-strong)' : 'none',
                  fontSize:'0.8125rem', fontWeight:600,
                  color: step >= n ? 'white' : 'var(--charcoal-light)'
                }}>
                  {step > n ? <Check size={14} /> : n}
                </div>
                <span style={{ fontSize:'0.8125rem', fontWeight: step === n ? 600 : 400, color: step === n ? 'var(--charcoal)' : 'var(--charcoal-light)', display: window.innerWidth < 480 ? 'none' : 'inline' }}>
                  {label}
                </span>
                {n < 3 && <div style={{ width:32, height:1, background:'var(--border)', margin:'0 4px' }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="container" style={{ padding:'3rem 1.25rem', maxWidth:640 }}>
          <div style={{ textAlign:'center', marginBottom:'2rem' }}>
            <h2 style={{ marginBottom:8 }}>Upload your room photo</h2>
            <p>JPG or PNG from your phone gallery or camera. Up to 15 MB.</p>
          </div>

          <div {...getRootProps()} style={{
            border: `2px dashed ${isDragActive ? 'var(--gold)' : 'var(--border-strong)'}`,
            borderRadius:16, padding:'3rem 2rem', textAlign:'center', cursor:'pointer',
            background: isDragActive ? 'rgba(201,168,76,0.06)' : 'var(--warm-white)',
            transition:'all 0.2s'
          }}>
            <input {...getInputProps()} />
            {uploading ? (
              <div>
                <div className="spinner" style={{ margin:'0 auto 1rem' }} />
                <p>Uploading your photo…</p>
              </div>
            ) : (
              <>
                <Upload size={40} color="var(--stone-light)" style={{ margin:'0 auto 1rem', display:'block' }} />
                <p style={{ fontWeight:500, color:'var(--charcoal)', marginBottom:4 }}>
                  {isDragActive ? 'Drop your photo here' : 'Drag & drop your room photo'}
                </p>
                <p style={{ marginBottom:'1.5rem' }}>or tap to choose from your gallery</p>
                <button type="button" className="btn btn-primary">
                  <Camera size={16} /> Choose photo
                </button>
              </>
            )}
          </div>

          <p style={{ textAlign:'center', marginTop:'1rem', fontSize:'0.8125rem', color:'var(--charcoal-light)' }}>
            Works best with well-lit, straight-on photos. Indian home lighting works perfectly.
          </p>
        </div>
      )}

      {/* Step 2: Product Selection */}
      {step === 2 && (
        <div className="visualizer-container">
          {/* Left: Photo + zone overlay */}
          <div className="visualizer-left-panel">
            <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
              {photo && (
                <img ref={imgRef} src={photo} alt="Your room" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
              )}

              {/* Segmentation loading overlay */}
              {segmenting && (
                <div style={{
                  position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)',
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12
                }}>
                  <Loader size={32} color="var(--gold)" style={{ animation:'spin 1.5s linear infinite' }} />
                  <p style={{ color:'white', fontWeight:500, fontSize:'0.9375rem' }}>
                    Analyzing room structure…
                  </p>
                  <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.8125rem' }}>
                    AI is detecting walls, floor, ceiling and more
                  </p>
                </div>
              )}

              {/* Zone overlay badges (positioned on image) */}
              {showOverlay && !segmenting && detectedZones.length > 0 && (
                <div className="visualizer-overlay-badges">
                  {detectedZones.map((zone) => {
                    const colors = ZONE_COLORS[zone.type] || { bg: 'rgba(128,128,128,0.25)', border: '#888', label: zone.type };
                    const hasProduct = getZoneProduct(zone.type);
                    const isActive = activeZone === zone.type;

                    return (
                      <div key={zone.type}
                        style={{
                          display:'flex', alignItems:'center', gap:6,
                          pointerEvents:'auto', cursor:'pointer',
                          padding:'6px 12px', borderRadius:8,
                          background: isActive ? 'var(--gold)' : 'rgba(255, 255, 255, 0.9)',
                          border: `2px solid ${isActive ? 'white' : 'transparent'}`,
                          backdropFilter:'blur(4px)',
                          transition:'all 0.2s',
                          transform: isActive ? 'scale(1.05)' : 'scale(1)',
                          boxShadow: isActive ? `0 0 16px rgba(201, 168, 76, 0.6)` : '0 4px 12px rgba(0,0,0,0.1)',
                          whiteSpace: 'nowrap'
                        }}
                        onClick={() => setActiveZone(zone.type)}
                      >
                        <span style={{ 
                          fontSize:'0.75rem', 
                          color: isActive ? 'white' : 'var(--charcoal)', 
                          fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 
                        }}>
                          {colors.label || zone.type}
                        </span>
                        <span style={{ 
                          fontSize:'0.6875rem', 
                          color: isActive ? 'rgba(255,255,255,0.9)' : 'var(--charcoal-light)', 
                          fontWeight:500 
                        }}>
                          {zone.coveragePct}%
                        </span>
                        {hasProduct && (
                          <Check size={12} color={isActive ? "white" : "var(--gold)"} strokeWidth={3} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom bar: applied materials */}
            {(selectedProducts.length > 0 || segmenting) && (
              <div style={{
                background:'rgba(44,36,32,0.95)', backdropFilter:'blur(8px)',
                padding:'0.75rem 1rem', borderTop:'1px solid rgba(255,255,255,0.1)'
              }}>
                {segmenting && (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', marginBottom: selectedProducts.length > 0 ? 8 : 0 }}>
                    <span style={{ fontSize:'0.75rem', color:'var(--gold)', display:'flex', alignItems:'center', gap:4 }}>
                      <Loader size={12} style={{ animation:'spin 1.5s linear infinite' }} /> Segmenting…
                    </span>
                  </div>
                )}
                {selectedProducts.length > 0 && (
                  <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                    <span style={{ color:'white', fontSize:'0.8125rem', fontWeight:500, marginRight:'0.5rem' }}>Applied Materials:</span>
                    {selectedProducts.map((p, i) => (
                      <span key={i} style={{
                        padding:'0.25rem 0.625rem', background:'rgba(201,168,76,0.25)',
                        borderRadius:20, fontSize:'0.75rem', color:'var(--gold-light)',
                        display:'flex', alignItems:'center', gap:4
                      }}>
                        {p.zone}: {p.product?.name}
                        <button
                          onClick={() => setSelectedProducts(prev => prev.filter((_, idx) => idx !== i))}
                          style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', padding:0, display:'flex' }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Product selector panel */}
          <div className="visualizer-right-panel">
            <div style={{ padding:'1.25rem', borderBottom:'1px solid var(--border-strong)', position:'sticky', top:0, background:'var(--warm-white)', zIndex:10 }}>
              <h3 style={{ marginBottom:4, fontSize:'1.1rem' }}>Choose materials</h3>
              <p style={{ fontSize:'0.8125rem', margin:0 }}>Select a zone on the photo, then pick a product texture</p>
            </div>

            {/* Zone selector — real detected zones */}
            <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border-strong)', background:'var(--cream)' }}>
              <label style={{ marginBottom:'0.5rem', display:'flex', alignItems:'center', gap:6 }}>
                <Layers size={14} /> Apply to zone
                {segmenting && <Loader size={12} style={{ animation:'spin 1.5s linear infinite', marginLeft:4 }} />}
              </label>
              {detectedZones.length > 0 ? (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {detectedZones.map(zone => {
                    const colors = ZONE_COLORS[zone.type] || { border: '#888', label: zone.type };
                    const hasProduct = getZoneProduct(zone.type);
                    return (
                      <button key={zone.type}
                        onClick={() => setActiveZone(zone.type)}
                        style={{
                          padding:'6px 12px', borderRadius:8, cursor:'pointer',
                          border: `2px solid ${activeZone === zone.type ? colors.border : 'var(--border)'}`,
                          background: activeZone === zone.type ? `${colors.bg}` : 'transparent',
                          color: activeZone === zone.type ? 'var(--charcoal)' : 'var(--charcoal-light)',
                          fontSize:'0.8125rem', fontWeight: activeZone === zone.type ? 600 : 400,
                          display:'flex', alignItems:'center', gap:4,
                          transition:'all 0.15s',
                          fontFamily:'var(--font-body)'
                        }}
                      >
                        {zone.type}
                        <span style={{ fontSize:'0.6875rem', opacity:0.7 }}>{zone.coveragePct}%</span>
                        {hasProduct && <Check size={12} color="var(--gold)" />}
                      </button>
                    );
                  })}
                </div>
              ) : segmenting ? (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0.5rem 0', color:'var(--charcoal-light)', fontSize:'0.8125rem' }}>
                  <Loader size={14} style={{ animation:'spin 1.5s linear infinite' }} />
                  Detecting room zones with AI…
                </div>
              ) : (
                <p style={{ fontSize:'0.8125rem', color:'var(--charcoal-light)', margin:'0.5rem 0 0' }}>
                  Upload a photo to detect zones
                </p>
              )}
            </div>

            {/* Category filter */}
            <div style={{ padding:'0.75rem 1.25rem', borderBottom:'1px solid var(--border-strong)', overflowX:'auto', background:'var(--warm-white)' }}>
              <div style={{ display:'flex', gap:6, minWidth:'max-content' }}>
                {categories.filter(c => c === 'all' || products.some(p => p.category === c)).map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-ghost'}`}>
                    {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Product grid */}
            <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border-strong)', background:'var(--cream)' }}>
              {!activeZone && detectedZones.length > 0 && (
                <div style={{ padding:'1rem', background:'rgba(201,168,76,0.08)', borderRadius:10, marginBottom:'1rem', fontSize:'0.8125rem', color:'var(--charcoal)' }}>
                  ☝️ Select a zone above first, then pick a product to apply
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {products
                  .filter(p => activeCategory === 'all' || p.category === activeCategory)
                  .map(product => (
                    <div key={product._id} onClick={() => activeZone && toggleProduct(product)}
                      style={{
                        border:`2px solid ${isSelected(product._id) ? 'var(--gold)' : 'var(--border)'}`,
                        borderRadius:12, overflow:'hidden',
                        cursor: activeZone ? 'pointer' : 'not-allowed',
                        opacity: activeZone ? 1 : 0.5,
                        background: isSelected(product._id) ? 'rgba(201,168,76,0.06)' : 'var(--warm-white)',
                        transition:'all 0.15s', position:'relative'
                      }}>
                      <div style={{ aspectRatio:'4/3', overflow:'hidden' }}>
                        <img src={product.textureImage?.url} alt={product.name}
                          style={{ width:'100%', height:'100%', objectFit:'cover' }}
                          onError={e => { e.target.style.display='none'; }}
                        />
                      </div>
                      {isSelected(product._id) && (
                        <div style={{ position:'absolute', top:6, right:6, width:20, height:20, background:'var(--gold)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Check size={12} color="white" />
                        </div>
                      )}
                      <div style={{ padding:'0.5rem 0.625rem' }}>
                        <p style={{ fontWeight:500, fontSize:'0.8125rem', color:'var(--charcoal)', margin:0, lineHeight:1.3 }}>{product.name}</p>
                        <p style={{ fontSize:'0.75rem', color:'var(--gold-dark)', margin:'2px 0 0', fontWeight:500 }}>₹{product.pricePerSqFt}/sq.ft</p>
                        <span className="badge badge-stone" style={{ marginTop:4, fontSize:'0.6875rem' }}>{product.finish}</span>
                      </div>
                    </div>
                  ))}
              </div>
              {products.length === 0 && (
                <div style={{ textAlign:'center', padding:'2rem', color:'var(--charcoal-light)' }}>
                  <p>No products found</p>
                </div>
              )}
            </div>

            {/* Neoclassical presets */}
            <div style={{ padding:'1.25rem', background:'var(--warm-white)' }}>
              <label style={{ marginBottom:'0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                One-click neoclassical presets
                <span style={{ background: 'var(--gold)', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold' }}>PRO</span>
              </label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {PRESETS.map(p => {
                  const isLocked = !isExistingCustomer;
                  
                  return (
                  <button key={p.id} onClick={() => {
                      if (isLocked) {
                        toast.error('This feature requires an Existing Customer PRO account. Contact support to unlock.');
                        return;
                      }
                      setActivePreset(activePreset === p.id ? null : p.id);
                    }}
                    style={{
                      padding:'0.75rem', border:`1px solid ${activePreset === p.id ? 'var(--gold)' : 'var(--border)'}`,
                      borderRadius:10, background: activePreset === p.id ? 'rgba(201,168,76,0.1)' : 'var(--cream)',
                      cursor: isLocked ? 'not-allowed' : 'pointer', textAlign:'left', transition:'all 0.15s',
                      opacity: isLocked ? 0.6 : 1, position: 'relative'
                    }}>
                    <div style={{ fontSize:'1.25rem', marginBottom:4 }}>
                      {p.icon}
                      {isLocked && <Lock size={14} style={{ position: 'absolute', top: 12, right: 12, color: 'var(--charcoal-light)' }} />}
                    </div>
                    <div style={{ fontWeight:500, fontSize:'0.8125rem', color:'var(--charcoal)', fontFamily:'var(--font-body)' }}>
                      {p.label}
                    </div>
                    <div style={{ fontSize:'0.75rem', color:'var(--charcoal-light)', fontFamily:'var(--font-body)' }}>{p.desc}</div>
                  </button>
                )})}
              </div>
            </div>

            {/* Generate button */}
            <div style={{ padding:'1rem 1.25rem', position:'sticky', bottom:0, background:'var(--warm-white)', borderTop:'1px solid var(--border-strong)' }}>
              <button onClick={handleGenerate} disabled={generating || segmenting || (selectedProducts.length === 0 && !activePreset)}
                className="btn btn-primary btn-lg" style={{ width:'100%', justifyContent:'center' }}>
                {generating ? (
                  <><div className="spinner" style={{ width:18, height:18, borderWidth:2 }} /> Generating with AI…</>
                ) : (
                  <><Wand2 size={18} /> Generate visualization</>
                )}
              </button>
              <p style={{ textAlign:'center', fontSize:'0.75rem', color:'var(--charcoal-light)', marginTop:'0.5rem', marginBottom:0 }}>
                {generating ? 'Cloudinary AI is rendering your visualization…' : 'Uses AI to realistically replace surfaces'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 3 && result && (
        <div className="container" style={{ padding:'2rem 1.25rem', maxWidth:960 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
            <button onClick={() => setStep(2)} className="btn btn-ghost btn-sm">
              <ChevronLeft size={16} /> Edit
            </button>
            <h2 style={{ flex:1, margin:0 }}>Your visualization</h2>
            <button onClick={handleReset} className="btn btn-ghost btn-sm">
              <RefreshCw size={15} /> Start over
            </button>
          </div>

          {/* Before / After */}
          <div className="grid-before-after" style={{ marginBottom:'1.5rem' }}>
            <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid var(--border)', display:'flex', flexDirection:'column' }}>
              <div style={{ padding:'0.5rem 1rem', background:'var(--charcoal)', color:'white', fontSize:'0.8125rem', fontWeight:500 }}>Before</div>
              <img src={photo} alt="Original room" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
            </div>
            <div style={{ borderRadius:16, overflow:'hidden', border:'2px solid var(--gold)', display:'flex', flexDirection:'column' }}>
              <div style={{ padding:'0.5rem 1rem', background:'var(--gold)', color:'var(--charcoal)', fontSize:'0.8125rem', fontWeight:600 }}>
                After — Arteffects AI
              </div>
              <img src={result.renderedUrl || photo} alt="Visualized room" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
            </div>
          </div>

          {/* Generation info */}
          {result.generationDuration && (
            <div style={{ textAlign:'center', marginBottom:'1rem' }}>
              <span style={{ fontSize:'0.8125rem', color:'var(--charcoal-light)', background:'var(--warm-white)', padding:'4px 12px', borderRadius:20, border:'1px solid var(--border)' }}>
                ⚡ Generated in {(result.generationDuration / 1000).toFixed(1)}s
              </span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', marginBottom:'2rem' }}>
            <button onClick={() => handleDownload(result.hdUrl || result.renderedUrl, 'arteffects-visualization.jpg')}
              className="btn btn-primary">
              <Download size={16} /> Download HD render
            </button>
            <button className="btn btn-secondary" onClick={handleShare}>
              <Share2 size={16} /> Share visualization
            </button>
            <button className="btn btn-secondary" onClick={() => setShowQuoteModal(true)}>
              <MessageSquare size={16} /> Request quote
            </button>
          </div>

          {/* Applied products summary */}
          {selectedProducts.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom:'1rem', fontSize:'1.1rem' }}>Products in this visualization</h3>
              <div style={{ display:'grid', gap:'0.75rem' }}>
                {selectedProducts.map((p, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.75rem', background:'var(--cream)', borderRadius:10 }}>
                    {p.product?.textureImage?.url && (
                      <img src={p.product.textureImage.url} alt="" style={{ width:48, height:48, borderRadius:8, objectFit:'cover' }} />
                    )}
                    <div style={{ flex:1 }}>
                      <p style={{ fontWeight:500, margin:0, color:'var(--charcoal)' }}>{p.product?.name}</p>
                      <p style={{ fontSize:'0.8125rem', margin:0 }}>
                        Zone: <strong>{p.zone}</strong> · SKU: {p.product?.sku} · ₹{p.product?.pricePerSqFt}/sq.ft
                      </p>
                    </div>
                    <span className="badge badge-gold">{p.product?.finish}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowQuoteModal(true)} className="btn btn-primary" style={{ marginTop:'1rem' }}>
                <MessageSquare size={16} /> Get a quote for these products
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quote modal */}
      {showQuoteModal && (
        <QuoteModal
          selectedProducts={selectedProducts}
          renderId={result?.renderId}
          onClose={() => setShowQuoteModal(false)}
        />
      )}

      {/* Inline keyframe for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
