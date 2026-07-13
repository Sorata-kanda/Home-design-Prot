import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Wand2, Heart, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsAPI, cartAPI } from '../utils/api';
import { toggleWishlist, isWishlisted, getWishlist } from '../utils/wishlist';

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
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [grade, setGrade] = useState('all');
  // Track wishlist state reactively
  const [wishlistIds, setWishlistIds] = useState(() => new Set(getWishlist().map(p => p._id)));

  // Keep wishlist state in sync if changed in another tab/component
  useEffect(() => {
    const handler = () => setWishlistIds(new Set(getWishlist().map(p => p._id)));
    window.addEventListener('wishlist-change', handler);
    return () => window.removeEventListener('wishlist-change', handler);
  }, []);

  const addMutation = useMutation({
    mutationFn: (productId) => cartAPI.add({ productId, quantity: 1, zone: 'General' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      toast.success('Added to cart');
    },
    onError: (err) => {
      if (err.response?.status === 401) {
        toast.error('Please login to add items to your cart.');
      } else {
        toast.error(err.response?.data?.error || 'Failed to add to cart');
      }
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products', category, grade, search],
    queryFn: () => productsAPI.getAll({
      ...(category !== 'all' && { category }),
      ...(grade !== 'all' && { grade }),
      ...(search && { search })
    }).then(r => r.data)
  });

  const products = data?.products || [];

  const handleToggleWishlist = (product) => {
    const added = toggleWishlist(product);
    setWishlistIds(new Set(getWishlist().map(p => p._id)));
    if (added) {
      toast.success(`💛 ${product.name} added to wishlist`);
    } else {
      toast(`Removed from wishlist`, { icon: '🗑️' });
    }
  };

  return (
    <div style={{ minHeight:'calc(100vh - 64px)', background:'var(--cream)' }}>
      {/* Header */}
      <div style={{ background:'var(--charcoal-bg)', color:'white', padding:'3rem 0 2.5rem' }}>
        <div className="container">
          <h1 style={{ color:'var(--gold-light)', marginBottom:8 }}>Our Stone Collection</h1>
          <p style={{ color:'white', opacity: 0.8, maxWidth:480 }}>
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
              {products.map(product => {
                const wishlisted = wishlistIds.has(product._id);
                return (
                  <div key={product._id} className="card" style={{ padding:0, overflow:'hidden', cursor:'default', position:'relative' }}>
                    {/* Wishlist heart button - top right of image */}
                    <button
                      onClick={() => handleToggleWishlist(product)}
                      title={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        zIndex: 2,
                        background: wishlisted ? 'rgba(201,168,76,0.92)' : 'rgba(255,255,255,0.85)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 36,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                        transition: 'all 0.2s ease',
                        backdropFilter: 'blur(4px)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <Heart
                        size={18}
                        color={wishlisted ? 'white' : '#C9A84C'}
                        fill={wishlisted ? 'white' : 'none'}
                        strokeWidth={2}
                      />
                    </button>

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
                      <div style={{ display:'flex', gap:6 }}>
                        <Link to="/visualizer" className="btn btn-secondary btn-sm" style={{ flex:1, justifyContent:'center' }}>
                          <Wand2 size={14} /> Try in visualizer
                        </Link>
                        <button
                          className="btn btn-primary btn-sm"
                          title="Add to cart"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addMutation.mutate(product._id);
                          }}
                          disabled={addMutation.isLoading}
                        >
                          <ShoppingCart size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
