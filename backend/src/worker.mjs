/* Observatorio MP — Worker G2 temático acotado. No tickets en cliente ni repositorio.
 * Modelo: verificación Turnstile, dos rate limits, 1-3 fechas y filtro local.
 * No se despliega sin configurar secretos y consentimiento explícito para G2 ampliado.
 */
const ORIGIN="https://germaquintana.github.io";
const API="https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json";
const TURNSTILE="https://challenges.cloudflare.com/turnstile/v0/siteverify";
const MAX_DAYS=3, MAX_AGE=30, MAX_UPSTREAM_BYTES=1750000, MAX_DAY_ITEMS=250, MAX_RESULTS=40;
const STATUS={"5":"Publicada","6":"Cerrada","7":"Desierta","8":"Adjudicada","18":"Revocada","19":"Suspendida"};
const errorCodes=new Set(["BAD_ORIGIN","NOT_FOUND","METHOD_NOT_ALLOWED","UNAVAILABLE","INVALID_INPUT","BOT_CHECK_FAILED","RATE_LIMIT","UPSTREAM_ERROR","UPSTREAM_TOO_LARGE"]);
function json(data,status=200,origin=""){
 const h={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Vary":"Origin"};
 if(origin===ORIGIN)h["Access-Control-Allow-Origin"]=ORIGIN;
 return new Response(JSON.stringify(data),{status,headers:h});
}
function fail(code,status,origin){
 return json({ok:false,error:errorCodes.has(code)?code:"UPSTREAM_ERROR"},status,origin);
}
function norm(s){return String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();}
function isoChile(ts=Date.now()){
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Santiago",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(ts));
 const obj=Object.fromEntries(parts.filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
 return obj.year+"-"+obj.month+"-"+obj.day;
}
function dayIndex(s){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;
 const [y,m,d]=s.split("-").map(Number);
 const dt=new Date(Date.UTC(y,m-1,d));
 return dt.getUTCFullYear()===y&&dt.getUTCMonth()===m-1&&dt.getUTCDate()===d?Math.floor(dt.getTime()/86400000):null;
}
function boundedQuery(body,ts=Date.now()){
 if(!body||typeof body!=="object"||Array.isArray(body))return null;
 const query=typeof body.query==="string"?body.query.trim():"";
 if(query.length<3||query.length>80||!/^[\p{L}\p{N}\s\-.,/()]+$/u.test(query))return null;
 const terms=norm(query).split(/\s+/).filter(Boolean);
 if(terms.length>7)return null;
 const a=dayIndex(body.from),b=dayIndex(body.to),today=dayIndex(isoChile(ts));
 if(a===null||b===null||today===null||a>b||b>today||a<today-MAX_AGE||b-a>=MAX_DAYS)return null;
 return {query,terms,from:body.from,to:body.to,fromDay:a,toDay:b,dates:Array.from({length:b-a+1},(_,i)=>new Date((a+i)*86400000).toISOString().slice(0,10))};
}
function apiDate(iso){return iso.slice(8,10)+iso.slice(5,7)+iso.slice(0,4);}
function safeString(v,max=500){return typeof v==="string"?v.slice(0,max):"";}
function dateMaybe(s){
 if(typeof s!=="string")return null;
 const v=s.trim();
 if(/^\d{4}-\d{2}-\d{2}$/.test(v)&&dayIndex(v)!==null)return v;
 if(/^\d{4}-\d{2}-\d{2}T\d\d:\d\d/.test(v)){
  const iso=v.slice(0,10);
  if(dayIndex(iso)===null)return null;
  // Si no viene zona horaria explícita, NO inventar hora chilena.
  if(/(?:Z|[+-]\d\d:\d\d)$/.test(v)&&Number.isFinite(Date.parse(v)))return new Date(v).toISOString();
  return iso;
 }
 return null;
}
function mapRecord(item){
 if(!item||typeof item!=="object"||Array.isArray(item))return null;
 const id=safeString(item.CodigoExterno,80).trim();
 if(!/^\d{1,9}-\d{1,9}-[A-Z0-9]{3,9}$/i.test(id))return null;
 const buyer=item.Comprador&&typeof item.Comprador==="object"?item.Comprador:{};
 const dates=item.Fechas&&typeof item.Fechas==="object"?item.Fechas:{};
 const name=safeString(item.Nombre,280).trim();
 const description=safeString(item.Descripcion,1200).trim();
 const company=safeString(buyer.NombreOrganismo||item.NombreOrganismo,240).trim();
 const close=dateMaybe(dates.FechaCierre||item.FechaCierre);
 const published=dateMaybe(dates.FechaPublicacion||item.FechaPublicacion);
 const currency=safeString(item.Moneda,5).toUpperCase();
 const num=typeof item.MontoEstimado==="number"?item.MontoEstimado:null;
 const money=num!==null&&Number.isFinite(num)&&num>=0&&["CLP","USD"].includes(currency)?
  {value:num,currency,kind:"monto_reportado_sin_verificar",tax:"sin_verificar",notes:"Campo API diario, clase económica no verificada"}:null;
 const status=item.CodigoEstado!==undefined&&item.CodigoEstado!==null?String(item.CodigoEstado):"";
 return {
  id,market:"consulta",type:"licitacion",title:name||"Licitación "+id,buyer:company||"Organismo no indicado",
  region:"Región no informada",description:description||name||"Sin descripción pública en listado",
  modality:(id.match(/-([A-Z]{1,3})\d+$/i)||[])[1]||"No indicada",category:"licitacion_api",
  topics:[],published_at:published,closing_at:close&&close.includes("T")?close:null,
  closing_date_known:close&&!close.includes("T")?close:null,amount:money,
  reported_status:status?(STATUS[status]||"Código "+status)+" (API, sin verificación documental)":"Estado no informado",
  fit:"Coincidencia textual del título, descripción u organismo en resultados del período limitado.",
  source_quality:"api_oficial_resumen_fecha_no_documento_original",
  sources:[{name:"Ficha Mercado Público por código, enlace no comprobado",kind:"oficial",url:"https://www.mercadopublico.cl/fichaLicitacion.html?idLicitacion="+encodeURIComponent(id)}],
  source_note:"Resultado del listado diario de la API oficial. No acredita vigencia de plazos, bases, adjudicación, recepción ni pago.",
  related_orders:[],document_status:"No se han leído bases, anexos ni actos originales."
 };
}
async function readBounded(response,maxBytes=MAX_UPSTREAM_BYTES){
 if(!response.body||!response.body.getReader)throw new Error("NO_BODY");
 const reader=response.body.getReader();const chunks=[];let size=0;
 try{
  while(true){
   const {value,done}=await reader.read();if(done)break;
   size+=value.byteLength;if(size>maxBytes)throw new Error("TOO_LARGE");
   chunks.push(value);
  }
 }finally{try{await reader.cancel()}catch(_){}}
 const all=new Uint8Array(size);let p=0;
 for(const chunk of chunks){all.set(chunk,p);p+=chunk.byteLength;}
 return new TextDecoder().decode(all);
}
async function verifyChallenge(token,env,request){
 if(typeof token!=="string"||token.length<20||token.length>2048)return false;
 const form=new URLSearchParams({secret:env.TURNSTILE_SECRET,response:token});
 let response;
 try{
  response=await fetch(TURNSTILE,{method:"POST",body:form,redirect:"error",signal:AbortSignal.timeout(6000)});
  if(!response.ok)return false;
  const data=await response.json();
  return data.success===true&&data.hostname==="germaquintana.github.io"&&data.action==="market_search";
 }catch(_){return false;}
}
async function listDate(date,env){
 const url=new URL(API);url.searchParams.set("fecha",apiDate(date));url.searchParams.set("ticket",env.MERCADOPUBLICO_TICKET);
 const response=await fetch(url.toString(),{method:"GET",headers:{"Accept":"application/json"},redirect:"error",signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw new Error("UPSTREAM_BAD_STATUS");
 const body=await readBounded(response);
 let data;try{data=JSON.parse(body)}catch(_){throw new Error("UPSTREAM_BAD_JSON")}
 if(!data||!Array.isArray(data.Listado))throw new Error("UPSTREAM_BAD_SCHEMA");
 const originalCount=Number(data.Cantidad);
 return {items:data.Listado.slice(0,MAX_DAY_ITEMS),total:data.Listado.length,sourceDeclared:Number.isFinite(originalCount)?originalCount:null,cut:data.Listado.length>MAX_DAY_ITEMS};
}
async function search(query,env){
 let examined=0,partial=false,matched=0;const seen=new Set(),results=[];
 for(const day of query.dates){
  const data=await listDate(day,env);
  partial ||= data.cut||(data.sourceDeclared!==null&&data.sourceDeclared>data.total);
  for(const item of data.items){
   examined++;
   const rec=mapRecord(item);if(!rec||seen.has(rec.id))continue;seen.add(rec.id);
   const h=norm([rec.title,rec.description,rec.buyer].join(" "));
   if(!query.terms.every(t=>h.includes(t)))continue;
   matched++;
   if(results.length<MAX_RESULTS)results.push(rec);else partial=true;
  }
 }
 return {ok:true,records:results,coverage:{
  query:query.query,dates_requested:query.dates,days_requested:query.dates.length,items_examined:examined,
  matched_in_sample:matched,records_returned:results.length,partial,exhaustive:false,
  explanation:"Solo licitaciones publicadas en los días solicitados, con límite diario y filtros de texto; NO todas las convocatorias abiertas ni el mercado completo.",
  source:"api_mercadopublico_v1_listado_diario",checked_at_utc:new Date().toISOString()
 }};
}
async function requestBody(request){
 const length=Number(request.headers.get("content-length")||"0");
 if(length>2500)return null;
 const text=await request.text();
 if(text.length>2500)return null;
 try{return JSON.parse(text)}catch(_){return null}
}
const worker={
 async fetch(request,env){
  const origin=request.headers.get("origin")||"";
  const url=new URL(request.url);
  if(url.pathname==="/health"&&request.method==="GET")
   return json({ok:true,version:"g2-theme-1",deployed:true,search_enabled:!!env.MERCADOPUBLICO_TICKET&&!!env.TURNSTILE_SECRET&&!!env.CLIENT_LIMIT&&!!env.UPSTREAM_LIMIT},200,origin);
  if(url.pathname!=="/api/search")return fail("NOT_FOUND",404,origin);
  if(origin!==ORIGIN)return fail("BAD_ORIGIN",403,"");
  if(request.method==="OPTIONS")
   return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type","Access-Control-Max-Age":"600","Vary":"Origin"}});
  if(request.method!=="POST")return fail("METHOD_NOT_ALLOWED",405,origin);
  if(!env.MERCADOPUBLICO_TICKET||!env.TURNSTILE_SECRET||!env.CLIENT_LIMIT?.limit||!env.UPSTREAM_LIMIT?.limit)return fail("UNAVAILABLE",503,origin);
  if(!(request.headers.get("content-type")||"").toLowerCase().startsWith("application/json"))return fail("INVALID_INPUT",400,origin);
  const payload=await requestBody(request);
  const query=boundedQuery(payload);
  if(!query)return fail("INVALID_INPUT",400,origin);
  try{
   const ip=(request.headers.get("CF-Connecting-IP")||"unknown").slice(0,80);
   const [client,global]=await Promise.all([env.CLIENT_LIMIT.limit({key:ip}),env.UPSTREAM_LIMIT.limit({key:"all-users"})]);
   if(!client.success||!global.success)return fail("RATE_LIMIT",429,origin);
   if(!await verifyChallenge(payload.turnstile_token,env,request))return fail("BOT_CHECK_FAILED",403,origin);
   return json(await search(query,env),200,origin);
  }catch(_){return fail("UPSTREAM_ERROR",502,origin)}
 }
};
export {boundedQuery,mapRecord,search,isoChile,readBounded};
export default worker;
