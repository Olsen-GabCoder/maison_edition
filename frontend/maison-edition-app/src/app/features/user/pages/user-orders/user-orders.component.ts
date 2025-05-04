// src/app/features/user/pages/user-orders/user-orders.component.ts
import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // Nécessaire pour *ngIf, *ngFor, etc.
import { RouterLink } from '@angular/router';   // Pour les liens [routerLink]
import { Observable, of, Subject } from 'rxjs';
import { catchError, tap, takeUntil, map } from 'rxjs/operators';

// Core Services
import { OrderService } from '../../../../core/services/order.service';
import { AuthService } from '../../../../core/services/auth.service'; // <<<=== IMPORTER AuthService

// Models
import { Order, OrderStatus } from '../../../../models/order.model';
import { OrderItem } from '../../../../models/order-item.model';
import { UserProfile } from '../../../../models/user.model';      // <<<=== IMPORTER UserProfile

// L'import de UserAuthService et UserInfo est supprimé

// Interface locale pour la vue groupée
interface GroupedOrderView {
  bookId: number;
  title: string;
  unitPrice: number;
  totalQuantity: number;
  totalGroupPrice: number;
  latestOrderDate: Date;
  latestStatus: OrderStatus;
  customerName: string;
  customerEmail: string;
  latestOrderNumber: string;
}

@Component({
  selector: 'app-user-orders',
  standalone: true,
  imports: [CommonModule, RouterLink], // Assurer les imports nécessaires
  templateUrl: './user-orders.component.html',
  styleUrls: ['./user-orders.component.scss']
})
export class UserOrdersComponent implements OnInit, OnDestroy {

  // --- Injections ---
  private orderService = inject(OrderService);
  private cdr = inject(ChangeDetectorRef); // ChangeDetectorRef pour détection manuelle si besoin
  // === MODIFICATION DE L'INJECTION ===
  private authService = inject(AuthService); // <<<=== INJECTER AuthService
  private destroy$ = new Subject<void>(); // Pour gérer la désinscription

  // --- Propriétés du composant ---
  // === MODIFICATION DU TYPE ===
  currentUser: UserProfile | null = null; // <<<=== Utilise UserProfile

