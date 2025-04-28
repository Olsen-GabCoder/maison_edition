import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ContactService, ContactMessage } from '../../../core/services/contact.service';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-list.component.html',
  styleUrls: ['./message-list.component.scss']
})
export class MessageListComponent implements OnInit {

  private contactService = inject(ContactService);

  messages$: Observable<ContactMessage[]> = of([]);

  ngOnInit(): void {
    console.log('[MessageListComponent] ngOnInit: Initialisation.');
    this.loadMessages();
  }

  loadMessages(): void {
    console.log('[MessageListComponent] Chargement des messages...');
    this.messages$ = this.contactService.getMessages().pipe(
      tap(messages => console.log(`[MessageListComponent] ${messages.length} messages chargés.`))
    );
  }

  deleteMessage(messageId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible.')) {
      console.log(`[MessageListComponent] Demande de suppression du message ID: ${messageId}`);
      this.contactService.deleteMessage(messageId);
      console.log(`[MessageListComponent] Message ID: ${messageId} supprimé (via service).`);
    } else {
      console.log(`[MessageListComponent] Suppression annulée pour message ID: ${messageId}`);
    }
  }
}
