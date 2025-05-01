// src/app/core/models/user.model.ts (ou l'emplacement correct)
export interface UserProfile {
  id: string | number;
  email: string;
  role: 'user' | 'admin' | string;
  firstName?: string; // Ajouté - Prénom (optionnel)
  lastName?: string;  // Ajouté - Nom de famille (optionnel)
  // Ajouter d'autres champs si présents dans le token (nom, prénom, etc.) -> C'est fait !
  exp?: number;
  iat?: number;
}