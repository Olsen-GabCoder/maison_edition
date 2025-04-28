// src/app/models/contact-message.model.ts

export interface ContactMessage { // <--- Le mot 'export' est crucial
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    date: Date;
    isRead?: boolean;
  }