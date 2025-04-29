// src/app/models/order-item.model.ts
export interface OrderItem {
    bookId: number;
    title: string;
    quantity: number;
    price: number;
    // PAS de subTotal ici
  }