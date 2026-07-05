import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Wand2, Trash2, Share2, Calendar, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { rendersAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['renders'],
    queryFn: () => rendersAPI.getMine().then(r => r.data)
  });

  const deleteMutation = useMutation({
    mutationFn: rendersAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['renders']);
      toast.success('Render deleted');
    }
  });

  const shareMutation = useMutation({
    mutationFn: rendersAPI.share,
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.data.shareUrl).catch(() => {});
      toast.success('Share link copied to clipboard!');
    }
  });

  const renders = data?.renders || [];

  const daysLeft = (expiresAt) => {
    const diff = new Date(expiresAt) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div style={{ minHeight:'calc(100vh - 64px)', background:'var(--cream)', padding:'2rem 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h2 style={{ margin:0 }}>My visualizations</h2>
            <p style={{ margin:'4px 0 0' }}>Welcome back, {user?.name?.split(' ')[0]}. Renders are saved for 30 days.</p>
          </div>
          <Link to="/visualizer" className="btn btn-primary">
            <Wand2 size={16} /> New visualization
          </Link>
        </div>

        {isLoading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}>
            <div className="spinner" style={{ width:36, height:36 }} />
          </div>
        ) : renders.length === 0 ? (
          <div style={{ textAlign:'center', padding:'5rem 2rem' }}>
            <Wand2 size={48} color="var(--stone-light)" style={{ margin:'0 auto 1rem', display:'block' }} />
            <h3 style={{ marginBottom:8 }}>No visualizations yet</h3>
            <p style={{ marginBottom:'1.5rem' }}>Upload a room photo and see Arteffects products come to life.</p>
            <Link to="/visualizer" className="btn btn-primary btn-lg">Create your first visualization</Link>
          </div>
        ) : (
          <div className="grid-3" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {renders.map(render => (
              <div key={render._id} className="card" style={{ padding:0, overflow:'hidden' }}>
                {/* Before/After thumbnails */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
                  <div style={{ aspectRatio:'4/3', overflow:'hidden', position:'relative' }}>
                    <img src={render.originalPhoto?.url} alt="Before" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    <span style={{ position:'absolute', bottom:4, left:4, background:'rgba(0,0,0,0.6)', color:'white', fontSize:'0.6875rem', padding:'2px 6px', borderRadius:4 }}>Before</span>
                  </div>
                  <div style={{ aspectRatio:'4/3', overflow:'hidden', position:'relative' }}>
                    <img src={render.renderedPhoto?.url || render.originalPhoto?.url} alt="After" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    <span style={{ position:'absolute', bottom:4, left:4, background:'var(--gold)', color:' var(--charcoal)', fontSize:'0.6875rem', padding:'2px 6px', borderRadius:4 }}>After</span>
                  </div>
                </div>

                <div style={{ padding:'1rem' }}>
                  <h3 style={{ fontSize:'0.9375rem', margin:'0 0 4px' }}>{render.title || 'Visualization'}</h3>

                  {/* Applied products */}
                  {render.appliedProducts?.length > 0 && (
                    <p style={{ fontSize:'0.8125rem', margin:'0 0 8px', color:'var(--charcoal-light)' }}>
                      {render.appliedProducts.slice(0,2).map(p => p.productName || 'Product').join(' · ')}
                      {render.appliedProducts.length > 2 && ` +${render.appliedProducts.length - 2} more`}
                    </p>
                  )}

                  {/* Metadata */}
                  <div style={{ display:'flex', gap:'0.75rem', marginBottom:'0.875rem' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.75rem', color:'var(--charcoal-light)' }}>
                      <Calendar size={12} /> {new Date(render.createdAt).toLocaleDateString('en-IN')}
                    </span>
                    <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.75rem', color: daysLeft(render.expiresAt) < 5 ? '#b91c1c' : 'var(--charcoal-light)' }}>
                      <Clock size={12} /> {daysLeft(render.expiresAt)}d left
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:6 }}>
                    <a href={render.renderedPhoto?.url} download className="btn btn-secondary btn-sm" style={{ flex:1, justifyContent:'center' }}>
                      Download
                    </a>
                    <button onClick={() => shareMutation.mutate(render._id)} className="btn btn-ghost btn-sm" title="Share">
                      <Share2 size={15} />
                    </button>
                    <button onClick={() => {
                      if (window.confirm('Delete this visualization?')) deleteMutation.mutate(render._id);
                    }} className="btn btn-ghost btn-sm" title="Delete" style={{ color:'var(--charcoal-light)' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
