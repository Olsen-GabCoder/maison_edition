// src/app/app.routes.ts
import { Routes } from '@angular/router';

// --- Guards ---
import { authGuard } from './core/guards/auth.guard'; // Le guard est déjà prêt

// --- Composants Principaux ---
import { HomeComponent } from './pages/home/home.component';
import { ContactComponent } from './pages/contact/contact.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { BookDetailComponent } from './pages/book-detail/book-detail.component';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';
import { UnauthorizedComponent } from './pages/unauthorized/unauthorized.component';
import { ProfileComponent } from './pages/profile/profile/profile.component';
import { CartComponent } from './pages/cart/cart/cart.component';
// import { CheckoutPageComponent } from './pages/checkout-page/checkout-page.component'; // Si vous l'aviez créé avant

// --- Composants Features ---
import { DirectOrderComponent } from './features/order/pages/direct-order/direct-order.component';
import { UserOrdersComponent } from './features/user/pages/user-orders/user-orders.component';
// === AJOUT: Importer le nouveau composant de commande panier ===
// Assurez-vous que le chemin est correct après génération
import { CartOrderComponent } from './features/order/pages/cart-order/cart-order.component';
// ============================================================


export const routes: Routes = [
  // --- Routes Publiques ---
  { path: '', component: HomeComponent, title: 'Accueil - EditApp' },
  { path: 'contact', component: ContactComponent, title: 'Contact - EditApp' },
  { path: 'books/:id', component: BookDetailComponent, title: 'Détails du Livre - EditApp' }, // Ajout titre
  { path: 'register', component: RegisterComponent, title: 'Inscription - EditApp' },
  { path: 'login', component: LoginComponent, title: 'Connexion - EditApp' },
  { path: 'unauthorized', component: UnauthorizedComponent, title: 'Accès Refusé - EditApp' },

  // --- Routes Utilisateur Connecté (Interdites à l'admin par défaut ici) ---
  {
    path: 'order/new/:bookId', // Commande directe d'un livre spécifique
    component: DirectOrderComponent,
    canActivate: [authGuard],
    data: { forbiddenRoles: ['admin'] }, // Interdire l'admin
    title: 'Passer Commande - EditApp'
  },
  // === NOUVELLE ROUTE POUR LA COMMANDE DEPUIS LE PANIER ===
  {
    path: 'order/from-cart', // URL spécifique pour la commande issue du panier
    component: CartOrderComponent, // Le composant que nous allons implémenter
    canActivate: [authGuard],       // Nécessite une connexion utilisateur
    data: { forbiddenRoles: ['admin'] }, // Interdire à l'admin (il ne commande pas via le front)
    title: 'Finaliser ma Commande - EditApp' // Titre de la page
  },
  // =======================================================
  {
    path: 'my-orders', // Voir ses propres commandes
    component: UserOrdersComponent,
    canActivate: [authGuard],
    data: { forbiddenRoles: ['admin'] }, // L'admin voit les commandes via /admin/orders
    title: 'Mes Commandes - EditApp'
  },
  {
    path: 'profile', // Voir/Modifier son profil
    component: ProfileComponent,
    canActivate: [authGuard],
    data: { forbiddenRoles: ['admin'] }, // L'admin n'a pas de "profil" client
    title: 'Mon Profil - EditApp'
  },
  {
    path: 'cart', // Voir son panier
    component: CartComponent,
    canActivate: [authGuard],
    data: { forbiddenRoles: ['admin'] }, // L'admin n'a pas de panier client
    title: 'Mon Panier - EditApp'
  },
  // === REDIRECTION (Optionnel mais propre) ===
  // Si jamais l'URL /checkout était utilisée ou mise en favori, on la redirige
  { path: 'checkout', redirectTo: 'order/from-cart', pathMatch: 'full' },
  // ==========================================

  // --- Section Admin (Rôle 'admin' REQUIS) ---
   {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES), // Lazy loading
    canActivate: [authGuard], // Le guard principal vérifie la connexion
    data: { roles: ['admin'] } // Le guard vérifie spécifiquement le rôle 'admin'
    // Le titre sera défini dans les routes enfants de l'admin
  },

  // --- Route par Défaut (NotFound) ---
  // Doit être la DERNIÈRE route !!
  { path: '**', component: NotFoundComponent, title: 'Page non trouvée - EditApp' },
];