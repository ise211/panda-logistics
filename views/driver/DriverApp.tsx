import React, { useState, useEffect } from 'react';
import { User, Order, OrderStatus, OrderType } from '../../types';
import { getOrdersByDriver, updateOrderStatus } from '../../services/mockData';
import { MobileLayout } from '../../components/Layout';
import { Button } from '../../components/Button';
import { STATUS_LABELS, STATUS_COLORS } from '../../types';

interface DriverAppProps {
  user: User;
  onLogout: () => void;
}

export const DriverApp: React.FC<DriverAppProps> = ({ user, onLogout }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Load orders
  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [user.id]);

  const loadOrders = async () => {
    const data = await getOrdersByDriver(user.id);
    setOrders(data);
    setLoading(false);
  };

  const activeOrder = orders.find(o => o.id === activeOrderId);

  if (activeOrderId && activeOrder) {
    return (
      <ActiveOrderView 
        order={activeOrder} 
        onBack={() => setActiveOrderId(null)}
        onUpdate={() => loadOrders()}
        isDark={darkMode}
      />
    );
  }

  return (
    <MobileLayout title="My Orders" isDark={darkMode}>
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm opacity-70">Welcome, {user.name}</div>
        <div className="flex gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 bg-gray-200 dark:bg-slate-700 rounded-full">
                {darkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={onLogout} className="text-xs underline text-red-500">Logout</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="space-y-4">
          {orders.filter(o => o.status !== OrderStatus.COMPLETED).length === 0 && (
            <div className="text-center py-10 text-gray-500">No active orders for today. Good job!</div>
          )}
          
          {orders.map(order => (
            <div 
              key={order.id} 
              onClick={() => setActiveOrderId(order.id)}
              className={`p-4 rounded-xl shadow-md border-l-4 cursor-pointer transition-transform active:scale-95 ${
                darkMode ? 'bg-secondary border-slate-700' : 'bg-white'
              } ${
                order.status === OrderStatus.PLANNED ? 'border-gray-400' :
                order.status === OrderStatus.ISSUE ? 'border-red-500' :
                order.status === OrderStatus.COMPLETED ? 'border-green-500' :
                order.type === OrderType.DELIVERY ? 'border-orange-500' : 'border-primary'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${STATUS_COLORS[order.status]}`}>
                  {STATUS_LABELS[order.status]}
                </span>
                <span className="text-xs font-mono opacity-60">{order.timeWindow}</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                 {order.type === OrderType.DELIVERY ? (
                     <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded font-bold border border-orange-200">DELIVERY ⬆️</span>
                 ) : (
                     <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-bold border border-blue-200">COLLECTION ⬇️</span>
                 )}
              </div>
              <h3 className="font-bold text-lg mb-1">{order.clientName}</h3>
              <p className="text-sm opacity-80 mb-2">{order.address}</p>
              <div className="flex justify-between items-center text-sm mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                <span className="font-medium text-primary">
                    {order.containerSize ? `${order.containerSize} ` : ''} 
                    {order.scrapType}
                </span>
                <span className="font-mono opacity-50">{order.truckType === 'Skip Lorry' ? 'SKIP' : 'HOOK'}</span>
              </div>
            </div>
          ))}

          {/* History Section Header */}
          <div className="pt-8 pb-2 font-bold text-lg opacity-60">History (Today)</div>
          {orders.filter(o => o.status === OrderStatus.COMPLETED).map(order => (
             <div key={order.id} className="opacity-60 bg-gray-100 dark:bg-slate-800 p-4 rounded-lg">
                <div className="flex justify-between">
                    <span className="font-bold">{order.clientName}</span>
                    <span className="text-green-600 font-bold">✓</span>
                </div>
                <div className="text-xs mt-1">
                    {order.type === OrderType.DELIVERY ? 'Container Dropped' : `Net: ${order.weightRecord?.net} kg`}
                </div>
             </div>
          ))}
        </div>
      )}
    </MobileLayout>
  );
};

