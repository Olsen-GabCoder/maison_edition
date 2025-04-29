import { Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { ContactComponent } from './pages/contact/contact.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { AdminLoginComponent } from './pages/admin-login/admin-login.component';
import { BookDetailComponent } from './pages/book-detail/book-detail.component';
import { DirectOrderComponent } from './features/order/pages/direct-order/direct-order.component';
import { UserOrdersComponent } from './features/user/pages/user-orders/user-orders.component';
//import { CartComponent } from './pages/cart/cart.component'; // Si créé plus tard

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'Accueil - Ma Maison d\'Édition'
  },
  {
    path: 'contact',
    component: ContactComponent,
    title: 'Contact - Ma Maison d\'Édition'
  },
  {
    path: 'admin/login',
    component: AdminLoginComponent,
    title: 'Admin - Connexion'
  },
  { path: 'my-orders', component: UserOrdersComponent }, 
  
  {
    path: 'books/:id',
    component: BookDetailComponent
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes')
                        .then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'order/new/:bookId',
    component: DirectOrderComponent
  },
  {
    path: 'book/:id', 
    component: BookDetailComponent
  },
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Page non trouvée'
  },
];
