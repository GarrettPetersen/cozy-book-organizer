import type { Book, Genre } from './types';
export const shelfCapacity = 8;
export const genreColors: Record<Genre, string> = { 'Science fiction':'#8ca6a0', Romance:'#c9827a', Mystery:'#7d8da0', Nature:'#9b9c6b', Poetry:'#c5a665' };
const bookRows: Array<[string,string,string,Genre,number]> = [
 ['war','The War of the Worlds','H. G. Wells','Science fiction',0], ['orchard','The Orchard House','M. Ellis','Romance',1], ['quiet','A Quiet Alibi','R. Vale','Mystery',2], ['moss','Moss & Moonlight','E. Finch','Nature',3], ['stars','A Map of Stars','J. Rowan','Science fiction',4], ['blue','Blue Hour Letters','C. North','Romance',5], ['river','The River Knows','A. Bell','Mystery',6], ['field','Field Notes','S. Grey','Nature',7]
];
export const startingBooks: Book[] = bookRows.map(([id,title,author,genre,slot])=>({id,title,author,genre,cover:genreColors[genre],price:12,slot}));
export const customerRequests = [
 { targetBookId:'war', thought:'I think it had a rocket on the cover…' },
 { targetBookId:'orchard', thought:'Something gentle, maybe a love story.' },
 { targetBookId:'quiet', thought:'A mystery with a very blue cover?' },
 { targetBookId:'moss', thought:'I read about it in a garden journal.' },
 { targetBookId:'stars', thought:'It was a space story. I remember the stars.' },
 { targetBookId:'blue', thought:'A letter, maybe? It felt romantic.' },
];
