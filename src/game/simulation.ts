import type { Book, Customer, GameState } from './types';
import { customerRequests } from './catalog';
const thoughts = ['Maybe another shelf…','This section feels close.','No, not quite that one.','I’ll try looking nearby.'];
const customerColors = ['#7b8582','#9d786c','#6e8295','#958b64'];
export function makeInitialState(): GameState { return { books:[...startingBooks], customers:[], money:24, day:1, capacity:8, message:'Arrange the books, then open the shop.', selectedBookId:null, inspectedBookId:null, isOpen:false }; }
import { startingBooks } from './catalog';
export function moveBook(state: GameState, bookId: string, slot: number | null): GameState {
 const book=state.books.find(item=>item.id===bookId); if(!book) return state;
 const target=slot===null?null:Math.max(0,Math.min(state.capacity-1,slot));
 const occupant=target===null?undefined:state.books.find(item=>item.slot===target&&item.id!==bookId);
 if(occupant) { const prior=book.slot; return {...state,books:state.books.map(item=>item.id===bookId?{...item,slot:target}:item.id===occupant.id?{...item,slot:prior}:item)}; }
 return {...state,books:state.books.map(item=>item.id===bookId?{...item,slot:target}:item),selectedBookId:null,inspectedBookId:null,message:target===null?'Book moved to the floor pile.':'Book placed on the shelf.'};
}
export function openShop(state:GameState):GameState {
 if(state.isOpen) return {...state,isOpen:false,message:'You close up for the evening.'};
 const available=state.books.filter(book=>book.slot!==null); if(!available.length) return {...state,message:'Put at least one book on the shelf before opening.'};
 const requests=customerRequests.filter(request=>available.some(book=>book.id===request.targetBookId));
 const customer:Customer[] = requests.slice(0,3).map((request,index)=>({id:`d${state.day}-${index}`,x:28+index*18,targetBookId:request.targetBookId,state:'browsing',thought:request.thought,seenGenres:[],tries:0,color:customerColors[index%customerColors.length]}));
 return {...state,isOpen:true,customers:customer,message:'A few readers have come in. Watch what they notice.'};
}
export function searchStep(state:GameState, customerId:string, slot:number):GameState {
 const customer=state.customers.find(c=>c.id===customerId); if(!customer||customer.state!=='browsing')return state;
 const book=state.books.find(b=>b.slot===slot); if(!book)return {...state,message:'That spot is empty.'};
 const target=state.books.find(b=>b.id===customer.targetBookId); if(!target)return state;
 const found=book.id===target.id;
 const seen=[...customer.seenGenres,book.genre];
 const updated={...customer,x:slot*10+12,seenGenres:seen,tries:customer.tries+1,state:found?'found' as const:'browsing' as const,thought:found?'That’s the one!':thoughts[Math.min(customer.tries,thoughts.length-1)]};
 const customers=state.customers.map(c=>c.id===customerId?updated:c);
 if(found) return {...state,customers,books:state.books.map(b=>b.id===book.id?{...b,slot:null}:b),money:state.money+book.price,message:`A reader found “${book.title}” and paid $${book.price}.`};
 return {...state,customers,message:book.genre===target.genre?'They found the right genre. Maybe keep looking nearby.':'That wasn’t it. They’re trying to infer your arrangement.'};
}
export function inspectCustomer(customer:Customer, book?:Book):string { if(book&&book.id===customer.targetBookId)return `“${book.title}” — yes, that’s the one.`; if(book)return 'Not this one. Maybe something with a different cover.'; const genre=customer.seenGenres.at(-1); return genre?`I’m looking for something like ${genre.toLowerCase()}.`:'I’m looking for a book. I remember the cover.'; }
export function nextDay(state:GameState):GameState { return {...state,day:state.day+1,isOpen:false,customers:[],message:'A new morning. Take your time arranging the shelves.'}; }
