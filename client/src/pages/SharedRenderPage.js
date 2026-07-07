import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Wand2, MessageSquare, Zap, Download, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { rendersAPI, cartAPI } from '../utils/api';
import { useState } from 'react';
import QuoteModal from '../components/visualizer/QuoteModal';

export default function SharedRenderPage() {
  const { token, id } = useParams();
  const [showQuote, setShowQuote] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const shareMutation = useMutation({
    mutationFn: rendersAPI.share,
    onSuccess: (res) => {
      navigator.clipboard.writeText(res.data.shareUrl).catch(() => {});
      toast.success('Share link copied to clipboard!');
    },
    onError: () => toast.error('Failed to create share link')
  });

  const handleShare = () => {
    if (token) {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
      toast.success('Share link copied to clipboard!');
    } else if (id) {
      shareMutation.mutate(id);
    }
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['render', token || id],
    queryFn: () => {
      if (id) return rendersAPI.getById(id).then(r => r.data);
      return rendersAPI.getShared(token).then(r => r.data);
    }
  });

  const render = data?.render;

  if (isLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div className="spinner" style={{ width:36, height:36 }} />
    </div>
  );

  if (isError || !render) return (
    <div style={{ textAlign:'center', padding:'5rem 1rem' }}>
      <h3 style={{ marginBottom:8 }}>Visualization not found</h3>
      <p style={{ marginBottom:'1.5rem' }}>This link may have expired or been removed.</p>
      <Link to="/login" className="btn btn-primary">Create your own</Link>
    </div>
  );

  const appliedProducts = render.appliedProducts?.filter(p => p.product) || [];

  return (
    <div style={{ minHeight:'calc(100vh - 64px)', background:'var(--cream)' }}>
      {/* Hero banner */}
      <div style={{ background:'var(--charcoal-bg)', color:'white', padding:'2rem 0' }}>
        <div className="container" style={{ textAlign:'center' }}>
          <p style={{ color:'var(--gold-light)', fontSize:'0.8125rem', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>
            Stratum Room Visualization
          </p>
          <h2 style={{ color:'white', marginBottom:0 }}>{render.title || 'Room Visualization'}</h2>
        </div>
      </div>

      <div className="container" style={{ padding:'2.5rem 1.25rem', maxWidth:960 }}>
        {/* Before / After */}
        <div className="grid-before-after" style={{ marginBottom:'2rem' }}>
          <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid var(--border)', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'0.5rem 1rem', background:'var(--charcoal-bg)', color:'white', fontSize:'0.8125rem', fontWeight:500 }}>Before</div>
            <img src={render.originalPhoto?.url} alt="Original room" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          </div>
          <div style={{ borderRadius:16, overflow:'hidden', border:'2px solid var(--gold)', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'0.5rem 1rem', background:'var(--gold)', color:'var(--charcoal)', fontSize:'0.8125rem', fontWeight:600 }}>
              After — Arteffects
            </div>
            <img src={render.watermarkedUrl || render.renderedPhoto?.url || render.originalPhoto?.url} alt="Visualized" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          </div>
        </div>

        {/* Products used */}
        {appliedProducts.length > 0 && (
          <div className="card" style={{ marginBottom:'1.5rem' }}>
            <h3 style={{ marginBottom:'1rem', fontSize:'1.1rem' }}>Products in this design</h3>
            <div style={{ display:'grid', gap:'0.75rem' }}>
              {appliedProducts.map((ap, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.75rem', background:'var(--cream)', borderRadius:10 }}>
                  {ap.product.textureImage?.url && (
                    <img src={ap.product.textureImage.url} alt="" style={{ width:52, height:52, borderRadius:8, objectFit:'cover' }} />
                  )}
                  <div style={{ flex:1 }}>
                    <p style={{ fontWeight:500, margin:0, color:'var(--charcoal)' }}>{ap.product.name}</p>
                    <p style={{ fontSize:'0.8125rem', margin:'2px 0 0', color:'var(--charcoal-light)' }}>
                      Zone: <strong>{ap.zone}</strong> · SKU: {ap.product.sku}
                    </p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontWeight:700, color:'var(--gold-dark)', margin:0 }}>₹{ap.product.pricePerSqFt}/sq.ft</p>
                    <span className="badge badge-stone" style={{ marginTop:4 }}>{ap.product.category?.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTAs */}
        <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', justifyContent:'center' }}>
          <a 
            href={render.watermarkedUrl || render.renderedPhoto?.url || render.originalPhoto?.url} 
            download="stratum-visualization.jpg" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-ghost btn-lg" 
            style={{ border: '1px solid var(--border)' }}
          >
            <Download size={18} /> Download
          </a>

          <button onClick={() => setShowQuote(true)} className="btn btn-secondary btn-lg">
            <MessageSquare size={18} /> Request Bulk Quote
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn btn-primary btn-lg" 
              onClick={async () => {
                toast.loading('Adding materials to cart...', { id: 'cartShared' });
                try {
                  for (const ap of appliedProducts) {
                    await cartAPI.add({ productId: ap.product._id, quantity: 1, zone: ap.zone });
                  }
                  queryClient.invalidateQueries(['cart']);
                  toast.success('Materials added to cart! Click the cart icon to checkout.', { id: 'cartShared' });
                } catch (err) {
                  toast.error('Failed to add some items', { id: 'cartShared' });
                }
              }}
            >
              <Zap size={18} /> Buy materials now
            </button>
            
            <button 
              className="btn btn-primary btn-lg"
              style={{ padding: '0 1rem' }}
              title="Share"
              onClick={handleShare}
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        <p style={{ textAlign:'center', marginTop:'1.5rem', fontSize:'0.8125rem', color:'var(--charcoal-light)' }}>
          Arteffects · Stone &amp; Moulding Specialists · Ludhiana / Tarn Taran
        </p>
      </div>

      {showQuote && (
        <QuoteModal
          selectedProducts={appliedProducts.map(ap => ({ productId: ap.product._id, zone: ap.zone, product: ap.product }))}
          renderId={render._id}
          onClose={() => setShowQuote(false)}
        />
      )}
    </div>
  );
}
