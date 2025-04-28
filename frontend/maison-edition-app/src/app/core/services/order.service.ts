import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
// CORRECTION DU CHEMIN D'IMPORT POUR LE MODÈLE :
import { Order, OrderStatus } from '../../models/order.model'; // <- ../../models/ au lieu de ../models/

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private ordersSubject = new BehaviorSubject<Order[]>(this.generateMockOrders());
  public orders$: Observable<Order[]> = this.ordersSubject.asObservable();

  constructor() {
    console.log('[OrderService] Initialisé avec des commandes simulées.');
  }

  private generateMockOrders(): Order[] {
     const mockOrders: Order[] = [
      {
        id: 'ORD-2023-001',
        orderNumber: 'CDE-XYZ789',
        customerId: null,
        customerName: 'Alice Dupont',
        customerEmail: 'alice.d@email.com',
        items: [
          { bookId: 1, title: 'Le Seigneur des Anneaux', quantity: 1, price: 25.50 },
          { bookId: 3, title: '1984', quantity: 1, price: 15.00 }
        ],
        totalAmount: 40.50,
        status: 'En préparation',
        orderDate: new Date(2023, 10, 15, 10, 30),
        lastUpdate: new Date(),
        shippingAddress: { street: '1 rue de la Paix', city: 'Paris', zipCode: '75001', country: 'France' }
      },
      {
        id: 'ORD-2023-002',
        orderNumber: 'CDE-ABC123',
        customerId: 101,
        customerName: 'Bob Martin',
        customerEmail: 'bob.m@email.com',
        items: [
          { bookId: 2, title: 'Fondation', quantity: 1, price: 18.00 }
        ],
        totalAmount: 18.00,
        status: 'Expédiée',
        orderDate: new Date(2023, 10, 18, 14, 0),
        lastUpdate: new Date(2023, 10, 19, 9, 0),
        shippingAddress: { street: '10 avenue des Champs', city: 'Lyon', zipCode: '69002', country: 'France' }
      },
      {
        id: 'ORD-2023-003',
        orderNumber: 'CDE-DEF456',
        customerId: null,
        customerName: 'Claire Durand',
        customerEmail: 'claire.d@email.com',
        items: [
           { bookId: 1, title: 'Le Seigneur des Anneaux', quantity: 2, price: 25.50 }
        ],
        totalAmount: 51.00,
        status: 'Livrée',
        orderDate: new Date(2023, 9, 5, 11, 15),
        lastUpdate: new Date(2023, 9, 10, 16, 30),
      }
    ];
    return mockOrders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
  }

  getOrders(): Observable<Order[]> {
    return this.orders$;
  }

  getOrderById(id: string): Observable<Order | undefined> {
    return this.orders$.pipe(
      map(orders => orders.find(order => order.id === id))
    );
  }

  updateOrderStatus(id: string, newStatus: OrderStatus): void {
    let currentOrders = this.ordersSubject.getValue();
    const orderIndex = currentOrders.findIndex(order => order.id === id);

    if (orderIndex !== -1) {
      const updatedOrder: Order = {
        ...currentOrders[orderIndex],
        status: newStatus,
        lastUpdate: new Date()
      };
      const updatedOrders = [
        ...currentOrders.slice(0, orderIndex),
        updatedOrder,
        ...currentOrders.slice(orderIndex + 1)
      ];
      this.ordersSubject.next(updatedOrders);
      console.log(`[OrderService] Statut de la commande ${id} mis à jour à "${newStatus}".`);
    } else {
      console.warn(`[OrderService] Commande ${id} non trouvée pour mise à jour du statut.`);
    }
  }

  deleteOrder(id: string): void {
    let currentOrders = this.ordersSubject.getValue();
    const updatedOrders = currentOrders.filter(order => order.id !== id);

    if (updatedOrders.length < currentOrders.length) {
      this.ordersSubject.next(updatedOrders);
      console.log(`[OrderService] Commande ${id} supprimée (simulation).`);
    } else {
      console.warn(`[OrderService] Commande ${id} non trouvée pour suppression.`);
    }
  }
}