// src/app/core/services/favorite.service.ts (AVEC shareReplay ET LOGS)
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, map, tap, shareReplay } from 'rxjs'; // Ajout shareReplay
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private authService = inject(AuthService);
  private readonly FAVORITES_KEY = 'app_favorites';

  private currentUsersFavoriteIdsSubject = new BehaviorSubject<string[]>([]);
  // === MODIFICATION: Ajout de shareReplay(1) ===
  public currentUsersFavoriteIds$: Observable<string[]> = this.currentUsersFavoriteIdsSubject.asObservable().pipe(
    tap(ids => console.log("[FavoriteService] currentUsersFavoriteIds$ émet (avant shareReplay):", ids)), // Log pour voir l'émission brute
    shareReplay(1) // Partage et rejoue la dernière valeur
  );

  constructor() {
    this.authService.currentUser$.subscribe(user => {
      // **** LOG SERVICE 1 ****
      console.log("[FavoriteService Constructor] AuthService.currentUser$ a émis:", user);
      if (user && user.email) {
        this.loadFavoritesForCurrentUser(user.email);
      } else {
        // **** LOG SERVICE 2 ****
        console.log("[FavoriteService Constructor] Utilisateur déconnecté ou sans email, vidage favoris courants.");
        this.currentUsersFavoriteIdsSubject.next([]);
      }
    });
  }

  addFavorite(bookId: string): void {
    const userEmail = this.getCurrentUserEmail();
    if (!userEmail || !bookId) {
        console.warn("[FavoriteService addFavorite] Email utilisateur ou bookId manquant.");
        return;
    }
    const allFavorites = this.getAllFavoritesFromStorage();
    const userFavorites = allFavorites[userEmail] || [];
    if (!userFavorites.includes(bookId)) {
      const updatedFavorites = [...userFavorites, bookId];
      allFavorites[userEmail] = updatedFavorites;
      this.saveAllFavoritesToStorage(allFavorites);
      this.currentUsersFavoriteIdsSubject.next(updatedFavorites);
      console.log(`[FavoriteService addFavorite] Livre ${bookId} ajouté aux favoris pour ${userEmail}. Nouvelle liste:`, updatedFavorites);
    } else {
       console.log(`[FavoriteService addFavorite] Livre ${bookId} est déjà dans les favoris pour ${userEmail}.`);
    }
  }

  removeFavorite(bookId: string): void {
    const userEmail = this.getCurrentUserEmail();
     if (!userEmail || !bookId) {
        console.warn("[FavoriteService removeFavorite] Email utilisateur ou bookId manquant.");
        return;
    }
    const allFavorites = this.getAllFavoritesFromStorage();
    const userFavorites = allFavorites[userEmail] || [];
    if (userFavorites.includes(bookId)) {
      const updatedFavorites = userFavorites.filter(id => id !== bookId);
      allFavorites[userEmail] = updatedFavorites;
      if (updatedFavorites.length === 0) {
         delete allFavorites[userEmail];
         console.log(`[FavoriteService removeFavorite] Dernière clé favori supprimée pour ${userEmail}.`);
      }
      this.saveAllFavoritesToStorage(allFavorites);
      this.currentUsersFavoriteIdsSubject.next(updatedFavorites);
       console.log(`[FavoriteService removeFavorite] Livre ${bookId} retiré des favoris pour ${userEmail}. Nouvelle liste:`, updatedFavorites);
    } else {
       console.log(`[FavoriteService removeFavorite] Livre ${bookId} n'était pas dans les favoris pour ${userEmail}.`);
    }
  }

  isFavorite(bookId: string): Observable<boolean> {
    if (!bookId) return of(false);
    return this.currentUsersFavoriteIds$.pipe(
      map(favoriteIds => favoriteIds.includes(bookId))
    );
  }

   private loadFavoritesForCurrentUser(email: string): void {
     // **** LOG SERVICE 3 ****
    console.log(`[FavoriteService loadFavoritesForCurrentUser] Début pour ${email}`);
    const allFavorites = this.getAllFavoritesFromStorage();
     // **** LOG SERVICE 4 ****
    console.log(`[FavoriteService loadFavoritesForCurrentUser] Données lues de localStorage ('${this.FAVORITES_KEY}'):`, JSON.stringify(allFavorites));
    const userFavorites = allFavorites[email] || [];
     // **** LOG SERVICE 5 ****
    console.log(`[FavoriteService loadFavoritesForCurrentUser] Favoris trouvés pour ${email}:`, userFavorites);
     // **** LOG SERVICE 6 ****
    console.log(`[FavoriteService loadFavoritesForCurrentUser] Appel de .next() avec:`, userFavorites);
    this.currentUsersFavoriteIdsSubject.next(userFavorites);
     // **** LOG SERVICE 7 ****
    console.log(`[FavoriteService loadFavoritesForCurrentUser] .next() appelé.`);
  }

  private getCurrentUserEmail(): string | null {
    const user = this.authService.getCurrentUser();
    return user?.email ?? null;
  }

  private getAllFavoritesFromStorage(): { [email: string]: string[] } {
    if (typeof localStorage === 'undefined') {
        console.warn("[FavoriteService getAllFavoritesFromStorage] localStorage non disponible.");
        return {};
    }
    const stored = localStorage.getItem(this.FAVORITES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
           return parsed;
        } else {
           console.warn("[FavoriteService getAllFavoritesFromStorage] Valeur stockée n'est pas un objet valide, réinitialisation.");
           localStorage.removeItem(this.FAVORITES_KEY);
        }
      } catch (e) {
        console.error("[FavoriteService getAllFavoritesFromStorage] Erreur lecture JSON favoris:", e);
        localStorage.removeItem(this.FAVORITES_KEY);
      }
    }
    return {};
  }

  private saveAllFavoritesToStorage(favorites: { [email: string]: string[] }): void {
    if (typeof localStorage === 'undefined') {
        console.warn("[FavoriteService saveAllFavoritesToStorage] localStorage non disponible.");
        return;
    }
    try {
      const dataToStore = JSON.stringify(favorites);
      localStorage.setItem(this.FAVORITES_KEY, dataToStore);
    } catch (e) {
      console.error("[FavoriteService saveAllFavoritesToStorage] Erreur sauvegarde JSON favoris:", e);
    }
  }
}