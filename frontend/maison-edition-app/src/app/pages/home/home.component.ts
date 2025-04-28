import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs'; // <<<=== Ajouter 'of' à l'import rxjs
import { Book } from '../../models/book.model';
import { BookService } from '../../core/services/book.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ CommonModule ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  // Initialiser directement avec un Observable émettant un tableau vide
  books$: Observable<Book[]> = of([]); // <<<=== MODIFICATION ICI

  constructor(private bookService: BookService) { }

  ngOnInit(): void {
    console.log('HomeComponent: Initialisation, demande des livres...');
    // L'assignation réelle écrasera la valeur par défaut 'of([])'
    this.books$ = this.bookService.getBooks();
  }

  buyBook(book: Book): void {
    console.log('Clic sur Acheter pour:', book.title);
  }
}