/* Dashboard general — interacción local con muestras públicas. Sin API ni credenciales. */
(function(){
"use strict";
const D=window.OBS_CATALOG,L=window.OBS_LOGIC;
const $=id=>document.getElementById(id);
const now=()=>Date.now();
const marketKeys=new Set((D?.markets||[]).map(m=>m.id));
const qp=new URLSearchParams(window.location.search);
const state={
market:marketKeys.has(qp.get("tema"))?qp.get("tema"):"ia",
query:qp.get("q")||"",
category:"",buyer:"",deadline:"",month:""
};
let selected=qp.get("id")||"";
const marks={todos:"Σ",ia:"IA",respel:"R",verde:"AV"};
function make(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function add(parent,...children){children.forEach(c=>parent.append(c));return parent;}
function button(cls,label,action){const e=make("button",cls,label);e.type="button";e.addEventListener("click",action);return e;}
function link(label,href,cls){const a=make("a",cls,label);a.href=href;a.target="_blank";a.rel="noopener noreferrer";return a;}
function textLine(parent,tag,text,cls){return parent.appendChild(make(tag,cls,text));}
function market(){return D.markets.find(m=>m.id===state.market)||D.markets[0];}
function baseRecords(){return D.records.filter(r=>state.market==="todos"||r.market===state.market);}
function filtered(){return L.filter(D.records,state,now());}
function safeURLSync(){
try{
const u=new URL(window.location.href);
u.searchParams.set("tema",state.market);
if(state.query.trim())u.searchParams.set("q",state.query.trim());else u.searchParams.delete("q");
if(selected)u.searchParams.set("id",selected);else u.searchParams.delete("id");
history.replaceState(null,"",u.pathname+u.search+u.hash);
}catch(_){/* Vista local file:// o navegador restrictivo: navegación continúa */ }
}
function resetFacets(clearQuery){
state.category="";state.buyer="";state.deadline="";state.month="";
if(clearQuery){state.query="";$("globalSearch").value="";}
}
function renderMarketCards(){
const root=$("marketCards");root.replaceChildren();
D.markets.forEach(m=>{
const recs=D.records.filter(r=>m.id==="todos"||r.market===m.id);
const b=button("market-card","",()=>{
 if(state.market===m.id)return;
 state.market=m.id;resetFacets(true);selected="";
 fillFacets();renderMarketCards();render();
 $("panorama").scrollIntoView({behavior:"smooth",block:"start"});
});
b.setAttribute("aria-pressed",String(state.market===m.id));
b.setAttribute("aria-label",m.name+", "+recs.length+" procesos de muestra");
const mark=make("span","market-icon",marks[m.id]||m.name.slice(0,2).toUpperCase());mark.style.background=m.color||"#376b7e";
add(b,mark,make("strong",null,m.name),make("span","market-desc",m.short||m.description),make("span","market-foot",recs.length+" licitaciones de ejemplo"));
root.append(b);
});
}
function opt(value,label){const e=document.createElement("option");e.value=value;e.textContent=label;return e;}
function fillFacets(){
const src=baseRecords();
const category=$("categoryFilter"),buyer=$("buyerFilter");
category.replaceChildren(opt("","Todos los tipos"));
[...new Set(src.map(r=>r.category))].sort((a,b)=>L.kindName(a).localeCompare(L.kindName(b),"es")).forEach(k=>category.append(opt(k,L.kindName(k))));
buyer.replaceChildren(opt("","Todos los organismos"));
[...new Set(src.map(r=>r.buyer))].sort((a,b)=>a.localeCompare(b,"es")).forEach(n=>buyer.append(opt(n,n)));
category.value=state.category;buyer.value=state.buyer;
$("deadlineFilter").value=state.deadline;
}
function renderMetrics(s){
const rows=[
{label:"Procesos documentados",value:s.records,note:"Solo registros de esta muestra",style:""},
{label:"Con cierre futuro*",value:s.future,note:s.past+" vencidos · "+s.unknown+" sin fecha",style:"positive"},
{label:"Organismos compradores",value:s.buyers,note:"Instituciones distintas en selección",style:""},
{label:"Montos informados",value:s.withAmount+" / "+s.records,note:"Cobertura; no refleja pagos ni mercado total",style:"warn"}
];
const root=$("metrics");root.replaceChildren();
rows.forEach(r=>{const cell=make("div","metric");add(cell,make("span","metric-label",r.label),make("strong",r.style,r.value),make("span","metric-note",r.note));root.append(cell);});
}
function bars(rootId,items,keyLabel,selectedKey,onSelect){
const root=$(rootId);root.replaceChildren();
if(!items.length){root.append(make("p","money-empty","Sin datos para estos filtros."));return;}
const max=Math.max(1,...items.map(x=>x.count));
items.forEach(({key,count})=>{
 const b=button(rootId==="buyerChart"?"buyer-button":"bar-button","",()=>onSelect(key));
 b.setAttribute("aria-pressed",String(selectedKey===key));
 b.setAttribute("aria-label",keyLabel(key)+": "+count+" procesos; filtrar");
 const top=make("span","bar-top");
 add(top,make("span","bar-name",keyLabel(key)),make("span","bar-count",count+" · "+Math.round(100*count/Math.max(1,items.reduce((sum,x)=>sum+x.count,0)))+"%"));
 const track=make("span","bar-track"),fill=make("span","bar-fill");fill.style.width=Math.max(5,Math.round(count*100/max))+"%";track.append(fill);
 add(b,top,track);root.append(b);
});
}
function renderCategoryChart(s){
$("categoryMetric").textContent=s.categories.length+" tipos";
bars("categoryChart",s.categories,L.kindName,state.category,key=>{
state.category=state.category===key?"":key;$("categoryFilter").value=state.category;render();
});
}
function renderMonthChart(s){
$("timelineMetric").textContent=s.months.length+" tramos";
const root=$("monthChart");root.replaceChildren();
if(!s.months.length){root.append(make("p","money-empty","Sin cierres registrados para esta selección."));return;}
const max=Math.max(1,...s.months.map(x=>x.count));
s.months.forEach(({key,count})=>{
const b=button("month-button","",()=>{
 state.month=state.month===key?"":key;render();
});
b.setAttribute("aria-pressed",String(state.month===key));
b.setAttribute("aria-label",L.monthName(key)+": "+count+" procesos; filtrar mes");
const bar=make("span","month-height"),fill=make("span","month-fill");
fill.style.height=Math.max(7,Math.round(100*count/max))+"%";
bar.append(fill);
add(b,make("span","month-count",String(count)),bar,make("span","month-label",L.monthName(key)));
root.append(b);
});
}
function renderBuyerChart(s){
$("buyerMetric").textContent=s.buyers+" organismos";
const root=$("buyerChart");root.replaceChildren();
const items=s.buyersRanked.slice(0,6);
if(!items.length){root.append(make("p","money-empty","Sin compradores para los filtros."));return;}
bars("buyerChart",items,k=>k,state.buyer,key=>{
state.buyer=state.buyer===key?"":key;$("buyerFilter").value=state.buyer;render();
});
if(s.buyersRanked.length>6)textLine(root,"p","Mostrando 6 organismos; filtra el resto con el selector.","money-foot");
}
function renderMoney(s){
$("moneyMetric").textContent=s.withAmount+" / "+s.records+" fichas";
const root=$("moneySummary");root.replaceChildren();
if(!s.amountGroups.length)root.append(make("p","money-empty","No hay montos documentados comparables en los registros filtrados."));
else s.amountGroups.forEach(g=>{
const d=make("div","money-item");
add(d,make("strong","money-val",L.fmtMoney(g.value,g.currency)),make("span","money-type",L.amountName(g)),make("span","money-note",g.count+" "+(g.count===1?"proceso":"procesos")+" · mismo tipo de monto, moneda y tratamiento de IVA"));
root.append(d);
});
root.append(make("p","money-foot","Cobertura: "+s.withAmount+" con monto, "+s.withoutAmount+" sin monto. Una OC o una adjudicación no se suma a presupuestos. Los montos no acreditan recepción ni pagos."));
if(s.relatedOrders)root.append(make("p","money-foot",s.relatedOrders+" órdenes de compra relacionadas visibles en expedientes; no se suman al presupuesto."));
}
function renderActiveFilters(){
const root=$("activeFilters");root.replaceChildren();
const chips=[
["query",state.query?"Texto: "+state.query:""],
["category",state.category?L.kindName(state.category):""],
["buyer",state.buyer?"Organismo: "+state.buyer:""],
["deadline",state.deadline?{future:"Plazo futuro",past:"Plazo vencido",unknown:"Cierre sin fecha"}[state.deadline]:""],
["month",state.month?"Cierre: "+L.monthName(state.month):""]
];
chips.forEach(([key,label])=>{
if(!label)return;
const b=button("active-chip",label+" ×",()=>{
state[key]="";
if(key==="query")$("globalSearch").value="";
if(key==="category")$("categoryFilter").value="";
if(key==="buyer")$("buyerFilter").value="";
if(key==="deadline")$("deadlineFilter").value="";
render();
});
b.setAttribute("aria-label","Quitar filtro "+label);root.append(b);
});
}
function deadlineLabel(r){
const d=L.deadline(r,now());
return d==="future"?"Cierre futuro*":d==="past"?"Plazo vencido":"Sin fecha confirmada";
}
function showResults(recs){
const root=$("resultsList");root.replaceChildren();
$("resultsCount").textContent=recs.length+" de "+baseRecords().length+" licitaciones visibles en el ejemplo.";
if(!recs.length){root.append(make("div","empty-results","No hay registros con estos filtros. Prueba otro término o elige un ejemplo distinto."));selected="";showDetail(null);return;}
if(!recs.some(r=>r.id===selected))selected=recs[0].id;
recs.forEach(r=>{
const b=button("result-item","",()=>{selected=r.id;showResults(recs);safeURLSync();if(window.matchMedia("(max-width: 860px)").matches)$("detailPanel").scrollIntoView({behavior:"smooth",block:"start"});});
b.setAttribute("aria-pressed",String(selected===r.id));
b.setAttribute("aria-label",r.id+", "+r.title+", mostrar detalle");
const head=make("span","result-top");
const d=L.deadline(r,now());add(head,make("span","code-tag",r.id),make("span","status-tag "+d,deadlineLabel(r)));
const foot=make("span","result-foot");
add(foot,make("span",null,L.kindName(r.category)),make("span",null,r.amount?L.fmtMoney(r.amount.value,r.amount.currency):"Monto no informado"));
add(b,head,make("span","result-title",r.title),make("span","result-buyer",r.buyer),foot);
root.append(b);
});
showDetail(recs.find(r=>r.id===selected));
}
function fact(label,value,note){
const box=make("div","fact");add(box,make("label",null,label),make("strong",null,value));
if(note)box.append(make("small",null,note));
return box;
}
function sourceLink(row){
const a=link(row.kind==="oficial"?"Abrir ficha oficial ↗":"Consultar fuente de contraste ↗",row.url,row.kind==="oficial"?"main-link":"");
a.title=row.name;
return a;
}
function showDetail(r){
const root=$("detailPanel");root.replaceChildren();
if(!r){
const d=make("div","empty-detail");add(d,make("strong",null,"Sin procesos coincidentes"),make("p",null,"Prueba otros filtros o cambia de ejemplo."));root.append(d);return;
}
const hd=make("div","detail-head");
add(hd,make("span","detail-code",r.id),make("span","microtag",r.modality||"Modalidad no indicada"));
root.append(hd);
root.append(make("h3","detail-title",r.title));
root.append(make("p","detail-buyer",r.buyer+" · "+r.region));
const tags=make("div","tag-group");
(r.topics||[]).forEach(t=>tags.append(make("span","topic-chip",t)));tags.append(make("span","topic-chip",L.kindName(r.category)));
root.append(tags);
const fields=make("div","detail-columns");
add(fields,
fact("Fecha de publicación",r.published_at?L.fmtDate(r.published_at):"No informada"),
fact("Cierre publicado",r.closing_at?L.fmtDate(r.closing_at):r.closing_date_known?"Fecha: "+r.closing_date_known:"No confirmado",deadlineLabel(r)),
fact("Monto declarado",r.amount?L.fmtMoney(r.amount.value,r.amount.currency):"No informado",L.amountName(r.amount)),
fact("Órdenes de compra vinculadas",String((r.related_orders||[]).length),(r.related_orders||[]).length?"Lista no exhaustiva":"Ninguna acreditada en muestra")
);
root.append(fields);
const about=make("section","detail-section");add(about,make("h4",null,"Objeto de la compra"),make("p",null,r.description));
root.append(about);
const fit=make("section","detail-section");add(fit,make("h4",null,"Lectura inicial"),make("p",null,r.fit||"Sin evaluación de afinidad"));
root.append(fit);
const status=make("section","detail-section");
add(status,make("h4",null,"Estado y procedencia"),make("p",null,r.reported_status||"Estado sin corroborar"),make("p",null,r.document_status||"Originales no revisados"));
root.append(status);
if(r.related_orders?.length){
const sec=make("section","detail-section");sec.append(make("h4",null,"Órdenes de compra relacionadas · no exhaustivo"));
r.related_orders.forEach(o=>{
 const card=make("div","order-card"),top=make("div","order-head");
 add(top,make("strong",null,o.id),make("span",null,L.fmtMoney(o.amount.value,o.amount.currency)));
 add(card,top,make("p",null,"Emisión: "+o.date+" · "+o.supplier),make("p",null,o.quantity),make("p",null,o.note),link("Consultar OC oficial ↗",o.source_url));
 sec.append(card);
});
root.append(sec);
}
const source=make("section","detail-section");source.append(make("h4",null,"Fuentes y documentos"));
const links=make("div","detail-links");
(r.sources||[]).forEach(src=>links.append(sourceLink(src)));
if(r.detail_url)links.append(link("Abrir expediente extendido ↗",r.detail_url));
source.append(links);root.append(source);
root.append(make("div","detail-note","Calidad de la evidencia: "+(r.source_note||"Referencia de muestra")+" Las fuentes y los plazos deben comprobarse en Mercado Público. No se han descargado ni revisado todos los documentos originales."));
}
function render(){
const m=market();const recs=filtered(),s=L.stats(recs,now());
$("marketTitle").textContent=m.id==="todos"?"todos los ejemplos":m.name;
$("marketIntro").textContent=m.description+" Indicadores de la selección filtrada, no del universo nacional.";
$("scopeLabel").textContent="Cobertura: "+baseRecords().length+" fichas de ejemplo · "+recs.length+" seleccionadas";
$("cutoffLabel").textContent="Corte de fuentes · 16 nov 2026";
renderMetrics(s);renderCategoryChart(s);renderMonthChart(s);renderBuyerChart(s);renderMoney(s);renderActiveFilters();showResults(recs);safeURLSync();
}
function exportSelected(){
const recs=filtered();
if(!recs.length)return;
const csv=L.csv(recs,now());
const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
const url=URL.createObjectURL(blob);
const a=document.createElement("a");a.href=url;a.download="observatorio_"+state.market+"_seleccion.csv";
document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function boot(){
if(!D||!L||!Array.isArray(D.records)||!Array.isArray(D.markets)){throw Error("Falta catálogo de demostración o módulo lógico");}
$("globalSearch").value=state.query;
$("searchForm").addEventListener("submit",e=>{e.preventDefault();state.query=$("globalSearch").value;render();$("explorar").scrollIntoView({behavior:"smooth",block:"start"});});
$("globalSearch").addEventListener("input",()=>{state.query=$("globalSearch").value;render();});
$("categoryFilter").addEventListener("change",()=>{state.category=$("categoryFilter").value;render();});
$("deadlineFilter").addEventListener("change",()=>{state.deadline=$("deadlineFilter").value;render();});
$("buyerFilter").addEventListener("change",()=>{state.buyer=$("buyerFilter").value;render();});
$("clearFilters").addEventListener("click",()=>{resetFacets(true);fillFacets();render();});
$("exportCsv").addEventListener("click",exportSelected);
renderMarketCards();fillFacets();render();
}
try{boot();}catch(e){
console.error("Observatorio no pudo iniciarse",e);
const node=$("resultsCount");if(node)node.textContent="No fue posible cargar el catálogo de demostración. Revisa los archivos assets/ en GitHub.";
}
})();
