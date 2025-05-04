// src/app/pages/book-detail/book-detail.component.ts (COMPLET - currentUser$ exposé)
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, BehaviorSubject, of, combineLatest } from 'rxjs';
import { catchError, switchMap, takeUntil, tap, map, distinctUntilChanged, filter, take } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

import { Book } from '../../models/book.model';
import { UserProfile } from '../../models/user.model'; // Importer UserProfile
import { BookService } from '../../core/services/book.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { FavoriteService } from '../../core/services/favorite.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './book-detail.component.html',
  styleUrls: ['./book-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookDetailComponent implements OnInit, OnDestroy {

  // Inject services
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookService = inject(BookService);
  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly favoriteService = inject(FavoriteService);
  private readonly cartService = inject(CartService);

  // Reactive state
  private readonly destroy$ = new Subject<void>();
  private readonly bookSubject = new BehaviorSubject<Book | null | undefined>(undefined);
  readonly book$: Observable<Book | null | undefined> = this.bookSubject.asObservable();

  // États pour les favoris et la connexion
  readonly isLoggedIn$: Observable<boolean> = toObservable(this.authService.isLoggedIn);
  readonly isFavorite$: Observable<boolean> = this.getIsFavoriteObservable();
  // === AJOUT: Exposer currentUser$ pour vérifier le rôle dans le template ===
  readonly currentUser$: Observable<UserProfile | null> = this.authService.currentUser$;

  // UI flags
  isLoading = true;
  errorMessage: string | null = null;
  private currentBookId: string | null = null;

  // Signal pour la quantité à ajouter
  quantityToAdd: WritableSignal<number> = signal(1);

  ngOnInit(): void {
    this.loadBookDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBookDetails(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        tap(() => {
          this.isLoading = true;
          this.errorMessage = null;
          this.bookSubject.next(undefined);
          this.currentBookId = null;
          this.quantityToAdd.set(1);
        }),
        switchMap(params => {
          const idParam = params.get('id');
          if (!idParam) {
            this.handleLoadingError(`ID du livre manquant dans l'URL.`);
            return of(null);
          }
           this.currentBookId = idParam;
          const idNum = Number(idParam);
          if (isNaN(idNum)) {
            this.handleLoadingError(`ID du livre invalide : ${idParam}`);
            return of(null);
          }
          return this.bookService.getBookById(idNum).pipe(
            catchError(err => {
              console.error('[BookDetail] Erreur getBookById :', err);
              this.handleLoadingError('Erreur lors du chargement du livre.');
              return of(null);
            })
          );
        })
      )
      .subscribe(book => {
        this.isLoading = false;
        if (!book && !this.errorMessage) {
            this.handleLoadingError('Livre introuvable.', false);
            this.bookSubject.next(null);
        } else if (book) {
             this.bookSubject.next(book);
        }
      });
  }

  private getIsFavoriteObservable(): Observable<boolean> {
    return this.book$.pipe(
      filter((book): book is Book | null => book !== undefined),
      switchMap(book => {
        if (!book || !book.id) { return of(false); }
        const bookIdStr = String(book.id);
        return this.favoriteService.isFavorite(bookIdStr);
      }),
      distinctUntilChanged(),
      tap(isFav => console.log(`[BookDetail] Livre ${this.currentBookId} est favori ?`, isFav))
    );
  }

  private handleLoadingError(message: string, notify = true): void {
    if (!this.errorMessage) { this.errorMessage = message; }
    this.isLoading = false;
    if (notify) { this.notificationService.showError(message); }
    this.bookSubject.next(null);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  addToCart(): void {
    const currentBook = this.bookSubject.getValue();
    const quantity = this.quantityToAdd();

    if (!currentBook) {
      this.notificationService.showError("Impossible d'ajouter au panier : détails du livre non chargés.");
      return;
    }
    if (quantity <= 0) {
        this.notificationService.showWarning("Veuillez entrer une quantité valide (supérieure à 0).");
        return;
    }

    console.log(`[BookDetail] Ajout au panier: ${quantity} x ${currentBook.title} (ID: ${currentBook.id})`);
    this.cartService.addItem(currentBook, quantity);
    this.notificationService.showSuccess(`${quantity} x "${currentBook.title}" ajouté(s) au panier !`);
  }

  toggleFavorite(): void {
    if (!this.currentBookId) {
        console.error("[BookDetail] Impossible de gérer le favori: ID du livre inconnu.");
        return;
    }
    combineLatest([this.isFavorite$, this.isLoggedIn$]).pipe(take(1))
      .subscribe(([isCurrentlyFavorite, isLoggedIn]: [boolean, boolean]) => {
        if (!isLoggedIn) {
            this.notificationService.showWarning("Veuillez vous connecter pour gérer vos favoris.");
            this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
            return;
        }
        const bookIdStr = this.currentBookId!;
        if (isCurrentlyFavorite) {
            this.favoriteService.removeFavorite(bookIdStr);
            this.notificationService.showSuccess("Livre retiré des favoris.");
        } else {
            this.favoriteService.addFavorite(bookIdStr);
            this.notificationService.showSuccess("Livre ajouté aux favoris !");
        }
    });
  }

  validateQuantity(): void {
      if (this.quantityToAdd() < 1) {
          this.quantityToAdd.set(1);
      }
  }
}