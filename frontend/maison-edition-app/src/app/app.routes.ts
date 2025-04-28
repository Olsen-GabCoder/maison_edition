import { Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { ContactComponent } from './pages/contact/contact.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { AdminLoginComponent } from './pages/admin-login/admin-login.component';

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
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes')
                       .then(m => m.ADMIN_ROUTES)
  },
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Page non trouvée'
  }
];
