// src/app/pages/profile/profile/profile.component.ts (APPROCHE RESTRUCTURÉE)
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
// === AJOUT: takeUntil détruit automatiquement les observables quand le composant est détruit ===
import { Observable, Subscription, filter, take, of, switchMap, map, combineLatest, tap, Subject, BehaviorSubject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators'; // Ajout takeUntil ici

// --- Service et Modèles ---
import { AuthService } from '../../../core/services/auth.service';
import { UserProfile } from '../../../models/user.model';
import { NotificationService } from '../../../core/services/notification.service';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../models/order.model';
import { FavoriteService } from '../../../core/services/favorite.service';
import { BookService } from '../../../core/services/book.service';
import { Book } from '../../../models/book.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  // --- Injections ---
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);
  private orderService = inject(OrderService);
  private favoriteService = inject(FavoriteService);
  private bookService = inject(BookService);

  // --- Sujet pour gérer la destruction des observables ---
  private destroy$ = new Subject<void>();

  // --- Propriétés Profil ---
  currentUser$: Observable<UserProfile | null> = this.authService.currentUser$;
  profileForm!: FormGroup;
  isLoadingProfile = false;
  profileErrorMessage: string | null = null;

  // --- Propriété Commandes ---
  userOrders$: Observable<Order[]> = of([]);

  // === Propriétés Favoris (Restructurées) ===
  // BehaviorSubject interne pour contenir la liste de livres
  private favoriteBooksSubject = new BehaviorSubject<Book[]>([]);
  // Observable exposé au template
  favoriteBooks$: Observable<Book[]> = this.favoriteBooksSubject.asObservable();
  isLoadingFavorites = true; // Flag de chargement

  ngOnInit(): void {
    console.log("ProfileComponent initialisé.");
    this.initForm();
    this.subscribeToCurrentUserAndLoadOrders(); // Renommé pour clarté
    this.subscribeToFavoriteIds(); // Démarrer l'écoute des IDs favoris
  }

  ngOnDestroy(): void {
    this.destroy$.next(); // Émettre une valeur pour détruire les observables
    this.destroy$.complete();
    // Les abonnements faits avec .pipe(takeUntil(this.destroy$)) s'arrêteront automatiquement.
  }

  // Initialisation du formulaire profil
  private initForm(): void {
    this.profileForm = this.fb.group({
      email: [{ value: '', disabled: true }, Validators.required],
      firstName: ['', Validators.maxLength(50)],
      lastName: ['', Validators.maxLength(50)]
    });
  }

  // Pré-remplissage formulaire profil ET Chargement commandes
  private subscribeToCurrentUserAndLoadOrders(): void {
    this.authService.currentUser$.pipe(
      filter((user): user is UserProfile => user !== null),
      take(1), // Prendre seulement la première valeur pour initialiser
      takeUntil(this.destroy$) // Se désabonner à la destruction
    ).subscribe(user => {
      console.log("Utilisateur trouvé pour profil et commandes:", user);
      this.profileForm.patchValue({
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      });
      this.userOrders$ = this.orderService.getUserOrders().pipe(
         catchError(err => {
             console.error("Erreur chargement commandes:", err);
             this.notificationService.showError("Impossible de charger l'historique des commandes.");
             return of([]);
         }),
         takeUntil(this.destroy$) // Se désabonner aussi
      );
    });
  }

  // === NOUVELLE MÉTHODE : S'abonner aux changements d'IDs favoris ===
  private subscribeToFavoriteIds(): void {
    console.log("[Profile] subscribeToFavoriteIds - Début de l'écoute des IDs favoris.");
    this.favoriteService.currentUsersFavoriteIds$.pipe(
      tap(ids => console.log("[Profile] subscribeToFavoriteIds - IDs reçus du service:", ids)),
      // Utiliser takeUntil pour nettoyer l'abonnement à la destruction du composant
      takeUntil(this.destroy$)
    ).subscribe({
      next: (ids) => {
        this.fetchFavoriteBookDetails(ids); // Appeler la méthode pour charger les livres
      },
      error: (err) => {
        console.error("[Profile] subscribeToFavoriteIds - Erreur sur l'observable des IDs:", err);
        this.notificationService.showError("Erreur lors de la réception des favoris.");
        this.isLoadingFavorites = false;
        this.favoriteBooksSubject.next([]); // Émettre un tableau vide en cas d'erreur
      }
      // Pas de 'complete' car l'observable des IDs reste actif
    });
  }

  // === NOUVELLE MÉTHODE : Charger les détails des livres à partir des IDs ===
  private fetchFavoriteBookDetails(ids: string[]): void {
    console.log("[Profile] fetchFavoriteBookDetails - IDs reçus à traiter:", ids);
    this.isLoadingFavorites = true; // Marquer comme en chargement

    if (!ids || ids.length === 0) {
      console.log("[Profile] fetchFavoriteBookDetails - Aucun ID, mise à jour avec tableau vide.");
      this.favoriteBooksSubject.next([]); // Mettre à jour le sujet interne
      this.isLoadingFavorites = false; // Chargement terminé
      return; // Arrêter ici
    }

    // Préparer les appels pour obtenir les détails
    const bookObservables = ids.map((id: string) =>
      this.bookService.getBookById(Number(id)).pipe(
        catchError(err => {
          console.warn(`[Profile] fetchFavoriteBookDetails - Erreur chargement livre ID ${id}:`, err);
          return of(null); // Retourner null en cas d'erreur pour ce livre
        })
      )
    );

    // Utiliser combineLatest pour attendre tous les résultats
    combineLatest(bookObservables).pipe(
      // Ne prendre qu'une seule émission de combineLatest pour ce set d'IDs
      // car combineLatest ré-émet si l'un des observables sources ré-émet.
      // Si getBookById n'émet qu'une fois, take(1) n'est pas crucial mais plus sûr.
      take(1)
    ).subscribe({
      next: (booksResult: (Book | null | undefined)[]) => {
        console.log("[Profile] fetchFavoriteBookDetails - Résultats de combineLatest:", booksResult);
        const validBooks = booksResult.filter((book): book is Book => book !== null);
        console.log("[Profile] fetchFavoriteBookDetails - Livres valides trouvés:", validBooks);
        this.favoriteBooksSubject.next(validBooks); // Mettre à jour le sujet interne avec les livres trouvés
        this.isLoadingFavorites = false; // Chargement terminé
      },
      error: (err) => {
        // Gérer une erreur potentielle de combineLatest lui-même (rare)
        console.error("[Profile] fetchFavoriteBookDetails - Erreur dans combineLatest:", err);
        this.notificationService.showError("Erreur lors du chargement des détails des favoris.");
        this.favoriteBooksSubject.next([]);
        this.isLoadingFavorites = false;
      }
    });
  }


  // Getters (inchangés)
  get email() { return this.profileForm.get('email'); }
  get firstName() { return this.profileForm.get('firstName'); }
  get lastName() { return this.profileForm.get('lastName'); }

  // onSubmitProfile (inchangé)
  onSubmitProfile(): void {
     if (this.profileForm.invalid || !this.profileForm.dirty) {
       if(!this.profileForm.dirty) this.notificationService.showInfo("Aucune modification détectée.");
       else this.notificationService.showError("Veuillez corriger les erreurs dans le formulaire.");
       this.profileForm.markAllAsTouched();
      return;
    }
    this.isLoadingProfile = true;
    this.profileErrorMessage = null;
    const updatedData: Partial<Pick<UserProfile, 'firstName' | 'lastName'>> = {
      firstName: this.firstName?.value.trim(),
      lastName: this.lastName?.value.trim()
    };
    this.authService.updateUserProfile(updatedData).subscribe({
      next: (updatedUserProfile) => {
        this.notificationService.showSuccess("Profil mis à jour avec succès !");
        this.isLoadingProfile = false;
        this.profileForm.reset({
            email: updatedUserProfile.email,
            firstName: updatedUserProfile.firstName,
            lastName: updatedUserProfile.lastName
        });
      },
      error: (err) => {
        this.profileErrorMessage = err?.message || "Une erreur inconnue est survenue lors de la mise à jour.";
        this.notificationService.showError(this.profileErrorMessage ?? 'Erreur inconnue');
        this.isLoadingProfile = false;
      }
    });
  }

  // removeFromFavorites (inchangé)
  removeFromFavorites(bookId: number | string | undefined): void {
    if (bookId === undefined) return;
    const bookIdStr = String(bookId);
    console.log(`[Profile] Demande suppression favori ID: ${bookIdStr}`);
    this.favoriteService.removeFavorite(bookIdStr);
    this.notificationService.showSuccess("Livre retiré des favoris.");
    // Le subscribeToFavoriteIds réagira au changement dans favoriteService et mettra à jour la liste
  }

  // getUserFullName (inchangé)
  getUserFullName(user: UserProfile | null): string {
     if (!user) return '';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return (firstName || lastName) ? `${firstName} ${lastName}`.trim() : user.email;
  }
}