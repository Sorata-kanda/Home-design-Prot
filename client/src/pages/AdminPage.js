import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Package, Users, MessageSquare, Plus, Edit2, Trash2, Check, X, Upload, RefreshCw, TrendingUp, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI, productsAPI, quotesAPI } from '../utils/api';

const TABS = ['Dashboard', 'Products', 'Quotes', 'Users'];
const CATEGORIES = ['marble', 'gwalior_stone', 'moca_crema', 'white_stone', 'moulding', 'column', 'limestone', 'granite', 'other'];
const CATEGORY_LABELS = {
  marble: 'Marble', gwalior_stone: 'Gwalior Stone', moca_crema: 'Moca Crema',
  white_stone: 'White Stone', moulding: 'Moulding', column: 'Columns',
  limestone: 'Limestone', granite: 'Granite', other: 'Other'
};
const ZONES = ['floor', 'wall', 'ceiling', 'pillar', 'cornice', 'wainscoting', 'elevation', 'exterior', 'staircase'];
const STATUS_COLORS = { new: 'badge-danger', contacted: 'badge-gold', quoted: 'badge-stone', won: 'badge-success', lost: '' };

const emptyProduct = {
  sku: '', name: '', category: 'marble', pricePerSqFt: '',
  finish: 'polished', grade: 'both', description: '',
  applicableZones: [], tags: '', reflectivity: 0.5, roughness: 0.3,
  isNeoClassicalPreset: false, presetType: null, isFeatured: false
};

