/* Consulta libre: importar y analizar extractos manuales, sin backend ni almacenamiento. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const L=window.OBS_LOGIC, I=window.OBS_IMPORT, C=window.OBS_CATALOG;
const state={records:[],subset:[],selected:"",kind:"",origin:""};
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
const add=(node,...children)=>{children.forEach(c=>node.append(c));return node;};
function setStatus(msg,kind=""){const el=$("statusMessage");el.className="message-line"+(kind?" "+kind:"");el.textContent=msg;}
function theme(){return $("topicInput").value.trim();}
function subset(){
 const q=L.normalize(theme());
 return state.records.filter(r=>{
 if(!q)return true;
 return L.normalize([r.id,r.title,r.buyer,r.region,r.description,r.category,...(r.topics||[])].join(" ")).includes(q);
 }).sort((a,b)=>{
  const x=L.deadline(a),y=L.deadline(b),rank={future:0,past:1,unknown:2};
  if(rank[x]!==rank[y])return rank[x]-rank[y];
  return (a.id||"").localeCompare(b.id||"","es");
 });
}
function statBox(label,value,note){
 const d=make("div","metric");
 add(d,make("span","metric-label",label),make("strong",null,String(value)),make("span","metric-note",note));
 return d;
}
function renderMetrics(stats){
 const root=$("queryMetrics");root.replaceChildren(
 statBox("Resultados coincidentes",stats.records,"De "+state.records.length+" registros cargados"),
 statBox("Organismos distintos",stats.buyers,"Según columna de organismo"),
 statBox("Cierres futuros*",stats.future,stats.past+" vencidos · "+stats.unknown+" sin fecha"),
 statBox("Cobertura de montos",stats.withAmount+" / "+stats.records,"Campos importados sin validación económica")
 );
}
function barList(target,groups,labelFn){
 const root=$(target);root.replaceChildren();
 if(!groups.length){root.append(make("p","money-empty","Sin datos para el término seleccionado."));return;}
 const max=Math.max(...groups.map(x=>x.count),1);
 groups.slice(0,9).forEach(({key,count})=>{
  const div=make("div","bar-row"),head=make("div","bar-top"),track=make("div","bar-track"),fill=make("span","bar-fill");
  add(head,make("span","bar-name",labelFn(key)),make("span","bar-count",String(count)));
  fill.style.width=Math.max(5,Math.round(count*100/max))+"%";track.append(fill);add(div,head,track);root.append(div);
 });
}
function renderAmounts(stats){
 const root=$("queryAmounts");root.replaceChildren();
 if(!stats.amountGroups.length)root.append(make("div","money-empty","Sin montos declarados en los registros coincidentes."));
 stats.amountGroups.forEach(g=>{
  const d=make("div","money-item");
  add(d,make("strong","money-val",L.fmtMoney(g.value,g.currency)),make("span","money-type",L.amountName(g)),make("span","money-note",g.count+" "+(g.count===1?"registro":"registros")+" en este grupo; origen no validado"));
  root.append(d);
 });
}
function asLink(label,href,main){
 const a=make("a",main?"main-link":"",label);
 a.href=href;a.target="_blank";a.rel="noopener noreferrer";return a;
}
function showDetail(r){
 const root=$("queryDetail");root.replaceChildren();
 if(!r){add(root,make("h3","detail-title","Sin resultados para este término"),make("p","query-detail-summary","Ajusta el tema o carga otro extracto. Una consulta sin coincidencias en este archivo no significa que no existan oportunidades."));return;}
 const hd=make("div","detail-head");add(hd,make("span","detail-code",r.id),make("span","microtag",r.modality||"Sin tipo"));root.append(hd);
 add(root,make("h3","detail-title",r.title),make("p","detail-buyer",r.buyer+" · "+r.region));
 const facts=make("div","detail-columns");
 for(const [key,value,note] of [
 ["Plazo publicado",r.closing_at?L.fmtDate(r.closing_at):r.closing_date_known||"No informado","No valida estado abierto"],
 ["Monto importado",r.amount?L.fmtMoney(r.amount.value,r.amount.currency):"No informado",L.amountName(r.amount)],
 ["Tipo de servicio",L.kindName(r.category),"Según archivo"],
 ["Estado",r.reported_status||"No verificado","Información no revalidada"]]){
  const f=make("div","fact");add(f,make("label",null,key),make("strong",null,value),make("small",null,note));facts.append(f);
 }
 root.append(facts);
 const why=make("section","detail-section");add(why,make("h4",null,"Descripción"),make("p",null,r.description||"Sin descripción"));
 root.append(why);
 const links=make("div","detail-links");
 for(const x of r.sources||[]){if(/^https:\/\//.test(x.url))links.append(asLink(x.kind==="oficial"?"Consultar ficha ↗":"Fuente ↗",x.url,x.kind==="oficial"));}
 if(links.children.length)root.append(links);
 root.append(make("div","detail-note","Ficha formada desde un extracto local o un ejemplo público. No se consultaron bases, anexos ni se verificó estado o admisibilidad. No se envían ni almacenan los resultados."));
}
function renderList(){
 const root=$("queryList");root.replaceChildren();
 const recs=state.subset;
 $("queryCount").textContent=recs.length+" registros coincidentes de "+state.records.length+" cargados.";
 if(!recs.length){
  root.append(make("div","empty-results","Ninguna coincidencia en el archivo cargado. Prueba un tema más amplio o elimina el filtro."));
  state.selected="";showDetail(null);return;
 }
 if(!recs.some(r=>r.id===state.selected))state.selected=recs[0].id;
 recs.forEach(r=>{
  const b=make("button","result-item");b.type="button";b.setAttribute("aria-pressed",String(r.id===state.selected));
  const top=make("span","result-top");add(top,make("span","code-tag",r.id),make("span","status-tag "+L.deadline(r),L.deadline(r)==="future"?"Cierre futuro*":L.deadline(r)==="past"?"Plazo vencido":"Fecha no informada"));
  const foot=make("span","result-foot");add(foot,make("span",null,r.buyer),make("span",null,r.amount?L.fmtMoney(r.amount.value,r.amount.currency):"Monto no informado"));
  add(b,top,make("span","result-title",r.title),foot);
  b.addEventListener("click",()=>{state.selected=r.id;renderList();if(window.matchMedia("(max-width: 860px)").matches)$("queryDetail").scrollIntoView({block:"start"});});
  root.append(b);
 });
 showDetail(recs.find(r=>r.id===state.selected));
}
function render(){
 if(!state.records.length)return;
 state.subset=subset();
 $("queryResults").hidden=false;
 const t=theme();$("currentTopic").textContent=t?'"'+t+'"':"los datos cargados";
 $("coverageNote").textContent="Origen: "+state.origin+" · "+state.subset.length+" coincidencias de "+state.records.length+" procesos importados. Sin representatividad nacional.";
 const stats=L.stats(state.subset);
 renderMetrics(stats);barList("queryCategories",stats.categories,k=>L.kindName(k));barList("queryBuyers",stats.buyersRanked,k=>k);renderAmounts(stats);renderList();
}
function loadRecords(recs,source){
 if(!recs.length){setStatus("No se encontraron licitaciones para analizar.","error");return;}
 state.records=recs;state.selected="";state.origin=source;
 render();
 setStatus("Se cargaron "+recs.length+" "+(recs.length===1?"licitación":"licitaciones")+" de "+source+". Todo el procesamiento ocurre en este navegador; no se guardan datos.","success");
 $("queryResults").scrollIntoView({behavior:"smooth",block:"start"});
}
async function analyze(){
 try{
  let content="",name="datos.csv";
  const f=$("fileInput").files?.[0];
  if(f){
   if(f.size>I.MAX_BYTES)throw new Error("El archivo supera 1 MB. Usa un extracto menor.");
   if(!/\.(csv|json|txt)$/i.test(f.name))throw new Error("Usa un archivo CSV, TXT o JSON.");
   content=await f.text();name=f.name;
  }else {content=$("pasteInput").value;name=/^\s*[\[{]/.test(content)?"pegado.json":"pegado.csv";}
  if(!content.trim())throw new Error("Selecciona un archivo o pega filas para analizarlas.");
  const data=I.importRecords(content,name);
  const extra=data.deduped?", "+data.deduped+" códigos repetidos omitidos":"";
  loadRecords(data.records,"archivo local"+extra);
 }catch(e){setStatus("No se pudo cargar: "+e.message,"error");}
}
function demo(){
 const source=C.records.filter(r=>r.market==="ia").map(r=>({...r,market:"consulta"}));
 $("topicInput").value="";$("fileInput").value="";$("pasteInput").value="";
 loadRecords(source,"muestra pública de IA, pedagogía y TI (corte 16-11-2026)");
}
function demoSolar(){
 const source=window.OBS_SOLAR_SAMPLE?.records;
 if(!Array.isArray(source)||source.length!==3){setStatus("No se pudo cargar el ejemplo solar.","error");return;}
 $("topicInput").value="energía solar";$("fileInput").value="";$("pasteInput").value="";
 loadRecords(source,"muestra energética solar de 3 fichas secundarias (corte 16-11-2026)");
}
/* Inyección solo de resultados ya normalizados desde el backend verificado.
 * No permite guardar ni transmitir datos de esta pantalla. */