// Sub-component for Active Order Detail
const ActiveOrderView: React.FC<{ order: Order, onBack: () => void, onUpdate: () => void, isDark: boolean }> = ({ order, onBack, onUpdate, isDark }) => {
  const [weightData, setWeightData] = useState({ estimated: '', ticket: '' });
  const [checklist, setChecklist] = useState({ ppe: false, vehicle: false, docs: false });
  // Delivery specific checklist
  const [deliveryChecklist, setDeliveryChecklist] = useState({ groundStable: false, doorsLocked: false, customerApproved: false });
  
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [issueText, setIssueText] = useState('');

  const isDelivery = order.type === OrderType.DELIVERY;

  const handleStatusChange = async (newStatus: OrderStatus, extraData?: any) => {
    await updateOrderStatus(order.id, newStatus, extraData);
    onUpdate();
  };

  const openExternalNav = () => {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(order.address)}`, '_blank');
  };

  const submitIssue = () => {
    handleStatusChange(OrderStatus.ISSUE, { issueReport: issueText });
    setIssueModalOpen(false);
  };

  // Embed Google Maps iframe URL
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(order.address)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <MobileLayout title={isDelivery ? "Delivery Details" : "Collection Details"} onBack={onBack} isDark={isDark}>
        
        {/* Info Card */}
        <div className={`p-4 rounded-xl mb-6 shadow-sm border-l-4 ${isDelivery ? 'border-orange-500' : 'border-primary'} ${isDark ? 'bg-secondary' : 'bg-white'}`}>
            <div className="flex justify-between items-start mb-2">
                 <h2 className="text-2xl font-bold mb-1">{order.clientName}</h2>
                 {isDelivery ? 
                    <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded font-bold border border-orange-200">DELIVERY</span> :
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold border border-blue-200">PICKUP</span>
                 }
            </div>
            
            <p className="text-lg mb-4">{order.address}</p>
            
            {/* Embedded Map */}
            <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden mb-4 border border-gray-300 relative">
                 <iframe 
                    width="100%" 
                    height="100%" 
                    src={mapUrl}
                    frameBorder="0" 
                    scrolling="no" 
                    marginHeight={0} 
                    marginWidth={0}
                    className="absolute inset-0"
                    title="Map Location"
                 ></iframe>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                    <div className="opacity-60">{isDelivery ? 'Dropping:' : 'Collecting:'}</div>
                    <div className="font-bold text-lg">{order.scrapType}</div>
                </div>
                <div>
                    <div className="opacity-60">Truck / Size:</div>
                    <div className="font-bold">
                        {order.truckType} <br/>
                        <span className={`text-lg ${isDelivery ? 'text-orange-600' : 'text-primary'}`}>{order.containerSize || 'Standard'}</span>
                    </div>
                </div>
            </div>

            <Button variant="outline" fullWidth onClick={openExternalNav} className="mb-2">
                🚀 Launch GPS App
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
                <Button variant="success" size="sm" onClick={() => setCompleteModalOpen(true)}>
                    ✅ Complete Order
                </Button>
                <Button variant="danger" size="sm" onClick={() => setIssueModalOpen(true)}>
                    ⚠️ Report Issue
                </Button>
            </div>
        </div>

        {/* Workflow Steps */}
        <div className="space-y-6">
            
            {/* Step 1: Checklist & Start */}
            {order.status === OrderStatus.PLANNED && (
                <div className="animate-fade-in">
                    <h3 className="font-bold mb-3">1. Safety Checklist</h3>
                    <div className={`space-y-3 p-4 rounded-lg mb-4 ${isDark ? 'bg-secondary border border-gray-700' : 'bg-white'}`}>
                        <label className="flex items-center gap-3 p-2">
                            <input type="checkbox" className="w-6 h-6 accent-primary" checked={checklist.ppe} onChange={e => setChecklist({...checklist, ppe: e.target.checked})} />
                            <span>🦺 I have PPE (Helmet & Vest)</span>
                        </label>
                        <label className="flex items-center gap-3 p-2">
                            <input type="checkbox" className="w-6 h-6 accent-primary" checked={checklist.vehicle} onChange={e => setChecklist({...checklist, vehicle: e.target.checked})} />
                            <span>🚛 Vehicle Check OK</span>
                        </label>
                        <label className="flex items-center gap-3 p-2">
                            <input type="checkbox" className="w-6 h-6 accent-primary" checked={checklist.docs} onChange={e => setChecklist({...checklist, docs: e.target.checked})} />
                            <span>📄 Transport Documents</span>
                        </label>
                    </div>
                    <Button 
                        fullWidth size="xl" variant="primary"
                        disabled={!checklist.ppe || !checklist.vehicle || !checklist.docs}
                        onClick={() => handleStatusChange(OrderStatus.IN_TRANSIT, { checklist })}
                    >
                        START ROUTE ▶
                    </Button>
                </div>
            )}

            {/* Step 2: In Transit */}
            {order.status === OrderStatus.IN_TRANSIT && (
                <div className="animate-fade-in text-center">
                    <div className="text-6xl mb-4">🚛</div>
                    <p className="mb-6 opacity-80">You are on the way to the client.</p>
                    <Button fullWidth size="xl" variant="success" onClick={() => handleStatusChange(OrderStatus.ON_SITE)}>
                        I'VE ARRIVED 🏁
                    </Button>
                </div>
            )}

            {/* Step 3: On Site (Loading/Unloading) */}
            {order.status === OrderStatus.ON_SITE && (
                <div className="animate-fade-in text-center">
                    <div className="text-6xl mb-4">{isDelivery ? '⬇️' : '🏗️'}</div>
                    <h3 className="text-xl font-bold mb-2">
                        {isDelivery ? `Dropping ${order.containerSize || 'Bin'}` : 'Loading Scrap'}
                    </h3>
                    <p className="mb-6 opacity-80">
                        {isDelivery 
                            ? 'Positioning the container carefully. Ensure safety zone.' 
                            : 'Loading scrap at client site...'}
                    </p>
                    <Button fullWidth size="xl" variant="primary" onClick={() => handleStatusChange(OrderStatus.ON_SCALE)}>
                        {isDelivery ? 'CONTAINER PLACED ✅' : 'LOADING COMPLETE 📦'}
                    </Button>
                </div>
            )}

            {/* Step 4: Action Confirmation */}
            {order.status === OrderStatus.ON_SCALE && (
                <div className="animate-fade-in">
                    <h3 className="font-bold mb-3">{isDelivery ? 'Drop-off Confirmation' : 'Pickup Confirmation'}</h3>
                    
                    {isDelivery ? (
                         // DELIVERY VIEW
                         <div className={`p-4 rounded-lg space-y-4 mb-4 ${isDark ? 'bg-secondary border border-gray-700' : 'bg-white'}`}>
                            <div className="p-3 bg-orange-50 border border-orange-100 rounded text-orange-900 text-sm mb-2">
                                <strong>Safety Protocol:</strong> Ensure container is on flat ground and doors are secure.
                            </div>
                            
                            <label className="flex items-center gap-3 p-2 border-b border-gray-100">
                                <input type="checkbox" className="w-6 h-6 accent-orange-500" checked={deliveryChecklist.groundStable} onChange={e => setDeliveryChecklist({...deliveryChecklist, groundStable: e.target.checked})} />
                                <span>Ground is stable & flat</span>
                            </label>
                             <label className="flex items-center gap-3 p-2 border-b border-gray-100">
                                <input type="checkbox" className="w-6 h-6 accent-orange-500" checked={deliveryChecklist.doorsLocked} onChange={e => setDeliveryChecklist({...deliveryChecklist, doorsLocked: e.target.checked})} />
                                <span>Doors/Locks secured</span>
                            </label>
                             <label className="flex items-center gap-3 p-2">
                                <input type="checkbox" className="w-6 h-6 accent-orange-500" checked={deliveryChecklist.customerApproved} onChange={e => setDeliveryChecklist({...deliveryChecklist, customerApproved: e.target.checked})} />
                                <span>Customer approved placement</span>
                            </label>
                         </div>
                    ) : (
                        // COLLECTION VIEW
                        <div className={`p-4 rounded-lg space-y-4 mb-4 ${isDark ? 'bg-secondary border border-gray-700' : 'bg-white'}`}>
                            <p className="text-sm opacity-70 italic">
                                Enter the Collection Note number below. Exact weighing will take place at the depot.
                            </p>
                            <div>
                                <label className="block text-sm opacity-70 mb-1">Collection Note / Ticket No.</label>
                                <input 
                                    type="text" 
                                    className="w-full p-3 rounded bg-transparent border border-gray-400 font-mono"
                                    value={weightData.ticket}
                                    onChange={e => setWeightData({...weightData, ticket: e.target.value})}
                                    placeholder="e.g. WZ-1234"
                                />
                            </div>
                            <div>
                                <label className="block text-sm opacity-70 mb-1">Estimated Weight (kg) - Optional</label>
                                <input 
                                    type="number" 
                                    className="w-full p-3 rounded bg-transparent border border-gray-400 font-mono text-xl"
                                    value={weightData.estimated}
                                    onChange={e => setWeightData({...weightData, estimated: e.target.value})}
                                    placeholder="~"
                                />
                            </div>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <Button variant="secondary" size="sm">📷 {isDelivery ? 'Placement Photo' : 'Cargo Photo'}</Button>
                        <Button variant="secondary" size="sm">✍️ Signature</Button>
                    </div>

                    <Button 
                        fullWidth size="xl" variant={isDelivery ? "secondary" : "success"} // Use secondary/orange styled if needed or just success
                        className={isDelivery ? "bg-orange-600 hover:bg-orange-700 text-white" : ""}
                        disabled={isDelivery && (!deliveryChecklist.groundStable || !deliveryChecklist.doorsLocked || !deliveryChecklist.customerApproved)}
                        onClick={() => handleStatusChange(OrderStatus.COMPLETED, {
                            weightRecord: {
                                gross: 0, 
                                tare: 0,
                                net: parseFloat(weightData.estimated) || 0,
                                ticketNumber: isDelivery ? 'DELIVERED' : (weightData.ticket || 'NO-TICKET'),
                                timestamp: new Date().toISOString()
                            }
                        })}
                    >
                        {isDelivery ? 'CONFIRM DROP-OFF' : 'CONFIRM PICKUP ✅'}
                    </Button>
                </div>
            )}

             {/* Complete Order Modal */}
             {completeModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
                     <div className={`w-full max-w-sm p-6 rounded-lg ${isDark ? 'bg-secondary' : 'bg-white'}`}>
                         <h3 className="font-bold text-lg mb-4">Complete Order</h3>
                         <p className="mb-4 text-sm opacity-80">
                            Are you sure you want to mark this order as completed?
                            {order.status !== OrderStatus.ON_SCALE && <span className="block text-orange-500 mt-2 font-bold">Warning: Standard flow was skipped.</span>}
                         </p>
                         <div className="flex gap-2">
                             <Button fullWidth variant="secondary" onClick={() => setCompleteModalOpen(false)}>Cancel</Button>
                             <Button fullWidth variant="success" onClick={() => {
                                 handleStatusChange(OrderStatus.COMPLETED);
                                 setCompleteModalOpen(false);
                             }}>Confirm</Button>
                         </div>
                     </div>
                 </div>
             )}

             {/* Issue Modal */}
             {issueModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
                     <div className={`w-full max-w-sm p-6 rounded-lg ${isDark ? 'bg-secondary' : 'bg-white'}`}>
                         <h3 className="font-bold text-lg mb-4">Report Issue</h3>
                         <textarea 
                            className="w-full h-32 p-3 border rounded mb-4 text-slate-900"
                            placeholder="Describe the situation (breakdown, gate closed, etc.)"
                            value={issueText}
                            onChange={e => setIssueText(e.target.value)}
                         />
                         <div className="flex gap-2">
                             <Button fullWidth variant="secondary" onClick={() => setIssueModalOpen(false)}>Cancel</Button>
                             <Button fullWidth variant="danger" onClick={submitIssue}>Send</Button>
                         </div>
                     </div>
                 </div>
             )}
        </div>
    </MobileLayout>
  );
};