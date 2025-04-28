// src/app/admin/pages/pipes/book-filter.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { Book } from '../../../models/book.model';

@Pipe({
  name: 'bookFilter',
  standalone: true
})
export class BookFilterPipe implements PipeTransform {
  transform(books: Book[], searchTerm: string): Book[] {
    if (!searchTerm) return books;
    const term = searchTerm.toLowerCase();
    return books.filter(book => 
      book.title.toLowerCase().includes(term) || 
      book.author.toLowerCase().includes(term)
    );
  }
}