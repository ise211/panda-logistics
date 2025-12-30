import { Order, OrderStatus, OrderType, ScrapType, TruckType, User, UserRole, ContainerSize } from '../types';

// Mock Users
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Angus MacLeod', role: UserRole.DRIVER, vehicleId: 'SV68 HGA' },
  { id: 'u2', name: 'Hamish Campbell', role: UserRole.DRIVER, vehicleId: 'SA21 BCD' },
  { id: 'u3', name: 'Fiona Stewart', role: UserRole.LOGISTICS },
  { id: 'u4', name: 'Cameron Ross', role: UserRole.MANAGER },
];

// Mock Orders
export const INITIAL_ORDERS: Order[] = [
  {
    id: 'o101',
    type: OrderType.COLLECTION,
    clientName: 'Aberdeen Construction Ltd',
    address: '15 Union Street, Aberdeen, AB11 6BB',
    scrapType: ScrapType.STEEL,
    truckType: TruckType.HOOKLIFT,
    containerSize: ContainerSize.Y40,
    plannedWeight: 5000,
    status: OrderStatus.PLANNED,
    driverId: 'u1',
    driverName: 'Angus MacLeod',
    vehicleId: 'SV68 HGA',
    date: new Date().toISOString().split('T')[0],
    timeWindow: '08:00 - 10:00',
  },
  {
    id: 'o102',
    type: OrderType.COLLECTION,
    clientName: 'North Sea Oil Services',
    address: 'Unit 4, Dyce Industrial Estate, Aberdeen, AB21 0EQ',
    scrapType: ScrapType.COPPER,
    truckType: TruckType.SKIP,
    containerSize: ContainerSize.Y8,
    plannedWeight: 1200,
    status: OrderStatus.IN_TRANSIT,
    driverId: 'u2',
    driverName: 'Hamish Campbell',
    vehicleId: 'SA21 BCD',
    date: new Date().toISOString().split('T')[0],
    timeWindow: '12:00 - 14:00',
  },
  {
    id: 'o103',
    type: OrderType.COLLECTION,
    clientName: 'Granite City Demo',
    address: '42 George Street, Aberdeen, AB25 1HZ',
    scrapType: ScrapType.MIXED,
    truckType: TruckType.HOOKLIFT,
    containerSize: ContainerSize.Y20,
    plannedWeight: 8000,
    status: OrderStatus.COMPLETED,
    driverId: 'u1',
    driverName: 'Angus MacLeod',
    vehicleId: 'SV68 HGA',
    date: '2023-10-26', // Past date
    timeWindow: '09:00 - 11:00',
    weightRecord: {
      gross: 12000,
      tare: 4000,
      net: 8000,
      ticketNumber: 'ABD-23-884',
      timestamp: '2023-10-26T10:30:00Z',
    },
    signature: true,
  },
  {
    id: 'o104',
    type: OrderType.DELIVERY,
    clientName: 'Highland Properties',
    address: '100 Anderson Drive, Aberdeen, AB15 6AZ',
    scrapType: ScrapType.EMPTY_BIN,
    truckType: TruckType.SKIP,
    containerSize: ContainerSize.Y8,
    plannedWeight: 0,
    status: OrderStatus.PLANNED,
    driverId: 'u2',
    driverName: 'Hamish Campbell',
    vehicleId: 'SA21 BCD',
    date: new Date().toISOString().split('T')[0],
    timeWindow: '14:00 - 16:00',
  },
];

// Simple in-memory storage simulation
let orders = [...INITIAL_ORDERS];

export const getOrders = () => Promise.resolve([...orders]);

export const getOrdersByDriver = (driverId: string) => 
  Promise.resolve(orders.filter(o => o.driverId === driverId));

export const updateOrderStatus = (orderId: string, status: OrderStatus, data?: Partial<Order>) => {
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx > -1) {
    orders[idx] = { ...orders[idx], status, ...data };
    return Promise.resolve(orders[idx]);
  }
  return Promise.reject('Order not found');
};

export const createOrder = (order: Omit<Order, 'id'>) => {
  const newOrder = { ...order, id: `o${Math.floor(Math.random() * 10000)}` };
  orders.push(newOrder);
  return Promise.resolve(newOrder);
};

export const getStats = () => {
    // Generate some simple stats for dashboard
    const completed = orders.filter(o => o.status === OrderStatus.COMPLETED);
    const inProgress = orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.PLANNED);
    const planned = orders.filter(o => o.status === OrderStatus.PLANNED);
    const totalWeight = completed.reduce((acc, curr) => acc + (curr.weightRecord?.net || 0), 0);
    
    return Promise.resolve({
        completedCount: completed.length,
        activeCount: inProgress.length,
        plannedCount: planned.length,
        totalWeightKg: totalWeight
    });
};