// src/app/features/order/pages/cart-order/cart-order.component.ts
import { Component, OnInit, OnDestroy, inject, Signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
// Ajout des opérateurs take et timeout
import { Subject, takeUntil, tap, finalize, take, timeout, catchError, EMPTY, throwError } from 'rxjs';

// --- Services ---
import { CartService } from '../../../../core/services/cart.service';
import { OrderService } from '../../../../core/services/order.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

// --- Models ---
import { CartItem } from '../../../../models/cart-item.model';
import { Address } from '../../../../models/address.model';

@Component({
  selector: 'app-cart-order',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './cart-order.component.html',
  styleUrls: ['./cart-order.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartOrderComponent implements OnInit, OnDestroy {

  // --- Injections ---
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  // --- Gestion Désinscription ---
  private destroy$ = new Subject<void>();

  // --- Données Panier (via Signals) ---
  cartItems: Signal<CartItem[]> = this.cartService.cartItems;
  totalAmount: Signal<number> = this.cartService.totalAmount;
  totalItemsCount: Signal<number> = this.cartService.totalItems;

  // --- Formulaire Commande ---
  orderForm!: FormGroup;

  // --- États UI ---
  isSubmitting: boolean = false;
  errorMessage: string | null = null;
  isLoadingUser: boolean = true; // Initialisé à true

  ngOnInit(): void {
    console.log('[CartOrderComponent] ngOnInit: Initialisation...');
    if (this.totalItemsCount() === 0) {
      console.warn('[CartOrderComponent] Panier vide détecté. Redirection...');
      this.notificationService.showWarning("Votre panier est vide.");
      setTimeout(() => this.router.navigate(['/cart']), 0);
      this.isLoadingUser = false;
      this.cdr.markForCheck();
      return;
    }
    this.initializeForm();
    this.loadUserDataAndPreFillForm();
  }

  ngOnDestroy(): void {
    console.log('[CartOrderComponent] ngOnDestroy: Nettoyage.');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Initialise le formulaire réactif */
  private initializeForm(): void {
    this.orderForm = this.fb.group({
      customerName: ['', Validators.required],
      customerEmail: ['', [Validators.required, Validators.email]],
      shippingAddress: this.fb.group({
        street: ['', Validators.required],
        zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
        city: ['', Validators.required],
        country: ['', Validators.required]
      })
    });
    console.log('[CartOrderComponent] Formulaire initialisé.');
  }

  /** Charge les données utilisateur et pré-remplit le formulaire */
  private loadUserDataAndPreFillForm(): void {
      this.isLoadingUser = true;
      this.errorMessage = null;
      this.cdr.markForCheck();
      console.log('[CartOrderComponent] Début chargement user data, isLoadingUser =', this.isLoadingUser);

      const TIMEOUT_DURATION = 7000; // 7 secondes, ajustable

      this.authService.currentUser$.pipe(
          take(1),
          timeout(TIMEOUT_DURATION),
          catchError(err => {
              if (err.name === 'TimeoutError') {
                  console.error(`[CartOrderComponent] Timeout (${TIMEOUT_DURATION}ms) dépassé lors du chargement des données utilisateur.`);
                  this.errorMessage = "Impossible de charger vos informations (timeout). Veuillez réessayer.";
                  return EMPTY;
              }
              return throwError(() => err);
          }),
          takeUntil(this.destroy$),
          tap(user => console.log('[CartOrderComponent] User data received:', user)),
          finalize(() => {
              this.isLoadingUser = false;
              console.log('[CartOrderComponent] Finalize loadUserData: isLoadingUser =', this.isLoadingUser);
              this.cdr.markForCheck();
          })
      ).subscribe({
            next: user => {
                if (user) {
                    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                    this.orderForm.patchValue({
                        customerName: fullName || user.email,
                        customerEmail: user.email,
                    });
                    console.log('[CartOrderComponent] Formulaire pré-rempli.');
                } else {
                    console.warn('[CartOrderComponent] Utilisateur non connecté ou première valeur de currentUser$ est null.');
                }
            },
            error: err => {
                 console.error('[CartOrderComponent] Erreur inattendue chargement utilisateur:', err);
                 if (!this.errorMessage) {
                    this.errorMessage = "Erreur lors du chargement de vos informations.";
                 }
            }
      });
  }

  /** Gère la soumission du formulaire */
  onSubmit(): void {
    console.log('[CartOrderComponent] Tentative de soumission.');
    this.errorMessage = null;

    if (this.orderForm.invalid) {
      console.warn('[CartOrderComponent] Formulaire invalide.');
      this.orderForm.markAllAsTouched();
      this.scrollToFirstInvalidControl();
      this.notificationService.showError("Veuillez vérifier les informations saisies.");
      this.cdr.markForCheck();
      return;
    }

    const currentCartItems = this.cartItems();
    if (currentCartItems.length === 0) {
        console.error('[CartOrderComponent] Panier vide au moment de la soumission.');
        this.notificationService.showError("Votre panier est vide. Impossible de commander.");
        this.router.navigate(['/cart']);
        return;
    }

    if (this.isSubmitting) return;

    this.isSubmitting = true;
    this.cdr.markForCheck(); // Signaler début soumission

    const orderPayload = {
      customerName: this.orderForm.value.customerName,
      customerEmail: this.orderForm.value.customerEmail,
      shippingAddress: this.orderForm.value.shippingAddress as Address
    };

    console.log('[CartOrderComponent] Appel orderService.addOrder avec:', orderPayload, currentCartItems);
    this.orderService.addOrder(orderPayload, currentCartItems)
      .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
              this.isSubmitting = false;
              console.log('[CartOrderComponent] Finalize onSubmit: isSubmitting =', this.isSubmitting);
              this.cdr.markForCheck(); // Signaler fin soumission
          })
      )
      .subscribe({
        next: (createdOrder) => {
          console.log('[CartOrderComponent] Commande créée avec succès:', createdOrder);
          this.notificationService.showSuccess(`Commande ${createdOrder.orderNumber || createdOrder.id} enregistrée avec succès !`);
          this.cartService.clearCart();
          console.log('[CartOrderComponent] Panier vidé.');
          this.orderForm.reset();
          // ===> MODIFICATION : Rediriger vers la page d'accueil ('/') <===
          console.log('[CartOrderComponent] Redirection vers la page d\'accueil...');
          setTimeout(() => { this.router.navigate(['/']); }, 1500);
        },
        error: (err) => {
          console.error('[CartOrderComponent] Erreur création commande:', err);
          const detail = err?.error?.message || err?.message || 'Erreur inconnue';
          this.errorMessage = `Erreur lors de la commande : ${detail}`;
          this.notificationService.showError(this.errorMessage);
        }
      });
  }

  /** Fait défiler vers le premier contrôle invalide trouvé dans le formulaire */
  private scrollToFirstInvalidControl(): void {
      setTimeout(() => {
        const firstInvalidControl = document.querySelector(
            'form .form-control.ng-invalid, form .ng-invalid .form-control, form [formControlName].ng-invalid, form [formGroupName] .ng-invalid input'
        );
        if (firstInvalidControl) {
            firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (typeof (firstInvalidControl as HTMLElement).focus === 'function') {
                (firstInvalidControl as HTMLElement).focus({ preventScroll: true });
            }
        }
      }, 50);
  }

  /** Fonction TrackBy pour optimiser le *ngFor sur les items du panier */
  trackByCartItem(index: number, item: CartItem): number | string {
    return item.bookId;
  }

  // --- Getters pour le template (utilisation sécurisée) ---
  getControl(name: string, groupName?: string): AbstractControl | null {
    if (!this.orderForm) return null;
    const form = this.orderForm;
    return groupName ? form.get(groupName)?.get(name) ?? null : form.get(name) ?? null;
  }

  isInvalid(name: string, groupName?: string): boolean {
    const control = this.getControl(name, groupName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  getErrorMessage(name: string, groupName?: string): string | null {
    const control = this.getControl(name, groupName);
    if (!control || !control.errors || !(control.touched || control.dirty)) {
      return null;
    }
    if (control.errors?.['required']) { return 'Ce champ est obligatoire.'; }
    if (control.errors?.['email']) { return 'Format d\'email invalide.'; }
    if (control.errors?.['pattern']) {
        if (name === 'zipCode') { return 'Le code postal doit contenir 5 chiffres.'; }
        return 'Le format saisi est incorrect.';
    }
    console.warn(`Validation non gérée pour ${name}:`, control.errors);
    return 'La valeur saisie est invalide.';
  }
  // --- Fin Getters ---
}