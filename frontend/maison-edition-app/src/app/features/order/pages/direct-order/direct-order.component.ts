// src/app/features/order/pages/direct-order/direct-order.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, of, Subject, switchMap, tap, catchError, takeUntil, finalize } from 'rxjs'; // finalize est déjà là

// Models
import { Book } from '../../../../models/book.model';
import { Address } from '../../../../models/address.model';
import { CartItem } from '../../../../models/cart-item.model';

// Services
import { BookService } from '../../../../core/services/book.service';
import { OrderService } from '../../../../core/services/order.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-direct-order',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './direct-order.component.html',
  styleUrls: ['./direct-order.component.scss']
})
export class DirectOrderComponent implements OnInit, OnDestroy {

  // --- Injections ---
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private bookService = inject(BookService);
  private orderService = inject(OrderService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  // --- Gestion Désinscription ---
  private destroy$ = new Subject<void>();

  // --- Propriétés du Composant ---
  orderForm!: FormGroup;
  selectedBookData: Book | null = null;

  // --- États UI ---
  isLoadingBook: boolean = true;
  isLoadingUser: boolean = true;
  isSubmitting: boolean = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    console.log('[DirectOrderComponent] ngOnInit: Début.');
    this.initializeForm();
    this.loadBookDetails();
    this.loadUserDataAndPreFillForm();
  }

