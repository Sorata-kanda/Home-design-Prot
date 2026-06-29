import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Wand2, ExternalLink } from 'lucide-react';
import { productsAPI } from '../utils/api';

const CATEGORY_LABELS = {
  marble: 'Marble', gwalior_stone: 'Gwalior Stone', moca_crema: 'Moca Crema',
  white_stone: 'White Stone', moulding: 'Moulding', column: 'Columns',
  limestone: 'Limestone', granite: 'Granite', other: 'Other'
};

const GRADE_COLORS = {
  interior: 'badge-stone',
  exterior: 'badge-gold',
  both: 'badge-success'
};

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [grade, setGrade] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['products', category, grade, search],
    queryFn: () => productsAPI.getAll({
      ...(category !== 'all' && { category }),
      ...(grade !== 'all' && { grade }),
      ...(search && { search })
    }).then(r => r.data)
  });

  const products = data?.products || [];

  return (
    <div style={{ minHeight:'calc(100vh - 64px)', background:'var(--cream)' }}>
      {/* Header */}
      <div style={{ background:'var(--charcoal)', color:'white', padding:'3rem 0 2.5rem' }}>
        <div className="container">
          <h1 style={{ color:'var(--gold-light)', marginBottom:8 }}>Our Stone Collection</h1>
          <p style={{ color:'rgba(255,255,255,0.6)', maxWidth:480 }}>
            Every product in our live inventory. Select any item in the visualizer to see it in your space.
          </p>
          <Link to="/visualizer" className="btn btn-primary" style={{ marginTop:'1.25rem' }}>
            <Wand2 size={16} /> Open visualizer
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background:'var(--warm-white)', borderBottom:'1px solid var(--border)', padding:'1rem 0', position:'sticky', top:64, zIndex:50 }}>
        <div className="container" style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', flex:'1 1 200px', minWidth:180 }}>
            <Search size={16} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--charcoal-light)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              style={{ paddingLeft:34, margin:0 }} />
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ flex:'0 0 160px', margin:0 }}>
            <option value="all">All categories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={grade} onChange={e => setGrade(e.target.value)} style={{ flex:'0 0 130px', margin:0 }}>
            <option value="all">Any grade</option>
            <option value="interior">Interior only</option>
            <option value="exterior">Exterior grade</option>
            <option value="both">Both</option>
          </select>
        </div>
      </div>

      {/* Products grid */}
      <div className="container" style={{ padding:'2rem 1.25rem' }}>
        {isLoading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}>
            <div className="spinner" style={{ width:36, height:36 }} />
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign:'center', padding:'4rem', color:'var(--charcoal-light)' }}>
            <p style={{ fontSize:'1.125rem', marginBottom:8 }}>No products found</p>
            <p>Try a different search or category</p>
          </div>
        ) : (
          <>
            <p style={{ marginBottom:'1.25rem', fontSize:'0.875rem', color:'var(--charcoal-light)' }}>
              {products.length} product{products.length !== 1 ? 's' : ''}
            </p>
            <div className="grid-3" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {products.map(product => (
                <div key={product._id} className="card" style={{ padding:0, overflow:'hidden', cursor:'default' }}>
                  <div style={{ aspectRatio:'4/3', overflow:'hidden' }}>
                    <img src={product.textureImage?.url || product.thumbnailImage?.url}
                      alt={product.name}
                      style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s' }}
                      onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
                      onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                    />
                  </div>
                  <div style={{ padding:'1rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                      <h3 style={{ fontSize:'1rem', margin:0 }}>{product.name}</h3>
                      <span style={{ fontSize:'0.6875rem', color:'var(--charcoal-light)', fontFamily:'var(--font-body)', whiteSpace:'nowrap', marginLeft:8 }}>{product.sku}</span>
                    </div>
                    <p style={{ fontSize:'1.125rem', fontWeight:700, color:'var(--gold-dark)', margin:'4px 0 8px', fontFamily:'var(--font-body)' }}>
                      ₹{product.pricePerSqFt.toLocaleString('en-IN')}<span style={{ fontSize:'0.75rem', fontWeight:400, color:'var(--charcoal-light)' }}>/sq.ft</span>
                    </p>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:'0.875rem' }}>
                      <span className={`badge ${GRADE_COLORS[product.grade] || 'badge-stone'}`}>
                        {product.grade === 'both' ? 'Interior + Exterior' : product.grade}
                      </span>
                      <span className="badge badge-stone">{product.finish}</span>
                      {product.isNeoClassicalPreset && <span className="badge badge-gold">Preset</span>}
                    </div>
                    {product.applicableZones?.length > 0 && (
                      <p style={{ fontSize:'0.75rem', color:'var(--charcoal-light)', margin:'0 0 0.875rem' }}>
                        Zones: {product.applicableZones.join(', ')}
                      </p>
                    )}
                    <Link to="/visualizer" className="btn btn-secondary btn-sm" style={{ width:'100%', justifyContent:'center' }}>
                      <Wand2 size={14} /> Try in visualizer
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
