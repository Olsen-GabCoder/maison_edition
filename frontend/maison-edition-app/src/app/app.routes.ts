// src/app/app.routes.ts - CORRECTION IMPORT UnauthorizedComponent
import { Routes } from '@angular/router';

// --- Guards ---
import { authGuard } from './core/guards/auth.guard';

// --- Composants Principaux ---
import { HomeComponent } from './pages/home/home.component';
import { ContactComponent } from './pages/contact/contact.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { BookDetailComponent } from './pages/book-detail/book-detail.component';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';
// === CHEMIN CORRIGÉ ICI ===
import { UnauthorizedComponent } from './pages/unauthorized/unauthorized.component';

// --- Composants Features ---
import { DirectOrderComponent } from './features/order/pages/direct-order/direct-order.component';
import { UserOrdersComponent } from './features/user/pages/user-orders/user-orders.component';
// import { AdminLoginComponent } from './pages/admin-login/admin-login.component'; // Supprimé


export const routes: Routes = [
  // --- Routes Publiques ---
  { path: '', component: HomeComponent, title: 'Accueil - Ma Maison d\'Édition' },
  { path: 'contact', component: ContactComponent, title: 'Contact - Ma Maison d\'Édition' },
  { path: 'books/:id', component: BookDetailComponent },
  { path: 'register', component: RegisterComponent, title: 'Inscription' },
  { path: 'login', component: LoginComponent, title: 'Connexion' },
  { path: 'unauthorized', component: UnauthorizedComponent, title: 'Accès Refusé' },

  // --- Routes Utilisateur Connecté (Tous Rôles Autorisés) ---
  {
    path: 'order/new/:bookId',
    component: DirectOrderComponent,
    canActivate: [authGuard],
    title: 'Passer Commande'
  },
  {
    path: 'my-orders',
    component: UserOrdersComponent,
    canActivate: [authGuard],
    title: 'Mes Commandes'
  },

  // --- Section Admin (Protégée pour Rôle 'admin') ---
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [authGuard],
    data: { roles: ['admin'] }
  },

  // --- Route par Défaut (NotFound) ---
  { path: '**', component: NotFoundComponent, title: 'Page non trouvée' },
];