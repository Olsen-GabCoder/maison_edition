// src/app/core/models/order.model.ts

export interface OrderItem {
    bookId: number;
    title: string;
    quantity: number;
    price: number;
  }
  
  export type OrderStatus = 'En attente' | 'En préparation' | 'Expédiée' | 'Livrée' | 'Annulée';
  
  export interface Order {
    id: string;
    orderNumber: string;
    customerId: number | null;
    customerName: string;
    customerEmail: string;
    items: OrderItem[];
    totalAmount: number;
    status: OrderStatus;
    orderDate: Date;
    shippingAddress?: {
      street: string;
      city: string;
      zipCode: string;
      country: string;
    };
    lastUpdate?: Date;
  }
  

  