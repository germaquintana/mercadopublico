/* Modelo puro del Observatorio. No conecta API ni ejecuta escrituras. */
(function(g){
"use strict";
const labels={
curso_ia:"Capacitación en IA",
docencia_digital:"Pedagogía digital",
analitica_bi:"Analítica y Power BI",
programa_multicurso:"Programas de formación",
estudio:"Estudios e investigación",desarrollo:"Desarrollo tecnológico",capacitacion:"Capacitación y docencia",
suministro:"Licencias y equipamiento",servicio_especializado:"Servicio especializado",
arbolado:"Manejo de arbolado",mantencion:"Mantención de áreas verdes"
};
const amountNames={
presupuesto_estimado:"Presupuesto estimado",
presupuesto_disponible:"Presupuesto disponible",
adjudicacion_neta:"Monto adjudicado neto",
oc_total:"Total de orden de compra",
monto_reportado_sin_verificar:"Monto de archivo (naturaleza económica no verificada)"
};
const moneyTax={sin_verificar:"IVA sin verificar",incluido:"IVA incluido",no_incluido:"Neto",desconocido:"IVA por verificar"};
function normalize(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function deadline(r,now=Date.now()){
if(r.closing_at){
 const t=Date.parse(r.closing_at);
 if(Number.isFinite(t))return t>Number(now)?"future":"past";
}
if(r.closing_date_known){
 const d=Date.parse(r.closing_date_known+"T23:59:59-03:00");
 if(Number.isFinite(d))return d>Number(now)?"future":"past";
}
return "unknown";
}
function fmtDate(d){
if(!d)return "Sin fecha de cierre confirmada";
const includeHour=d.includes("T");
const n=Date.parse(includeHour?d:d+"T12:00:00-03:00");
if(!Number.isFinite(n))return "Fecha no disponible";
return new Intl.DateTimeFormat("es-CL",{timeZone:"America/Santiago",day:"2-digit",month:"short",year:"numeric",...(includeHour?{hour:"2-digit",minute:"2-digit",hour12:false}:{})}).format(new Date(n));
}
function fmtMoney(n,currency="CLP"){
if(n===null||n===undefined||!Number.isFinite(Number(n)))return "No informado";
return new Intl.NumberFormat("es-CL",{style:"currency",currency:currency||"CLP",maximumFractionDigits:0}).format(Number(n));
}
function moneyKey(a){return [a.kind,a.currency,a.tax||"desconocido"].join("|");}
function monthId(r){return r.closing_at?r.closing_at.slice(0,7):(r.closing_date_known?r.closing_date_known.slice(0,7):"unknown");}
function countBy(items,key){
 const map=new Map();
 items.forEach(r=>{const k=key(r);map.set(k,(map.get(k)||0)+1);});
 return [...map].map(([key,count])=>({key,count})).sort((a,b)=>b.count-a.count||a.key.localeCompare(b.key,"es"));
}
function matches(r,f,now=Date.now()){
 if(f.market&&f.market!=="todos"&&r.market!==f.market)return false;
 if(f.query){
 const text=[r.id,r.title,r.buyer,r.region,r.description,r.modality,r.category, ...(r.topics||[])].join(" ");
 if(!normalize(text).includes(normalize(f.query.trim())))return false;
 }
 if(f.category&&r.category!==f.category)return false;
 if(f.buyer&&r.buyer!==f.buyer)return false;
 if(f.deadline&&deadline(r,now)!==f.deadline)return false;
 if(f.month&&monthId(r)!==f.month)return false;
 return true;
}
function filter(records,f,now=Date.now()){
return records.filter(r=>matches(r,f,now)).sort((a,b)=>{
const aD=deadline(a,now),bD=deadline(b,now);
const rank={future:0,past:1,unknown:2};if(rank[aD]!==rank[bD])return rank[aD]-rank[bD];
const aT=Date.parse(a.closing_at||a.closing_date_known||"");
const bT=Date.parse(b.closing_at||b.closing_date_known||"");
if(aD==="future")return (Number.isFinite(aT)?aT:Infinity)-(Number.isFinite(bT)?bT:Infinity);
if(aD==="past")return (Number.isFinite(bT)?bT:0)-(Number.isFinite(aT)?aT:0);
return a.id.localeCompare(b.id,"es");
});
}
function stats(records,now=Date.now()){
const s={
records:records.length,
buyers:new Set(records.map(r=>r.buyer)).size,
future:0,past:0,unknown:0,
withAmount:0,withoutAmount:0,
relatedOrders:0,categories:[],buyersRanked:[],months:[],amountGroups:[]
};
for(const r of records){
s[deadline(r,now)]++;
s.relatedOrders+=(r.related_orders||[]).length;
if(r.amount&&Number.isFinite(Number(r.amount.value)))s.withAmount++;else s.withoutAmount++;
}
s.categories=countBy(records,r=>r.category);
s.buyersRanked=countBy(records,r=>r.buyer);
s.months=countBy(records,monthId).sort((a,b)=>a.key==="unknown"?1:b.key==="unknown"?-1:a.key.localeCompare(b.key));
const groups=new Map();
for(const r of records){
 const a=r.amount;
 if(!a||!Number.isFinite(Number(a.value)))continue;
 const k=moneyKey(a);
 if(!groups.has(k))groups.set(k,{key:k,kind:a.kind,currency:a.currency,tax:a.tax||"desconocido",value:0,count:0});
 const g=groups.get(k);g.value+=Number(a.value);g.count++;
}
s.amountGroups=[...groups.values()].sort((a,b)=>b.count-a.count||a.key.localeCompare(b.key));
return s;
}
function kindName(kind){return labels[kind]||kind||"Sin clasificar";}
function amountName(a){return a?((amountNames[a.kind]||a.kind||"Monto")+" · "+(moneyTax[a.tax]||a.tax||"IVA por verificar")):"Monto no informado";}
function monthName(id){
if(id==="unknown")return "Sin fecha confirmada";
const [y,m]=id.split("-");
const idx=Number(m)-1;
const months=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
return months[idx]?months[idx]+" "+y:id;
}
function isoChileToday(now=Date.now()){
return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Santiago",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(now));
}
function csv(records,now=Date.now()){
const headers=["codigo","tema","nombre","organismo","region","tipo","subtipo","publicacion","cierre_publicado","situacion_plazo_calculado","estado_fuente_no_revalidado","monto_valor","moneda","naturaleza_monto","iva","ordenes_relacionadas_no_exhaustivas","url_origen","url_contraste","calidad_fuente","nota"];
const safe=v=>{
let str=String(v??"");
if(/^\s*[=+\-@\t\r]/.test(str))str="'"+str;
return '"'+str.replace(/"/g,'""')+'"';
};
const rows=records.map(r=>[
r.id,r.market,r.title,r.buyer,r.region,r.modality,kindName(r.category),
r.published_at||"",r.closing_at||r.closing_date_known||"",deadline(r,now),
r.reported_status||"",r.amount?.value??"",r.amount?.currency||"",r.amount?.kind||"",r.amount?.tax||"",
(r.related_orders||[]).map(x=>x.id).join("|"),r.sources.find(s=>s.kind==="oficial")?.url||"",
r.sources.find(s=>s.kind!=="oficial")?.url||"",r.source_quality||"",r.source_note||""
]);
return "\uFEFF"+[headers,...rows].map(r=>r.map(safe).join(";")).join("\r\n");
}
g.OBS_LOGIC={normalize,deadline,fmtDate,fmtMoney,moneyKey,monthId,monthName,countBy,filter,matches,stats,kindName,amountName,isoChileToday,csv};
})(window);
