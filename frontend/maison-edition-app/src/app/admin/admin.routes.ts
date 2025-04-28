// src/app/admin/admin.routes.ts
import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { authGuard } from '../core/guards/auth.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '', // Le préfixe '/admin' est géré dans app.routes.ts
    component: AdminLayoutComponent,
    canActivate: [authGuard], // Applique le guard à toutes les routes enfants
    children: [
      // Redirection par défaut de /admin vers /admin/dashboard
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Route pour le Tableau de Bord
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(c => c.DashboardComponent),
        title: 'Admin - Tableau de bord'
      },

      // --- Routes pour la gestion des livres ---
      {
        path: 'books', // Liste des livres (/admin/books)
        loadComponent: () => import('./pages/book-management/book-management.component').then(c => c.BookManagementComponent),
        title: 'Admin - Gestion des livres'
      },
      {
        path: 'books/add', // Ajout de livre (/admin/books/add)
        loadComponent: () => import('./pages/book-add/book-add.component').then(c => c.BookAddComponent),
        title: 'Admin - Ajouter un livre'
      },
      {
        path: 'books/edit/:id', // Édition de livre (/admin/books/edit/...)
        loadComponent: () => import('./pages/book-edit/book-edit.component').then(c => c.BookEditComponent),
        title: 'Admin - Modifier un livre'
      },
      // --- Fin Routes Livres ---

      // Route pour les Messages Reçus
      {
        path: 'messages', // (/admin/messages)
        loadComponent: () => import('./pages/message-list/message-list.component').then(c => c.MessageListComponent),
        title: 'Admin - Messages reçus'
      },

      // --- Routes pour les Commandes ---
      {
        path: 'orders', // Liste des commandes (/admin/orders)
        loadComponent: () => import('./pages/order-list/order-list.component').then(c => c.OrderListComponent),
        title: 'Admin - Liste des commandes'
      },
      {
        // NOUVELLE ROUTE : Détails d'une commande (/admin/orders/...)
        path: 'orders/:id',
        loadComponent: () => import('./pages/order-detail/order-detail.component').then(c => c.OrderDetailComponent),
        title: 'Admin - Détails de la commande'
      },
      // --- Fin Routes Commandes ---

      // Fallback : si aucune autre route enfant ne correspond, rediriger vers le dashboard
      { path: '**', redirectTo: 'dashboard' }
    ]
  }
];