  groupedOrders: GroupedOrderView[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  totalItemsCount: number = 0;
  cumulativeTotalPrice: number = 0;

  // Traductions des statuts (correct)
  statusTranslations: { [key in OrderStatus]: string } = {
    'Pending': 'En attente',
    'Processing': 'En préparation',
    'Shipped': 'Expédiée',
    'Delivered': 'Livrée', // Gardé pour la complétude du type
    'Cancelled': 'Annulée'
  };

  ngOnInit(): void {
    console.log('[UserOrdersComponent] ngOnInit.');
    // === UTILISATION DE AuthService ===
    this.currentUser = this.authService.getCurrentUser(); // <<<=== Récupère UserProfile
    console.log('[UserOrdersComponent] Utilisateur actuel récupéré via AuthService:', this.currentUser);

    // Charger les commandes seulement si un utilisateur est connecté
    if (this.currentUser) {
       console.log('[UserOrdersComponent] Utilisateur connecté, chargement des commandes...');
       this.loadAndGroupUserOrders();
    } else {
        // Gérer le cas où l'utilisateur n'est pas (ou plus) connecté
        console.log('[UserOrdersComponent] Aucun utilisateur connecté, arrêt du chargement.');
        this.isLoading = false;
        // Optionnel : afficher un message dans le template via une variable ou directement
        // this.errorMessage = "Veuillez vous connecter pour voir vos commandes.";
    }
  }

  ngOnDestroy(): void {
    console.log('[UserOrdersComponent] ngOnDestroy.');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Charge les commandes de l'utilisateur via OrderService et les groupe */
  loadAndGroupUserOrders(): void {
    this.isLoading = true;
    this.errorMessage = null;
    // Réinitialiser les données avant chargement
    this.groupedOrders = [];
    this.totalItemsCount = 0;
    this.cumulativeTotalPrice = 0;
    // Optionnel: forcer la détection de changements si la réinitialisation doit être vue immédiatement
    // this.cdr.detectChanges();
    console.log('[UserOrdersComponent] loadAndGroupUserOrders: Début du chargement et groupement.');

    // Appel à getUserOrders qui utilise maintenant AuthService en interne
    this.orderService.getUserOrders().pipe(
        takeUntil(this.destroy$), // Gestion désinscription
        map(orders => this.groupOrdersByBookAndCustomer(orders)), // Groupement logique (reste inchangé)
        tap(groupedData => console.log(`[UserOrdersComponent] Données après groupement: ${groupedData.length} groupes.`))
    ).subscribe({
        next: (groupedOrdersData) => {
            console.log(`[UserOrdersComponent] Commandes groupées reçues: ${groupedOrdersData.length}`);
            this.groupedOrders = groupedOrdersData;
            // Calculer les totaux après avoir reçu les données groupées
            this.totalItemsCount = this.groupedOrders.reduce((sum, group) => sum + group.totalQuantity, 0);
            this.cumulativeTotalPrice = this.groupedOrders.reduce((sum, group) => sum + group.totalGroupPrice, 0);
            this.isLoading = false; // Fin du chargement (succès)
            this.cdr.detectChanges(); // Notifier Angular des changements
        },
        error: (error) => {
            console.error('[UserOrdersComponent] Erreur lors du chargement/groupement des commandes:', error);
            this.errorMessage = "Impossible de charger l'historique des commandes.";
            this.isLoading = false; // Fin du chargement (erreur)
            this.groupedOrders = []; // Assurer que les tableaux sont vides
            this.totalItemsCount = 0;
            this.cumulativeTotalPrice = 0;
            this.cdr.detectChanges(); // Notifier Angular
        },
        // complete: () => { console.log('[UserOrdersComponent] Observable des commandes complété.'); } // Log optionnel
    });
     console.log('[UserOrdersComponent] loadAndGroupUserOrders: Abonnement à l\'observable effectué.');
  }

  /**
   * Groupe les commandes par livre.
   * Prend un tableau d'objets Order et retourne un tableau d'objets GroupedOrderView.
   * La logique interne de cette méthode n'a pas besoin de changer.
   */
  private groupOrdersByBookAndCustomer(orders: Order[]): GroupedOrderView[] {
      if (!orders || orders.length === 0) {
           console.log('[UserOrdersComponent] groupOrdersByBookAndCustomer: Aucune commande à grouper.');
           return [];
      }
      console.log(`[UserOrdersComponent] groupOrdersByBookAndCustomer: Groupement pour ${orders.length} commandes reçues.`);
      const groupedMap = new Map<string, GroupedOrderView>();

      orders.forEach(order => {
           // S'assurer que la commande et ses items sont valides
           if (!order.items || order.items.length === 0) {
               console.warn(`[UserOrdersComponent] Commande ${order.orderNumber} ignorée (pas d'items).`);
               return;
            }
            // Pour cette vue, on suppose un seul type de livre par commande initiale (DirectOrder)
            // Si une commande pouvait avoir plusieurs lignes, il faudrait adapter cette logique.
           const item = order.items[0];
           if(!item) return; // Sécurité supplémentaire

           // Utiliser l'ID du livre comme clé de groupement
           const groupKey = `book-${item.bookId}`;

           if (groupedMap.has(groupKey)) {
               // Groupe existant : mettre à jour les totaux et la commande la plus récente
               const existingGroup = groupedMap.get(groupKey)!;
               existingGroup.totalQuantity += item.quantity;
               existingGroup.totalGroupPrice += (item.price * item.quantity);
               // Mettre à jour si la commande actuelle est plus récente
               if (order.orderDate > existingGroup.latestOrderDate) {
                   existingGroup.latestOrderDate = order.orderDate;
                   existingGroup.latestStatus = order.status;
                   existingGroup.customerName = order.customerName; // Garde le nom de la dernière commande
                   existingGroup.customerEmail = order.customerEmail; // Garde l'email de la dernière commande
                   existingGroup.latestOrderNumber = order.orderNumber; // Garde le numéro de la dernière commande
               }
           } else {
               // Nouveau groupe : créer l'entrée
               groupedMap.set(groupKey, {
                   bookId: item.bookId,
                   title: item.title,
                   unitPrice: item.price,
                   totalQuantity: item.quantity,
                   totalGroupPrice: item.price * item.quantity,
                   latestOrderDate: order.orderDate,
                   latestStatus: order.status,
                   customerName: order.customerName, // Infos de la première commande du groupe
                   customerEmail: order.customerEmail,
                   latestOrderNumber: order.orderNumber
               });
           }
       });

       // Convertir la Map en tableau et trier par date la plus récente
       const groupedArray = Array.from(groupedMap.values())
           .sort((a, b) => b.latestOrderDate.getTime() - a.latestOrderDate.getTime());

       console.log(`[UserOrdersComponent] groupOrdersByBookAndCustomer: Groupement terminé. ${groupedArray.length} groupes formés.`);
       return groupedArray;
  }

  /** Retourne la classe CSS pour le badge de statut (logique correcte) */
  getStatusBadgeClass(status: OrderStatus | undefined): string {
     if (!status) return 'status-unknown';
     // Vérifie si le statut est une clé valide dans nos traductions
     if (this.statusTranslations.hasOwnProperty(status)) {
        // Crée la classe CSS: 'status-pending', 'status-processing', etc.
        return 'status-' + status.toLowerCase().replace(/ /g, '-');
     }
     return 'status-unknown'; // Classe par défaut pour statut inconnu
   }
}