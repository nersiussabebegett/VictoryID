
import { Laptop, LaptopCondition, LaptopStatus, User, UserRole, Transaction, PaymentMethod } from './types';

export const INITIAL_INVENTORY: Laptop[] = [
  {
    id: '1',
    barcode: 'VIC892031001',
    brand: 'ASUS',
    model: 'ROG Zephyrus G14',
    specs: { cpu: 'Ryzen 9', ram: '16GB', storage: '1TB SSD', gpu: 'RTX 3060' },
    condition: LaptopCondition.NEW,
    buyPrice: 18000000,
    sellPrice: 21500000,
    stock: 5,
    status: LaptopStatus.READY,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    barcode: 'VIC892031002',
    brand: 'Apple',
    model: 'MacBook Pro 14 M2',
    specs: { cpu: 'M2 Pro', ram: '16GB', storage: '512GB SSD', gpu: '16-core GPU' },
    condition: LaptopCondition.NEW,
    buyPrice: 28000000,
    sellPrice: 32999000,
    stock: 3,
    status: LaptopStatus.READY,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    barcode: 'VIC892031003',
    brand: 'Lenovo',
    model: 'ThinkPad X1 Carbon Gen 9',
    specs: { cpu: 'Intel i7-1165G7', ram: '16GB', storage: '512GB SSD', gpu: 'Iris Xe' },
    condition: LaptopCondition.USED,
    buyPrice: 12000000,
    sellPrice: 15500000,
    stock: 2,
    status: LaptopStatus.READY,
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_USERS: User[] = [
  { id: 'sa-1', name: 'System Admin', role: UserRole.SUPER_ADMIN, email: 'superadmin@victory.id', password: '123' },
  { id: 'ow-1', name: 'Budi Santoso', role: UserRole.OWNER, email: 'owner@victory.id', password: '123' },
  { id: 'ad-1', name: 'Siti Aminah', role: UserRole.ADMIN, email: 'admin@victory.id', password: '123' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    invoiceNumber: 'INV-20231024-001',
    customerName: 'Andi Pratama',
    items: [
      { laptopId: '1', brand: 'ASUS', model: 'ROG Zephyrus G14', quantity: 1, price: 21500000 }
    ],
    subtotal: 21500000,
    discount: 500000,
    tax: 0,
    total: 21000000,
    paymentMethod: PaymentMethod.TRANSFER,
    date: new Date().toISOString(),
    createdBy: 'Budi Santoso'
  }
];

export const BRANDS = ['ASUS', 'Apple', 'Lenovo', 'HP', 'Dell', 'MSI', 'Acer'];
