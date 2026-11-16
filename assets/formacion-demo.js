/* Maqueta interactiva del mercado formativo, corte editorial 16-11-2026.
 * No consulta API ni almacena datos. Los enlaces abren fichas públicas externas.
 */
(function(){
"use strict";
const data=window.OBS_FORMACION_DEMO, L=window.OBS_LOGIC, $=id=>document.getElementById(id);
if(!data||!L||!Array.isArray(data.records))return;
const records=data.records;
const state={query:"",category:"",deadline:""};
let chosen=new URLSearchParams(window.location.search).get("id")||"";
const names=data.categories||{};
const now=()=>Date.now();
function el(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;}
function append(root,...nodes){nodes.forEach(n=>root.append(n));return root;}
function btn(cls,click){const n=el("button",cls);n.type="button";n.addEventListener("click",click);return n;}
function cap(s){return String(s).replace(/_/g," ");}
function label(cat){return names[cat]||L.kindName(cat)||cap(cat);}
function deadline(r){return L.deadline(r,now());}
function date(r){return r.closing_at?L.fmtDate(r.closing_at):r.closing_date_known?L.fmtDate(r.closing_date_known):"No informada";}
function money(r){return r.amount?L.fmtMoney(r.amount.value,r.amount.currency):"No informado";}
function marketRecords(){
 return L.filter(records,{market:"formacion",query:state.query,category:state.category,deadline:state.deadline},now());
}
function statusText(r){return deadline(r)==="future"?"Cierre futuro*":deadline(r)==="past"?"Plazo vencido":"Sin fecha de cierre";}
function kpi(labelText,value,note,special=false){
 const x=el("div","pitch-kpi"+(special?" special":""));
 append(x,el("span","pitch-kpi-label",labelText),el("strong",null,String(value)),el("span","pitch-kpi-note",note));return x;
}
function renderKpis(items){
 const s=L.stats(items,now()),box=$("pitchKpis");box.replaceChildren(
 kpi("Procesos seleccionados",s.records,"De "+records.length+" registros de la maqueta"),
 kpi("Cierre posterior al corte*",s.future,s.past+" ya vencidos · "+s.unknown+" sin fecha",true),
 kpi("Organismos distintos",s.buyers,"Compradores identificados en fichas"),
 kpi("Montos documentados",s.withAmount+" / "+s.records,"Sin imputar presupuesto a cursos individuales")
 );
 $("heroCount").textContent=records.length;
 $("heroFuture").textContent=L.stats(records,now()).future;
 $("catNumber").textContent=s.categories.length+" tipos";
 $("buyerNumber").textContent=s.buyers+" compradores";
 $("moneyNumber").textContent=s.withAmount+" con monto";
 return s;
}
function drawCategories(stats){
 const root=$("pitchCategoryBars");root.replaceChildren();
 if(!stats.categories.length){root.append(el("p","pitch-chart-foot","Sin categorías para esta selección."));return;}
 const max=Math.max(...stats.categories.map(x=>x.count),1);
 for(const item of stats.categories){
  const b=btn("pitch-bars-button",()=>{
   state.category=state.category===item.key?"":item.key;
   $("pitchCategory").value=state.category;render();
  });
  b.setAttribute("aria-pressed",String(state.category===item.key));
  const header=el("span","pitch-bar-label");append(header,el("span",null,label(item.key)),el("b",null,String(item.count)));
  const track=el("span","pitch-bar-track"),fill=el("span","pitch-bar-fill");
  fill.style.width=Math.max(5,Math.round(item.count*100/max))+"%";
  track.append(fill);append(b,header,track);root.append(b);
 }
}
function drawDeadline(stats){
 const root=$("pitchDeadline");root.replaceChildren();
 for(const [key,title,n] of [["future","Cierre futuro*",stats.future],["past","Plazo vencido",stats.past]]){
  const b=btn("pitch-deadline-item "+key,()=>{
   state.deadline=state.deadline===key?"":key;
   $("pitchDeadlineFilter").value=state.deadline;
   render();
  });
  b.setAttribute("aria-pressed",String(state.deadline===key));
  append(b,el("span",null,title),el("strong",null,String(n)));
  root.append(b);
 }
}
function drawBuyers(stats){
 const root=$("pitchBuyers");root.replaceChildren();
 const max=Math.max(...stats.buyersRanked.map(x=>x.count),1);
 for(const item of stats.buyersRanked.slice(0,5)){
  const row=el("div","pitch-buyer-row");const head=el("div","pitch-bar-label");
  append(head,el("span",null,item.key),el("b",null,String(item.count)));
  const track=el("div","pitch-bar-track"),fill=el("span","pitch-bar-fill");
  fill.style.width=Math.max(5,Math.round(100*item.count/max))+"%";track.append(fill);append(row,head,track);root.append(row);
 }
 if(stats.buyersRanked.length>5)root.append(el("p","pitch-chart-foot","Mostrando 5 compradores; la selección total contiene "+stats.buyers+" distintos."));
 if(!stats.buyersRanked.length)root.append(el("p","pitch-chart-foot","Sin organismos para esta selección."));
}
function drawMoney(stats){
 const root=$("pitchMoney");root.replaceChildren();
 if(!stats.amountGroups.length){root.append(el("p","pitch-chart-foot","Sin montos informados comparables en la selección."));return;}
 for(const a of stats.amountGroups){
  const d=el("div","pitch-money-item");
  append(d,el("strong",null,L.fmtMoney(a.value,a.currency)),el("span",null,L.amountName(a)),el("small",null,a.count+" "+(a.count===1?"proceso":"procesos")+"; origen y base tributaria no auditados"));
  root.append(d);
 }
 if(stats.withoutAmount)root.append(el("p","pitch-chart-foot",stats.withoutAmount+" registros sin monto: no se estimaron como cero."));
}
function link(text,url,main){
 const a=el("a",main?"official":"",text);
 a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;
}
function fact(name,value,note){
 const x=el("div","pitch-fact");
 append(x,el("span",null,name),el("strong",null,value));
 if(note)x.append(el("small",null,note));
 return x;
}
function showDetail(r){
 const root=$("pitchDetail");root.replaceChildren();
 if(!r){
  append(root,el("h3",null,"No hay coincidencias"),el("p","buyer","Prueba otra palabra o limpia los filtros."));
  return;
 }
 const top=el("div","pitch-detail-header");
 append(top,el("span","pitch-result-id",r.id),el("span","pitch-result-type",r.type==="compra_agil"?"Compra Ágil":"Licitación"));
 append(root,top,el("h3",null,r.title),el("p","buyer",r.buyer+" · "+r.region));
 const tags=el("div","pitch-detail-tags");for(const t of r.topics||[])tags.append(el("span",null,t));root.append(tags);
 const facts=el("div","pitch-facts");
 append(facts,
 fact("Cierre publicado",date(r),statusText(r)),
 fact("Monto de referencia",money(r),r.amount?L.amountName(r.amount):"No informado, no inferido"),
 fact("Naturaleza",label(r.category),"Clasificación temática editorial"),
 fact("Estado en fuente",r.reported_status||"No verificado","No sustituye estado actual del portal")
 );
 root.append(facts);
 const obj=el("section","pitch-detail-section");append(obj,el("h4",null,"Qué se solicita"),el("p",null,r.description));root.append(obj);
 const fit=el("section","pitch-detail-section");append(fit,el("h4",null,"Lectura para el equipo"),el("p",null,r.fit));root.append(fit);
 const links=el("div","pitch-detail-links");
 for(const s of r.sources||[]){if(!/^https:\/\//.test(s.url))continue;links.append(link(s.kind==="oficial"?"Ficha oficial ↗":"Fuente de contraste ↗",s.url,s.kind==="oficial"));}
 root.append(links);
 root.append(el("div","pitch-detail-caution",(r.source_note||"") +" No se ha validado la totalidad de las bases, anexos, adjudicaciones ni pagos."));
 try{
  const u=new URL(window.location.href);
  u.searchParams.set("id",r.id);
  history.replaceState(null,"",u.pathname+u.search+u.hash);
 }catch(_){}
}
function showList(items){
 const root=$("pitchList");root.replaceChildren();
 $("pitchStatus").textContent=items.length+" de "+records.length+" procesos en la selección · fuentes consultadas al 16-11-2026.";
 if(!items.length){
  root.append(el("div","empty-results","No hay coincidencias. Limpia los filtros para explorar todos los casos."));
  chosen="";showDetail(null);return;
 }
 if(!items.some(r=>r.id===chosen))chosen=items[0].id;
 for(const r of items){
  const b=btn("pitch-result",()=>{chosen=r.id;showList(items);if(window.matchMedia("(max-width: 850px)").matches)$("pitchDetail").scrollIntoView({behavior:"smooth",block:"start"});});
  b.setAttribute("aria-pressed",String(chosen===r.id));
  b.setAttribute("aria-label",r.id+", "+r.title+", ver expediente");
  const head=el("span","pitch-result-head");
  append(head,el("span","pitch-result-id",r.id),el("span","pitch-result-type",r.type==="compra_agil"?"Compra Ágil":"Licitación"),
   el("span","pitch-result-status "+deadline(r),statusText(r)));
  const bottom=el("span","pitch-result-bottom");append(bottom,el("span",null,label(r.category)),el("span",null,money(r)));
  append(b,head,el("span","pitch-result-title",r.title),el("span","pitch-result-buyer",r.buyer),bottom);
  root.append(b);
 }
 showDetail(items.find(r=>r.id===chosen));
}
function render(){
 const items=marketRecords(),stats=renderKpis(items);
 drawCategories(stats);drawDeadline(stats);drawBuyers(stats);drawMoney(stats);showList(items);
}
function clear(){
 state.query="";state.category="";state.deadline="";
 $("pitchQuery").value="";$("pitchCategory").value="";$("pitchDeadlineFilter").value="";
 render();
}
function exportCsv(){
 const items=marketRecords();
 if(!items.length)return;
 const blob=new Blob([L.csv(items,now())],{type:"text/csv;charset=utf-8"});
 const href=URL.createObjectURL(blob);const a=document.createElement("a");a.href=href;
 a.download="observatorio_maqueta_cursos_ia_educacion_2026-11-16.csv";
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),1200);
}
function boot(){
 const sel=$("pitchCategory");
 for(const [key,name] of Object.entries(names)){
  const o=el("option",null,name);o.value=key;sel.append(o);
 }
 $("pitchQuery").addEventListener("input",()=>{state.query=$("pitchQuery").value;render();});
 sel.addEventListener("change",()=>{state.category=sel.value;render();});
 $("pitchDeadlineFilter").addEventListener("change",()=>{state.deadline=$("pitchDeadlineFilter").value;render();});
 $("pitchReset").addEventListener("click",clear);
 $("downloadCsv").addEventListener("click",exportCsv);
 const insights=[...document.querySelectorAll(".pitch-insight")];
 for(const x of insights){
  x.addEventListener("click",()=>{
   state.category=x.dataset.focus;
   sel.value=state.category;render();
   $("procesos").scrollIntoView({behavior:"smooth",block:"start"});
  });
 }
 render();
}
try{boot()}catch(e){
 console.error("Maqueta no pudo inicializarse",e);
 const t=$("pitchStatus");if(t)t.textContent="No se pudo abrir el catálogo de demostración.";
}
})();
