/* Explorador ad hoc: normaliza archivos elegidos manualmente, sin red ni almacenamiento. */
(function(g) {
"use strict";
const MAX_RECORDS=100,MAX_BYTES=1024*1024;
function normalize(s){return String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"");}
function csvRows(text){
 const src=String(text??"").replace(/^\uFEFF/,"");
 if(src.length>MAX_BYTES)throw new Error("Archivo demasiado grande. Usa un extracto de hasta 1 MB.");
 const probe=src.split(/\r?\n/,1)[0],candidates=[";","\t",","];
 const count=(delimiter)=>{
  let q=false,n=0;for(let i=0;i<probe.length;i++){if(probe[i]==='"'){if(q&&probe[i+1]==='"')i++;else q=!q;}else if(probe[i]===delimiter&&!q)n++;}return n;
 };
 const delimiter=candidates.map(c=>({c,n:count(c)})).sort((a,b)=>b.n-a.n)[0];
 if(!delimiter||delimiter.n===0)throw new Error("No se identificó separador CSV. Usa punto y coma, coma o tabulador.");
 let row=[],val="",rows=[],quoted=false;
 const finishVal=()=>{row.push(val);val="";};
 const finishRow=()=>{finishVal();if(row.some(x=>x.trim()))rows.push(row);row=[];};
 for(let i=0;i<src.length;i++){
  const ch=src[i];
  if(quoted){
   if(ch==='"'&&src[i+1]==='"'){val+='"';i++;}
   else if(ch==='"')quoted=false;
   else val+=ch;
  }else{
   if(ch==='"'&&val==="")quoted=true;
   else if(ch===delimiter.c)finishVal();
   else if(ch==="\n"){if(val.endsWith("\r"))val=val.slice(0,-1);finishRow();}
   else val+=ch;
  }
 }
 if(quoted)throw new Error("El CSV tiene comillas sin cerrar.");
 if(val||row.length)finishRow();
 if(!rows.length)throw new Error("El CSV está vacío.");
 const headers=rows.shift().map(x=>x.trim());
 if(!headers.some(h=>/^(codigo|codigoexterno|idlicitacion|id|codigooc)$/i.test(normalize(h))))throw new Error("Falta la columna código (codigo, CodigoExterno o id).");
 if(rows.length>MAX_RECORDS)throw new Error("Máximo 100 registros por consulta. Selecciona un subconjunto más acotado.");
 return rows.map((values,i)=>{
  if(values.length>headers.length+1)throw new Error("Demasiadas columnas en la fila "+(i+2)+". Revisa el delimitador.");
  return Object.fromEntries(headers.map((key,j)=>[key,values[j]??""]));
 });
}
function pick(row,...aliases){
 const entries=Object.entries(row||{}).map(([k,v])=>[normalize(k),v]);
 for(const alias of aliases){
  const found=entries.find(([k])=>k===normalize(alias));
  if(found&&found[1]!==null&&String(found[1]).trim()!=="")return String(found[1]).trim();
 }
 return "";
}
function parseAmount(v){
 if(v===null||v===undefined||String(v).trim()==="")return null;
 let str=String(v).replace(/(CLP|USD|UF|US\$|\$)/gi,"").trim();
 if(!/^[\d.,\s-]+$/.test(str))return null;
 str=str.replace(/\s/g,"");
 if(str.includes(",")&&str.includes(".")){str=str.lastIndexOf(",")>str.lastIndexOf(".")?str.replace(/\./g,"").replace(",","."):str.replace(/,/g,"");}
 else if(str.includes(",")){
  const p=str.split(",");str=p.length>2||p.at(-1).length===3?str.replace(/,/g,""):str.replace(",",".");
 }else if(str.includes(".")){
  const p=str.split(".");str=p.length>2||p.at(-1).length===3?str.replace(/\./g,""):str;
 }
 const n=Number(str);
 return Number.isFinite(n)&&n>=0&&n<=1e15?n:null;
}
function parseDate(v){
 const s=String(v??"").trim();
 if(!s)return null;
 if(/^\d{4}-\d\d-\d\d(?:T\d\d:\d\d(?::\d\d)?(?:Z|[+-]\d\d:?\d\d)?)?$/.test(s)){
  if(s.length===10)return s;
  if(/[Z+-]\d\d:?\d\d$/.test(s))return Number.isFinite(Date.parse(s))?s:null;
  return Number.isFinite(Date.parse(s+"-03:00"))?s+"-03:00":null;
 }
 const m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[ ,T]+(\d{1,2}):(\d{2}))?/);
 if(m){
  const day=Number(m[1]),month=Number(m[2]),year=Number(m[3]),hh=Number(m[4]||0),mm=Number(m[5]||0);
  if(month<1||month>12||day<1||day>31||year<2000||year>2100||hh>23||mm>59)return null;
  const base=year+"-"+String(month).padStart(2,"0")+"-"+String(day).padStart(2,"0");
  if(new Date(base+"T12:00:00Z").getUTCDate()!==day)return null;
  if(!m[4])return base;
  return base+"T"+String(hh).padStart(2,"0")+":"+String(mm).padStart(2,"0")+":00-03:00";
 }
 return null;
}
function validUrl(v){
 const s=String(v||"").trim();
 if(!/^https:\/\//i.test(s)||s.length>2000)return null;
 try{const u=new URL(s);if(u.username||u.password)return null;return u.href;}catch(_){return null;}
}
function officialLink(id){
 if(!/^\d{1,8}-\d{1,8}-[A-Z0-9]{3,8}$/i.test(id))return null;
 return "https://www.mercadopublico.cl/fichaLicitacion.html?idLicitacion="+encodeURIComponent(id);
}
function fromRow(raw,index){
 const obj=raw&&typeof raw==="object"&&!Array.isArray(raw)?raw:{};
 const id=pick(obj,"codigo","CodigoExterno","id","idLicitacion","nroLicitacion","Código de licitación","Código");
 if(!id||id.length>100)throw new Error("La fila "+(index+1)+" no contiene un código válido.");
 const title=pick(obj,"nombre","Nombre","titulo","title","NombreLicitacion","Licitacion","Nombre de la licitación").slice(0,280);
 const buyer=pick(obj,"organismo","Comprador","NombreOrganismo","Nombre del organismo","buyer","buyer_name","Unidad de Compra").slice(0,240);
 const description=pick(obj,"descripcion","Descripción","description","detalle","Objeto","NombreLicitacion").slice(0,1500)||title;
 const close=pick(obj,"fechacierre","fecha_cierre","closing_at","Fecha Cierre","Fecha de cierre");
 const published=pick(obj,"fechapublicacion","fecha_publicacion","published_at","Fecha Publicacion");
 const moneyRaw=pick(obj,"montoestimado","monto","Monto Estimado","presupuesto","amount","valor");
 const money=parseAmount(moneyRaw);
 const currency=pick(obj,"moneda","currency").toUpperCase();
 const state=pick(obj,"estado","codigoestado","status","Estado Licitacion");
 const regions=pick(obj,"region","región","regioncomprador")||"Región no indicada";
 const url=validUrl(pick(obj,"url","enlace","link","urlOficial","official_url","url_ficha"));
 const safeUrl=url&&(new URL(url).hostname==="mercadopublico.cl"||new URL(url).hostname.endsWith(".mercadopublico.cl"))?url:null;
 const official=safeUrl||officialLink(id);
 const category=pick(obj,"tipo","categoria","tipo_compra","category","rubro").slice(0,90)||"sin_clasificar";
 const publishedDate=parseDate(published);
 const closingDate=parseDate(close);
 return {
 id,market:"consulta",type:"licitacion",title:title||"Licitación "+id,buyer:buyer||"Organismo no indicado",region:regions,
 description,modality:(id.match(/-([A-Z]{2,3})\d+$/i)||[])[1]||"No indicado",category,
 topics:[],published_at:publishedDate,
 closing_at:closingDate&&closingDate.includes("T")?closingDate:null,
 closing_date_known:closingDate&&!closingDate.includes("T")?closingDate:null,
 amount:money===null||!["USD","CLP"].includes(currency)?null:{value:money,currency,kind:"monto_reportado_sin_verificar",tax:"sin_verificar",notes:"Campo de monto reportado en archivo; naturaleza económica/IVA no acreditados"},
 reported_status:state?"Estado reportado en archivo: "+state+" (no revalidado)":"Estado sin verificar",
 fit:"Coincidencia de términos según la descripción cargada; no es evaluación de bases ni de elegibilidad.",
 source_quality:"extracto_local_aportado_por_usuario_no_verificado",
 sources:official?[{name:"Acceder a ficha de Mercado Público (ruta no verificada)",url:official,kind:"oficial"}]:[],
 source_note:"Archivo cargado localmente por una persona usuaria, sin cotejo automático de portal; no se guardó ni transmitió.",
 related_orders:[],document_status:"Bases y anexos no consultados. La presencia de código no acredita vigencia."
 };
}
function importRecords(text,filename="datos.csv"){
 if(String(text).length>MAX_BYTES)throw new Error("Archivo demasiado grande (límite 1 MB).");
 let rows;
 if(/\.json$/i.test(filename)||/^\s*[\[{]/.test(text)){
  let v;try{v=JSON.parse(text);}catch(_){throw new Error("JSON inválido.");}
  rows=Array.isArray(v)?v:Array.isArray(v.records)?v.records:Array.isArray(v.Listado)?v.Listado:null;
  if(!rows)throw new Error("El JSON requiere una lista o una propiedad records o Listado.");
 }else rows=csvRows(text);
 if(rows.length>MAX_RECORDS)throw new Error("Hasta 100 registros por consulta. Acota antes el archivo.");
 const records=rows.map(fromRow);
 const seen=new Set(),unique=[];
 for(const r of records){if(!seen.has(r.id.toUpperCase())){seen.add(r.id.toUpperCase());unique.push(r);}}
 if(!unique.length)throw new Error("El archivo no contiene licitaciones utilizables.");
 return {records:unique,read:rows.length,deduped:rows.length-unique.length};
}
g.OBS_IMPORT={MAX_RECORDS,MAX_BYTES,csvRows,parseAmount,parseDate,fromRow,importRecords,officialLink,normalize};
})(window);
