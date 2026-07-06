import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { cartAPI } from '../../utils/api';
import CheckoutModal from '../visualizer/CheckoutModal';

export default function CartDrawer({ open, onClose }) {
  const queryClient = useQueryClient();
  const [showCheckout, setShowCheckout] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartAPI.get().then(r => r.data),
    enabled: open
  });

  const cart = data?.cart;
  const items = cart?.items || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }) => cartAPI.update(id, { quantity }),
    onSuccess: () => queryClient.invalidateQueries(['cart'])
  });

  const removeMutation = useMutation({
    mutationFn: (id) => cartAPI.remove(id),
    onSuccess: () => queryClient.invalidateQueries(['cart'])
  });
  
  const clearMutation = useMutation({
    mutationFn: () => cartAPI.clear(),
    onSuccess: () => queryClient.invalidateQueries(['cart'])
  });

  const totalAmount = items.reduce((acc, item) => acc + (item.quantity * item.priceAtAddition), 0);

  const lineItems = items.map(item => ({
    productId: item.product._id,
    zone: item.zone,
    pricePerSqFt: item.priceAtAddition,
    quantity: item.quantity
  }));

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      {!showCheckout && (
        <div 
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, backdropFilter:'blur(4px)' }}
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div style={{
        position:'fixed', top:0, right:0, bottom:0, width:'100%', maxWidth:400,
        background:'var(--cream)', zIndex:10000, display: showCheckout ? 'none' : 'flex', flexDirection:'column',
        boxShadow:'-10px 0 30px rgba(0,0,0,0.1)', animation:'slideInRight 0.3s ease'
      }}>
        {/* Header */}
        <div style={{ padding:'1.5rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ margin:0, display:'flex', alignItems:'center', gap:8 }}>
            <ShoppingCart size={24} color="var(--gold)" />
            Your Cart
          </h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding:8 }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'1.5rem' }}>
          {isLoading ? (
            <div style={{ display:'flex', justifyContent:'center', marginTop:'3rem' }}>
              <div className="spinner" />
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign:'center', marginTop:'4rem', color:'var(--charcoal-light)' }}>
              <ShoppingCart size={48} style={{ opacity:0.2, margin:'0 auto 1rem' }} />
              <p>Your cart is empty.</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
              {items.map(item => (
                <div key={item._id} style={{ display:'flex', gap:'1rem' }}>
                  <div style={{ width:80, height:80, borderRadius:8, overflow:'hidden', flexShrink:0, background:'var(--stone-light)' }}>
                    <img 
                      src={item.product?.textureImage?.url || item.product?.thumbnailImage?.url} 
                      alt={item.product?.name} 
                      style={{ width:'100%', height:'100%', objectFit:'cover' }} 
                    />
                  </div>
                  <div style={{ flex:1 }}>
                    <h4 style={{ margin:'0 0 4px', fontSize:'1rem' }}>{item.product?.name}</h4>
                    <p style={{ margin:'0 0 8px', fontSize:'0.75rem', color:'var(--charcoal-light)' }}>
                      ₹{item.priceAtAddition.toLocaleString('en-IN')}/sq.ft
                    </p>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ display:'flex', alignItems:'center', border:'1px solid var(--border)', borderRadius:4 }}>
                        <button 
                          className="btn btn-ghost" 
                          style={{ padding:4, height:28, width:28, minHeight:0 }}
                          onClick={() => {
                            if (item.quantity > 1) updateMutation.mutate({ id: item._id, quantity: item.quantity - 1 })
                          }}
                          disabled={updateMutation.isLoading}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ fontSize:'0.875rem', width:30, textAlign:'center', fontFamily:'var(--font-body)', fontWeight:600 }}>
                          {item.quantity}
                        </span>
                        <button 
                          className="btn btn-ghost" 
                          style={{ padding:4, height:28, width:28, minHeight:0 }}
                          onClick={() => updateMutation.mutate({ id: item._id, quantity: item.quantity + 1 })}
                          disabled={updateMutation.isLoading}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button 
                        className="btn btn-ghost" 
                        style={{ padding:6, color:'red' }}
                        onClick={() => removeMutation.mutate(item._id)}
                        disabled={removeMutation.isLoading}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding:'1.5rem', borderTop:'1px solid var(--border)', background:'white' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.25rem', fontSize:'1.125rem', fontWeight:600 }}>
              <span>Subtotal</span>
              <span>₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <button 
              className="btn btn-primary" 
              style={{ width:'100%', justifyContent:'center' }}
              onClick={() => setShowCheckout(true)}
            >
              Checkout <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {showCheckout && (
        <CheckoutModal
          selectedProducts={items.map(item => ({
            productId: item.product?._id,
            zone: item.zone,
            product: item.product,
            quantity: item.quantity
          }))}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            setShowCheckout(false);
            onClose();
            clearMutation.mutate(); // Empty the cart on success
          }}
        />
      )}
    </>,
    document.body
  );
}
