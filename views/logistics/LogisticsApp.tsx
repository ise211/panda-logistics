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

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard stats={stats} orders={orders} />;
      case 'orders': return <OrdersTable orders={orders} refresh={refreshData} />;
      case 'collections': return <CollectionsView orders={orders} />;
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
          case 'orders': return 'All Jobs (Overview)';
          case 'collections': return 'Scrap Collections';
          case 'delivery': return 'Container Deliveries';
          case 'registry': return 'Weight Registry';
          case 'reports': return 'Reports & Analytics';
          case 'export': return 'Ship Loading / Export';
          default: return '';
      }
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'orders', label: 'All Jobs' },
    { id: 'collections', label: 'Collections' },
    { id: 'delivery', label: 'Deliveries' },
    { id: 'registry', label: 'Registry' },
    { id: 'reports', label: 'Reports' },
    { id: 'export', label: '⚓ Ship / Export' },
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
      {renderContent()}
    </WebLayout>
  );
};

// --- Sub-components ---

const Dashboard: React.FC<{ stats: any, orders: Order[] }> = ({ stats, orders }) => {
    if (!stats) return <div>Loading...</div>;

    const issues = orders.filter(o => o.status === OrderStatus.ISSUE);
    const pendingWeighing = orders.filter(o => o.status === OrderStatus.COMPLETED && o.weightRecord?.gross === 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-primary">
                    <div className="text-sm text-gray-500">Active Trips</div>
                    <div className="text-3xl font-bold">{stats.activeCount}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
                    <div className="text-sm text-gray-500">Pending Weighing</div>
                    <div className="text-3xl font-bold">{pendingWeighing.length}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                    <div className="text-sm text-gray-500">Completed Today</div>
                    <div className="text-3xl font-bold">{stats.completedCount}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
                    <div className="text-sm text-gray-500">Issues</div>
                    <div className="text-3xl font-bold text-red-600">{issues.length}</div>
                </div>
            </div>

            {issues.length > 0 && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <h3 className="font-bold text-red-800 mb-2">⚠️ Requires Attention:</h3>
                    <ul>
                        {issues.map(o => (
                            <li key={o.id} className="text-sm text-red-700 flex justify-between border-b border-red-100 py-1 last:border-0">
                                <span><strong>{o.driverName}</strong> @ {o.clientName}</span>
                                <span>"{o.issueReport}"</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm h-80">
                <h3 className="font-bold mb-4">Order Status</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                        { name: 'Plan', count: orders.filter(o => o.status === OrderStatus.PLANNED).length },
                        { name: 'In Transit', count: orders.filter(o => o.status === OrderStatus.IN_TRANSIT).length },
                        { name: 'On Site', count: orders.filter(o => o.status === OrderStatus.ON_SITE).length },
                        { name: 'Pending Weigh', count: pendingWeighing.length },
                        { name: 'Done', count: orders.filter(o => o.status === OrderStatus.COMPLETED && o.weightRecord?.gross !== 0).length },
                    ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#1E79BF" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const CollectionsView: React.FC<{ orders: Order[] }> = ({ orders }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'date', direction: 'desc' });
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
    const completedCount = collectionOrders.filter(o => o.status === OrderStatus.COMPLETED).length;
    const pendingWeighingCount = collectionOrders.filter(o => o.status === OrderStatus.COMPLETED && o.weightRecord?.gross === 0).length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-400">
                    <div className="text-sm text-gray-500">Pickups in Progress</div>
                    <div className="text-3xl font-bold">{activeCount}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-400">
                    <div className="text-sm text-gray-500">Pending Weighbridge</div>
                    <div className="text-3xl font-bold">{pendingWeighingCount}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                    <div className="text-sm text-gray-500">Collected Today</div>
                    <div className="text-3xl font-bold">{completedCount}</div>
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="p-4 bg-blue-50 border-b border-blue-100">
                    <h2 className="font-bold text-blue-900">Scrap Collection Schedule</h2>
                </div>
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
                                <td className="p-4">
                                    <span className="font-bold text-gray-700">{order.scrapType}</span>
                                    {order.containerSize && <div className="text-xs text-gray-400">{order.containerSize}</div>}
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
    const completedCount = deliveryOrders.filter(o => o.status === OrderStatus.COMPLETED).length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-400">
                    <div className="text-sm text-gray-500">Deliveries in Progress</div>
                    <div className="text-3xl font-bold">{activeCount}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                    <div className="text-sm text-gray-500">Containers Dropped Today</div>
                    <div className="text-3xl font-bold">{completedCount}</div>
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="p-4 bg-orange-50 border-b border-orange-100">
                    <h2 className="font-bold text-orange-900">Container Drop-off Schedule</h2>
                </div>
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
    const [showForm, setShowForm] = useState(false);
    const [weighModalOpen, setWeighModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'id', direction: 'desc' });
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

    const handleSort = (key: string) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedOrders = useSortedData(orders, sortConfig);

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
        setShowForm(false);
        setFormData({ ...formData, client: '', address: '', weight: 0 });
        refresh();
    };

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


    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ New Order'}</Button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-yellow-200 animate-fade-in">
                    <h3 className="font-bold text-lg mb-4 text-gray-700">Create New Job</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                             <label className="block text-xs font-bold mb-1">Order Type</label>
                             <select 
                                className="w-full border p-2 rounded bg-white font-bold" 
                                value={formData.type}
                                onChange={e => setFormData({...formData, type: e.target.value as OrderType})}
                             >
                                 <option value={OrderType.COLLECTION}>⬇️ Collection (Pickup)</option>
                                 <option value={OrderType.DELIVERY}>⬆️ Delivery (Drop-off)</option>
                             </select>
                        </div>
                        <div className="lg:col-span-3">
                            <label className="block text-xs font-bold mb-1">Client Name</label>
                            <input className="w-full border p-2 rounded" value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} placeholder="Company Name" />
                        </div>
                        <div className="lg:col-span-2">
                            <label className="block text-xs font-bold mb-1">Collection/Drop-off Address</label>
                            <input className="w-full border p-2 rounded" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Street, City" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1">Assign Driver</label>
                            <select 
                                className="w-full border p-2 rounded bg-white" 
                                value={formData.driverId} 
                                onChange={e => setFormData({...formData, driverId: e.target.value})}
                            >
                                {availableDrivers.map(d => (
                                    <option key={d.id} value={d.id}>{d.name} ({d.vehicleId})</option>
                                ))}
                            </select>
                        </div>
                        
                         <div>
                            <label className="block text-xs font-bold mb-1">Plan. Weight (kg)</label>
                            <input className="w-full border p-2 rounded" type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: parseInt(e.target.value)})} disabled={formData.type === OrderType.DELIVERY} placeholder={formData.type === OrderType.DELIVERY ? "N/A" : "kg"}/>
                        </div>

                         <div>
                            <label className="block text-xs font-bold mb-1">Truck Type</label>
                            <select 
                                className="w-full border p-2 rounded bg-white"
                                value={formData.truckType}
                                onChange={e => setFormData({...formData, truckType: e.target.value as TruckType})}
                            >
                                <option value={TruckType.SKIP}>Skip Lorry</option>
                                <option value={TruckType.HOOKLIFT}>Hooklift Lorry</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold mb-1">Container Size</label>
                            <select 
                                className="w-full border p-2 rounded bg-white font-mono"
                                value={formData.containerSize}
                                onChange={e => setFormData({...formData, containerSize: e.target.value})}
                            >
                                {getContainerSizes(formData.truckType).map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </div>

                    </div>
                    <div className="flex justify-end">
                        <Button variant="success" onClick={handleCreate} disabled={!formData.client || !formData.address}>Create Order</Button>
                    </div>
                </div>
            )}

            {pendingWeighingOrders.length > 0 && (
                <div className="animate-fade-in">
                    <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-xl font-bold text-purple-700">Pending Weighbridge Verification</h2>
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-bold">{pendingWeighingOrders.length}</span>
                    </div>
                    <div className="bg-white shadow-md rounded-lg overflow-hidden border-2 border-purple-100 mb-8">
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
                <h2 className="text-lg font-bold mb-2 text-gray-700">All Orders</h2>
                <div className="bg-white shadow-sm rounded-lg overflow-hidden">
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
                                    <td className="p-4">
                                        <div className="font-medium">{order.truckType || 'Lorry'}</div>
                                        <div className="text-xs text-primary font-bold">{order.containerSize || ''}</div>
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
        </div>
    );
};

