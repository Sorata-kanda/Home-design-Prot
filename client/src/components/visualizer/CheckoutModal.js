import { useState } from 'react';
import { X, CreditCard, CheckCircle, ShieldCheck, Tag, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { ordersAPI, couponsAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import AddressAutocomplete from '../shared/AddressAutocomplete';

export default function CheckoutModal({ selectedProducts = [], renderId, onClose, onSuccess }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [form, setForm] = useState({
    contactName: user?.name || '',
    contactPhone: user?.phone || '',
    contactEmail: user?.email || '',
    shippingAddress: {
      houseNumber: user?.address?.houseNumber || '',
      street: user?.address?.street || '',
      city: user?.address?.city || user?.city || '',
      state: user?.address?.state || '',
      pincode: user?.address?.pincode || ''
    },
    areas: Object.fromEntries(selectedProducts.map(p => [p.productId, p.quantity || 100]))
  });
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderData, setOrderData] = useState(null);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  
  const subtotal = selectedProducts.reduce((sum, p) => {
    const area = form.areas[p.productId] || p.quantity || 100;
    return sum + area * (p.product?.pricePerSqFt || 0);
  }, 0);

  const discountAmount = appliedCoupon
    ? appliedCoupon.type === 'percent'
      ? Math.round(subtotal * appliedCoupon.discount / 100)
      : Math.min(appliedCoupon.discount, subtotal)
    : 0;

  const totalAmount = subtotal - discountAmount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    setAppliedCoupon(null);
    try {
      const res = await couponsAPI.validate(couponCode.trim());
      setAppliedCoupon(res.data.coupon);
      toast.success(`Coupon "${res.data.coupon.code}" applied!`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid coupon code';
      setCouponError(msg);
      toast.error(msg);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!form.contactName || !form.contactEmail || !form.contactPhone || !form.shippingAddress.pincode) {
      toast.error('Name, email, phone, and pincode are required');
      return;
    }
    setLoading(true);
    
    const resScript = await loadRazorpayScript();
    if (!resScript) {
      toast.error('Razorpay SDK failed to load. Are you online?');
      setLoading(false);
      return;
    }

    try {
      toast.loading('Initializing Secure Gateway...', { id: 'payment' });
      
      const res = await ordersAPI.razorpayCreate({
        ...form,
        renderId,
        totalAmount,
        lineItems: selectedProducts.map(p => ({
          product: p.productId,
          productName: p.product?.name,
          sku: p.product?.sku,
          estimatedArea: form.areas[p.productId] || p.quantity || 100,
          pricePerSqFt: p.product?.pricePerSqFt,
          lineTotal: (form.areas[p.productId] || p.quantity || 100) * (p.product?.pricePerSqFt || 0)
        }))
      });
      
      const { rzpOrder, orderId } = res.data;

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || '', // Set in .env
        amount: rzpOrder.amount,
        currency: "INR",
        name: "Stratum by DSYN",
        description: "Material Order",
        order_id: rzpOrder.id,
        handler: async function (response) {
          try {
            toast.loading('Verifying payment...', { id: 'payment' });
            await ordersAPI.razorpayVerify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderId
            });
            toast.success('Payment successful!', { id: 'payment' });
            setOrderData({ transactionId: response.razorpay_payment_id });
            setSubmitted(true);
            queryClient.invalidateQueries(['myOrders']);
            queryClient.invalidateQueries(['admin-orders']);
            queryClient.invalidateQueries(['admin-dash']);
            queryClient.invalidateQueries(['cart']);
            if (onSuccess) onSuccess();
          } catch (err) {
            toast.error(err.response?.data?.error || 'Payment verification failed.', { id: 'payment' });
          }
        },
        prefill: {
          name: form.contactName,
          email: form.contactEmail,
          // Razorpay strictly only accepts one valid phone number for OTP verification.
          // We extract the first sequence of digits (min 10) from the user's input.
          contact: form.contactPhone.split(/[,/\s]/)[0].trim() || form.contactPhone
        },
        theme: {
          color: "#C9A84C"
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            toast.dismiss('payment');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        toast.error('Payment failed: ' + response.error.description, { id: 'payment' });
        setLoading(false);
      });
      
      toast.dismiss('payment');
      rzp.open();
      
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to initialize payment. Check API keys.', { id: 'payment' });
      setLoading(false);
    }
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
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, paddingBottom:12, borderBottom:'1px dashed rgba(0,0,0,0.05)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flex:1 }}>
                    <img 
                      src={p.product?.textureImage?.url || p.product?.thumbnailImage?.url} 
                      alt="" 
                      style={{ width:40, height:40, borderRadius:8, objectFit:'cover', flexShrink:0 }}
                      onError={e => { e.target.style.display='none'; }} 
                    />
                    <div>
                      <p style={{ fontWeight:500, margin:0, fontSize:'0.875rem', color:'var(--charcoal)' }}>
                        {p.product?.name} <span style={{ fontSize:'0.75rem', color:'var(--charcoal-light)', fontWeight:400, marginLeft:4 }}>({p.product?.sku})</span>
                      </p>
                      <p style={{ margin:0, fontSize:'0.75rem', color:'var(--charcoal-light)' }}>₹{p.product?.pricePerSqFt}/sq.ft</p>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input type="number" value={form.areas[p.productId] || 100}
                      onChange={e => setForm(f => ({ ...f, areas: { ...f.areas, [p.productId]: Number(e.target.value) } }))}
                      style={{ width:80, textAlign:'right', padding:'0.25rem 0.5rem', fontSize:'0.875rem' }}
                      min={1} />
                    <span style={{ fontSize:'0.75rem', color:'var(--charcoal-light)' }}>sq.ft</span>
                  </div>
                </div>
              ))}

              {/* Subtotal row */}
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'1rem', alignItems:'center' }}>
                <span style={{ fontWeight:500, color:'var(--charcoal)' }}>Subtotal</span>
                <span style={{ fontWeight:600, color:'var(--charcoal)', fontSize:'1rem' }}>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {/* Coupon code row */}
              <div style={{ marginTop:'1rem', paddingTop:'1rem', borderTop:'1px dashed rgba(0,0,0,0.1)' }}>
                <label style={{ display:'flex', alignItems:'center', gap:6, marginBottom:'0.5rem', fontSize:'0.875rem', fontWeight:500, color:'var(--charcoal)' }}>
                  <Tag size={14} color="var(--gold)" /> Coupon Code
                </label>
                {appliedCoupon ? (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.5rem 0.75rem', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <CheckCheck size={16} color="#10b981" />
                      <span style={{ fontSize:'0.875rem', fontWeight:600, color:'#10b981' }}>{appliedCoupon.code}</span>
                      <span style={{ fontSize:'0.8rem', color:'var(--charcoal-light)' }}>
                        — {appliedCoupon.type === 'percent' ? `${appliedCoupon.discount}% off` : `₹${appliedCoupon.discount} off`}
                      </span>
                    </div>
                    <button type="button" onClick={handleRemoveCoupon} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--charcoal-light)', fontSize:'0.75rem', textDecoration:'underline' }}>Remove</button>
                  </div>
                ) : (
                  <div style={{ display:'flex', gap:8 }}>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                      placeholder="Enter coupon code"
                      style={{ flex:1, padding:'0.5rem 0.75rem', fontSize:'0.875rem', borderRadius:8, border: couponError ? '1px solid #ef4444' : '1px solid var(--border)', background:'var(--warm-white)', outline:'none', fontFamily:'var(--font-body)', letterSpacing:'0.05em' }}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      style={{ padding:'0.5rem 1rem', borderRadius:8, background:'var(--charcoal)', color:'white', border:'none', cursor: couponLoading || !couponCode.trim() ? 'not-allowed' : 'pointer', fontSize:'0.875rem', fontWeight:600, opacity: couponLoading || !couponCode.trim() ? 0.6 : 1, whiteSpace:'nowrap', transition:'all 0.2s' }}
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
                {couponError && <p style={{ margin:'0.25rem 0 0', fontSize:'0.75rem', color:'#ef4444' }}>{couponError}</p>}
              </div>

              {/* Discount row */}
              {appliedCoupon && discountAmount > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.75rem', alignItems:'center' }}>
                  <span style={{ fontSize:'0.875rem', color:'#10b981', fontWeight:500 }}>Discount Applied</span>
                  <span style={{ fontSize:'0.875rem', color:'#10b981', fontWeight:600 }}>− ₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {/* Total */}
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.75rem', paddingTop:'0.75rem', borderTop:'2px solid var(--border)', alignItems:'center' }}>
                <span style={{ fontWeight:700, color:'var(--charcoal)', fontSize:'1rem' }}>Total Material Cost</span>
                <span style={{ fontWeight:700, color:'var(--gold-dark)', fontSize:'1.25rem' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>

              <p style={{ margin:'0.5rem 0 0 0', fontSize:'0.75rem', color:'var(--charcoal-light)', textAlign:'right' }}>
                * Freight & shipping calculated separately prior to dispatch.
              </p>
            </div>

            {/* Shipping & Contact */}
            <div style={{ marginBottom:'0.875rem' }}>
              <label>Full Name *</label>
              <input type="text" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} required />
            </div>
            <div className="form-grid-2" style={{ marginBottom:'0.875rem' }}>
              <div>
                <label>Email *</label>
                <input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} required />
              </div>
              <div>
                <label>Phone *</label>
                <input type="tel" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} required />
              </div>
            </div>
            
            <div style={{ marginBottom:'0.875rem' }}>
              <label>Street Address *</label>
              <input 
                type="text" 
                value={form.shippingAddress.houseNumber} 
                onChange={e => setForm(f => ({ ...f, shippingAddress: { ...f.shippingAddress, houseNumber: e.target.value } }))} 
                required 
                placeholder="e.g., Flat 4B, Signature Towers, MG Road, North Zone"
              />
            </div>
            
            <div style={{ marginBottom:'0.875rem' }}>
              <label>Province or Town (Search to autofill) *</label>
              <AddressAutocomplete
                value={form.shippingAddress.street}
                onChange={val => setForm(f => ({ ...f, shippingAddress: { ...f.shippingAddress, street: val } }))}
                onSelect={(data) => {
                  setForm(f => ({
                    ...f,
                    shippingAddress: {
                      ...f.shippingAddress,
                      street: data.street || data.fullAddress.split(',')[0],
                      city: data.city || f.shippingAddress.city,
                      state: data.state || f.shippingAddress.state,
                      pincode: data.pincode || f.shippingAddress.pincode
                    }
                  }));
                }}
              />
            </div>

            <div className="form-grid-3" style={{ marginBottom:'1.5rem' }}>
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
