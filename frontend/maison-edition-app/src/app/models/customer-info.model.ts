// src/app/models/customer-info.model.ts
export interface CustomerInfo {
    name: string;
    email: string;
    customerId?: string | number; // Optionnel pour l'instant
  }