export default function AdminPage() {
  const [tab, setTab] = useState('Dashboard');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [textureFile, setTextureFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef();
  const thumbInputRef = useRef();
  const queryClient = useQueryClient();

  // Queries
  const { data: dashData } = useQuery({ queryKey: ['admin-dash'], queryFn: () => adminAPI.dashboard().then(r => r.data), enabled: tab === 'Dashboard' });
  const { data: productsData } = useQuery({ queryKey: ['admin-products'], queryFn: () => productsAPI.getAll({}).then(r => r.data), enabled: tab === 'Products' });
  const { data: quotesData } = useQuery({ queryKey: ['admin-quotes'], queryFn: () => quotesAPI.getAll({}).then(r => r.data), enabled: tab === 'Quotes' });
  const { data: usersData } = useQuery({ queryKey: ['admin-users'], queryFn: () => adminAPI.users().then(r => r.data), enabled: tab === 'Users' });

  // Mutations
  const seedMutation = useMutation({
    mutationFn: adminAPI.seed,
    onSuccess: (res) => { toast.success(res.data.message); queryClient.invalidateQueries(['admin-products']); }
  });

  const deleteMutation = useMutation({
    mutationFn: productsAPI.delete,
    onSuccess: () => { toast.success('Product removed'); queryClient.invalidateQueries(['admin-products', 'products']); }
  });

  const quoteStatusMutation = useMutation({
    mutationFn: ({ id, status, adminNotes }) => quotesAPI.updateStatus(id, { status, adminNotes }),
    onSuccess: () => { toast.success('Status updated'); queryClient.invalidateQueries(['admin-quotes']); }
  });

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      sku: product.sku, name: product.name, category: product.category,
      pricePerSqFt: product.pricePerSqFt, finish: product.finish, grade: product.grade,
      description: product.description || '', applicableZones: product.applicableZones || [],
      tags: product.tags?.join(', ') || '', reflectivity: product.reflectivity,
      roughness: product.roughness, isNeoClassicalPreset: product.isNeoClassicalPreset,
      presetType: product.presetType, isFeatured: product.isFeatured
    });
    setShowProductForm(true);
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setProductForm(emptyProduct);
    setTextureFile(null);
    setThumbnailFile(null);
    setShowProductForm(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.sku || !productForm.name || !productForm.pricePerSqFt) {
      toast.error('SKU, name and price are required');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(productForm).forEach(([k, v]) => {
        if (k === 'applicableZones' || k === 'tags') {
          fd.append(k, JSON.stringify(Array.isArray(v) ? v : v.split(',').map(s => s.trim()).filter(Boolean)));
        } else if (v !== null && v !== undefined) {
          fd.append(k, v);
        }
      });
      if (textureFile) fd.append('texture', textureFile);
      if (thumbnailFile) fd.append('thumbnail', thumbnailFile);

      if (editingProduct) {
        await productsAPI.update(editingProduct._id, fd);
        toast.success('Product updated');
      } else {
        await productsAPI.create(fd);
        toast.success('Product added to catalogue');
      }
      queryClient.invalidateQueries(['admin-products', 'products']);
      setShowProductForm(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const pf = (field) => (e) => setProductForm(f => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const toggleZone = (zone) => setProductForm(f => ({ ...f, applicableZones: f.applicableZones.includes(zone) ? f.applicableZones.filter(z => z !== zone) : [...f.applicableZones, zone] }));

  return (
    <div style={{ minHeight:'calc(100vh - 64px)', background:'var(--cream)', overflowX:'hidden' }}>
      {/* Admin header */}
      <div style={{ background:'var(--charcoal)', color:'white', padding:'1.25rem 0' }}>
        <div className="container" style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          <h2 style={{ color:'var(--gold-light)', margin:0, fontSize:'1.25rem' }}>Admin Panel</h2>
          <div style={{ display:'flex', gap:'0.5rem', overflowX:'auto', WebkitOverflowScrolling:'touch', paddingBottom:'2px' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} className="btn btn-sm"
                style={{ background: tab === t ? 'var(--gold)' : 'transparent', color: tab === t ? 'var(--charcoal)' : 'rgba(255,255,255,0.7)', border: tab === t ? 'none' : '1px solid rgba(255,255,255,0.2)', whiteSpace:'nowrap', flexShrink:0 }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding:'2rem 1.25rem' }}>

        {/* DASHBOARD TAB */}
        {tab === 'Dashboard' && (
          <div>
            {dashData && (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'0.75rem', marginBottom:'2rem' }}>
                  {[
                    { label:'Clients', value: dashData.stats.users, icon: Users, color:'#3b82f6' },
                    { label:'Products', value: dashData.stats.products, icon: Package, color:'var(--gold)' },
                    { label:'Total renders', value: dashData.stats.renders, icon: TrendingUp, color:'#8b5cf6' },
                    { label:'New quotes', value: dashData.stats.newQuotes, icon: MessageSquare, color:'#ef4444' }
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="card" style={{ padding:'1.25rem', textAlign:'center' }}>
                      <Icon size={24} color={color} style={{ margin:'0 auto 0.5rem', display:'block' }} />
                      <p style={{ fontSize:'2rem', fontWeight:700, margin:0, color:'var(--charcoal)', fontFamily:'var(--font-body)' }}>{value}</p>
                      <p style={{ fontSize:'0.8125rem', margin:0 }}>{label}</p>
                    </div>
                  ))}
                </div>

                {dashData.recentQuotes?.length > 0 && (
                  <div className="card">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                      <h3 style={{ margin:0 }}>New quote requests</h3>
                      <button onClick={() => setTab('Quotes')} className="btn btn-ghost btn-sm">View all</button>
                    </div>
                    <div style={{ display:'grid', gap:'0.625rem' }}>
                      {dashData.recentQuotes.map(q => (
                        <div key={q._id} style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.75rem', background:'var(--cream)', borderRadius:10 }}>
                          <div style={{ flex:1 }}>
                            <p style={{ fontWeight:500, margin:0, color:'var(--charcoal)' }}>{q.contactName}</p>
                            <p style={{ fontSize:'0.8125rem', margin:0, color:'var(--charcoal-light)' }}>{q.city || '—'}</p>
                          </div>
                          {q.totalEstimate > 0 && (
                            <span style={{ fontWeight:600, color:'var(--gold-dark)' }}>₹{q.totalEstimate.toLocaleString('en-IN')}</span>
                          )}
                          <span style={{ fontSize:'0.75rem', color:'var(--charcoal-light)' }}>
                            {new Date(q.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* PRODUCTS TAB */}
        {tab === 'Products' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
              <h3 style={{ margin:0 }}>Product catalogue ({productsData?.total || 0} items)</h3>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button onClick={() => seedMutation.mutate()} className="btn btn-secondary btn-sm" disabled={seedMutation.isPending}>
                  <RefreshCw size={14} /> Seed sample data
                </button>
                <button onClick={handleNewProduct} className="btn btn-primary btn-sm">
                  <Plus size={14} /> Add product
                </button>
              </div>
            </div>

            <div style={{ display:'grid', gap:'0.75rem' }}>
              {productsData?.products?.map(product => (
                <div key={product._id} style={{
                  display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem',
                  background:'var(--warm-white)', borderRadius:12, border:'1px solid var(--border)', overflow:'hidden'
                }}>
                  <img src={product.textureImage?.url || product.thumbnailImage?.url} alt=""
                    style={{ width:40, height:40, borderRadius:8, objectFit:'cover', flexShrink:0 }}
                    onError={e => { e.target.style.display='none'; }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <p style={{ fontWeight:500, margin:0, color:'var(--charcoal)' }}>{product.name}</p>
                      <span style={{ fontSize:'0.6875rem', color:'var(--charcoal-light)' }}>{product.sku}</span>
                      {product.isFeatured && <span className="badge badge-gold" style={{ fontSize:'0.6875rem' }}>Featured</span>}
                      {product.isNeoClassicalPreset && <span className="badge badge-stone" style={{ fontSize:'0.6875rem' }}>Preset</span>}
                    </div>
                    <p style={{ margin:'2px 0 0', fontSize:'0.75rem', color:'var(--charcoal-light)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {CATEGORY_LABELS[product.category]} · ₹{product.pricePerSqFt}/sq.ft · {product.finish}
                    </p>
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button onClick={() => handleEditProduct(product)} className="btn btn-ghost btn-sm">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => { if (window.confirm('Remove this product?')) deleteMutation.mutate(product._id); }}
                      className="btn btn-ghost btn-sm" style={{ color:'#dc2626' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUOTES TAB */}
        {tab === 'Quotes' && (
          <div>
            <h3 style={{ marginBottom:'1.5rem' }}>Quote requests ({quotesData?.total || 0})</h3>
            <div style={{ display:'grid', gap:'1rem' }}>
              {quotesData?.quotes?.map(quote => (
                <div key={quote._id} className="card" style={{ padding:'1.25rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.875rem', flexWrap:'wrap', gap:'0.5rem' }}>
                    <div>
                      <p style={{ fontWeight:600, margin:0, color:'var(--charcoal)', fontSize:'1rem' }}>{quote.contactName}</p>
                      <p style={{ margin:'2px 0 0', fontSize:'0.875rem', color:'var(--charcoal-light)' }}>
                        📱 {quote.contactPhone} {quote.city && `· ${quote.city}`} {quote.contactEmail && `· ${quote.contactEmail}`}
                      </p>
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      {quote.totalEstimate > 0 && (
                        <span style={{ fontWeight:700, color:'var(--gold-dark)', fontSize:'1.1rem' }}>₹{quote.totalEstimate.toLocaleString('en-IN')}</span>
                      )}
                      <span className={`badge ${STATUS_COLORS[quote.status] || 'badge-stone'}`}>{quote.status}</span>
                    </div>
                  </div>

                  {quote.lineItems?.length > 0 && (
                    <div style={{ marginBottom:'0.875rem' }}>
                      {quote.lineItems.map((item, i) => (
                        <span key={i} style={{ display:'inline-block', padding:'0.2rem 0.625rem', background:'var(--cream)', borderRadius:20, fontSize:'0.75rem', color:'var(--charcoal-light)', marginRight:6, marginBottom:4 }}>
                          {item.productName} ({item.zone}, {item.estimatedArea} sq.ft)
                        </span>
                      ))}
                    </div>
                  )}

                  {quote.clientMessage && (
                    <p style={{ background:'var(--cream)', padding:'0.625rem 0.875rem', borderRadius:8, fontSize:'0.875rem', marginBottom:'0.875rem', color:'var(--charcoal)' }}>
                      "{quote.clientMessage}"
                    </p>
                  )}

                  <div style={{ fontSize:'0.75rem', color:'var(--charcoal-light)', marginBottom:'0.5rem' }}>
                    <Clock size={11} style={{ verticalAlign:'middle' }} /> {new Date(quote.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                    {' · '}{quote.projectType}
                  </div>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {['new', 'contacted', 'quoted', 'won', 'lost'].map(s => (
                      <button key={s} onClick={() => quoteStatusMutation.mutate({ id: quote._id, status: s })}
                        className="btn btn-sm"
                        style={{ background: quote.status === s ? 'var(--charcoal)' : 'transparent', color: quote.status === s ? 'white' : 'var(--charcoal-light)', border:'1px solid var(--border)', padding:'0.2rem 0.5rem', fontSize:'0.6875rem' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {quotesData?.quotes?.length === 0 && (
                <div style={{ textAlign:'center', padding:'3rem', color:'var(--charcoal-light)' }}>No quote requests yet</div>
              )}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {tab === 'Users' && (
          <div>
            <h3 style={{ marginBottom:'1.5rem' }}>Registered users ({usersData?.users?.length || 0})</h3>
            <div style={{ display:'grid', gap:'0.625rem' }}>
              {usersData?.users?.map(user => (
                <div key={user._id} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem', background:'var(--warm-white)', borderRadius:12, border:'1px solid var(--border)', overflow:'hidden' }}>
                  <div style={{ width:36, height:36, background:'rgba(201,168,76,0.15)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600, fontSize:'0.875rem', color:'var(--gold-dark)', flexShrink:0 }}>
                    {user.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:500, margin:0, color:'var(--charcoal)' }}>{user.name}</p>
                    <p style={{ fontSize:'0.75rem', margin:0, color:'var(--charcoal-light)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</p>
                  </div>
                  <div style={{ display:'flex', gap:4, alignItems:'center', flexShrink:0 }}>
                    {user.role === 'admin' && <span className="badge badge-gold" style={{ fontSize:'0.625rem', padding:'0.1rem 0.4rem' }}>Admin</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(44,36,32,0.55)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
          onClick={() => setShowProductForm(false)}>
          <div style={{ background:'var(--warm-white)', borderRadius:20, width:'100%', maxWidth:600, maxHeight:'92vh', overflowY:'auto', boxShadow:'var(--shadow-lg)' }}
            onClick={e => e.stopPropagation()}>

            <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'var(--warm-white)', zIndex:10 }}>
              <h3 style={{ margin:0 }}>{editingProduct ? 'Edit product' : 'Add new product'}</h3>
              <button onClick={() => setShowProductForm(false)} className="btn btn-ghost btn-sm"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div className="form-grid-2">
                <div>
                  <label>SKU *</label>
                  <input value={productForm.sku} onChange={pf('sku')} placeholder="MRB-001" required style={{ textTransform:'uppercase' }} />
                </div>
                <div>
                  <label>Price per sq.ft (₹) *</label>
                  <input type="number" value={productForm.pricePerSqFt} onChange={pf('pricePerSqFt')} placeholder="450" required min={1} />
                </div>
              </div>
              <div>
                <label>Product name *</label>
                <input value={productForm.name} onChange={pf('name')} placeholder="Italian Carrara White Marble" required />
              </div>
              <div className="form-grid-2" style={{ gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))' }}>
                <div>
                  <label>Category</label>
                  <select value={productForm.category} onChange={pf('category')}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                  </select>
                </div>
                <div>
                  <label>Finish</label>
                  <select value={productForm.finish} onChange={pf('finish')}>
                    {['polished','honed','brushed','antique','natural','flamed'].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label>Grade</label>
                  <select value={productForm.grade} onChange={pf('grade')}>
                    <option value="interior">Interior only</option>
                    <option value="exterior">Exterior grade</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>
              <div>
                <label>Applicable zones</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
                  {ZONES.map(zone => (
                    <button key={zone} type="button" onClick={() => toggleZone(zone)}
                      className={`btn btn-sm ${productForm.applicableZones.includes(zone) ? 'btn-primary' : 'btn-secondary'}`}>
                      {productForm.applicableZones.includes(zone) && <Check size={12} />} {zone}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label>Tags (comma separated)</label>
                <input value={productForm.tags} onChange={pf('tags')} placeholder="marble, white, luxury, classic" />
              </div>
              <div>
                <label>Description</label>
                <textarea value={productForm.description} onChange={pf('description')} placeholder="Brief product description…" rows={3} />
              </div>
              <div className="form-grid-2">
                <div>
                  <label>Reflectivity (0–1)</label>
                  <input type="number" value={productForm.reflectivity} onChange={pf('reflectivity')} min={0} max={1} step={0.1} />
                </div>
                <div>
                  <label>Roughness (0–1)</label>
                  <input type="number" value={productForm.roughness} onChange={pf('roughness')} min={0} max={1} step={0.1} />
                </div>
              </div>

              {/* Texture upload */}
              <div>
                <label>Texture image</label>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-secondary btn-sm">
                    <Upload size={14} /> {textureFile ? textureFile.name : 'Choose texture'}
                  </button>
                  {(textureFile || editingProduct?.textureImage?.url) && (
                    <img src={textureFile ? URL.createObjectURL(textureFile) : editingProduct.textureImage.url}
                      alt="texture" style={{ width:48, height:48, borderRadius:8, objectFit:'cover' }} />
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }}
                  onChange={e => setTextureFile(e.target.files[0])} />
              </div>

              {/* Feature flags */}
              <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap' }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, textTransform:'none', marginBottom:0, cursor:'pointer' }}>
                  <input type="checkbox" checked={productForm.isFeatured} onChange={pf('isFeatured')} />
                  Featured product
                </label>
                <label style={{ display:'flex', alignItems:'center', gap:8, textTransform:'none', marginBottom:0, cursor:'pointer' }}>
                  <input type="checkbox" checked={productForm.isNeoClassicalPreset} onChange={pf('isNeoClassicalPreset')} />
                  Neoclassical preset
                </label>
              </div>

              {productForm.isNeoClassicalPreset && (
                <div>
                  <label>Preset type</label>
                  <select value={productForm.presetType || ''} onChange={e => setProductForm(f => ({ ...f, presetType: e.target.value || null }))}>
                    <option value="">None</option>
                    <option value="ionic_column">Ionic column</option>
                    <option value="cornice">Cornice</option>
                    <option value="wainscoting">Wainscoting</option>
                    <option value="pilaster">Pilaster</option>
                    <option value="arch">Arch</option>
                  </select>
                </div>
              )}

              <div style={{ display:'flex', gap:'0.75rem', paddingTop:'0.5rem' }}>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex:1, justifyContent:'center' }}>
                  {saving ? <><div className="spinner" style={{ width:16, height:16, borderWidth:2 }} /> Saving…</> : <><Check size={16} /> {editingProduct ? 'Save changes' : 'Add product'}</>}
                </button>
                <button type="button" onClick={() => setShowProductForm(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
