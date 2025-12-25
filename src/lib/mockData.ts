import { MediaItem, ReadBook, OwnedBook } from './types';

export const VINYLS_DATA: MediaItem[] = [
  { id: '1', author: 'Pink Floyd', title: 'The Dark Side of the Moon', quantity: 1, year: 1973, cost: 35.0, rating: 5, notes: 'Edizione limitata blu' },
  { id: '2', author: 'Daft Punk', title: 'Random Access Memories', quantity: 2, year: 2013, cost: 45.5, rating: 5, notes: '180g Vinyl' },
  { id: '3', author: 'The Beatles', title: 'Abbey Road', quantity: 1, year: 1969, cost: 28.0, rating: 4, notes: 'Usato, ottime condizioni' },
  { id: '4', author: 'Led Zeppelin', title: 'Led Zeppelin IV', quantity: 1, year: 1971, cost: 32.0, rating: 5, notes: '' },
];

export const CDS_DATA: MediaItem[] = [
  { id: '1', author: 'Radiohead', title: 'OK Computer', quantity: 1, year: 1997, cost: 15.0, rating: 5, notes: 'Jewel case' },
  { id: '2', author: 'Nirvana', title: 'Nevermind', quantity: 1, year: 1991, cost: 12.0, rating: 4, notes: '' },
  { id: '3', author: 'Michael Jackson', title: 'Thriller', quantity: 1, year: 1982, cost: 10.0, rating: 5, notes: 'Rimasterizzato' },
];

export const READ_BOOKS_DATA: ReadBook[] = [
  { id: '1', author: 'Frank Herbert', title: 'Dune', yearRead: 2024, pages: 612, notes: 'Capolavoro della fantascienza' },
  { id: '2', author: 'George Orwell', title: '1984', yearRead: 2024, pages: 328, notes: 'Sempre attuale' },
  { id: '3', author: 'J.R.R. Tolkien', title: 'Il Signore degli Anelli', yearRead: 2023, pages: 1200, notes: 'Rilettura annuale' },
  { id: '4', author: 'Fyodor Dostoevsky', title: 'Delitto e Castigo', yearRead: 2024, pages: 671, notes: 'Intenso' },
  { id: '5', author: 'Isaac Asimov', title: 'Fondazione', yearRead: 2024, pages: 255, notes: '' },
  { id: '6', author: 'Haruki Murakami', title: 'Norwegian Wood', yearRead: 2024, pages: 384, notes: '' },
];

export const OWNED_BOOKS_DATA: OwnedBook[] = [
  { id: '1', author: 'Stephen King', title: 'It', location: 'A1', cost: 22.0 },
  { id: '2', author: 'Umberto Eco', title: 'Il Nome della Rosa', location: 'B2', cost: 18.5 },
  { id: '3', author: 'Gabriel García Márquez', title: 'Cent\'anni di solitudine', location: 'A2', cost: 15.0 },
  { id: '4', author: 'James Joyce', title: 'Ulisse', location: 'C1', cost: 25.0 },
];