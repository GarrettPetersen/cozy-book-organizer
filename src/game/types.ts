export type Genre = 'Science fiction' | 'Romance' | 'Mystery' | 'Nature' | 'Poetry';
export type Book = { id: string; title: string; author: string; genre: Genre; cover: string; price: number; slot: number | null };
export type Customer = { id: string; x: number; targetBookId: string; state: 'browsing' | 'found' | 'leaving'; thought: string; seenGenres: Genre[]; tries: number; color: string };
export type GameState = { books: Book[]; customers: Customer[]; money: number; day: number; capacity: number; message: string; selectedBookId: string | null; inspectedBookId: string | null; isOpen: boolean };