window.OBS_LOAD_LIVE_RECORDS=function(records,coverage){
 if(!Array.isArray(records)||records.length>40)throw new Error("Respuesta API fuera de límites.");
 const cleaned=records.filter(r=>r&&typeof r.id==="string"&&Array.isArray(r.sources));
 if(cleaned.length!==records.length)throw new Error("Esquema del servicio no válido.");
 if(!cleaned.length){state.records=[];state.subset=[];state.selected="";$("queryResults").hidden=true;setStatus("La API no encontró coincidencias en este período acotado; no significa que no existan licitaciones publicadas antes.","");}
 else loadRecords(cleaned,"API oficial, consulta acotada de "+(coverage?.days_requested||0)+" día(s)");
 const partial=coverage?.partial?" · Muestra parcialmente truncada":"";
 const info="Cobertura: "+(coverage?.items_examined||0)+" procesos examinados en "+(coverage?.days_requested||0)+" día(s); no equivale a todos los procesos abiertos"+partial+".";
 $("liveMeta").textContent=info;$("liveMeta").hidden=false;
};
function exportCsv(){
 if(!state.subset.length){setStatus("No hay resultados filtrados para exportar.","error");return;}
 const blob=new Blob([L.csv(state.subset)],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=url;a.download="observatorio_consulta_tematica.csv";
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
}
function boot(){
 $("analyzeBtn").addEventListener("click",analyze);
 $("exampleBtn").addEventListener("click",demo);
 $("solarBtn").addEventListener("click",demoSolar);
 $("topicInput").addEventListener("input",()=>{if(state.records.length)render();});
 $("showAll").addEventListener("click",()=>{$("topicInput").value="";render();});
 $("csvExport").addEventListener("click",exportCsv);
 $("copyTopic").addEventListener("click",async()=>{
  const t=theme();if(!t){setStatus("Escribe un término para copiar.","error");return;}
  if(!navigator.clipboard?.writeText){$("topicInput").focus();$("topicInput").select();setStatus("Seleccioné el término. Cópialo con Ctrl+C y pégalo en el buscador oficial.");return;}
  try{await navigator.clipboard.writeText(t);setStatus("Término copiado. Pégalo en el campo de búsqueda del portal oficial.","success");}
  catch(_){$("topicInput").focus();$("topicInput").select();setStatus("Seleccioné el término. Cópialo manualmente y pégalo en el portal.");}
 });
}
try{boot();}catch(e){console.error("Error al inicializar consulta temática",e);setStatus("No se pudo iniciar la consulta. Revisa los archivos JS del sitio.","error");}
})();
