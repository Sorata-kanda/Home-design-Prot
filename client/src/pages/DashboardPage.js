import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Wand2, Trash2, Share2, Calendar, Clock, Package, User as UserIcon, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { rendersAPI, ordersAPI, authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import OrderDetailsModal from '../components/shared/OrderDetailsModal';

export default function DashboardPage() {
  const { user, login } = useAuth(); // login is usually just setAuth or similar, but we can update state if needed, or just let context handle it
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Renders Tab
  const { data: renderData, isLoading: rendersLoading } = useQuery({
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

  // Orders Tab
  const { data: orderData, isLoading: ordersLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: () => ordersAPI.getMine().then(r => r.data)
  });

  const renders = renderData?.renders || [];
  const orders = orderData?.orders || [];

  const daysLeft = (expiresAt) => {
    const diff = new Date(expiresAt) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div style={{ minHeight:'calc(100vh - 64px)', background:'var(--cream)', padding:'2rem 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h2 style={{ margin:0 }}>My Dashboard</h2>
            <p style={{ margin:'4px 0 0' }}>Welcome back, {user?.name?.split(' ')[0]}.</p>
          </div>
          <Link to="/visualizer" className="btn btn-primary">
            <Wand2 size={16} /> New visualization
          </Link>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'1rem', borderBottom:'1px solid var(--border)', marginBottom:'2rem' }}>
          {[
            { id: 'profile', label: 'My Profile', icon: UserIcon },
            { id: 'visualizations', label: 'My Visualizations', icon: Wand2 },
            { id: 'orders', label: 'My Orders', icon: Package }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display:'flex', alignItems:'center', gap:'0.5rem',
                padding:'0.75rem 1rem', background:'none', border:'none',
                fontSize:'0.9375rem', fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? 'var(--gold-dark)' : 'var(--charcoal-light)',
                borderBottom: activeTab === tab.id ? '2px solid var(--gold)' : '2px solid transparent',
                cursor:'pointer', transition:'all 0.2s'
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* PROFILE TAB */}
        {activeTab === 'profile' && <ProfileTab user={user} />}

        {/* VISUALIZATIONS TAB */}
        {activeTab === 'visualizations' && (
          <div>
            {rendersLoading ? (
              <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}>
                <div className="spinner" style={{ width:36, height:36 }} />
              </div>
            ) : renders.length === 0 ? (
              <div style={{ textAlign:'center', padding:'5rem 2rem' }}>
                <Wand2 size={48} color="var(--stone-light)" style={{ margin:'0 auto 1rem', display:'block' }} />
                <h3 style={{ marginBottom:8 }}>No visualizations yet</h3>
                <p style={{ marginBottom:'1.5rem' }}>Upload a room photo and see Stratum products come to life.</p>
                <Link to="/visualizer" className="btn btn-primary btn-lg">Create your first visualization</Link>
              </div>
            ) : (
              <div className="grid-3" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))' }}>
                {renders.map(render => (
                  <div key={render._id} className="card" style={{ padding:0, overflow:'hidden' }}>
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
                      {render.appliedProducts?.length > 0 && (
                        <p style={{ fontSize:'0.8125rem', margin:'0 0 8px', color:'var(--charcoal-light)' }}>
                          {render.appliedProducts.slice(0,2).map(p => p.product?.name || p.product?.sku || 'Product').join(' · ')}
                          {render.appliedProducts.length > 2 && ` +${render.appliedProducts.length - 2} more`}
                        </p>
                      )}
                      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'0.875rem' }}>
                        <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.75rem', color:'var(--charcoal-light)' }}>
                          <Calendar size={12} /> {new Date(render.createdAt).toLocaleDateString('en-IN')}
                        </span>
                        <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.75rem', color: daysLeft(render.expiresAt) < 5 ? '#b91c1c' : 'var(--charcoal-light)' }}>
                          <Clock size={12} /> {daysLeft(render.expiresAt)}d left
                        </span>
                      </div>
                      <div style={{ display:'flex', gap:6, marginTop: 'auto' }}>
                        <Link to={`/render/${render._id}`} className="btn btn-primary btn-sm" style={{ flex:1, justifyContent:'center' }}>
                          <Eye size={15} style={{ marginRight: 4 }} /> View Details & Purchase
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div>
            {ordersLoading ? (
              <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}>
                <div className="spinner" style={{ width:36, height:36 }} />
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign:'center', padding:'5rem 2rem' }}>
                <Package size={48} color="var(--stone-light)" style={{ margin:'0 auto 1rem', display:'block' }} />
                <h3 style={{ marginBottom:8 }}>No orders yet</h3>
                <p style={{ marginBottom:'1.5rem' }}>You haven't made any purchases yet.</p>
                <Link to="/products" className="btn btn-primary btn-lg">Browse Collection</Link>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                {orders.map(order => (
                  <div key={order._id} className="card" style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem' }}>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:8 }}>
                          <h3 style={{ margin:0, fontSize:'1.125rem' }}>Order #{order.orderNumber || order._id.substring(0,8)}</h3>
                          <span className="badge badge-gold" style={{ textTransform:'capitalize' }}>{order.fulfillmentStatus}</span>
                        </div>
                        <p style={{ margin:0, fontSize:'0.875rem', color:'var(--charcoal-light)' }}>
                          Placed on {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <h3 style={{ margin:0, fontSize:'1.25rem', color:'var(--gold-dark)' }}>₹{order.totalAmount?.toLocaleString('en-IN')}</h3>
                        <p style={{ margin:0, fontSize:'0.875rem', color:'var(--charcoal-light)' }}>{order.lineItems?.length} items</p>
                      </div>
                    </div>
                    
                    {/* Condensed item images */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      {order.lineItems?.slice(0, 5).map((item, idx) => (
                         <img 
                          key={idx}
                          src={item.product?.textureImage?.url || item.product?.thumbnailImage?.url} 
                          alt={item.productName} 
                          title={item.productName}
                          style={{ width:40, height:40, borderRadius:8, objectFit:'cover', border: '1px solid var(--border)' }}
                          onError={e => { e.target.style.display='none'; }} 
                        />
                      ))}
                      {order.lineItems?.length > 5 && (
                        <div style={{ width:40, height:40, borderRadius:8, background:'var(--cream)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', color:'var(--charcoal-light)', border: '1px solid var(--border)' }}>
                          +{order.lineItems.length - 5}
                        </div>
                      )}
                    </div>
                    
                    <button onClick={() => setSelectedOrder(order)} className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start', marginTop: '0.5rem', padding: '0.5rem 1.25rem' }}>
                      Track Order
                    </button>
                  </div>
                ))}
              </div>
            )}
            {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
          </div>
        )}
      </div>
    </div>
  );
}

// PROFILE TAB COMPONENT
function ProfileTab({ user }) {
  const { updateUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || user?.city || '',
      state: user?.address?.state || '',
      pincode: user?.address?.pincode || ''
    }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || user.city || '',
          state: user.address?.state || '',
          pincode: user.address?.pincode || ''
        }
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => authAPI.updateProfile(data),
    onSuccess: (res) => {
      updateUser(res.data.user);
      toast.success('Profile updated successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  return (
    <div className="card" style={{ maxWidth: 600, padding: '2rem' }}>
      <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Personal Information</h3>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
        
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <label style={{ fontSize:'0.875rem', fontWeight:600 }}>Email Address</label>
          <input 
            type="email" 
            value={user?.email || ''} 
            disabled 
            style={{ opacity: 0.6, cursor: 'not-allowed', background: 'var(--warm-white)' }}
          />
          <span style={{ fontSize:'0.75rem', color:'var(--charcoal-light)' }}>Email address cannot be changed.</span>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <label style={{ fontSize:'0.875rem', fontWeight:600 }}>Full Name</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <label style={{ fontSize:'0.875rem', fontWeight:600 }}>Phone Number</label>
            <input 
              type="tel" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        <h4 style={{ margin:'0.5rem 0 0', fontSize:'1rem' }}>Shipping Address</h4>
        
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <label style={{ fontSize:'0.875rem', fontWeight:600 }}>Street Address</label>
          <input 
            type="text" 
            name="address.street"
            value={formData.address.street}
            onChange={handleChange}
          />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <label style={{ fontSize:'0.875rem', fontWeight:600 }}>City</label>
            <input 
              type="text" 
              name="address.city"
              value={formData.address.city}
              onChange={handleChange}
            />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <label style={{ fontSize:'0.875rem', fontWeight:600 }}>State</label>
            <input 
              type="text" 
              name="address.state"
              value={formData.address.state}
              onChange={handleChange}
            />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <label style={{ fontSize:'0.875rem', fontWeight:600 }}>Pincode</label>
            <input 
              type="text" 
              name="address.pincode"
              value={formData.address.pincode}
              onChange={handleChange}
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ marginTop: '1rem', width: 'fit-content' }}
          disabled={updateProfileMutation.isLoading}
        >
          {updateProfileMutation.isLoading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