const RegistryTable: React.FC<{ orders: Order[] }> = ({ orders }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'weightRecord.timestamp', direction: 'desc' });
    const completedOrders = orders.filter(o => o.weightRecord);

    const handleSort = (key: string) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedOrders = useSortedData(completedOrders, sortConfig);

    return (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
             <div className="p-4 border-b flex gap-4">
                <input placeholder="Search ticket..." className="border p-2 rounded text-sm w-64" />
                <button className="text-sm bg-gray-100 px-3 rounded hover:bg-gray-200">Filter Date</button>
             </div>
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 border-b">
                    <tr>
                        <SortableHeader label="Date/Time" sortKey="weightRecord.timestamp" currentSort={sortConfig} onSort={handleSort} />
                        <SortableHeader label="Ticket No" sortKey="weightRecord.ticketNumber" currentSort={sortConfig} onSort={handleSort} />
                        <SortableHeader label="Client" sortKey="clientName" currentSort={sortConfig} onSort={handleSort} />
                        <SortableHeader label="Driver" sortKey="driverName" currentSort={sortConfig} onSort={handleSort} />
                        <SortableHeader label="Cargo" sortKey="scrapType" currentSort={sortConfig} onSort={handleSort} />
                        <SortableHeader label="Tare" sortKey="weightRecord.tare" currentSort={sortConfig} onSort={handleSort} align="right" />
                        <SortableHeader label="Gross" sortKey="weightRecord.gross" currentSort={sortConfig} onSort={handleSort} align="right" />
                        <SortableHeader label="Net" sortKey="weightRecord.net" currentSort={sortConfig} onSort={handleSort} align="right" />
                    </tr>
                </thead>
                <tbody>
                    {sortedOrders.map(order => (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                            <td className="p-4 text-gray-600">{new Date(order.weightRecord!.timestamp).toLocaleString()}</td>
                            <td className="p-4 font-mono font-bold">{order.weightRecord!.ticketNumber}</td>
                            <td className="p-4">{order.clientName}</td>
                            <td className="p-4 text-gray-700">{order.driverName}</td>
                            <td className="p-4">{order.scrapType}</td>
                            <td className="p-4 text-right text-gray-500">{order.weightRecord!.tare} kg</td>
                            <td className="p-4 text-right text-gray-500">{order.weightRecord!.gross} kg</td>
                            <td className="p-4 text-right font-bold">
                                {order.weightRecord!.gross === 0 ? (
                                    <span className="text-orange-500 italic" title="Estimated">~ {order.weightRecord!.net} kg</span>
                                ) : (
                                    <span>{order.weightRecord!.net} kg</span>
                                )}
                            </td>
                        </tr>
                    ))}
                    {sortedOrders.length === 0 && (
                        <tr><td colSpan={8} className="p-8 text-center text-gray-500">No recorded weighings.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

const ReportsView: React.FC<{ orders: Order[] }> = ({ orders }) => {
    const [materialFilter, setMaterialFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'weightRecord.timestamp', direction: 'desc' });

    const filteredData = useMemo(() => {
        if (!materialFilter && !startDate) return [];

        return orders.filter(o => {
            // Must be completed and have a weight record
            if (o.status !== OrderStatus.COMPLETED || !o.weightRecord) return false;

            // Check Material Name (case insensitive partial match)
            const matchesMaterial = materialFilter 
                ? o.scrapType.toLowerCase().includes(materialFilter.toLowerCase())
                : true;

            // Check Date (>= start date)
            const matchesDate = startDate 
                ? new Date(o.weightRecord.timestamp) >= new Date(startDate)
                : true;

            return matchesMaterial && matchesDate;
        });
    }, [orders, materialFilter, startDate]);

    const handleSort = (key: string) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = useSortedData(filteredData, sortConfig);
    const totalWeight = sortedData.reduce((sum, o) => sum + (o.weightRecord?.net || 0), 0);

    const handleExport = () => {
        const csvRows = [
            ['Date', 'Ticket No', 'Client', 'Material', 'Net Weight (kg)']
        ];

        sortedData.forEach(order => {
            csvRows.push([
                new Date(order.weightRecord!.timestamp).toLocaleDateString(),
                order.weightRecord!.ticketNumber,
                `"${order.clientName.replace(/"/g, '""')}"`,
                `"${order.scrapType.replace(/"/g, '""')}"`,
                order.weightRecord!.net.toString()
            ]);
        });

        const csvContent = csvRows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `yield_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-3">
                         <span className="text-3xl">⚖️</span>
                         <h2 className="text-2xl font-bold text-gray-800">Yield Calculator</h2>
                     </div>
                     <Button 
                        onClick={handleExport} 
                        disabled={sortedData.length === 0} 
                        variant="primary"
                        className="flex items-center gap-2"
                     >
                        <span>📥</span> Export CSV
                     </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Material / Scrap Type</label>
                        <input 
                            type="text"
                            className="w-full border border-gray-300 rounded-lg p-3"
                            placeholder="e.g. Light Iron, Copper, Mixed..."
                            value={materialFilter}
                            onChange={(e) => setMaterialFilter(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave empty to select all materials.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">From Date</label>
                        <input 
                            type="date"
                            className="w-full border border-gray-300 rounded-lg p-3"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">Calculates total weight received since this date.</p>
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Weight Received</div>
                        <div className="text-4xl font-extrabold text-primary mt-1">
                            {totalWeight.toLocaleString()} <span className="text-xl text-gray-600">kg</span>
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                            {(totalWeight / 1000).toFixed(3)} Tonnes
                        </div>
                    </div>
                    <div className="text-right">
                         <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Loads</div>
                         <div className="text-2xl font-bold text-secondary">{sortedData.length}</div>
                    </div>
                </div>
            </div>

            {/* List of included items */}
            {sortedData.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-fade-in">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                        <h3 className="font-bold text-gray-700 text-sm">Included Batches</h3>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <SortableHeader label="Date" sortKey="weightRecord.timestamp" currentSort={sortConfig} onSort={handleSort} />
                                <SortableHeader label="Client" sortKey="clientName" currentSort={sortConfig} onSort={handleSort} />
                                <SortableHeader label="Material" sortKey="scrapType" currentSort={sortConfig} onSort={handleSort} />
                                <SortableHeader label="Net Weight" sortKey="weightRecord.net" currentSort={sortConfig} onSort={handleSort} align="right" />
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.map(order => (
                                <tr key={order.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                    <td className="p-4">{new Date(order.weightRecord!.timestamp).toLocaleDateString()}</td>
                                    <td className="p-4 font-medium">{order.clientName}</td>
                                    <td className="p-4">{order.scrapType}</td>
                                    <td className="p-4 text-right font-mono">{order.weightRecord!.net} kg</td>
                                    
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* Empty state hint */}
            {sortedData.length === 0 && (materialFilter || startDate) && (
                <div className="text-center p-10 text-gray-400">
                    No completed orders found matching these criteria.
                </div>
            )}
        </div>
    );
};

const ShipLoadingView: React.FC = () => {
    // Local state for the session
    const [targetWeightTons, setTargetWeightTons] = useState(4000);
    const [loads, setLoads] = useState<ExportLoad[]>([]);
    
    // Form Inputs
    const [inputReg, setInputReg] = useState('');
    const [inputWeight, setInputWeight] = useState('');

    // Unique set of trucks used today for quick selection
    const activeTrucks = useMemo(() => {
        return Array.from(new Set(loads.map(l => l.truckReg)));
    }, [loads]);

    const totalLoadedKg = loads.reduce((acc, curr) => acc + curr.netWeight, 0);
    const totalLoadedTons = totalLoadedKg / 1000;
    const progressPercent = Math.min((totalLoadedTons / targetWeightTons) * 100, 100);
    const remainingTons = Math.max(targetWeightTons - totalLoadedTons, 0);

    const handleAddLoad = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        const weight = parseFloat(inputWeight);
        if (!inputReg || !weight || weight <= 0) return;

        const newLoad: ExportLoad = {
            id: `ex-${Date.now()}`,
            truckReg: inputReg.toUpperCase().trim(),
            netWeight: weight,
            timestamp: new Date().toISOString()
        };

        setLoads([newLoad, ...loads]);
        setInputWeight('');
        // Keep reg if needed? No, usually a different truck comes next, but we keep it in quick list
        setInputReg('');
    };

    const selectQuickTruck = (reg: string) => {
        setInputReg(reg);
        document.getElementById('weightInput')?.focus();
    };

    return (
        <div className="space-y-6">
            {/* Target & Progress Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-blue-500">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <span>⚓</span> Ship / Export Loading
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                             <span className="text-sm text-gray-500">Target (Tonnes):</span>
                             <input 
                                type="number" 
                                value={targetWeightTons} 
                                onChange={(e) => setTargetWeightTons(parseFloat(e.target.value) || 0)}
                                className="w-24 border rounded px-2 py-1 text-sm font-bold text-blue-800"
                             />
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-extrabold text-blue-600">{totalLoadedTons.toFixed(2)} <span className="text-lg text-gray-400">t</span></div>
                        <div className="text-sm text-gray-500">Loaded so far</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-8 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 flex items-center justify-center text-white font-bold text-xs shadow-lg"
                        style={{ width: `${progressPercent}%` }}
                    >
                        {progressPercent > 5 && `${progressPercent.toFixed(1)}%`}
                    </div>
                </div>
                <div className="flex justify-between mt-2 text-xs font-bold text-gray-400">
                    <span>0 t</span>
                    <span>Remaining: {remainingTons.toFixed(2)} t</span>
                    <span>{targetWeightTons} t</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Input Column */}
                <div className="lg:col-span-1 space-y-6">
                    <form onSubmit={handleAddLoad} className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="font-bold text-lg mb-4 text-gray-700">Add New Load</h3>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-600 mb-1">Truck Registration</label>
                            <input 
                                type="text"
                                className="w-full border-2 border-gray-200 rounded-lg p-3 text-xl font-mono uppercase focus:border-blue-500 outline-none"
                                placeholder="e.g. WA 12345"
                                value={inputReg}
                                onChange={(e) => setInputReg(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-600 mb-1">Net Weight (kg)</label>
                            <input 
                                id="weightInput"
                                type="number"
                                className="w-full border-2 border-gray-200 rounded-lg p-3 text-xl font-mono focus:border-blue-500 outline-none"
                                placeholder="0"
                                value={inputWeight}
                                onChange={(e) => setInputWeight(e.target.value)}
                            />
                        </div>

                        <Button type="submit" fullWidth size="lg" disabled={!inputReg || !inputWeight}>
                            + ADD LOAD
                        </Button>
                    </form>

                    {/* Quick Select for Rotation */}
                    {activeTrucks.length > 0 && (
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <h3 className="font-bold text-sm mb-3 text-gray-500 uppercase tracking-wide">Active Trucks (Rotation)</h3>
                            <div className="flex flex-wrap gap-2">
                                {activeTrucks.map(reg => (
                                    <button
                                        key={reg}
                                        onClick={() => selectQuickTruck(reg)}
                                        className={`px-3 py-2 rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-300 font-mono text-sm transition-colors ${inputReg === reg ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-gray-50 text-gray-700'}`}
                                    >
                                        {reg}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* History List Column */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden h-full">
                         <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                             <h3 className="font-bold text-gray-700">Today's Loads</h3>
                             <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{loads.length} Loads</span>
                         </div>
                         <div className="overflow-y-auto max-h-[600px]">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr>
                                        <th className="p-3">Time</th>
                                        <th className="p-3">Truck Reg</th>
                                        <th className="p-3 text-right">Weight (kg)</th>
                                        <th className="p-3 text-right">Running Total (t)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loads.map((load, index) => {
                                        // Calculate running total up to this point (reversed because list is new->old)
                                        // Actually simplest to just show individual, maybe running total is confusing in reverse order.
                                        // Let's just show individual rows.
                                        return (
                                            <tr key={load.id} className="border-b hover:bg-gray-50 animate-fade-in">
                                                <td className="p-3 text-gray-500 font-mono">
                                                    {new Date(load.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </td>
                                                <td className="p-3 font-bold font-mono">{load.truckReg}</td>
                                                <td className="p-3 text-right text-lg">{load.netWeight}</td>
                                                <td className="p-3 text-right text-gray-400 text-xs">
                                                     {/* Only showing individual for simplicity, or we could calc context */}
                                                     -
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {loads.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-10 text-center text-gray-400">
                                                No loads added yet. Start typing above.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                         </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

const WeighbridgeModal: React.FC<{ order: Order, onClose: () => void, onSuccess: () => void }> = ({ order, onClose, onSuccess }) => {
    const [gross, setGross] = useState<string>(order.weightRecord?.gross && order.weightRecord.gross > 0 ? order.weightRecord.gross.toString() : '');
    const [tare, setTare] = useState<string>(order.weightRecord?.tare && order.weightRecord.tare > 0 ? order.weightRecord.tare.toString() : '');
    const [ticket, setTicket] = useState<string>(order.weightRecord?.ticketNumber || '');
    const [material, setMaterial] = useState<string>(order.scrapType);

    const net = (parseFloat(gross) || 0) - (parseFloat(tare) || 0);

    const handleSave = async () => {
        if (!gross || !tare) return;

        await updateOrderStatus(order.id, OrderStatus.COMPLETED, {
            scrapType: material,
            weightRecord: {
                ...order.weightRecord!, // preserve timestamp
                gross: parseFloat(gross),
                tare: parseFloat(tare),
                net: net,
                ticketNumber: ticket
            }
        });
        onSuccess();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="text-xl font-bold text-gray-800">Finalize Weighing</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
                        <div><strong>Client:</strong> {order.clientName}</div>
                        <div><strong>Driver:</strong> {order.driverName}</div>
                        <div><strong>Driver Estimate:</strong> {order.weightRecord?.net} kg</div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Material / Scrap Type Description</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded p-2"
                            value={material}
                            onChange={(e) => setMaterial(e.target.value)}
                            placeholder="e.g. Mixed Heavy Steel, Copper Wire, etc."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Weighbridge Ticket #</label>
                        <input 
                            className="w-full border border-gray-300 rounded p-2 font-mono"
                            value={ticket}
                            onChange={e => setTicket(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Gross (kg)</label>
                            <input 
                                type="number" 
                                className="w-full border border-gray-300 rounded p-2 text-lg"
                                value={gross}
                                onChange={e => setGross(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Tare (kg)</label>
                            <input 
                                type="number" 
                                className="w-full border border-gray-300 rounded p-2 text-lg"
                                value={tare}
                                onChange={e => setTare(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
                        <span className="font-bold text-blue-900">Final Net Weight:</span>
                        <span className="text-2xl font-bold text-blue-700">{net > 0 ? net : 0} kg</span>
                    </div>
                </div>

                <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant="success" onClick={handleSave} disabled={!gross || !tare}>Confirm & Save</Button>
                </div>
            </div>
        </div>
    );
};