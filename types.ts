export enum UserRole {
  DRIVER = 'DRIVER',
  LOGISTICS = 'LOGISTICS',
  MANAGER = 'MANAGER',
}

export enum OrderType {
  COLLECTION = 'COLLECTION', // Odbiór złomu
  DELIVERY = 'DELIVERY',     // Podstawienie kontenera
}

export enum OrderStatus {
  PLANNED = 'PLANNED',
  IN_TRANSIT = 'IN_TRANSIT',
  ON_SITE = 'ON_SITE',
  ON_SCALE = 'ON_SCALE', // For delivery this means "Dropping off/Action"
  COMPLETED = 'COMPLETED',
  ISSUE = 'ISSUE',
}

export enum ScrapType {
  STEEL = 'Steel',
  COPPER = 'Copper',
  ALUMINUM = 'Aluminum',
  MIXED = 'Mixed',
  ELECTRONICS = 'Electronics',
  EMPTY_BIN = 'Empty Bin', // Useful for deliveries
}

export enum TruckType {
  SKIP = 'Skip Lorry',
  HOOKLIFT = 'Hooklift Lorry',
}

export enum ContainerSize {
  Y6 = '6 yd',
  Y8 = '8 yd',
  Y12 = '12 yd',
  Y14 = '14 yd',
  Y16 = '16 yd',
  Y20 = '20 yd (RoRo)',
  Y35 = '35 yd (RoRo)',
  Y40 = '40 yd (RoRo)',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  vehicleId?: string; // Only for drivers
}

export interface WeightRecord {
  gross: number; // Brutto
  tare: number;  // Tara
  net: number;   // Netto
  ticketNumber: string;
  timestamp: string;
}

export interface CheckList {
  ppeChecked: boolean;
  vehicleChecked: boolean;
  docsChecked: boolean;
}

export interface Order {
  id: string;
  type: OrderType; // New field
  clientName: string;
  address: string;
  scrapType: string; 
  truckType?: TruckType;
  containerSize?: string; // e.g. "8 yd"
  plannedWeight: number; // in kg (or capacity for bins)
  status: OrderStatus;
  driverId: string;
  driverName: string;
  vehicleId: string;
  date: string;
  timeWindow: string; 
  weightRecord?: WeightRecord;
  issueReport?: string;
  checklist?: CheckList;
  images?: string[]; 
  signature?: boolean;
}

export interface ExportLoad {
  id: string;
  truckReg: string;
  netWeight: number; // kg
  timestamp: string;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PLANNED]: 'Planned',
  [OrderStatus.IN_TRANSIT]: 'In Transit',
  [OrderStatus.ON_SITE]: 'On Site',
  [OrderStatus.ON_SCALE]: 'Processing',
  [OrderStatus.COMPLETED]: 'Completed',
  [OrderStatus.ISSUE]: 'Issue',
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PLANNED]: 'bg-gray-200 text-gray-800',
  [OrderStatus.IN_TRANSIT]: 'bg-blue-100 text-blue-800',
  [OrderStatus.ON_SITE]: 'bg-yellow-100 text-yellow-800',
  [OrderStatus.ON_SCALE]: 'bg-purple-100 text-purple-800',
  [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [OrderStatus.ISSUE]: 'bg-red-100 text-red-800',
};