  ngOnDestroy(): void {
    console.log('[DirectOrderComponent] ngOnDestroy: Nettoyage.');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Initialise le formulaire réactif */
  private initializeForm(): void {
     console.log('[DirectOrderComponent] Initialisation du formulaire.');
     this.orderForm = this.fb.group({
       customerName: ['', Validators.required],
       customerEmail: ['', [Validators.required, Validators.email]],
       customerId: [''], // Optionnel
       shippingAddress: this.fb.group({
         street: ['', Validators.required],
         zipCode: ['', Validators.required],
         city: ['', Validators.required],
         country: ['', Validators.required]
       })
     });
   }

   /** Charge les données utilisateur et pré-remplit le formulaire */
  private loadUserDataAndPreFillForm(): void {
      this.isLoadingUser = true;
      this.authService.currentUser$.pipe(
          takeUntil(this.destroy$),
          tap(user => console.log('[DirectOrderComponent] User data received:', user)),
          finalize(() => this.isLoadingUser = false)
      ).subscribe(user => {
          if (user) {
              this.orderForm.patchValue({
                  customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || '',
                  customerEmail: user.email
              });
              console.log('[DirectOrderComponent] Formulaire pré-rempli avec données utilisateur.');
          } else {
               console.warn('[DirectOrderComponent] Impossible de pré-remplir: utilisateur non trouvé.');
          }
      });
  }


  /** Charge les détails du livre depuis l'ID dans l'URL */
  loadBookDetails(): void {
    console.log('[DirectOrderComponent] loadBookDetails: DÉBUT.');
    this.isLoadingBook = true;
    this.errorMessage = null;
    this.selectedBookData = null;

    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const bookIdParam = params.get('bookId');
        console.log(`[DirectOrderComponent] loadBookDetails: bookIdParam = ${bookIdParam}`);
        if (!bookIdParam) {
            this.handleLoadingError("ID du livre manquant pour la commande.");
            return of(null);
        }
        const bookId = parseInt(bookIdParam, 10);
        if (isNaN(bookId)) {
            this.handleLoadingError("ID du livre invalide.");
            return of(null);
        }
        console.log(`[DirectOrderComponent] loadBookDetails: Appel de bookService.getBookById(${bookId})`);
        return this.bookService.getBookById(bookId).pipe(
           catchError(err => {
              console.error('[DirectOrderComponent] Erreur getBookById:', err);
              this.handleLoadingError("Erreur lors du chargement des détails du livre.");
              return of(null);
           })
        );
      }),
      tap(bookOrNull => {
        console.log('[DirectOrderComponent] loadBookDetails: TAP après switchMap. Valeur reçue:', bookOrNull);
        if (bookOrNull) {
          this.selectedBookData = bookOrNull;
          console.log('[DirectOrderComponent] Livre trouvé et stocké:', this.selectedBookData.title);
        } else {
          if (!this.errorMessage) {
             this.handleLoadingError("Le livre sélectionné n'a pas été trouvé.");
          }
          this.selectedBookData = null;
        }
        this.isLoadingBook = false;
        console.log('[DirectOrderComponent] loadBookDetails: <<< isLoadingBook mis à false >>>');
      })
    ).subscribe({
        next: () => console.log('[DirectOrderComponent] loadBookDetails: SUIVI de l\'observable terminé pour ce cycle.'),
        error: (err) => console.error('[DirectOrderComponent] loadBookDetails: Erreur non interceptée (ne devrait pas arriver):', err)
    });
  }

  /** Helper pour gérer les erreurs de chargement */
  private handleLoadingError(message: string): void {
      console.error(`[DirectOrderComponent] Erreur chargement: ${message}`);
      this.errorMessage = message;
      this.isLoadingBook = false;
      this.selectedBookData = null;
  }

  /** Gère la soumission du formulaire de commande */
  onSubmit(): void {
    console.log('[DirectOrderComponent] onSubmit: Début de la soumission.');
    this.errorMessage = null;

    // --- Vérifications avant soumission ---
    if (this.orderForm.invalid) {
       console.warn('[DirectOrderComponent] onSubmit: Formulaire invalide.');
       this.orderForm.markAllAsTouched();
       this.notificationService.showError("Veuillez corriger les erreurs dans le formulaire.");
       return;
    }
    if (!this.selectedBookData) {
        console.error('[DirectOrderComponent] onSubmit: Impossible de soumettre, selectedBookData est null.');
        this.errorMessage = "Les données du livre n'ont pas pu être chargées. Impossible de commander.";
        this.notificationService.showError(this.errorMessage);
       return;
    }
    if (this.isSubmitting) {
        console.warn('[DirectOrderComponent] onSubmit: Soumission déjà en cours.');
        return;
    }
    // --- Fin Vérifications ---

    this.isSubmitting = true;

    const orderPayload = {
      customerName: this.orderForm.value.customerName,
      customerEmail: this.orderForm.value.customerEmail,
      customerId: this.orderForm.value.customerId || null,
      shippingAddress: this.orderForm.value.shippingAddress as Address
    };

    const cartItemForOrder: CartItem[] = [{
        bookId: this.selectedBookData.id,
        quantity: 1,
        title: this.selectedBookData.title,
        price: this.selectedBookData.price,
        coverUrl: this.selectedBookData.coverUrl
    }];

    console.log('[DirectOrderComponent] onSubmit: Appel de orderService.addOrder avec:', orderPayload, cartItemForOrder);

    this.orderService.addOrder(orderPayload, cartItemForOrder)
        .pipe(
            takeUntil(this.destroy$),
            finalize(() => this.isSubmitting = false)
        )
        .subscribe({
            next: (createdOrder) => {
                console.log('[DirectOrderComponent] onSubmit: SUCCÈS de addOrder:', createdOrder);
                this.notificationService.showSuccess(
                    `Commande ${createdOrder.orderNumber} passée avec succès !`
                );
                console.log('[DirectOrderComponent] onSubmit: Réinitialisation formulaire et redirection vers l\'accueil...');
                this.orderForm.reset();
                // ===> MODIFICATION : Rediriger vers la page d'accueil ('/') <===
                setTimeout(() => { this.router.navigate(['/']); }, 1500);
            },
            error: (err) => {
                 console.error('[DirectOrderComponent] onSubmit: ERREUR de addOrder:', err);
                 const errorMsg = `Erreur lors de la commande: ${err?.message || 'Une erreur inconnue est survenue.'}`;
                 this.errorMessage = errorMsg;
                 this.notificationService.showError(errorMsg);
            }
     });
  }

  // --- Getters pour accès facile aux contrôles de formulaire ---
  get customerName() { return this.orderForm.get('customerName'); }
  get customerEmail() { return this.orderForm.get('customerEmail'); }
  get shippingAddressGroup() { return this.orderForm.get('shippingAddress') as FormGroup; }
  get street() { return this.shippingAddressGroup.get('street'); }
  get zipCode() { return this.shippingAddressGroup.get('zipCode'); }
  get city() { return this.shippingAddressGroup.get('city'); }
  get country() { return this.shippingAddressGroup.get('country'); }
  // ------------------------------------------------------------
}