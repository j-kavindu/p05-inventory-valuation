import Decimal from 'decimal.js';
Decimal.set({precision:40,rounding:Decimal.ROUND_HALF_UP});
export type Method='fifo'|'average';
export type System='perpetual'|'periodic';
export type Kind='opening'|'purchase'|'sale'|'purchase_return'|'sale_return';
export interface Product {id:string; name:string; category:string; unit:string; reorder:number}
export interface Movement {id:string; productId:string; date:string; kind:Kind; quantity:string; unitCost?:string; reference?:string; note:string}
export interface Dataset {version:1; products:Product[]; movements:Movement[]}
export interface CardRow {movement:Movement; incoming:string; outgoing:string; quantity:string; value:string|null; cost:string|null}
export interface Valuation {quantity:string; value:string; cogs:string; availableCost:string; rows:CardRow[]; layers:{source:string;quantity:string;unitCost:string}[]}
const D=(v:Decimal.Value)=>new Decimal(v);
const validDate=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
function positive(v:string,label:string,zero=false){if(typeof v!=='string'||!/^\d+(\.\d{1,6})?$/.test(v)||!D(v).isFinite()||D(v).gt('1000000000000')||(zero?D(v).lt(0):D(v).lte(0)))throw Error(`${label} must be ${zero?'non-negative':'positive'}, with up to 6 decimal places (maximum 1 trillion).`);}
export function validateDataset(data:Dataset){
 if(data?.version!==1||!Array.isArray(data.products)||!Array.isArray(data.movements))throw Error('Invalid backup schema.');
 if(new TextEncoder().encode(JSON.stringify(data)).length>700000)throw Error('Workspace exceeds the 700 KB MVP limit.');
 if(data.products.length>200||data.movements.length>2000)throw Error('MVP limit: 200 products and 2,000 movements.');
 const ids=new Set<string>();for(const p of data.products){if(!p.id||ids.has(p.id)||!p.name?.trim()||!p.unit?.trim()||typeof p.category!=='string'||!Number.isFinite(p.reorder)||p.reorder<0)throw Error('Invalid or duplicate product.');ids.add(p.id);}
 const txids=new Set<string>();for(const m of data.movements){if(!m.id||txids.has(m.id)||!ids.has(m.productId)||!validDate(m.date)||typeof m.note!=='string')throw Error('Invalid movement ID, product, date, or note.');txids.add(m.id);positive(m.quantity,'Quantity');if(!['opening','purchase','sale','purchase_return','sale_return'].includes(m.kind))throw Error('Unknown movement type.');if(m.kind==='purchase'||m.kind==='opening')positive(m.unitCost!,'Unit cost',true);}
 // Every supported method must remain valid when the user changes the view.
 for(const p of data.products)for(const method of ['fifo','average'] as const)for(const system of ['perpetual','periodic'] as const)valueInventory(data.movements.filter(m=>m.productId===p.id),method,system);
 return data;
}
/** Stable same-day order is ledger insertion order. Dates may be backdated; replay validates all following rows. */
export function valueInventory(input:Movement[],method:Method='fifo',system:System='perpetual',asOf='9999-12-31'):Valuation{
 let qty=D(0),value=D(0),cogs=D(0),available=D(0);
 let layers:{source:string;q:Decimal;c:Decimal}[]=[];
 const netReceipts:{source:string;q:Decimal;c:Decimal}[]=[];
 const seen=new Map<string,Movement>(),returned=new Map<string,Decimal>(),saleCosts=new Map<string,Decimal>();
 const rows:CardRow[]=[];let hasActivity=false;
 const sorted=input.map((m,i)=>({m,i})).sort((a,b)=>a.m.date.localeCompare(b.m.date)||a.i-b.i).map(x=>x.m).filter(m=>m.date<=asOf);
 const product=sorted[0]?.productId;
 for(const m of sorted){
 if(!m.id||seen.has(m.id)||!validDate(m.date)||m.productId!==product)throw Error('Invalid ID, date, duplicate, or mixed-product ledger.');
 positive(m.quantity,'Quantity');const n=D(m.quantity);let cost=D(0);const incoming=['opening','purchase','sale_return'].includes(m.kind);
 if(m.kind==='opening'||m.kind==='purchase'){
  if(m.kind==='opening'&&hasActivity)throw Error('Opening stock must be the first and only opening entry.');
  positive(m.unitCost!,'Unit cost',true);const c=D(m.unitCost!);cost=n.mul(c);qty=qty.add(n);value=value.add(cost);available=available.add(cost);layers.push({source:m.id,q:n,c});netReceipts.push({source:m.id,q:n,c});
 }else if(m.kind==='sale'){
  if(qty.lt(n))throw Error(`Negative stock: ${m.id} requests ${n} but only ${qty} is available.`);
  if(system==='perpetual'){
   if(method==='average')cost=value.div(qty).mul(n);
   else {let remaining=n;for(const l of layers){const take=Decimal.min(l.q,remaining);cost=cost.add(take.mul(l.c));l.q=l.q.sub(take);remaining=remaining.sub(take);if(remaining.isZero())break;}}
   value=value.sub(cost);cogs=cogs.add(cost);saleCosts.set(m.id,cost.div(n));
  }
  qty=qty.sub(n);
 }else if(m.kind==='purchase_return'||m.kind==='sale_return'){
  const original=seen.get(m.reference||'');const expected=m.kind==='purchase_return'?'purchase':'sale';
  if(!original||original.kind!==expected)throw Error(`Return ${m.id} must reference an earlier ${expected} for this product.`);
  const r=(returned.get(original.id)||D(0)).add(n);if(r.gt(original.quantity))throw Error('Returned quantity exceeds the original transaction.');returned.set(original.id,r);
  if(m.kind==='sale_return'){
   cost=system==='perpetual'?saleCosts.get(original.id)!.mul(n):D(0);qty=qty.add(n);value=value.add(cost);cogs=cogs.sub(cost);
   if(system==='perpetual'&&method==='fifo')layers.push({source:m.id,q:n,c:cost.div(n)});
  }else{
   if(qty.lt(n))throw Error('Purchase return would cause negative stock.');cost=n.mul(original.unitCost!);
   const receipt=netReceipts.find(x=>x.source===original.id)!;receipt.q=receipt.q.sub(n);
   if(system==='perpetual'&&method==='fifo'){const l=layers.find(x=>x.source===original.id)!;if(l.q.lt(n))throw Error('FIFO purchase return exceeds the unconsumed original receipt layer.');l.q=l.q.sub(n);}
   qty=qty.sub(n);value=value.sub(cost);available=available.sub(cost);
   if(system==='perpetual'&&(value.lt(0)||(qty.isZero()&&!value.isZero())))throw Error('Purchase return leaves an invalid inventory value; review original receipt cost.');
  }
 }else throw Error('Unknown movement type.');
 if(system==='perpetual'&&qty.isZero())value=D(0);
 rows.push({movement:m,incoming:incoming?n.toString():'0',outgoing:incoming?'0':n.toString(),quantity:qty.toString(),value:system==='perpetual'?value.toString():null,cost:system==='perpetual'?cost.toString():null});seen.set(m.id,m);hasActivity=true;
 }
 if(system==='periodic'){
  const total=netReceipts.reduce((a,l)=>a.add(l.q),D(0));value=D(0);layers=[];
  if(method==='average')value=total.isZero()?D(0):available.div(total).mul(qty);
  else {let remaining=qty;for(const l of [...netReceipts].reverse()){const take=Decimal.min(l.q,remaining);if(take.gt(0))layers.unshift({source:l.source,q:take,c:l.c});value=value.add(take.mul(l.c));remaining=remaining.sub(take);}if(remaining.gt(0))throw Error('Closing stock exceeds available receipts.');}
  cogs=available.sub(value);
 }
 return {quantity:qty.toString(),value:value.toString(),cogs:cogs.toString(),availableCost:available.toString(),rows,layers:method==='fifo'?layers.filter(l=>l.q.gt(0)).map(l=>({source:l.source,quantity:l.q.toString(),unitCost:l.c.toString()})):[]};
}
export function csv(rows:unknown[][]){return rows.map(row=>row.map(x=>{let s=String(x??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(',')).join('\r\n');}
