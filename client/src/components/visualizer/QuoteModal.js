import { useState } from 'react';
import { X, Phone, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { quotesAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function QuoteModal({ selectedProducts, renderId, onClose }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    contactName: user?.name || '',
    contactPhone: user?.phone || '',
    contactEmail: user?.email || '',
    city: user?.city || '',
    projectType: 'residential',
    clientMessage: '',
    areas: Object.fromEntries(selectedProducts.map(p => [p.productId + p.zone, 100]))
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const total = selectedProducts.reduce((sum, p) => {
    const area = form.areas[p.productId + p.zone] || 100;
    return sum + area * (p.product?.pricePerSqFt || 0);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.contactName || !form.contactPhone) {
      toast.error('Name and phone number are required');
      return;
    }
    setLoading(true);
    try {
      await quotesAPI.submit({
        ...form,
        renderId,
        lineItems: selectedProducts.map(p => ({
          productId: p.productId,
          zone: p.zone,
          estimatedArea: form.areas[p.productId + p.zone] || 100
        }))
      });
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(44,36,32,0.5)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem'
    }} onClick={onClose}>
      <div style={{
        background:'var(--warm-white)', borderRadius:20, width:'100%', maxWidth:540,
        maxHeight:'90vh', overflowY:'auto', boxShadow:'var(--shadow-lg)'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h3 style={{ margin:0 }}>Request a quote</h3>
            <p style={{ margin:0, fontSize:'0.8125rem' }}>Our team will call within 24 hours</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding:'0.375rem' }}>
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div style={{ padding:'3rem 1.5rem', textAlign:'center' }}>
            <CheckCircle size={48} color="var(--gold)" style={{ margin:'0 auto 1rem', display:'block' }} />
            <h3 style={{ marginBottom:8 }}>Quote request sent!</h3>
            <p style={{ marginBottom:'1.5rem' }}>Our team will call you on <strong>{form.contactPhone}</strong> within 24 hours to discuss your project.</p>
            <button onClick={onClose} className="btn btn-primary">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding:'1.5rem' }}>
            {/* Product summary */}
            {selectedProducts.length > 0 && (
              <div style={{ marginBottom:'1.5rem' }}>
                <label style={{ marginBottom:'0.75rem' }}>Products selected</label>
                {selectedProducts.map((p, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:8, padding:'0.625rem', background:'var(--cream)', borderRadius:10 }}>
                    <div style={{ flex:1 }}>
                      <p style={{ fontWeight:500, margin:0, fontSize:'0.875rem', color:'var(--charcoal)' }}>{p.product?.name}</p>
                      <p style={{ margin:0, fontSize:'0.8125rem', color:'var(--charcoal-light)' }}>
                        {p.zone} · ₹{p.product?.pricePerSqFt}/sq.ft
                      </p>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                      <input type="number" value={form.areas[p.productId + p.zone] || 100}
                        onChange={e => setForm(f => ({ ...f, areas: { ...f.areas, [p.productId + p.zone]: Number(e.target.value) } }))}
                        style={{ width:90, textAlign:'right', padding:'0.25rem 0.5rem', fontSize:'0.875rem' }}
                        min={1} placeholder="sq.ft" />
                      <span style={{ fontSize:'0.75rem', color:'var(--charcoal-light)' }}>sq.ft</span>
                    </div>
                  </div>
                ))}
                {total > 0 && (
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'0.75rem', background:'rgba(201,168,76,0.1)', borderRadius:10, marginTop:8 }}>
                    <span style={{ fontWeight:500, color:'var(--charcoal)' }}>Estimated total</span>
                    <span style={{ fontWeight:700, color:'var(--gold-dark)' }}>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Contact */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.875rem', marginBottom:'0.875rem' }}>
              <div>
                <label>Your name *</label>
                <input type="text" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} required placeholder="Full name" />
              </div>
              <div>
                <label>Phone number *</label>
                <input type="tel" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} required placeholder="+91 98xxx xxxxx" />
              </div>
            </div>
            <div style={{ marginBottom:'0.875rem' }}>
              <label>City</label>
              <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="e.g. Ludhiana, Tarn Taran" />
            </div>
            <div style={{ marginBottom:'0.875rem' }}>
              <label>Project type</label>
              <select value={form.projectType} onChange={e => setForm(f => ({ ...f, projectType: e.target.value }))}>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="hospitality">Hospitality / Hotel</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={{ marginBottom:'1.25rem' }}>
              <label>Message (optional)</label>
              <textarea value={form.clientMessage} onChange={e => setForm(f => ({ ...f, clientMessage: e.target.value }))}
                placeholder="Tell us more about your project…" rows={3} />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width:'100%', justifyContent:'center' }}>
              {loading ? <><div className="spinner" style={{ width:18, height:18, borderWidth:2 }} /> Submitting…</> : <><Phone size={16} /> Send quote request</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
