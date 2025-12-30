import React, { useState, useEffect, useMemo } from 'react';
import { User, Order, OrderStatus, STATUS_LABELS, STATUS_COLORS, ScrapType, ExportLoad, UserRole, TruckType, OrderType, ContainerSize } from '../../types';
import { getOrders, getStats, createOrder, updateOrderStatus, MOCK_USERS } from '../../services/mockData';
import { WebLayout } from '../../components/Layout';
import { Button } from '../../components/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LogisticsAppProps {
  user: User;
  onLogout: () => void;
}

// --- Sorting Helpers ---

type SortDirection = 'asc' | 'desc';
interface SortConfig { key: string; direction: SortDirection; }

const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((o, k) => (o || {})[k], obj);
};

const useSortedData = <T,>(data: T[], config: SortConfig | null) => {
    return useMemo(() => {
        if (!config) return data;

        return [...data].sort((a, b) => {
            const aValue = getNestedValue(a, config.key);
            const bValue = getNestedValue(b, config.key);

            if (aValue === bValue) return 0;
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            if (aValue < bValue) {
                return config.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return config.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [data, config]);
};

const SortableHeader: React.FC<{
    label: string;
    sortKey: string;
    currentSort: SortConfig | null;
    onSort: (key: string) => void;
    align?: 'left' | 'right';
}> = ({ label, sortKey, currentSort, onSort, align = 'left' }) => (
    <th 
        className={`p-4 cursor-pointer hover:bg-gray-200 transition-colors select-none ${align === 'right' ? 'text-right' : 'text-left'}`}
        onClick={() => onSort(sortKey)}
    >
        <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
            {label}
            {currentSort?.key === sortKey && (
                <span className="text-primary font-bold">{currentSort.direction === 'asc' ? ' ↑' : ' ↓'}</span>
            )}
            {currentSort?.key !== sortKey && (
                 <span className="text-gray-300 text-xs"> ⇅</span>
            )}
        </div>
    </th>
);

// --- Mobile Card Component ---
const MobileLogisticsCard: React.FC<{
    order: Order;
    onClick?: () => void;
    actionButton?: React.ReactNode;
}> = ({ order, onClick, actionButton }) => {
    const isDelivery = order.type === OrderType.DELIVERY;
    return (
        <div onClick={onClick} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3 active:scale-[0.99] transition-transform">
            <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                </span>
                <span className="text-xs font-mono text-gray-400">{order.date}</span>
            </div>
            
            <div className="flex items-center gap-3 mb-3">
                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 ${isDelivery ? 'bg-orange-100' : 'bg-blue-100'}`}>
                    {isDelivery ? '⬇️' : '♻️'}
                 </div>
                 <div className="min-w-0">
                     <h3 className="font-bold text-gray-800 truncate">{order.clientName}</h3>
                     <p className="text-xs text-gray-500 truncate">{order.address}</p>
                 </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-2 rounded-lg mb-3">
                <div>
                    <span className="text-xs text-gray-400 block">Driver</span>
                    <span className="font-medium text-gray-700">{order.driverName.split(' ')[0]}</span>
                </div>
                 <div className="text-right">
                    <span className="text-xs text-gray-400 block">Cargo</span>
                    <span className="font-medium text-gray-700">{order.containerSize} {order.scrapType}</span>
                </div>
            </div>

            <div className="flex justify-between items-center border-t pt-2 mt-2">
                 <div className="text-xs text-gray-400">
                    ID: {order.id}
                 </div>
                 <div>
                     {actionButton}
                 </div>
            </div>
        </div>
    );
}

// --- Main Component ---

export const LogisticsApp: React.FC<LogisticsAppProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    const o = await getOrders();
    const s = await getStats();
    setOrders(o);
    setStats(s);
  };

  const handleOrderCreated = () => {
      refreshData();
      setActiveTab('orders');
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard stats={stats} orders={orders} />;
      case 'create': return <NewJobView onSuccess={handleOrderCreated} />;
      case 'orders': return <OrdersTable orders={orders} refresh={refreshData} />;
      case 'collections': return <CollectionsView orders={orders} refresh={refreshData} />;
      case 'delivery': return <DeliveryView orders={orders} />;
      case 'registry': return <RegistryTable orders={orders} />;
      case 'reports': return <ReportsView orders={orders} />;
      case 'export': return <ShipLoadingView />;
      default: return <Dashboard stats={stats} orders={orders} />;
    }
  };

  const getTitle = () => {
      switch(activeTab) {
          case 'dashboard': return 'Dashboard';
          case 'create': return 'New Job';
          case 'orders': return 'All Jobs';
          case 'collections': return 'Collections';
          case 'delivery': return 'Deliveries';
          case 'registry': return 'Registry';
          case 'reports': return 'Reports';
          case 'export': return 'Export';
          default: return '';
      }
  }

  const pendingWeighingCount = useMemo(() => orders.filter(o => 
    o.status === OrderStatus.COMPLETED && 
    o.weightRecord?.gross === 0
  ).length, [orders]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', mobileLabel: 'Home' },
    { id: 'create', label: 'Create Job', mobileLabel: 'New +' },
    { id: 'orders', label: 'All Jobs', mobileLabel: 'Jobs', count: pendingWeighingCount },
    { id: 'collections', label: 'Collections', mobileLabel: 'In' },
    { id: 'delivery', label: 'Deliveries', mobileLabel: 'Out' },
    { id: 'registry', label: 'Registry', mobileLabel: 'Wgt' },
    { id: 'reports', label: 'Reports', mobileLabel: 'Rpt' },
    { id: 'export', label: 'Ship Export', mobileLabel: 'Ship' },
  ];

  return (
    <WebLayout 
      title={getTitle()} 
      user={user} 
      onLogout={onLogout} 
      currentTab={activeTab}
      onTabChange={setActiveTab}
      tabs={tabs}
    >
      <div className="pb-16 md:pb-0"> {/* Mobile bottom padding */}
        {renderContent()}
      </div>
    </WebLayout>
  );
};

// --- Sub-components ---

const Dashboard: React.FC<{ stats: any, orders: Order[] }> = ({ stats, orders }) => {
    if (!stats) return <div className="p-10 text-center text-gray-400">Loading stats...</div>;

    const issues = orders.filter(o => o.status === OrderStatus.ISSUE);
    const pendingWeighing = orders.filter(o => o.status === OrderStatus.COMPLETED && o.weightRecord?.gross === 0);

    const StatCard = ({ title, value, color, icon }: any) => (
        <div className={`bg-white p-5 rounded-2xl shadow-sm border-l-4 ${color} relative overflow-hidden`}>
            <div className="relative z-10">
                <div className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-1">{title}</div>
                <div className="text-3xl font-black text-gray-800">{value}</div>
            </div>
            <div className="absolute right-2 bottom-2 text-4xl opacity-10 grayscale">
                {icon}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                <StatCard title="Active" value={stats.activeCount} color="border-primary" icon="🚛" />
                <StatCard title="Pending Wgt" value={pendingWeighing.length} color="border-purple-500" icon="⚖️" />
                <StatCard title="Done Today" value={stats.completedCount} color="border-green-500" icon="✅" />
                <StatCard title="Issues" value={issues.length} color="border-red-500" icon="⚠️" />
            </div>

            {issues.length > 0 && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl shadow-sm">
                    <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                        <span>🚨</span> Requires Attention
                    </h3>
                    <div className="space-y-2">
                        {issues.map(o => (
                            <div key={o.id} className="bg-white p-3 rounded-lg text-sm text-red-700 shadow-sm border border-red-100">
                                <div className="flex justify-between font-bold">
                                    <span>{o.driverName}</span>
                                    <span>{o.clientName}</span>
                                </div>
                                <div className="mt-1 opacity-80">"{o.issueReport}"</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm h-64 md:h-80">
                <h3 className="font-bold mb-4 text-gray-700 text-sm md:text-base">Order Status Overview</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                        { name: 'Plan', count: orders.filter(o => o.status === OrderStatus.PLANNED).length },
                        { name: 'Trans', count: orders.filter(o => o.status === OrderStatus.IN_TRANSIT).length },
                        { name: 'Site', count: orders.filter(o => o.status === OrderStatus.ON_SITE).length },
                        { name: 'Wgt', count: pendingWeighing.length },
                        { name: 'Done', count: orders.filter(o => o.status === OrderStatus.COMPLETED && o.weightRecord?.gross !== 0).length },
                    ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} hide />
                        <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="count" fill="#1E79BF" radius={[4, 4, 4, 4]} barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const NewJobView: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
    const availableDrivers = MOCK_USERS.filter(u => u.role === UserRole.DRIVER);
    const [formData, setFormData] = useState({ 
        type: OrderType.COLLECTION,
        client: '', 
        address: '', 
        weight: 0, 
        driverId: availableDrivers[0]?.id || '',
        truckType: TruckType.SKIP as TruckType,
        containerSize: ContainerSize.Y8 as string
    });

    const getContainerSizes = (truck: TruckType) => {
        if (truck === TruckType.SKIP) {
            return [ContainerSize.Y6, ContainerSize.Y8, ContainerSize.Y12, ContainerSize.Y14, ContainerSize.Y16];
        }
        if (truck === TruckType.HOOKLIFT) {
            return [ContainerSize.Y20, ContainerSize.Y35, ContainerSize.Y40];
        }
        return [];
    };

    useEffect(() => {
        const sizes = getContainerSizes(formData.truckType);
        if (!sizes.includes(formData.containerSize as ContainerSize)) {
            setFormData(prev => ({ ...prev, containerSize: sizes[0] }));
        }
    }, [formData.truckType]);

    const handleCreate = async () => {
        const selectedDriver = availableDrivers.find(d => d.id === formData.driverId);
        if (!selectedDriver) {
            alert("Please select a valid driver");
            return;
        }

        await createOrder({
            type: formData.type,
            clientName: formData.client,
            address: formData.address,
            plannedWeight: formData.weight,
            scrapType: formData.type === OrderType.DELIVERY ? ScrapType.EMPTY_BIN : ScrapType.STEEL,
            truckType: formData.truckType,
            containerSize: formData.containerSize,
            status: OrderStatus.PLANNED,
            driverId: selectedDriver.id,
            driverName: selectedDriver.name,
            vehicleId: selectedDriver.vehicleId || 'Unknown',
            date: new Date().toISOString().split('T')[0],
            timeWindow: '08:00 - 16:00'
        });
        onSuccess();
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto animate-fade-in">
             <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                 <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-2xl">📝</div>
                 <div>
                     <h2 className="text-xl font-bold text-gray-800">Create New Job</h2>
                     <p className="text-sm text-gray-500">Assign a new task to a driver</p>
                 </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div>
                    <label className="block text-xs font-bold mb-2 text-gray-500 uppercase tracking-wide">Job Type</label>
                    <select 
                        className="w-full border p-4 rounded-xl bg-gray-50 font-bold text-lg hover:bg-white focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-primary/20" 
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value as OrderType})}
                    >
                        <option value={OrderType.COLLECTION}>⬇️ Collection (Pickup)</option>
                        <option value={OrderType.DELIVERY}>⬆️ Delivery (Drop-off)</option>
                    </select>
                </div>

                <div className="lg:col-span-2">
                    <label className="block text-xs font-bold mb-2 text-gray-500 uppercase tracking-wide">Assign Driver</label>
                    <select 
                        className="w-full border p-4 rounded-xl bg-gray-50 hover:bg-white focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-primary/20" 
                        value={formData.driverId} 
                        onChange={e => setFormData({...formData, driverId: e.target.value})}
                    >
                        {availableDrivers.map(d => (
                            <option key={d.id} value={d.id}>{d.name} ({d.vehicleId})</option>
                        ))}
                    </select>
                </div>

                <div className="lg:col-span-3">
                    <label className="block text-xs font-bold mb-2 text-gray-500 uppercase tracking-wide">Client Company Name</label>
                    <input className="w-full border p-4 rounded-xl bg-gray-50 hover:bg-white focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-primary/20" value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} placeholder="e.g. Aberdeen Construction Ltd" />
                </div>

                <div className="lg:col-span-3">
                    <label className="block text-xs font-bold mb-2 text-gray-500 uppercase tracking-wide">Site Address</label>
                    <input className="w-full border p-4 rounded-xl bg-gray-50 hover:bg-white focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-primary/20" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="e.g. 15 Union Street, Aberdeen, AB11 6BB" />
                </div>
                
                <div>
                    <label className="block text-xs font-bold mb-2 text-gray-500 uppercase tracking-wide">Truck Type</label>
                    <select 
                        className="w-full border p-4 rounded-xl bg-gray-50 hover:bg-white focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-primary/20"
                        value={formData.truckType}
                        onChange={e => setFormData({...formData, truckType: e.target.value as TruckType})}
                    >
                        <option value={TruckType.SKIP}>Skip Lorry</option>
                        <option value={TruckType.HOOKLIFT}>Hooklift Lorry</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold mb-2 text-gray-500 uppercase tracking-wide">Container Size</label>
                    <select 
                        className="w-full border p-4 rounded-xl bg-gray-50 font-mono hover:bg-white focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-primary/20"
                        value={formData.containerSize}
                        onChange={e => setFormData({...formData, containerSize: e.target.value})}
                    >
                        {getContainerSizes(formData.truckType).map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold mb-2 text-gray-500 uppercase tracking-wide">Planned Weight (kg)</label>
                    <input 
                        className={`w-full border p-4 rounded-xl bg-gray-50 hover:bg-white focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-primary/20 ${formData.type === OrderType.DELIVERY ? 'opacity-50 cursor-not-allowed' : ''}`}
                        type="number" 
                        value={formData.weight} 
                        onChange={e => setFormData({...formData, weight: parseInt(e.target.value) || 0})} 
                        disabled={formData.type === OrderType.DELIVERY} 
                        placeholder={formData.type === OrderType.DELIVERY ? "N/A" : "kg"}
                    />
                </div>
             </div>

             <div className="flex justify-end pt-4 border-t">
                 <Button variant="success" size="lg" onClick={handleCreate} disabled={!formData.client || !formData.address} className="w-full md:w-auto min-w-[200px] shadow-lg shadow-green-500/30">
                     Create Order
                 </Button>
             </div>
        </div>
    );
};

const CollectionsView: React.FC<{ orders: Order[], refresh: () => void }> = ({ orders, refresh }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'date', direction: 'desc' });
    const [editingMaterialOrder, setEditingMaterialOrder] = useState<Order | null>(null);
    const collectionOrders = useMemo(() => orders.filter(o => o.type === OrderType.COLLECTION), [orders]);
    
    const handleSort = (key: string) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedCollections = useSortedData(collectionOrders, sortConfig);
    const activeCount = collectionOrders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.PLANNED).length;

    return (
        <div className="space-y-4">
             {/* Mobile Header Stat */}
             <div className="md:hidden bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                 <span className="text-blue-900 font-bold">Pickups in progress</span>
                 <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">{activeCount}</span>
             </div>

             {/* Desktop Stats */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-400">
                    <div className="text-sm text-gray-500">Pickups in Progress</div>
                    <div className="text-3xl font-bold">{activeCount}</div>
                </div>
                {/* ... other stats ... */}
            </div>

            {/* Mobile List */}
            <div className="md:hidden">
                {sortedCollections.map(order => (
                    <MobileLogisticsCard 
                        key={order.id} 
                        order={order}
                        actionButton={
                            order.weightRecord?.gross === 0 && (
                                <span className="text-purple-600 text-xs font-bold bg-purple-50 px-2 py-1 rounded">Needs Weighing</span>
                            )
                        } 
                    />
                ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <SortableHeader label="Date" sortKey="date" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Client" sortKey="clientName" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Address" sortKey="address" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Driver" sortKey="driverName" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Material" sortKey="scrapType" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Est. Weight" sortKey="weightRecord.net" currentSort={sortConfig} onSort={handleSort} align="right" />
                            <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                        </tr>
                    </thead>
                    <tbody>
                        {sortedCollections.map(order => (
                            <tr key={order.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-mono text-gray-500">
                                    {order.date} <br/> <span className="text-xs">{order.timeWindow}</span>
                                </td>
                                <td className="p-4 font-bold">{order.clientName}</td>
                                <td className="p-4 text-gray-600">{order.address}</td>
                                <td className="p-4">
                                    <div className="font-medium">{order.driverName}</div>
                                    <div className="text-xs text-gray-400">{order.vehicleId}</div>
                                </td>
                                <td className="p-4 group relative">
                                    <div className="flex items-center gap-2">
                                        <div>
                                            <span className="font-bold text-gray-700">{order.scrapType}</span>
                                            {order.containerSize && <div className="text-xs text-gray-400">{order.containerSize}</div>}
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingMaterialOrder(order); }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50"
                                            title="Change Material"
                                        >
                                            ✎
                                        </button>
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                     {order.weightRecord ? (
                                            <div className={order.weightRecord.gross === 0 ? "text-orange-500 italic" : "font-bold"}>
                                                {order.weightRecord.gross === 0 ? `~ ${order.weightRecord.net}` : order.weightRecord.net} kg
                                            </div>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${STATUS_COLORS[order.status]}`}>
                                        {STATUS_LABELS[order.status]}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingMaterialOrder && (
                <MaterialEditModal 
                    order={editingMaterialOrder} 
                    onClose={() => setEditingMaterialOrder(null)} 
                    onSuccess={() => { setEditingMaterialOrder(null); refresh(); }} 
                />
            )}
        </div>
    );
};

const DeliveryView: React.FC<{ orders: Order[] }> = ({ orders }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'date', direction: 'desc' });
    const deliveryOrders = useMemo(() => orders.filter(o => o.type === OrderType.DELIVERY), [orders]);
    
    const handleSort = (key: string) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedDeliveries = useSortedData(deliveryOrders, sortConfig);
    const activeCount = deliveryOrders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.PLANNED).length;

    return (
        <div className="space-y-4">
             {/* Mobile Header Stat */}
             <div className="md:hidden bg-orange-50 p-4 rounded-xl border border-orange-100 flex justify-between items-center">
                 <span className="text-orange-900 font-bold">Active Deliveries</span>
                 <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold">{activeCount}</span>
             </div>

            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-400">
                    <div className="text-sm text-gray-500">Deliveries in Progress</div>
                    <div className="text-3xl font-bold">{activeCount}</div>
                </div>
            </div>

            {/* Mobile List */}
            <div className="md:hidden">
                {sortedDeliveries.map(order => (
                     <MobileLogisticsCard key={order.id} order={order} />
                ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <SortableHeader label="Date" sortKey="date" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Client" sortKey="clientName" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Address" sortKey="address" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Driver" sortKey="driverName" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Bin Type" sortKey="scrapType" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Size" sortKey="containerSize" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                        </tr>
                    </thead>
                    <tbody>
                        {sortedDeliveries.map(order => (
                            <tr key={order.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-mono text-gray-500">
                                    {order.date} <br/> <span className="text-xs">{order.timeWindow}</span>
                                </td>
                                <td className="p-4 font-bold">{order.clientName}</td>
                                <td className="p-4 text-gray-600">{order.address}</td>
                                <td className="p-4">
                                    <div className="font-medium">{order.driverName}</div>
                                    <div className="text-xs text-gray-400">{order.vehicleId}</div>
                                </td>
                                <td className="p-4">
                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold border border-gray-200">
                                        {order.truckType === TruckType.SKIP ? 'SKIP' : 'HOOK'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className="text-primary font-bold">{order.containerSize || '-'}</span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${STATUS_COLORS[order.status]}`}>
                                        {order.status === OrderStatus.COMPLETED ? 'DROPPED ✅' : STATUS_LABELS[order.status]}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const OrdersTable: React.FC<{ orders: Order[], refresh: () => void }> = ({ orders, refresh }) => {
    const [weighModalOpen, setWeighModalOpen] = useState(false);
    const [editingMaterialOrder, setEditingMaterialOrder] = useState<Order | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'id', direction: 'desc' });

    const handleSort = (key: string) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedOrders = useSortedData(orders, sortConfig);

    const openWeighModal = (order: Order) => {
        setSelectedOrder(order);
        setWeighModalOpen(true);
    };

    const handleWeighSuccess = () => {
        setWeighModalOpen(false);
        setSelectedOrder(null);
        refresh();
    };

    const pendingWeighingOrders = orders.filter(o => 
        o.type === OrderType.COLLECTION && 
        o.status === OrderStatus.COMPLETED && 
        o.weightRecord?.gross === 0
    );


    return (
        <div className="space-y-6">
            
            {pendingWeighingOrders.length > 0 && (
                <div className="animate-fade-in mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-lg font-bold text-purple-700">Needs Weighing</h2>
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-bold">{pendingWeighingOrders.length}</span>
                    </div>
                    {/* Mobile Card List for Pending Weighing */}
                    <div className="md:hidden space-y-3">
                        {pendingWeighingOrders.map(order => (
                             <div key={order.id} className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm flex flex-col gap-2">
                                 <div className="flex justify-between">
                                     <span className="font-bold">{order.clientName}</span>
                                     <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">{order.driverName}</span>
                                 </div>
                                 <div className="text-sm text-gray-500 font-mono">
                                     Ticket: {order.weightRecord?.ticketNumber}
                                 </div>
                                 <div className="text-right text-orange-500 text-sm italic">
                                     Est: {order.weightRecord?.net} kg
                                 </div>
                                 <Button size="sm" variant="primary" onClick={() => openWeighModal(order)} className="mt-2">
                                     ⚖️ Input Weights
                                 </Button>
                             </div>
                        ))}
                    </div>

                    {/* Desktop Table for Pending Weighing */}
                    <div className="hidden md:block bg-white shadow-md rounded-lg overflow-hidden border-2 border-purple-100">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-purple-50 border-b border-purple-100">
                                <tr>
                                    <th className="p-4 text-purple-900">Driver</th>
                                    <th className="p-4 text-purple-900">Client</th>
                                    <th className="p-4 text-purple-900">Ticket (Driver)</th>
                                    <th className="p-4 text-right text-purple-900">Est. Weight</th>
                                    <th className="p-4 text-right text-purple-900">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingWeighingOrders.map(order => (
                                    <tr key={order.id} className="border-b hover:bg-purple-50 transition-colors">
                                        <td className="p-4 font-bold">{order.driverName}</td>
                                        <td className="p-4">{order.clientName}</td>
                                        <td className="p-4 font-mono">{order.weightRecord?.ticketNumber}</td>
                                        <td className="p-4 text-right text-gray-500 italic">~ {order.weightRecord?.net} kg</td>
                                        <td className="p-4 text-right">
                                            <Button size="sm" variant="primary" onClick={() => openWeighModal(order)}>
                                                ⚖️ Finalize Weight
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div>
                <h2 className="text-lg font-bold mb-2 text-gray-700">All Active Jobs</h2>
                {/* Mobile Card List */}
                <div className="md:hidden">
                    {sortedOrders.map(order => (
                         <MobileLogisticsCard 
                            key={order.id} 
                            order={order} 
                            actionButton={
                                order.type === OrderType.COLLECTION && order.status === OrderStatus.COMPLETED && (
                                     <button onClick={(e) => { e.stopPropagation(); openWeighModal(order); }} className="text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1 rounded">
                                        Edit Wgt
                                    </button>
                                )
                            }
                         />
                    ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 border-b">
                            <tr>
                                <SortableHeader label="ID" sortKey="id" currentSort={sortConfig} onSort={handleSort} />
                                <SortableHeader label="Type" sortKey="type" currentSort={sortConfig} onSort={handleSort} />
                                <SortableHeader label="Client" sortKey="clientName" currentSort={sortConfig} onSort={handleSort} />
                                <SortableHeader label="Truck/Size" sortKey="truckType" currentSort={sortConfig} onSort={handleSort} />
                                <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                                <SortableHeader label="Weight (Net)" sortKey="weightRecord.net" currentSort={sortConfig} onSort={handleSort} align="right" />
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedOrders.map(order => (
                                <tr key={order.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-mono text-gray-500">{order.id}</td>
                                    <td className="p-4">
                                        {order.type === OrderType.DELIVERY ? 
                                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-bold border border-orange-200">DELIVERY ⬆️</span> : 
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold border border-blue-200">COLLECTION ⬇️</span>
                                        }
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold">{order.clientName}</div>
                                        <div className="text-xs text-gray-500">{order.address}</div>
                                    </td>
                                    <td className="p-4 group relative">
                                        <div className="font-medium">{order.truckType || 'Lorry'}</div>
                                        
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-primary font-bold">{order.containerSize || ''}</span>
                                            {order.type === OrderType.COLLECTION && (
                                                <div className="flex items-center">
                                                    <span className="text-xs text-gray-400"> • {order.scrapType}</span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setEditingMaterialOrder(order); }}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 ml-1"
                                                        title="Change Material"
                                                    >
                                                        ✎
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="text-xs text-gray-400">{order.driverName}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${STATUS_COLORS[order.status]}`}>
                                            {STATUS_LABELS[order.status]}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {order.weightRecord ? (
                                            <div className={order.weightRecord.gross === 0 ? "text-orange-500 italic" : "font-bold"}>
                                                {order.weightRecord.gross === 0 ? `~ ${order.weightRecord.net}` : order.weightRecord.net} kg
                                            </div>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm">
                                        {order.type === OrderType.COLLECTION && order.status === OrderStatus.COMPLETED && (
                                            <button onClick={() => openWeighModal(order)} className="text-blue-600 hover:underline mr-3">
                                                Edit Weight
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {weighModalOpen && selectedOrder && (
                <WeighbridgeModal 
                    order={selectedOrder} 
                    onClose={() => setWeighModalOpen(false)} 
                    onSuccess={handleWeighSuccess} 
                />
            )}

            {editingMaterialOrder && (
                <MaterialEditModal 
                    order={editingMaterialOrder} 
                    onClose={() => setEditingMaterialOrder(null)} 
                    onSuccess={() => { setEditingMaterialOrder(null); refresh(); }} 
                />
            )}
        </div>
    );
};

const RegistryTable: React.FC<{ orders: Order[] }> = ({ orders }) => {
    // Filter for completed items with valid weight records
    const records = orders
        .filter(o => o.status === OrderStatus.COMPLETED && o.weightRecord && o.weightRecord.gross > 0)
        .sort((a, b) => new Date(b.weightRecord!.timestamp).getTime() - new Date(a.weightRecord!.timestamp).getTime());

    return (
        <div className="space-y-4">
            <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Ticket</th>
                            <th className="p-4">Client</th>
                            <th className="p-4">Material</th>
                            <th className="p-4 text-right">Gross</th>
                            <th className="p-4 text-right">Tare</th>
                            <th className="p-4 text-right">Net</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map(order => (
                            <tr key={order.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 text-gray-500">{new Date(order.weightRecord!.timestamp).toLocaleDateString()}</td>
                                <td className="p-4 font-mono font-bold">{order.weightRecord!.ticketNumber}</td>
                                <td className="p-4">{order.clientName}</td>
                                <td className="p-4">{order.scrapType}</td>
                                <td className="p-4 text-right text-gray-400">{order.weightRecord!.gross}</td>
                                <td className="p-4 text-right text-gray-400">{order.weightRecord!.tare}</td>
                                <td className="p-4 text-right font-bold text-gray-800">{order.weightRecord!.net} kg</td>
                            </tr>
                        ))}
                         {records.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-10 text-center text-gray-400">No records found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
             <div className="md:hidden space-y-3">
                {records.map(order => (
                    <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between mb-2">
                             <span className="font-mono font-bold text-gray-500">#{order.weightRecord!.ticketNumber}</span>
                             <span className="text-xs text-gray-400">{new Date(order.weightRecord!.timestamp).toLocaleDateString()}</span>
                        </div>
                        <div className="font-bold text-lg mb-1">{order.clientName}</div>
                        <div className="text-sm text-gray-600 mb-3">{order.scrapType}</div>
                        <div className="flex justify-between items-end border-t pt-2">
                            <div className="text-xs text-gray-400">
                                G: {order.weightRecord!.gross} / T: {order.weightRecord!.tare}
                            </div>
                            <div className="font-black text-xl text-primary">{order.weightRecord!.net} kg</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const WeighbridgeModal: React.FC<{ order: Order, onClose: () => void, onSuccess: () => void }> = ({ order, onClose, onSuccess }) => {
    const [gross, setGross] = useState(order.weightRecord?.gross || 0);
    const [tare, setTare] = useState(order.weightRecord?.tare || 0);
    const [ticket, setTicket] = useState(order.weightRecord?.ticketNumber || '');
    
    // Calculate net automatically
    const net = Math.max(0, gross - tare);

    const handleSave = async () => {
        await updateOrderStatus(order.id, OrderStatus.COMPLETED, {
            weightRecord: {
                gross,
                tare,
                net,
                ticketNumber: ticket || `T-${Math.floor(Math.random() * 100000)}`,
                timestamp: new Date().toISOString()
            }
        });
        onSuccess();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
             <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 animate-scale-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Weighbridge Entry</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="mb-6 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-sm">
                        <div className="flex justify-between mb-1">
                            <span className="text-gray-500">Client:</span>
                            <span className="font-bold">{order.clientName}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                            <span className="text-gray-500">Material:</span>
                            <span className="font-bold">{order.scrapType}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-gray-500">Driver Ticket:</span>
                            <span className="font-mono">{order.weightRecord?.ticketNumber || 'N/A'}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-gray-500">Driver Est:</span>
                            <span className="font-mono">{order.weightRecord?.net || 0} kg</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Weighbridge Ticket #</label>
                        <input 
                            className="w-full border-2 border-gray-200 p-3 rounded-lg font-mono focus:border-primary outline-none"
                            value={ticket}
                            onChange={e => setTicket(e.target.value)}
                            placeholder="Enter ticket number"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Gross (kg)</label>
                            <input 
                                type="number" 
                                className="w-full border-2 border-gray-200 p-3 rounded-lg font-mono font-bold text-lg focus:border-primary outline-none"
                                value={gross || ''}
                                onChange={e => setGross(parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Tare (kg)</label>
                            <input 
                                type="number" 
                                className="w-full border-2 border-gray-200 p-3 rounded-lg font-mono font-bold text-lg focus:border-primary outline-none"
                                value={tare || ''}
                                onChange={e => setTare(parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center border border-blue-100">
                        <span className="text-blue-800 font-bold uppercase text-sm">Net Weight</span>
                        <span className="text-2xl font-black text-blue-900">{net} kg</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="secondary" onClick={onClose} fullWidth>Cancel</Button>
                    <Button variant="primary" onClick={handleSave} fullWidth disabled={net <= 0 || !ticket}>Confirm</Button>
                </div>
            </div>
        </div>
    );
};

const ReportsView: React.FC<{ orders: Order[] }> = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {['Daily Weight Log', 'Driver Timesheets', 'Client Waste Transfer Notes', 'Monthly Volume Summary'].map((item, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-all">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-3xl mb-4">
                        📄
                    </div>
                    <h3 className="font-bold text-lg mb-2">{item}</h3>
                    <p className="text-sm text-gray-400 mb-6">Generate and download PDF report.</p>
                    <Button variant="outline" size="sm">Download PDF ⬇</Button>
                </div>
            ))}
        </div>
    );
};

const ShipLoadingView: React.FC = () => {
    const [targetTons, setTargetTons] = useState(3500);
    const [loads, setLoads] = useState<ExportLoad[]>([
        { id: 'EXP-8821', truckReg: 'SV68 HGA', netWeight: 28400, timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
        { id: 'EXP-8822', truckReg: 'SA21 BCD', netWeight: 29150, timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
        { id: 'EXP-8823', truckReg: 'SY19 JKL', netWeight: 27800, timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString() },
    ]);
    
    const [reg, setReg] = useState('');
    const [weight, setWeight] = useState('');

    const totalLoadedKg = loads.reduce((acc, curr) => acc + curr.netWeight, 0);
    const totalLoadedTons = totalLoadedKg / 1000;
    const progress = Math.min((totalLoadedTons / targetTons) * 100, 100);
    const remainingTons = Math.max(targetTons - totalLoadedTons, 0);

    const handleAddLoad = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reg || !weight) return;
        
        const newLoad: ExportLoad = {
            id: `EXP-${Math.floor(1000 + Math.random() * 9000)}`,
            truckReg: reg.toUpperCase(),
            netWeight: parseInt(weight),
            timestamp: new Date().toISOString()
        };
        
        setLoads([newLoad, ...loads]);
        setReg('');
        setWeight('');
    };

    return (
        <div className="space-y-6 animate-fade-in">
             {/* Hero / Status Section */}
             <div className="bg-gradient-to-r from-blue-900 to-slate-800 text-white p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="relative z-10 grid md:grid-cols-2 gap-8 items-end">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-white/20">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/> Active Loading
                        </div>
                        <h2 className="text-3xl font-black mb-1">MV Nordic Star</h2>
                        <div className="flex items-center gap-4 text-sm opacity-80 font-medium">
                            <span>Destination: Turkey (Aliaga)</span>
                            <span>•</span>
                            <span>Cargo: HMS 1/2</span>
                        </div>
                    </div>
                    <div className="text-left md:text-right">
                        <div className="flex flex-col md:items-end">
                            <div className="text-5xl font-black mb-1 flex items-baseline gap-2">
                                {totalLoadedTons.toFixed(1)} 
                                <span className="text-2xl opacity-60 font-medium">/ 
                                    <input 
                                        type="number" 
                                        value={targetTons} 
                                        onChange={(e) => setTargetTons(Number(e.target.value))}
                                        className="w-24 bg-transparent border-b border-white/30 text-center outline-none focus:border-white ml-1"
                                    /> 
                                    t
                                </span>
                            </div>
                            <div className="text-sm opacity-60 font-mono">Metric Tonnes Loaded</div>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-60 mb-2">
                        <span>Progress</span>
                        <span>{progress.toFixed(1)}% ({remainingTons.toFixed(1)}t remaining)</span>
                    </div>
                    <div className="w-full bg-black/30 h-4 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
                        <div 
                            className="bg-gradient-to-r from-green-400 to-emerald-500 h-full transition-all duration-1000 ease-out relative" 
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-shimmer" />
                        </div>
                    </div>
                </div>
                
                <div className="absolute right-[-20px] bottom-[-40px] text-9xl opacity-5 pointer-events-none select-none transform rotate-12">
                    🚢
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Input Form */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span>📝</span> Register New Load
                    </h3>
                    <form onSubmit={handleAddLoad} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Vehicle Reg</label>
                            <input 
                                type="text" 
                                value={reg}
                                onChange={e => setReg(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-lg uppercase focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="e.g. SV68 HGA"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Net Weight (kg)</label>
                            <input 
                                type="number" 
                                value={weight}
                                onChange={e => setWeight(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="0"
                            />
                        </div>
                        <Button fullWidth type="submit" variant="primary" disabled={!reg || !weight} className="shadow-lg shadow-blue-500/20">
                            Add Load +
                        </Button>
                    </form>
                    
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="text-xs font-bold text-gray-400 uppercase mb-3">Quick Fill (Recent Trucks)</div>
                        <div className="flex flex-wrap gap-2">
                            {Array.from(new Set(loads.map(l => l.truckReg))).slice(0, 4).map(r => (
                                <button 
                                    key={r} 
                                    onClick={() => setReg(r)}
                                    type="button"
                                    className="px-3 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-xs font-mono font-bold text-gray-600 transition-colors"
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="lg:col-span-2 bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100 flex flex-col h-[500px]">
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-700">Load History</h3>
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{loads.length}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => alert('Manifest generated')}>📄 Manifest</Button>
                        </div>
                    </div>
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-3 pl-6">Time</th>
                                    <th className="p-3">ID</th>
                                    <th className="p-3">Vehicle</th>
                                    <th className="p-3 text-right pr-6">Net (kg)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loads.map((load, i) => (
                                    <tr key={load.id} className="border-b last:border-0 hover:bg-blue-50/50 transition-colors group">
                                        <td className="p-3 pl-6 text-gray-500 font-mono">
                                            {new Date(load.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </td>
                                        <td className="p-3 font-mono text-xs text-gray-400 group-hover:text-gray-600">{load.id}</td>
                                        <td className="p-3 font-bold">{load.truckReg}</td>
                                        <td className="p-3 text-right pr-6 font-bold font-mono text-gray-700">{load.netWeight.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-3 border-t bg-gray-50 text-xs text-gray-400 text-center flex-shrink-0">
                        Showing all {loads.length} loads for current session
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- ADDED: Material Edit Modal ---
const MaterialEditModal: React.FC<{ order: Order, onClose: () => void, onSuccess: () => void }> = ({ order, onClose, onSuccess }) => {
    const [material, setMaterial] = useState(order.scrapType);

    const handleSave = async () => {
        await updateOrderStatus(order.id, order.status, { scrapType: material });
        onSuccess();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl p-6 animate-scale-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Change Material</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                
                <div className="mb-6">
                    <div className="text-sm text-gray-500 mb-4">
                        Updating material for order <span className="font-mono font-bold text-gray-700">{order.id}</span>
                        <br/>
                        Client: {order.clientName}
                    </div>

                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">New Material Type</label>
                    <select 
                        className="w-full border p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none"
                        value={material}
                        onChange={(e) => setMaterial(e.target.value)}
                    >
                         {Object.values(ScrapType).map(type => (
                             <option key={type} value={type}>{type}</option>
                         ))}
                    </select>
                </div>

                <div className="flex gap-3 justify-end">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave}>Save Changes</Button>
                </div>
            </div>
        </div>
    );
};