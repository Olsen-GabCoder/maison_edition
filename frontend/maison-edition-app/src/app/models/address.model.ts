// src/app/models/address.model.ts
export interface Address {
    street: string;
    zipCode: string;   // Changé de postalCode à zipCode
    city: string;
    country: string;
  }