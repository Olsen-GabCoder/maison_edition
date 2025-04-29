// src/app/features/order/pages/direct-order/direct-order.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, of, Subject, switchMap, tap, catchError, takeUntil } from 'rxjs';
import { Book } from '../../../../models/book.model';                       // Vérifiez chemin
import { BookService } from '../../../../core/services/book.service';           // Vérifiez chemin
import { OrderService } from '../../../../core/services/order.service';         // Vérifiez chemin
import { Address } from '../../../../models/address.model';                   // Vérifiez chemin
import { NotificationService } from '../../../../core/services/notification.service'; // <<<=== VÉRIFIEZ CE CHEMIN

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

  // --- Gestion Désinscription ---
  private destroy$ = new Subject<void>();

  // --- Propriétés du Composant ---
  orderForm: FormGroup;
  selectedBook$: Observable<Book | null | undefined> = of(null);
  selectedBookData: Book | null = null;

  // --- États UI ---
  isLoadingBook: boolean = true;
  isSubmitting: boolean = false;
  errorMessage: string | null = null;

  constructor() {
    console.log('[DirectOrderComponent] Constructor: Initialisation du formulaire.');
    this.orderForm = this.fb.group({
      customerName: ['', Validators.required],
      customerEmail: ['', [Validators.required, Validators.email]],
      customerId: [''],
      shippingAddress: this.fb.group({
        street: ['', Validators.required],
        zipCode: ['', Validators.required],
        city: ['', Validators.required],
        country: ['', Validators.required]
      })
    });
  }

  ngOnInit(): void {
    console.log('[DirectOrderComponent] ngOnInit: Début.');
    this.loadBookDetails();
  }

  ngOnDestroy(): void {
    console.log('[DirectOrderComponent] ngOnDestroy: Nettoyage.');
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBookDetails(): void {
    console.log('[DirectOrderComponent] loadBookDetails: DÉBUT. isLoadingBook = true.');
    this.isLoadingBook = true;
    this.errorMessage = null;
    this.selectedBookData = null;

    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const bookIdParam = params.get('bookId');
        console.log(`[DirectOrderComponent] loadBookDetails: bookIdParam = ${bookIdParam}`);
        if (!bookIdParam) {
          this.errorMessage = "ID du livre manquant pour la commande.";
          this.isLoadingBook = false; return of(null);
        }
        const bookId = parseInt(bookIdParam, 10);
        if (isNaN(bookId)) {
          this.errorMessage = "ID du livre invalide.";
          this.isLoadingBook = false; return of(null);
        }
        console.log(`[DirectOrderComponent] loadBookDetails: Appel de bookService.getBookById(${bookId})`);
        return this.bookService.getBookById(bookId);
      }),
      tap(book => {
        console.log('[DirectOrderComponent] loadBookDetails: TAP exécuté. Valeur reçue:', book);
        if (!book) {
          this.errorMessage = "Le livre sélectionné n'a pas été trouvé.";
          this.selectedBookData = null;
        } else {
          this.selectedBookData = book;
        }
        this.isLoadingBook = false;
        console.log('[DirectOrderComponent] loadBookDetails: <<< isLoadingBook mis à false (TAP) >>>');
      }),
      catchError(err => {
        console.error('[DirectOrderComponent] loadBookDetails: CATCHERROR exécuté.', err);
        this.errorMessage = "Erreur lors du chargement des détails du livre.";
        this.selectedBookData = null;
        this.isLoadingBook = false;
        console.log('[DirectOrderComponent] loadBookDetails: <<< isLoadingBook mis à false (CATCHERROR) >>>');
        return of(null);
      })
    ).subscribe({
        next: (bookOrNull) => console.log('[DirectOrderComponent] loadBookDetails: SUBSCRIBE next.'),
        error: (err) => console.error('[DirectOrderComponent] loadBookDetails: SUBSCRIBE error.', err)
    });
  }

  onSubmit(): void {
    console.log('[DirectOrderComponent] onSubmit: Début de la soumission.');

    if (this.orderForm.invalid || !this.selectedBookData || this.isSubmitting) {
       console.warn('[DirectOrderComponent] onSubmit: Conditions non remplies.');
       if(this.orderForm.invalid) this.orderForm.markAllAsTouched();
       if(!this.selectedBookData) this.errorMessage = "Livre non chargé.";
       return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const orderPayload = {
      customerName: this.orderForm.value.customerName,
      customerEmail: this.orderForm.value.customerEmail,
      customerId: this.orderForm.value.customerId || null,
      shippingAddress: this.orderForm.value.shippingAddress as Address
    };

    console.log('[DirectOrderComponent] onSubmit: Appel de orderService.addOrder...');

    this.orderService.addOrder(orderPayload, this.selectedBookData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: (createdOrder) => {
                console.log('[DirectOrderComponent] onSubmit: SUCCÈS de addOrder:', createdOrder);
                this.isSubmitting = false;

                // === CORRECTION DE L'APPEL NOTIFICATION ===
                // Appel avec seulement le message (1er argument string)
                this.notificationService.showSuccess(
                    `Commande ${createdOrder.orderNumber} passée avec succès !`
                    // PAS de 2ème argument ici, car il attend un nombre (duration)
                    // Si vous voulez une durée : , 5000
                );
                // === FIN CORRECTION ===

                console.log('[DirectOrderComponent] onSubmit: Réinitialisation formulaire et redirection...');
                this.orderForm.reset();
                setTimeout(() => { this.router.navigate(['/']); }, 1500);
            },
            error: (err) => {
                 console.error('[DirectOrderComponent] onSubmit: ERREUR de addOrder:', err);
                 this.isSubmitting = false;
                 const errorMsg = `Erreur: ${err?.message || 'Impossible de créer la commande.'}`;
                 this.errorMessage = errorMsg;
                 // Optionnel: Notification d'erreur (vérifier la signature de showError aussi)
                 // this.notificationService.showError(errorMsg);
            }
     });
  }

  // --- Getters ---
  get customerName() { return this.orderForm.get('customerName'); }
  get customerEmail() { return this.orderForm.get('customerEmail'); }
  get shippingAddressGroup() { return this.orderForm.get('shippingAddress') as FormGroup; }
  get street() { return this.shippingAddressGroup.get('street'); }
  get zipCode() { return this.shippingAddressGroup.get('zipCode'); }
  get city() { return this.shippingAddressGroup.get('city'); }
  get country() { return this.shippingAddressGroup.get('country'); }
}