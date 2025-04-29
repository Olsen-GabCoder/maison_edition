// src/app/models/order.model.ts
import { OrderItem } from './order-item.model';
import { Address } from './address.model';

// Définir le type OrderStatus (ou utiliser un enum si vous préférez)
export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string; // <-- CONFIRMER/METTRE string
  orderNumber: string;
  orderDate: Date;
  status: OrderStatus; // <-- Utiliser le type défini
  totalAmount: number;
  lastUpdate: Date; // <-- Vérifier le nom exact

  customerName: string;
  customerEmail: string;
  customerId: number | null; // <-- CONFIRMER/METTRE number | null

  shippingAddress: Address;
  items: OrderItem[];
}