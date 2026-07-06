import { useState } from 'react';
import { X, CreditCard, CheckCircle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { ordersAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function CheckoutModal({ selectedProducts = [], renderId, onClose, onSuccess }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [form, setForm] = useState({
    contactName: user?.name || '',
    contactPhone: user?.phone || '',
    contactEmail: user?.email || '',
    shippingAddress: {
      street: user?.address?.street || '',
      city: user?.address?.city || user?.city || '',
      state: user?.address?.state || '',
      pincode: user?.address?.pincode || ''
    },
    areas: Object.fromEntries(selectedProducts.map(p => [p.productId + p.zone, p.quantity || 100])),
    paymentMethod: 'simulated_upi'
  });
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderData, setOrderData] = useState(null);
  
  const totalAmount = selectedProducts.reduce((sum, p) => {
    const area = form.areas[p.productId + p.zone] || p.quantity || 100;
    return sum + area * (p.product?.pricePerSqFt || 0);
  }, 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!form.contactName || !form.contactPhone || !form.shippingAddress.pincode) {
      toast.error('Name, phone, and pincode are required');
      return;
    }
    setLoading(true);
    
    // Simulate payment gateway delay
    toast.loading('Initializing Secure Gateway...', { id: 'payment' });
    
    setTimeout(async () => {
      try {
        toast.loading('Processing payment...', { id: 'payment' });
        
        const res = await ordersAPI.simulatedCheckout({
          ...form,
          renderId,
          totalAmount,
          lineItems: selectedProducts.map(p => ({
            product: p.productId,
            productName: p.product?.name,
            sku: p.product?.sku,
            zone: p.zone,
            estimatedArea: form.areas[p.productId + p.zone] || p.quantity || 100,
            pricePerSqFt: p.product?.pricePerSqFt,
            lineTotal: (form.areas[p.productId + p.zone] || p.quantity || 100) * (p.product?.pricePerSqFt || 0)
          }))
        });
        
        toast.success('Payment successful!', { id: 'payment' });
        setOrderData(res.data.order);
        setSubmitted(true);
        queryClient.invalidateQueries(['myOrders']);
        queryClient.invalidateQueries(['cart']);
        if (onSuccess) onSuccess();
      } catch (err) {
        toast.error(err.response?.data?.error || 'Payment failed. Please try again.', { id: 'payment' });
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:99999,
      background:'rgba(44,36,32,0.6)', backdropFilter:'blur(5px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem'
    }} onClick={onClose}>
      <div style={{
        background:'var(--warm-white)', borderRadius:20, width:'100%', maxWidth:600,
        maxHeight:'90vh', overflowY:'auto', boxShadow:'var(--shadow-lg)'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--cream)', borderTopLeftRadius:20, borderTopRightRadius:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <ShieldCheck size={20} color="var(--gold)" />
            <div>
              <h3 style={{ margin:0 }}>Secure Checkout</h3>
              <p style={{ margin:0, fontSize:'0.8125rem' }}>100% encrypted transaction</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding:'0.375rem' }}>
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div style={{ padding:'3rem 1.5rem', textAlign:'center' }}>
            <CheckCircle size={56} color="#10b981" style={{ margin:'0 auto 1rem', display:'block' }} />
            <h2 style={{ marginBottom:8, color:'var(--charcoal)' }}>Order Confirmed!</h2>
            <p style={{ marginBottom:'0.5rem' }}>Thank you, <strong>{form.contactName}</strong>. Your payment of <strong>₹{totalAmount.toLocaleString('en-IN')}</strong> was successful.</p>
            <p style={{ marginBottom:'2rem', fontSize:'0.875rem', color:'var(--charcoal-light)' }}>
              Transaction ID: {orderData?.transactionId}<br/>
              Our logistics team will contact you shortly regarding freight and delivery.
            </p>
            <button onClick={onClose} className="btn btn-primary" style={{ minWidth:200 }}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleCheckout} style={{ padding:'1.5rem' }}>
            
            {/* Order Summary */}
            <div style={{ marginBottom:'1.5rem', padding:'1rem', background:'var(--cream)', borderRadius:12 }}>
              <h4 style={{ margin:'0 0 1rem 0', color:'var(--charcoal)' }}>Order Summary</h4>
              {selectedProducts.map((p, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, paddingBottom:8, borderBottom:'1px dashed rgba(0,0,0,0.05)' }}>
                  <div style={{ flex:1 }}>
                    <p style={{ fontWeight:500, margin:0, fontSize:'0.875rem', color:'var(--charcoal)' }}>{p.product?.name}</p>
                    <p style={{ margin:0, fontSize:'0.75rem', color:'var(--charcoal-light)' }}>₹{p.product?.pricePerSqFt}/sq.ft</p>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input type="number" value={form.areas[p.productId + p.zone] || 100}
                      onChange={e => setForm(f => ({ ...f, areas: { ...f.areas, [p.productId + p.zone]: Number(e.target.value) } }))}
                      style={{ width:80, textAlign:'right', padding:'0.25rem 0.5rem', fontSize:'0.875rem' }}
                      min={1} />
                    <span style={{ fontSize:'0.75rem', color:'var(--charcoal-light)' }}>sq.ft</span>
                  </div>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'1rem', alignItems:'center' }}>
                <span style={{ fontWeight:500, color:'var(--charcoal)' }}>Total Material Cost</span>
                <span style={{ fontWeight:700, color:'var(--gold-dark)', fontSize:'1.25rem' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <p style={{ margin:'0.5rem 0 0 0', fontSize:'0.75rem', color:'var(--charcoal-light)', textAlign:'right' }}>
                * Freight & shipping calculated separately prior to dispatch.
              </p>
            </div>

            {/* Shipping & Contact */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.875rem', marginBottom:'0.875rem' }}>
              <div>
                <label>Full Name *</label>
                <input type="text" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} required />
              </div>
              <div>
                <label>Phone *</label>
                <input type="tel" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} required />
              </div>
            </div>
            
            <div style={{ marginBottom:'0.875rem' }}>
              <label>Delivery Address (Street) *</label>
              <input type="text" value={form.shippingAddress.street} onChange={e => setForm(f => ({ ...f, shippingAddress: { ...f.shippingAddress, street: e.target.value } }))} required />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:'0.875rem', marginBottom:'1.5rem' }}>
              <div>
                <label>City *</label>
                <input type="text" value={form.shippingAddress.city} onChange={e => setForm(f => ({ ...f, shippingAddress: { ...f.shippingAddress, city: e.target.value } }))} required />
              </div>
              <div>
                <label>State</label>
                <input type="text" value={form.shippingAddress.state} onChange={e => setForm(f => ({ ...f, shippingAddress: { ...f.shippingAddress, state: e.target.value } }))} />
              </div>
              <div>
                <label>Pincode *</label>
                <input type="text" value={form.shippingAddress.pincode} onChange={e => setForm(f => ({ ...f, shippingAddress: { ...f.shippingAddress, pincode: e.target.value } }))} required />
              </div>
            </div>

            {/* Payment Options (Simulated) */}
            <div style={{ marginBottom:'1.5rem' }}>
              <label style={{ marginBottom:'0.5rem', display:'block' }}>Select Payment Method</label>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <button type="button" onClick={() => setForm(f => ({ ...f, paymentMethod: 'simulated_upi' }))}
                  style={{ flex:1, padding:'0.75rem', border: form.paymentMethod === 'simulated_upi' ? '2px solid var(--gold)' : '1px solid var(--border)', borderRadius:8, background: form.paymentMethod === 'simulated_upi' ? 'rgba(201,168,76,0.05)' : '#fff', cursor:'pointer' }}>
                  <div style={{ fontWeight:600, color:'var(--charcoal)' }}>UPI</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--charcoal-light)' }}>GPay, PhonePe</div>
                </button>
                <button type="button" onClick={() => setForm(f => ({ ...f, paymentMethod: 'simulated_card' }))}
                  style={{ flex:1, padding:'0.75rem', border: form.paymentMethod === 'simulated_card' ? '2px solid var(--gold)' : '1px solid var(--border)', borderRadius:8, background: form.paymentMethod === 'simulated_card' ? 'rgba(201,168,76,0.05)' : '#fff', cursor:'pointer' }}>
                  <div style={{ fontWeight:600, color:'var(--charcoal)', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                    <CreditCard size={14} /> Card
                  </div>
                  <div style={{ fontSize:'0.75rem', color:'var(--charcoal-light)' }}>Visa, Mastercard</div>
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || totalAmount <= 0} className="btn btn-primary btn-lg" style={{ width:'100%', justifyContent:'center' }}>
              {loading ? (
                <><div className="spinner" style={{ width:18, height:18, borderWidth:2 }} /> Processing securely...</>
              ) : (
                <>Pay ₹{totalAmount.toLocaleString('en-IN')}</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
