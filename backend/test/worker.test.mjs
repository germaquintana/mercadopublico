import test from "node:test";
import assert from "node:assert/strict";
import worker,{boundedQuery,mapRecord,isoChile} from "../src/worker.mjs";

const fixed=Date.parse("2026-11-16T18:59:00-03:00");
const origin="https://germaquintana.github.io";
function validPayload(){
 const day=isoChile();
 return {query:"energia solar",from:day,to:day,turnstile_token:"local-mock-turnstile-token-12345"};
}
const env=(rate=true,secret=true)=>({
 MERCADOPUBLICO_TICKET:secret?"synthetic-only-no-real-ticket":"",
 TURNSTILE_SECRET:secret?"synthetic-turnstile-secret":"",
 CLIENT_LIMIT:{limit:async()=>({success:rate})},
 UPSTREAM_LIMIT:{limit:async()=>({success:rate})}
});
const req=(p=validPayload(),o=origin)=>new Request("https://worker.invalid/api/search",{
 method:"POST",headers:{"Origin":o,"Content-Type":"application/json"},
 body:JSON.stringify(p)
});
test("fecha acotada, 3 días máximo y 30 días históricos",()=>{
 assert.equal(boundedQuery({query:"energia solar",from:"2026-11-14",to:"2026-11-16"},fixed).dates.length,3);
 for(const x of [
 {query:"energia solar",from:"2026-11-13",to:"2026-11-16"},
 {query:"energia solar",from:"2026-10-10",to:"2026-10-10"},
 {query:"a",from:"2026-11-15",to:"2026-11-16"},
 {query:"energia solar",from:"2026-02-31",to:"2026-02-31"},
 {query:"energia solar",from:"2026-11-17",to:"2026-11-17"},
 ])assert.equal(boundedQuery(x,fixed),null);
});
test("ficha diaria normalizada no acredita documento ni pago",()=>{
 const r=mapRecord({CodigoExterno:"5251-105-LP26",Nombre:"Energía solar",CodigoEstado:5,Comprador:{NombreOrganismo:"Universidad A"},MontoEstimado:1000,Moneda:"CLP"});
 assert.equal(r.id,"5251-105-LP26");assert.equal(r.buyer,"Universidad A");
 assert.equal(r.amount.kind,"monto_reportado_sin_verificar");
 assert.equal(r.related_orders.length,0);
 assert.match(r.source_note,/No acredita/);
});
test("origen inválido se bloquea sin upstream",async()=>{
 const res=await worker.fetch(req(validPayload(),"https://evil.example"),env());
 assert.equal(res.status,403);assert.equal((await res.json()).error,"BAD_ORIGIN");
});
test("sin secretos o limitadores se bloquea",async()=>{
 const res=await worker.fetch(req(),env(true,false));
 assert.equal(res.status,503);assert.equal((await res.json()).error,"UNAVAILABLE");
});
test("limitación de solicitudes evita llamar upstream",async()=>{
 const res=await worker.fetch(req(),env(false,true));
 assert.equal(res.status,429);
});
test("rechaza fechas no válidas",async()=>{
 const res=await worker.fetch(req({...validPayload(),from:"2026-01-01"}),env());
 assert.equal(res.status,400);
});
test("prueba de extremo a extremo simulada, sin acceso a la API",async()=>{
 const original=globalThis.fetch;let apiCalls=0,botCalls=0;
 try{
 globalThis.fetch=async url=>{
  if(String(url).includes("siteverify")){
   botCalls++;
   return new Response(JSON.stringify({success:true,hostname:"germaquintana.github.io",action:"market_search"}),{status:200,headers:{"Content-Type":"application/json"}});
  }
  apiCalls++;
  assert.ok(String(url).startsWith("https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?"));
  const body={Cantidad:2,Listado:[
   {CodigoExterno:"1010-10-LE26",Nombre:"Instalación energia solar fotovoltaica",Descripcion:"Estudio",CodigoEstado:5},
   {CodigoExterno:"1010-11-LE26",Nombre:"Compra de papel y tinta",CodigoEstado:5}
  ]};
  return new Response(JSON.stringify(body),{status:200,headers:{"Content-Type":"application/json"}});
 };
 const res=await worker.fetch(req(),env());
 assert.equal(res.status,200);
 const data=await res.json();
 assert.equal(data.records.length,1);assert.equal(data.coverage.items_examined,2);
 assert.equal(data.coverage.exhaustive,false);assert.equal(data.records[0].id,"1010-10-LE26");
 assert.equal(apiCalls,1);assert.equal(botCalls,1);
 assert.equal(res.headers.get("Access-Control-Allow-Origin"),origin);
 assert.ok(!JSON.stringify(data).includes("synthetic-turnstile-secret"));
 }finally{globalThis.fetch=original;}
});
