/* Puente a Worker G2: apagado salvo URL y sitekey verificados. Ticket siempre en servidor. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const cfg=window.OBS_SERVICE||{};
let validEndpoint=null,challengeToken="",widgetId=null,busy=false;
const status=(message,bad=false)=>{$("liveServiceStatus").textContent=message;$("liveServiceStatus").className="help-text"+(bad?" error":"");};
function todayChile(offset=0){
 const p=new Intl.DateTimeFormat("en-US",{timeZone:"America/Santiago",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(Date.now()+offset*86400000));
 const o=Object.fromEntries(p.filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
 return o.year+"-"+o.month+"-"+o.day;
}
function isConfigured(){
 if(typeof cfg.endpoint!=="string"||typeof cfg.turnstileSiteKey!=="string")return false;
 if(!/^0x[a-zA-Z0-9_-]{10,100}$/.test(cfg.turnstileSiteKey))return false;
 try{const u=new URL(cfg.endpoint);if(u.protocol!=="https:"||!u.hostname.endsWith(".workers.dev")||u.username||u.password||u.search||u.hash||u.pathname!=="/")return false;validEndpoint=u.origin;return true;}
 catch(_){return false;}
}
function resetCaptcha(){
 challengeToken="";
 try{if(widgetId!==null&&window.turnstile)window.turnstile.reset(widgetId)}catch(_){}
}
function installChallenge(){
 const script=document.createElement("script");
 script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
 script.async=true;script.defer=true;
 script.onload=()=>{
  if(!window.turnstile){status("No se pudo iniciar la protección de consultas.",true);return;}
  $("liveWidget").hidden=false;
  widgetId=window.turnstile.render("#liveWidget",{
   sitekey:cfg.turnstileSiteKey,action:"market_search",
   callback:token=>{challengeToken=token;$("liveRun").disabled=false;status("Servicio disponible. Confirma las fechas y pulsa Consultar API.");},
   "expired-callback":()=>{challengeToken="";$("liveRun").disabled=true;status("La verificación caducó. Vuelve a completarla.");},
   "error-callback":()=>{challengeToken="";$("liveRun").disabled=true;status("No se pudo verificar el desafío. Reintenta.",true);}
  });
 };
 script.onerror=()=>status("No se pudo cargar la verificación antiabuso. Consulta deshabilitada.",true);
 document.head.append(script);
}
async function checkHealth(){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),6000);
 try{
  const r=await fetch(validEndpoint+"/health",{method:"GET",mode:"cors",credentials:"omit",cache:"no-store",redirect:"error",signal:controller.signal});
  if(!r.ok)throw new Error("NOT_READY");
  const data=await r.json();
  if(!data.ok||!data.search_enabled)throw new Error("NOT_READY");
  $("liveBadge").textContent="Servicio disponible";
  status("Backend disponible. Completa la verificación para consultar datos oficiales de un período acotado.");
  installChallenge();
 }catch(_){
  $("liveBadge").textContent="No disponible";
  status("El servicio no pasó la comprobación HTTP o aún no tiene secretos/protecciones configurados. Usa la búsqueda oficial y la importación local.",true);
 }finally{clearTimeout(timer)}
}
function validRange(from,to){
 const day=x=>/^\d{4}-\d{2}-\d{2}$/.test(x)?Date.parse(x+"T12:00:00Z"):NaN;
 const a=day(from),b=day(to),n=day(todayChile());
 return Number.isFinite(a)&&Number.isFinite(b)&&a<=b&&b<=n&&a>=n-30*86400000&&b-a<=2*86400000;
}
async function run(){
 if(!validEndpoint||busy||!challengeToken)return;
 const q=$("topicInput").value.trim(),from=$("liveFrom").value,to=$("liveTo").value;
 if(q.length<3||q.length>80||!validRange(from,to)){status("Escribe un tema entre 3 y 80 caracteres y selecciona entre 1 y 3 fechas de los últimos 30 días.",true);return;}
 busy=true;$("liveRun").disabled=true;
 status("Consultando un período acotado. El token API permanece en el servidor.");
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),27000);
 try{
  const r=await fetch(validEndpoint+"/api/search",{
   method:"POST",mode:"cors",credentials:"omit",cache:"no-store",redirect:"error",
   headers:{"Content-Type":"application/json"},
   body:JSON.stringify({query:q,from,to,turnstile_token:challengeToken}),signal:controller.signal
  });
  const data=await r.json();
  if(!r.ok||data.ok!==true||!Array.isArray(data.records))throw new Error(data.error||"INVALID_RESPONSE");
  if(!window.OBS_LOAD_LIVE_RECORDS)throw new Error("VIEW_NOT_READY");
  window.OBS_LOAD_LIVE_RECORDS(data.records,data.coverage||{});
  status("Consulta terminada: "+data.records.length+" coincidencias entre "+(data.coverage?.items_examined||0)+" procesos examinados. El período y los límites impiden tratarlo como universo nacional.");
 }catch(e){
  const err=String(e.message||"").slice(0,45).replace(/[^A-Z_]/g,"");
  const known={RATE_LIMIT:"Se alcanzó el límite de consultas. Reintenta más tarde.",BOT_CHECK_FAILED:"La verificación antiabuso falló.",UPSTREAM_ERROR:"La API oficial no pudo responder en el alcance previsto.",UNAVAILABLE:"El backend aún no está configurado.",INVALID_INPUT:"Fechas o término fuera de límites.",UPSTREAM_TOO_LARGE:"La API devolvió demasiados datos para esta consulta."};
  status(known[err]||"La búsqueda no pudo completarse. No se entregarán resultados parciales como completos.",true);
 }finally{
  clearTimeout(timer);busy=false;resetCaptcha();$("liveRun").disabled=true;
 }
}
function init(){
 $("liveFrom").value=todayChile(-1);$("liveTo").value=todayChile();
 $("liveFrom").max=todayChile();$("liveTo").max=todayChile();
 $("liveFrom").min=todayChile(-30);$("liveTo").min=todayChile(-30);
 $("liveRun").addEventListener("click",run);
 if(!isConfigured()){
  $("liveBadge").textContent="Pendiente de despliegue";
  status("Conector preparado, no desplegado ni configurado. La búsqueda automática permanece deshabilitada; puedes usar la consulta manual y los ejemplos.");
  return;
 }
 $("liveBadge").textContent="Verificando backend";
 checkHealth();
}
try{init();}catch(_){status("No fue posible inicializar el conector automático. Continúa con la consulta manual.",true)}
})();
