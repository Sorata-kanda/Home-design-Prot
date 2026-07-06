import { X, CheckCircle2, Clock, Truck, Package, PackageX } from 'lucide-react';

const STEPS = [
  { id: 'placed', label: 'Order Placed', icon: Clock },
  { id: 'processing', label: 'Processing', icon: Package },
  { id: 'shipped', label: 'Shipped', icon: Truck },
  { id: 'delivered', label: 'Delivered', icon: CheckCircle2 }
];

export default function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;

  // Determine active step index
  let activeStepIndex = 0;
  if (order.fulfillmentStatus === 'processing') activeStepIndex = 1;
  else if (order.fulfillmentStatus === 'shipped') activeStepIndex = 2;
  else if (order.fulfillmentStatus === 'delivered') activeStepIndex = 3;
  
  const isCancelled = order.fulfillmentStatus === 'cancelled';

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:99999,
      background:'rgba(44,36,32,0.6)', backdropFilter:'blur(5px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem'
    }} onClick={onClose}>
      <div style={{
        background:'var(--warm-white)', borderRadius:20, width:'100%', maxWidth:600,
        maxHeight:'90vh', overflowY:'auto', boxShadow:'var(--shadow-lg)',
        display:'flex', flexDirection:'column'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--cream)', borderTopLeftRadius:20, borderTopRightRadius:20, position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <h3 style={{ margin:0, fontSize: '1.125rem' }}>Order #{order.orderNumber || order.transactionId?.substring(0,8) || order._id.substring(0,8)}</h3>
            <p style={{ margin:0, fontSize:'0.8125rem', color: 'var(--charcoal-light)' }}>
              Placed on {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding:'0.375rem' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          
          {/* Tracking Stepper */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '0.9375rem', color: 'var(--charcoal)' }}>Tracking Status</h4>
            
            {isCancelled ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', padding: '1rem', borderRadius: 8 }}>
                <PackageX size={24} />
                <div>
                  <strong style={{ display: 'block' }}>Order Cancelled</strong>
                  <span style={{ fontSize: '0.8125rem' }}>This order has been cancelled and will not be fulfilled.</span>
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
                {/* Connecting Line */}
                <div style={{ position: 'absolute', top: '1.25rem', left: '10%', right: '10%', height: '2px', background: 'var(--border)', zIndex: 1 }} />
                
                {/* Active connecting line */}
                <div style={{ position: 'absolute', top: '1.25rem', left: '10%', right: `calc(90% - ${activeStepIndex * 26.6}%)`, height: '2px', background: 'var(--gold)', zIndex: 2, transition: 'right 0.5s ease' }} />

                {STEPS.map((step, idx) => {
                  const isCompleted = idx <= activeStepIndex;
                  const isCurrent = idx === activeStepIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, width: '25%' }}>
                      <div style={{ 
                        width: '2rem', height: '2rem', borderRadius: '50%', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isCompleted ? 'var(--gold)' : 'var(--cream)',
                        color: isCompleted ? 'white' : 'var(--charcoal-light)',
                        border: isCompleted ? 'none' : '1px solid var(--border)',
                        boxShadow: isCurrent ? '0 0 0 4px rgba(201,168,76,0.2)' : 'none',
                        transition: 'all 0.3s ease'
                      }}>
                        <Icon size={14} />
                      </div>
                      <span style={{ 
                        marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: isCurrent ? 600 : 400,
                        color: isCurrent ? 'var(--charcoal)' : (isCompleted ? 'var(--charcoal)' : 'var(--charcoal-light)'),
                        textAlign: 'center'
                      }}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            
            {/* Detailed Line Items */}
            <div>
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem', color: 'var(--charcoal)' }}>Items Purchased</h4>
              <div style={{ background: 'var(--cream)', borderRadius: 12, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {order.lineItems?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      <img 
                        src={item.product?.textureImage?.url || item.product?.thumbnailImage?.url} 
                        alt="" 
                        style={{ width:40, height:40, borderRadius:6, objectFit:'cover', flexShrink:0, border: '1px solid rgba(0,0,0,0.05)' }}
                        onError={e => { e.target.style.display='none'; }} 
                      />
                      <div>
                        <span style={{ color: 'var(--charcoal)', fontWeight: 500, fontSize: '0.875rem', display: 'block' }}>
                          {item.productName}
                        </span>
                        <span style={{ color: 'var(--charcoal-light)', fontSize: '0.75rem' }}>
                          SKU: {item.sku}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 500, fontSize: '0.875rem', display: 'block' }}>{item.estimatedArea} sq.ft</span>
                      <span style={{ color: 'var(--charcoal-light)', fontSize: '0.75rem' }}>₹{item.pricePerSqFt}/sq.ft</span>
                    </div>
                  </div>
                ))}
                
                <div style={{ borderTop: '1px dashed rgba(0,0,0,0.1)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500, color: 'var(--charcoal)' }}>Total Amount</span>
                  <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--gold-dark)' }}>₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Shipping details */}
            <div>
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem', color: 'var(--charcoal)' }}>Delivery Information</h4>
              <div style={{ background: 'var(--cream)', borderRadius: 12, padding: '1rem' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--charcoal-light)', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--charcoal)', display: 'block', marginBottom: '4px' }}>{order.contactName}</strong>
                  {order.contactPhone}<br/>
                  {order.shippingAddress?.houseNumber && `${order.shippingAddress.houseNumber}, `}{order.shippingAddress?.street}, {order.shippingAddress?.city}<br/>
                  {order.shippingAddress?.state} {order.shippingAddress?.pincode}
                </p>
              </div>
            </div>

          </div>
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', background: 'var(--warm-white)', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, textAlign: 'right' }}>
           <button onClick={onClose} className="btn btn-primary">Close</button>
        </div>

      </div>
    </div>
  );
}
