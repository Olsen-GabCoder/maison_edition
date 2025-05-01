// src/app/models/order.model.ts
import { OrderItem } from './order-item.model';
import { Address } from './address.model';

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  orderDate: Date;
  status: OrderStatus;
  totalAmount: number;
  lastUpdate: Date;

  customerName: string;
  customerEmail: string; // Email du client (peut être différent de l'utilisateur connecté)
  customerId: number | null; // Gardé pour info client potentiel

  // === AJOUT ===
  /** Email de l'utilisateur connecté au moment de la commande (ou null si invité) */
  userEmail: string | null; // <<<=== AJOUTER CETTE LIGNE
  // === FIN AJOUT ===

  shippingAddress: Address;
  items: OrderItem[];
}