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
    <MobileLayout title="My Schedule" isDark={darkMode}>
      <div className="flex justify-between items-end mb-6 px-1">
        <div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">Driver</div>
            <div className="text-2xl font-bold leading-none">{user.name}</div>
        </div>
        <div className="flex gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className={`p-3 rounded-full shadow-sm transition-transform active:scale-90 ${darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-white text-slate-600'}`}>
                {darkMode ? '🌙' : '☀️'}
            </button>
            <button onClick={onLogout} className="p-3 bg-red-50 text-red-500 rounded-full shadow-sm active:scale-90 font-bold text-xs">
                EXIT
            </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 opacity-50 animate-pulse">Loading orders...</div>
      ) : (
        <div className="space-y-5">
          {orders.filter(o => o.status !== OrderStatus.COMPLETED).length === 0 && (
            <div className="text-center py-10">
                <div className="text-6xl mb-4">🎉</div>
                <div className="text-xl font-bold opacity-80">All done for now!</div>
                <div className="text-sm opacity-50">Enjoy your break.</div>
            </div>
          )}
          
          {orders.map(order => {
             const isDelivery = order.type === OrderType.DELIVERY;
             const isCompleted = order.status === OrderStatus.COMPLETED;
             
             return (
                <div 
                key={order.id} 
                onClick={() => setActiveOrderId(order.id)}
                className={`group relative overflow-hidden rounded-3xl p-5 shadow-lg transition-all active:scale-[0.98] ${
                    darkMode ? 'bg-slate-800 shadow-slate-900/50' : 'bg-white shadow-slate-200/50'
                } ${isCompleted ? 'opacity-60 grayscale' : ''}`}
                >
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-3">
                    <div className={`px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide shadow-sm ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                    </div>
                    <div className="text-xs font-bold font-mono opacity-50 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                        {order.timeWindow}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex gap-4 items-center mb-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
                        isDelivery ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                        {isDelivery ? '⬇️' : '♻️'}
                    </div>
                    <div>
                        <h3 className="font-bold text-xl leading-tight mb-1">{order.clientName}</h3>
                        <p className="text-sm font-medium opacity-70 line-clamp-1">{order.address}</p>
                    </div>
                </div>

                {/* Footer Info */}
                <div className={`flex justify-between items-center text-sm pt-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-2">
                        <span className={`font-bold ${isDelivery ? 'text-orange-500' : 'text-primary'}`}>
                            {order.containerSize ? `${order.containerSize}` : ''} {order.scrapType}
                        </span>
                    </div>
                    <div className="font-bold text-xs bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-slate-500">
                        {order.truckType === 'Skip Lorry' ? 'SKIP' : 'HOOK'}
                    </div>
                </div>
                
                {/* Arrow indicator */}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300">
                    ➔
                </div>
                </div>
             );
          })}
        </div>
      )}
    </MobileLayout>
  );
};

// --- Sub-component: Toggle Row for Checklists ---
const ToggleRow: React.FC<{ 
    checked: boolean; 
    onChange: (val: boolean) => void; 
    label: string; 
    icon: string;
    colorClass: string;
    isDark?: boolean;
}> = ({ checked, onChange, label, icon, colorClass, isDark }) => (
    <div 
        onClick={() => onChange(!checked)}
        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer select-none active:scale-95 ${
            checked 
                ? `${colorClass} border-transparent shadow-md` 
                : `${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`
        }`}
    >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${checked ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
            {checked ? '✓' : icon}
        </div>
        <span className={`font-bold text-lg flex-1 ${checked ? 'text-white' : ''}`}>{label}</span>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
            checked ? 'bg-white border-white' : 'border-slate-300'
        }`}>
            {checked && <div className="w-3 h-3 rounded-full bg-current opacity-50" />}
        </div>
    </div>
);


