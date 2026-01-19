
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OWNER = 'OWNER',
  ADMIN = 'ADMIN'
}

export enum LaptopCondition {
  NEW = 'NEW',
  USED = 'USED'
}

export enum LaptopStatus {
  READY = 'READY',
  SOLD = 'SOLD'
}

export interface LaptopSpecs {
  cpu: string;
  ram: string;
  storage: string;
  gpu: string;
}

export interface Laptop {
  id: string;
  barcode: string;
  brand: string;
  model: string;
  specs: LaptopSpecs;
  condition: LaptopCondition;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  status: LaptopStatus;
  createdAt: string;
}

export interface TransactionItem {
  laptopId: string;
  brand: string;
  model: string;
  quantity: number;
  price: number;
}

export enum PaymentMethod {
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
  EWALLET = 'E-WALLET'
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  customerName: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  date: string;
  createdBy: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  password?: string;
}

export interface AppState {
  inventory: Laptop[];
  transactions: Transaction[];
  users: User[];
  currentUser: User | null;
  isAuthenticated: boolean;
}
