import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery } from '@tanstack/react-query';
import { Upload, Camera, Wand2, Download, Share2, MessageSquare, X, ChevronLeft, Zap, Check, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { visualizerAPI, productsAPI } from '../utils/api';
import QuoteModal from '../components/visualizer/QuoteModal';

const ZONES = ['floor', 'wall', 'ceiling', 'pillar', 'cornice', 'wainscoting', 'elevation', 'exterior'];
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

export default function VisualizerPage() {
  const [step, setStep] = useState(1); // 1=upload, 2=select, 3=result
  const [photo, setPhoto] = useState(null);
  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]); // [{productId, zone, estimatedArea}]
  const [activeZone, setActiveZone] = useState('wall');
  const [activePreset, setActivePreset] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const fileInputRef = useRef(null);

  const { data: productsData } = useQuery({
    queryKey: ['products', activeCategory],
    queryFn: () => productsAPI.getAll(activeCategory !== 'all' ? { category: activeCategory } : {}).then(r => r.data)
  });

  const products = productsData?.products || [];
  const categories = ['all', ...Object.keys(CATEGORY_LABELS)];

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
    } catch (err) {
      toast.error('Upload failed. Please try again.');
      setPhoto(null);
    } finally {
      setUploading(false);
    }
  }, []);

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
      setSelectedProducts(prev => [
        ...prev.filter(p => p.zone !== activeZone || p.productId !== product._id),
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
  };

  return (
    <div style={{ minHeight:'calc(100vh - 64px)', background:'var(--cream)' }}>
      {/* Progress bar */}
      <div style={{ background:'var(--warm-white)', borderBottom:'1px solid var(--border)', padding:'0.75rem 0' }}>
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
        <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', minHeight:'calc(100vh - 120px)', gap:0 }}>
          {/* Left: Photo + zone overlay */}
          <div style={{ position:'sticky', top:64, height:'calc(100vh - 64px)', overflow:'hidden', background:' var(--charcoal)' }}>
            {photo && (
              <img src={photo} alt="Your room" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
            )}
            {selectedProducts.length > 0 && (
              <div style={{
                position:'absolute', bottom:16, left:16, right:16,
                background:'rgba(44,36,32,0.8)', backdropFilter:'blur(8px)',
                borderRadius:12, padding:'0.875rem 1rem'
              }}>
                <p style={{ color:'white', fontSize:'0.8125rem', fontWeight:500, margin:'0 0 0.5rem' }}>Applied materials</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {selectedProducts.map((p, i) => (
                    <span key={i} style={{ padding:'0.25rem 0.625rem', background:'rgba(201,168,76,0.25)', borderRadius:20, fontSize:'0.75rem', color:'var(--gold-light)' }}>
                      {p.zone}: {p.product?.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Product selector panel */}
          <div style={{ borderLeft:'1px solid var(--border)', background:'var(--warm-white)', overflowY:'auto', height:'calc(100vh - 120px)' }}>
            <div style={{ padding:'1.25rem', borderBottom:'1px solid var(--border)', position:'sticky', top:0, background:'var(--warm-white)', zIndex:10 }}>
              <h3 style={{ marginBottom:4, fontSize:'1.1rem' }}>Choose materials</h3>
              <p style={{ fontSize:'0.8125rem', margin:0 }}>Select where to apply, then pick a product</p>
            </div>

            {/* Zone selector */}
            <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)' }}>
              <label style={{ marginBottom:'0.5rem' }}>Apply to zone</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {ZONES.map(zone => (
                  <button key={zone} onClick={() => setActiveZone(zone)} className={`btn btn-sm ${activeZone === zone ? 'btn-primary' : 'btn-secondary'}`}>
                    {zone}
                  </button>
                ))}
              </div>
            </div>

            {/* Neoclassical presets */}
            <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)' }}>
              <label style={{ marginBottom:'0.5rem' }}>One-click neoclassical presets</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {PRESETS.map(p => (
                  <button key={p.id} onClick={() => setActivePreset(activePreset === p.id ? null : p.id)}
                    style={{
                      padding:'0.75rem', border:`1px solid ${activePreset === p.id ? 'var(--gold)' : 'var(--border)'}`,
                      borderRadius:10, background: activePreset === p.id ? 'rgba(201,168,76,0.1)' : 'transparent',
                      cursor:'pointer', textAlign:'left', transition:'all 0.15s'
                    }}>
                    <div style={{ fontSize:'1.25rem', marginBottom:4 }}>{p.icon}</div>
                    <div style={{ fontWeight:500, fontSize:'0.8125rem', color:'var(--charcoal)', fontFamily:'var(--font-body)' }}>{p.label}</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--charcoal-light)', fontFamily:'var(--font-body)' }}>{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Category filter */}
            <div style={{ padding:'0.75rem 1.25rem', borderBottom:'1px solid var(--border)', overflowX:'auto' }}>
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
            <div style={{ padding:'1rem 1.25rem' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {products
                  .filter(p => activeCategory === 'all' || p.category === activeCategory)
                  .map(product => (
                    <div key={product._id} onClick={() => toggleProduct(product)}
                      style={{
                        border:`2px solid ${isSelected(product._id) ? 'var(--gold)' : 'var(--border)'}`,
                        borderRadius:12, overflow:'hidden', cursor:'pointer',
                        background: isSelected(product._id) ? 'rgba(201,168,76,0.06)' : 'transparent',
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

            {/* Generate button */}
            <div style={{ padding:'1rem 1.25rem', position:'sticky', bottom:0, background:'var(--warm-white)', borderTop:'1px solid var(--border)' }}>
              <button onClick={handleGenerate} disabled={generating || (selectedProducts.length === 0 && !activePreset)}
                className="btn btn-primary btn-lg" style={{ width:'100%', justifyContent:'center' }}>
                {generating ? (
                  <><div className="spinner" style={{ width:18, height:18, borderWidth:2 }} /> Generating visualization…</>
                ) : (
                  <><Wand2 size={18} /> Generate visualization</>
                )}
              </button>
              <p style={{ textAlign:'center', fontSize:'0.75rem', color:'var(--charcoal-light)', marginTop:'0.5rem', marginBottom:0 }}>
                Takes 10–15 seconds
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
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
            <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid var(--border)' }}>
              <div style={{ padding:'0.5rem 1rem', background:'var(--charcoal)', color:'white', fontSize:'0.8125rem', fontWeight:500 }}>Before</div>
              <img src={photo} alt="Original room" style={{ width:'100%', display:'block' }} />
            </div>
            <div style={{ borderRadius:16, overflow:'hidden', border:'2px solid var(--gold)' }}>
              <div style={{ padding:'0.5rem 1rem', background:'var(--gold)', color:'var(--charcoal)', fontSize:'0.8125rem', fontWeight:600 }}>
                After — Arteffects
              </div>
              <img src={result.renderedUrl || photo} alt="Visualized room" style={{ width:'100%', display:'block' }} />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', marginBottom:'2rem' }}>
            <a href={result.hdUrl || result.renderedUrl} download="arteffects-visualization.jpg"
              className="btn btn-primary">
              <Download size={16} /> Download HD render
            </a>
            <button className="btn btn-secondary" onClick={() => toast.success('Share link copied!')}>
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
    </div>
  );
}