// --- Sub-component: Active Order Detail ---
const ActiveOrderView: React.FC<{ order: Order, onBack: () => void, onUpdate: () => void, isDark: boolean }> = ({ order, onBack, onUpdate, isDark }) => {
  const [weightData, setWeightData] = useState({ estimated: '', ticket: '' });
  const [checklist, setChecklist] = useState({ ppe: false, vehicle: false, docs: false });
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

  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(order.address)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <MobileLayout title={isDelivery ? "Drop-off" : "Collection"} onBack={onBack} isDark={isDark}>
        
        {/* Top Card */}
        <div className={`relative p-5 rounded-3xl mb-6 shadow-xl overflow-hidden ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}>
            <div className={`absolute top-0 left-0 w-2 h-full ${isDelivery ? 'bg-orange-500' : 'bg-primary'}`} />
            
            <div className="pl-4">
                <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-black uppercase tracking-wider px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-500`}>
                        {isDelivery ? 'DELIVERY' : 'PICKUP'}
                    </span>
                    <button onClick={openExternalNav} className="text-blue-500 font-bold text-sm flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full active:bg-blue-100">
                        <span>🗺️</span> GO
                    </button>
                </div>
                
                <h2 className="text-2xl font-black leading-tight mb-1">{order.clientName}</h2>
                <p className="text-lg opacity-80 font-medium mb-4">{order.address}</p>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                    <div>
                        <div className="text-xs uppercase opacity-50 font-bold">Cargo</div>
                        <div className="font-bold text-lg">{order.scrapType}</div>
                    </div>
                    <div>
                        <div className="text-xs uppercase opacity-50 font-bold">Size</div>
                        <div className="font-bold text-lg">{order.containerSize || 'Std'}</div>
                    </div>
                </div>
            </div>
            
            {/* Map Preview */}
            <div className="mt-4 h-32 w-full rounded-xl overflow-hidden shadow-inner relative border border-slate-200 dark:border-slate-700">
                 <div className="absolute inset-0 z-10 bg-transparent pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]"></div>
                 <iframe 
                    width="100%" 
                    height="100%" 
                    src={mapUrl}
                    frameBorder="0" 
                    scrolling="no" 
                    className="opacity-80 grayscale-[50%]"
                    title="Map Location"
                 ></iframe>
            </div>
        </div>

        {/* Workflow Container */}
        <div className="pb-24">
            
            {/* Step 1: Checklist */}
            {order.status === OrderStatus.PLANNED && (
                <div className="animate-fade-in space-y-3">
                    <h3 className="font-bold text-xl mb-2 px-1">Safety Check</h3>
                    <ToggleRow 
                        checked={checklist.ppe} onChange={v => setChecklist({...checklist, ppe: v})}
                        label="PPE Equipment" icon="🦺" colorClass="bg-blue-500 border-blue-600" isDark={isDark}
                    />
                    <ToggleRow 
                        checked={checklist.vehicle} onChange={v => setChecklist({...checklist, vehicle: v})}
                        label="Vehicle Safe" icon="🚛" colorClass="bg-blue-500 border-blue-600" isDark={isDark}
                    />
                    <ToggleRow 
                        checked={checklist.docs} onChange={v => setChecklist({...checklist, docs: v})}
                        label="Documents" icon="📄" colorClass="bg-blue-500 border-blue-600" isDark={isDark}
                    />
                </div>
            )}

            {/* Step 2: Transit */}
            {order.status === OrderStatus.IN_TRANSIT && (
                <div className="animate-fade-in text-center py-10">
                    <div className="inline-block p-6 rounded-full bg-blue-50 dark:bg-slate-800 mb-6 animate-bounce">
                        <span className="text-6xl">🚛</span>
                    </div>
                    <h3 className="text-2xl font-black mb-2">Driving...</h3>
                    <p className="opacity-60 text-lg">Focus on the road.</p>
                </div>
            )}

            {/* Step 3: On Site */}
            {order.status === OrderStatus.ON_SITE && (
                <div className="animate-fade-in text-center py-6">
                     <div className="inline-block p-6 rounded-full bg-yellow-50 dark:bg-slate-800 mb-6">
                        <span className="text-6xl">{isDelivery ? '⬇️' : '🏗️'}</span>
                    </div>
                    <h3 className="text-2xl font-black mb-2">{isDelivery ? 'Dropping Off' : 'Loading...'}</h3>
                    <p className="opacity-60 text-lg px-8">
                        {isDelivery ? 'Place container safely.' : 'Load material according to safety rules.'}
                    </p>
                </div>
            )}

            {/* Step 4: Verification */}
            {order.status === OrderStatus.ON_SCALE && (
                <div className="animate-fade-in space-y-4">
                    <h3 className="font-bold text-xl mb-2 px-1">{isDelivery ? 'Drop Confirmation' : 'Load Details'}</h3>
                    
                    {isDelivery ? (
                         <div className="space-y-3">
                            <ToggleRow 
                                checked={deliveryChecklist.groundStable} onChange={v => setDeliveryChecklist({...deliveryChecklist, groundStable: v})}
                                label="Ground Stable" icon="⛰️" colorClass="bg-orange-500 border-orange-600" isDark={isDark}
                            />
                            <ToggleRow 
                                checked={deliveryChecklist.doorsLocked} onChange={v => setDeliveryChecklist({...deliveryChecklist, doorsLocked: v})}
                                label="Doors Secured" icon="🔒" colorClass="bg-orange-500 border-orange-600" isDark={isDark}
                            />
                            <ToggleRow 
                                checked={deliveryChecklist.customerApproved} onChange={v => setDeliveryChecklist({...deliveryChecklist, customerApproved: v})}
                                label="Client Approved" icon="👍" colorClass="bg-orange-500 border-orange-600" isDark={isDark}
                            />
                         </div>
                    ) : (
                        <div className={`p-5 rounded-2xl shadow-sm space-y-5 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-2">Ticket Number</label>
                                <input 
                                    type="text" 
                                    className="w-full p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border-2 border-transparent focus:border-primary text-2xl font-mono text-center outline-none"
                                    value={weightData.ticket}
                                    onChange={e => setWeightData({...weightData, ticket: e.target.value})}
                                    placeholder="----"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-2">Est. Weight (kg)</label>
                                <input 
                                    type="number" 
                                    className="w-full p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border-2 border-transparent focus:border-primary text-2xl font-mono text-center outline-none"
                                    value={weightData.estimated}
                                    onChange={e => setWeightData({...weightData, estimated: e.target.value})}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <Button variant="outline" size="lg" className="flex flex-col gap-1 h-auto py-3">
                            <span className="text-2xl">📷</span>
                            <span className="text-xs">Photo</span>
                        </Button>
                        <Button variant="outline" size="lg" className="flex flex-col gap-1 h-auto py-3">
                            <span className="text-2xl">✍️</span>
                            <span className="text-xs">Sign</span>
                        </Button>
                    </div>
                </div>
            )}
        </div>

        {/* --- FIXED BOTTOM ACTION BAR --- */}
        <div className={`fixed bottom-0 left-0 right-0 p-4 border-t backdrop-blur-xl z-30 transition-all ${
            isDark ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-slate-200'
        }`}>
            <div className="max-w-lg mx-auto flex gap-3">
                {order.status === OrderStatus.PLANNED && (
                     <Button 
                        fullWidth size="xl" variant="primary" 
                        disabled={!checklist.ppe || !checklist.vehicle || !checklist.docs}
                        onClick={() => handleStatusChange(OrderStatus.IN_TRANSIT, { checklist })}
                        className="shadow-xl shadow-blue-500/30"
                    >
                        START ROUTE ▶
                    </Button>
                )}
                {order.status === OrderStatus.IN_TRANSIT && (
                    <Button fullWidth size="xl" variant="success" onClick={() => handleStatusChange(OrderStatus.ON_SITE)} className="shadow-xl shadow-green-500/30">
                        I'VE ARRIVED 🏁
                    </Button>
                )}
                {order.status === OrderStatus.ON_SITE && (
                    <Button fullWidth size="xl" variant="primary" onClick={() => handleStatusChange(OrderStatus.ON_SCALE)} className="shadow-xl shadow-blue-500/30">
                        DONE {isDelivery ? 'DROPPING' : 'LOADING'}
                    </Button>
                )}
                {order.status === OrderStatus.ON_SCALE && (
                    <Button 
                        fullWidth size="xl" variant={isDelivery ? "secondary" : "success"}
                        className={`${isDelivery ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30" : "shadow-green-500/30"} shadow-xl`}
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
                        CONFIRM {isDelivery ? 'DROP' : 'PICKUP'} ✓
                    </Button>
                )}

                {/* Always visible secondary options if not completed */}
                {order.status !== OrderStatus.PLANNED && (
                    <button 
                        onClick={() => setIssueModalOpen(true)}
                        className="w-16 flex-shrink-0 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center text-xl font-bold active:scale-95 transition-transform"
                    >
                        !
                    </button>
                )}
            </div>
             {order.status === OrderStatus.PLANNED && (
                 <div className="text-center mt-2">
                     <button onClick={() => setIssueModalOpen(true)} className="text-xs font-bold text-red-400 p-2">Report Issue</button>
                 </div>
             )}
        </div>

         {/* Complete/Cancel Modals (Simplified for mobile) */}
         {completeModalOpen && (
             <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 pb-10">
                 <div className={`w-full max-w-sm p-6 rounded-3xl animate-slide-up ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                     <h3 className="font-bold text-2xl mb-4">Complete Order?</h3>
                     <div className="flex flex-col gap-3">
                         <Button fullWidth variant="success" size="lg" onClick={() => {
                             handleStatusChange(OrderStatus.COMPLETED);
                             setCompleteModalOpen(false);
                         }}>Yes, Complete</Button>
                         <Button fullWidth variant="secondary" size="lg" onClick={() => setCompleteModalOpen(false)}>Cancel</Button>
                     </div>
                 </div>
             </div>
         )}

         {/* Issue Modal */}
         {issueModalOpen && (
             <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 pb-0">
                 <div className={`w-full max-w-sm p-6 rounded-t-3xl sm:rounded-3xl animate-slide-up ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-xl">Report Issue</h3>
                        <button onClick={() => setIssueModalOpen(false)} className="p-2 bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center">✕</button>
                     </div>
                     <textarea 
                        className="w-full h-40 p-4 border-2 border-slate-200 rounded-2xl mb-4 text-slate-900 text-lg focus:border-red-500 outline-none"
                        placeholder="What went wrong?"
                        value={issueText}
                        onChange={e => setIssueText(e.target.value)}
                     />
                     <Button fullWidth variant="danger" size="lg" onClick={submitIssue} className="mb-6">Send Report</Button>
                 </div>
             </div>
         )}
    </MobileLayout>
  );
};