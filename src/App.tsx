import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
};

const firebaseApp = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(firebaseApp);

// ══════════════════════════════════════════════════
// SUBPREFEITURAS — 32 oficiais de São Paulo
// ══════════════════════════════════════════════════
const SUBPREFS = [
  "Aricanduva/Formosa/Carrão","Butantã","Campo Limpo","Capela do Socorro",
  "Casa Verde/Cachoeirinha","Cidade Ademar","Cidade Tiradentes","Ermelino Matarazzo",
  "Freguesia/Brasilândia","Guaianases","Ipiranga","Itaim Paulista",
  "Itaquera","Jabaquara","Jaçanã/Tremembé","Lapa",
  "M'Boi Mirim","Mooca","Parelheiros","Penha",
  "Perus","Pinheiros","Pirituba/Jaraguá","Santana/Tucuruvi",
  "Santo Amaro","São Mateus","São Miguel Paulista","Sapopemba",
  "Sé","Vila Maria/Vila Guilherme","Vila Mariana","Vila Prudente"
];

// ══════════════════════════════════════════════════
// COORDENADAS DAS 32 SUBPREFEITURAS (temporário)
// ══════════════════════════════════════════════════
const SUBPREF_COORDS = {
  "Aricanduva/Formosa/Carrão":[-23.5720,-46.5150],
  "Butantã":[-23.5720,-46.7180],
  "Campo Limpo":[-23.6390,-46.7480],
  "Capela do Socorro":[-23.6800,-46.7000],
  "Casa Verde/Cachoeirinha":[-23.5060,-46.6650],
  "Cidade Ademar":[-23.6800,-46.6600],
  "Cidade Tiradentes":[-23.5980,-46.4020],
  "Ermelino Matarazzo":[-23.5010,-46.4720],
  "Freguesia/Brasilândia":[-23.4700,-46.6900],
  "Guaianases":[-23.5440,-46.4160],
  "Ipiranga":[-23.5920,-46.6100],
  "Itaim Paulista":[-23.5010,-46.4030],
  "Itaquera":[-23.5390,-46.4470],
  "Jabaquara":[-23.6460,-46.6420],
  "Jaçanã/Tremembé":[-23.4550,-46.5950],
  "Lapa":[-23.5270,-46.7010],
  "M'Boi Mirim":[-23.6520,-46.7620],
  "Mooca":[-23.5610,-46.5980],
  "Parelheiros":[-23.8280,-46.7370],
  "Penha":[-23.5300,-46.5400],
  "Perus":[-23.4020,-46.7600],
  "Pinheiros":[-23.5670,-46.7020],
  "Pirituba/Jaraguá":[-23.4700,-46.7280],
  "Santana/Tucuruvi":[-23.4890,-46.6280],
  "Santo Amaro":[-23.6540,-46.7060],
  "São Mateus":[-23.5990,-46.4610],
  "São Miguel Paulista":[-23.4930,-46.4430],
  "Sapopemba":[-23.5920,-46.5290],
  "Sé":[-23.5505,-46.6333],
  "Vila Maria/Vila Guilherme":[-23.5050,-46.5900],
  "Vila Mariana":[-23.5880,-46.6350],
  "Vila Prudente":[-23.5870,-46.5820],
};

function coordsDaSub(sub) {
  return SUBPREF_COORDS[sub] || SUBPREF_COORDS["Sé"];
}

function abrirView360(sub) {
  const [lat, lng] = coordsDaSub(sub);
  window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`, "_blank", "noopener,noreferrer");
}

const TIPOS = ["Calçada","Inundação","Vegetação","Limpeza","Acessibilidade","Pavimentação","Segurança"];
const STATUSES = ["Aberta","Em andamento","Concluída","Crítica"];
const TIPO_ICON = { Calçada:"🔲",Inundação:"💧",Vegetação:"🌳",Limpeza:"🧹",Acessibilidade:"♿",Pavimentação:"🔧",Segurança:"🚨" };
const TIPO_COR = { Calçada:"#00c47a",Inundação:"#ef4444",Vegetação:"#7c3aed",Limpeza:"#06b6d4",Acessibilidade:"#3b82f6",Pavimentação:"#f97316",Segurança:"#ef4444" };
const STATUS_COR = { "Aberta":"#ef4444","Em andamento":"#f59e0b","Concluída":"#00c47a","Crítica":"#ff3b30" };

const C = {
  bg:"#07090f",card:"#0f1420",card2:"#131929",borda:"#1e2a42",
  verde:"#00c47a",verde2:"#008f58",azul:"#1d6fa4",laranja:"#f59e0b",
  vermelho:"#ef4444",roxo:"#7c3aed",ciano:"#06b6d4",
  txt:"#e8edf5",txt2:"#6b7fa0",accent:"#00e5c0",alerta:"#ff3b30"
};

const s = {
  btn:{ border:"none",borderRadius:8,padding:"9px 14px",fontWeight:700,cursor:"pointer",fontSize:12,transition:"opacity .2s" },
  input:{ background:"#0a0e18",border:`1px solid ${C.borda}`,borderRadius:8,padding:"9px 12px",color:C.txt,fontSize:13,outline:"none",width:"100%",fontFamily:"inherit",boxSizing:"border-box" },
  select:{ background:"#0a0e18",border:`1px solid ${C.borda}`,borderRadius:8,padding:"9px 12px",color:C.txt,fontSize:12,outline:"none",width:"100%",fontFamily:"inherit",cursor:"pointer" },
  tag:{ display:"inline-block",padding:"2px 8px",borderRadius:4,fontWeight:700,fontSize:10,border:"1px solid" },
  label:{ fontSize:10,fontWeight:700,color:C.txt2,textTransform:"uppercase",letterSpacing:".4px",marginBottom:4,display:"block" },
};

// ══════════════════════════════════════════════════
// CLASSIFICAÇÃO DE TIPO
// ══════════════════════════════════════════════════
function classificarTipo(assunto, servico, tema) {
  const a = (assunto||"").trim(), sv = (servico||"").trim(), t = (tema||"").trim();
  if (a==="Calçadas, guias e postes") return "Calçada";
  if (["Denúncia de represamento ou aterramento de rio ou córrego","Sugerir obras de drenagem em córregos","Córrego - solicitar limpeza","Água Subterrânea/Curso d'Água","Inundação","Alagamento"].includes(sv)||a==="Drenagem de água de chuva") return "Inundação";
  if (a==="Árvore"||["Queda de árvore","Queda de galho","Risco iminente de queda de árvore","Capinação e roçada de áreas verdes"].includes(sv)) return "Vegetação";
  if (a==="Áreas Contaminadas"||t==="Lixo e limpeza") return "Limpeza";
  if (t==="Acessibilidade") return "Acessibilidade";
  if (a==="Reparos em  Asfalto, Pontes, Viadutos e Túneis") return "Pavimentação";
  if (t==="Segurança urbana"||a==="População ou pessoa em situação de rua") return "Segurança";
  return null;
}

// ══════════════════════════════════════════════════
// RESOLUÇÃO DE SUBPREFEITURA (normaliza acento/hífen/apóstrofo)
// ══════════════════════════════════════════════════
function normalizarChave(str) {
  return (str||"")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g," ")
    .trim()
    .replace(/\s+/g," ");
}

// Valores crus da coluna "Prefeitura Operacional" do SP156 → nome oficial (SUBPREFS)
const MAPA_PREFEITURA_OPERACIONAL = {
  "SE":"Sé",
  "MOOCA":"Mooca",
  "CAMPO LIMPO":"Campo Limpo",
  "CAPELA DO SOCORRO":"Capela do Socorro",
  "SANTANA TUCURUVI":"Santana/Tucuruvi",
  "ITAQUERA":"Itaquera",
  "BUTANTA":"Butantã",
  "IPIRANGA":"Ipiranga",
  "LAPA":"Lapa",
  "SANTO AMARO":"Santo Amaro",
  "PIRITUBA JARAGUA":"Pirituba/Jaraguá",
  "VILA MARIANA":"Vila Mariana",
  "PENHA":"Penha",
  "M BOI MIRIM":"M'Boi Mirim",
  "PINHEIROS":"Pinheiros",
  "SAO MATEUS":"São Mateus",
  "JACANA TREMEMBE":"Jaçanã/Tremembé",
  "VILA MARIA VILA GUILHERME":"Vila Maria/Vila Guilherme",
  "ITAIM PAULISTA":"Itaim Paulista",
  "FREGUESIA BRASILANDIA":"Freguesia/Brasilândia",
  "SAO MIGUEL":"São Miguel Paulista",
  "JABAQUARA":"Jabaquara",
  "CIDADE ADEMAR":"Cidade Ademar",
  "ARICANDUVA FORMOSA CARRAO":"Aricanduva/Formosa/Carrão",
  "CASA VERDE LIMAO CACHOEIRINHA":"Casa Verde/Cachoeirinha",
  "GUAIANASES":"Guaianases",
  "VILA PRUDENTE":"Vila Prudente",
  "ERMELINO MATARAZZO":"Ermelino Matarazzo",
  "SAPOPEMBA":"Sapopemba",
  "CIDADE TIRADENTES":"Cidade Tiradentes",
  "PARELHEIROS":"Parelheiros",
  "CASA VERDE CACHOEIRINHA":"Casa Verde/Cachoeirinha",
  "PERUS ANHANGUERA":"Perus",
  "PERUS":"Perus",
};

// Índice reverso dos nomes oficiais (cobre a coluna "Distrito" ou variações não mapeadas acima)
const INDICE_SUBPREFS = SUBPREFS.reduce((acc,p)=>{
  p.split("/").forEach(parte=>{ acc[normalizarChave(parte)] = p; });
  acc[normalizarChave(p.replace(/\//g," "))] = p;
  return acc;
},{});

function resolverSubprefeitura(raw) {
  const chave = normalizarChave(raw);
  if (!chave) return "Sé";
  if (MAPA_PREFEITURA_OPERACIONAL[chave]) return MAPA_PREFEITURA_OPERACIONAL[chave];
  if (INDICE_SUBPREFS[chave]) return INDICE_SUBPREFS[chave];
  // fallback por substring, do nome mais longo pro mais curto (evita "Vila Maria" casar com "Vila Mariana")
  const candidatos = SUBPREFS
    .map(p=>({p, chaveP:normalizarChave(p.split("/")[0])}))
    .sort((a,b)=>b.chaveP.length-a.chaveP.length);
  const achado = candidatos.find(c=>chave.includes(c.chaveP));
  return achado ? achado.p : "Sé";
}

// ══════════════════════════════════════════════════
// PARSER CSV
// ══════════════════════════════════════════════════
async function carregarSP156() {
  try {
    const response = await fetch("/sp156_filtrado.csv");
    if (!response.ok) return [];
    const buffer = await response.arrayBuffer();
    const text = new TextDecoder("utf-8").decode(buffer);
    const lines = text.split("\n").filter(l=>l.trim());
    if (lines.length<2) return [];
    const headers = lines[0].split(";").map(h=>h.trim());
    const rows = [];
    for (let i=1;i<lines.length;i++) {
      const values = lines[i].split(";").map(v=>v.trim());
      const row = {};
      headers.forEach((h,idx)=>{row[h]=values[idx]||"";});
      rows.push(row);
    }
    const resultado = [];
    rows.forEach(row=>{
      const tipo = row["tipo_zeladoria"] || classificarTipo(row["Assunto"],row["Serviço"],row["Tema"]);
      if (!tipo) return;
      const statusRaw = row["Status da Solicitação"]||"";
      let status = "Aberta";
      if (/finaliz/i.test(statusRaw)) status="Concluída";
      else if (/andamento/i.test(statusRaw)) status="Em andamento";
      const subRaw = row["Prefeitura Operacional"]||row["Distrito"]||"Sé";
      const sub = resolverSubprefeitura(subRaw);
      const [lat,lng] = coordsDaSub(sub);
      resultado.push({
        id:resultado.length+1, sub,
        end:`${row["Logradouro"]||""}, ${row["Número"]||"s/n"} - ${row["Bairro"]||""}`,
        tipo, status,
        data:row["Data de Abertura"]?row["Data de Abertura"].split("/").reverse().join("-"):new Date().toISOString().slice(0,10),
        resp:row["Órgão"]||"—",
        desc:`${row["Assunto"]||""} — ${row["Serviço"]||""}`,
        acao:row["Canal"]?`Canal: ${row["Canal"]}`:"",
        vezes:1, lat, lng, fotos:[],
        cep:row["CEP"]||"", fonte:"SP156"
      });
    });
    return resultado;
  } catch(e) { console.error(e); return []; }
}

// ══════════════════════════════════════════════════
// COMPONENTES AUXILIARES
// ══════════════════════════════════════════════════
function Tag({tipo,cor,txt2}) {
  const bg=tipo?TIPO_COR[tipo]:cor||C.verde;
  return <span style={{...s.tag,background:`${bg}18`,color:bg,borderColor:`${bg}44`}}>{txt2||tipo}</span>;
}
function StatusTag({status}) {
  const c=STATUS_COR[status]||C.txt2;
  return <span style={{...s.tag,background:`${c}15`,color:c,borderColor:`${c}35`}}>{status}</span>;
}
function Toast({msg}) {
  if(!msg) return null;
  return <div style={{position:"fixed",bottom:20,right:20,background:C.card,border:`1px solid ${C.borda}`,borderRadius:10,padding:"10px 16px",fontSize:13,zIndex:9999,color:C.txt,boxShadow:"0 8px 32px rgba(0,0,0,.5)",maxWidth:280}}>{msg}</div>;
}
function Pulse() {
  return <div style={{width:8,height:8,borderRadius:"50%",background:C.accent,animation:"pulse 2s ease infinite"}}/>;
}

// ══════════════════════════════════════════════════
// TELA DE LOGIN
// ══════════════════════════════════════════════════
function LoginScreen({onLoginSuccess}) {
  const [loading,setLoading]=useState(false);
  const [erro,setErro]=useState("");
  const [imgSrc,setImgSrc]=useState("/imagem_tela_login.jpg");

  const handleImgError=()=>{ if(imgSrc.endsWith(".jpg")) setImgSrc("/imagem_tela_login.png"); };

  const handleGoogleLogin=async()=>{
    setErro(""); setLoading(true);
    try {
      const provider=new GoogleAuthProvider();
      const result=await signInWithPopup(auth,provider);
      onLoginSuccess({email:result.user.email,displayName:result.user.displayName||result.user.email.split("@")[0]});
    } catch(e) { setErro("❌ Erro ao fazer login: "+e.message); setLoading(false); }
  };

  return (
    <div style={{position:"relative",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,sans-serif",color:C.txt,overflow:"hidden"}}>
      <img src={imgSrc} onError={handleImgError} alt="" style={{display:"none"}}/>
      <div style={{position:"fixed",inset:0,backgroundImage:`url('${imgSrc}')`,backgroundSize:"cover",backgroundPosition:"center",filter:"brightness(0.55) saturate(1.1)"}}/>
      <div style={{position:"fixed",inset:0,background:"linear-gradient(180deg,rgba(7,9,15,.5) 0%,rgba(7,9,15,.75) 100%)"}}/>

      {/* Cabeçalho */}
      <div style={{position:"fixed",top:0,left:0,right:0,zIndex:2,height:130,background:"rgba(7,9,15,.25)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",borderBottom:"1px solid rgba(255,255,255,.08)",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"flex-start",paddingTop:54,whiteSpace:"nowrap",pointerEvents:"none"}}>
          <div style={{display:"inline-block",animation:"marqueeScroll 45s linear infinite",fontSize:18,fontWeight:500,color:"rgba(255,255,255,.06)",letterSpacing:"2px"}}>
            {Array(8).fill("SOLUÇÃO COMPLETA DE ZELADORIA").join("  •  ")}
          </div>
        </div>
        <div style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",gap:20}}>
          <span style={{fontSize:40}}>🏙</span>
          <span style={{fontSize:34,fontWeight:700,letterSpacing:"1px"}}>NEUROURBANA</span>
          <span style={{fontSize:40}}>🏙</span>
        </div>
      </div>

      {/* Card de login */}
      <div style={{position:"relative",zIndex:1,background:"rgba(15,20,32,0.55)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid rgba(255,255,255,.15)",borderRadius:20,padding:"56px 36px",width:"100%",maxWidth:360,boxShadow:"0 16px 64px rgba(0,0,0,.5)",display:"flex",flexDirection:"column",alignItems:"center"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:54,marginBottom:20}}>🏙</div>
          <div style={{fontSize:26,fontWeight:700,marginBottom:10}}>NeuroUrbana</div>
          <div style={{fontSize:13,color:C.txt2,lineHeight:1.5}}>Sistema de Controle de<br/>Ocorrências Urbanas</div>
        </div>

        <div style={{width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"18px 20px",marginBottom:32}}>
          <div style={{fontSize:13,fontWeight:700,color:C.txt,marginBottom:14,textAlign:"center"}}>Gestão inteligente de zeladoria urbana</div>
          {[
            "Mapa interativo de ocorrências de Zeladoria",
            "Controle de Calçadas, Vegetação, Limpeza e etc",
            "Diagnóstico técnico assistido por IA",
            "Relatórios e exportação em PDF",
            "Análises de Dados Robusta",
            "Insights com Inteligência Artificial",
            "Imagens do Local exato",
            "Novas Ocorrências através da plataforma",
            "Identificação de Recorrências",
          ].map((txt,i,arr)=>(
            <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:i<arr.length-1?8:0}}>
              <span style={{fontSize:12,color:C.txt2,lineHeight:1.5,flexShrink:0}}>•</span>
              <span style={{fontSize:12,color:C.txt2,lineHeight:1.5}}>{txt}</span>
            </div>
          ))}
        </div>

        {erro&&<div style={{width:"100%",boxSizing:"border-box",background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)",borderRadius:8,padding:12,marginBottom:20,fontSize:12,color:"#fca5a5"}}>{erro}</div>}

        <button onClick={handleGoogleLogin} disabled={loading} style={{width:"100%",padding:14,background:`linear-gradient(135deg,${C.verde2},${C.verde})`,color:"#fff",border:"none",borderRadius:10,fontWeight:700,cursor:"pointer",opacity:loading?0.5:1,fontSize:14}}>
          {loading?"⟳ Entrando...":"🔐 Entrar com Google"}
        </button>
      </div>

      <style>{`
        @keyframes marqueeScroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════
// MODAL DE LOCALIZAÇÃO — Leaflet
// ══════════════════════════════════════════════════
function LocalizacaoModal({end,sub,onClose}) {
  const mapRef=useRef(null);
  const mapInstanceRef=useRef(null);

  useEffect(()=>{
    if(!mapRef.current||mapInstanceRef.current) return;
    const coords=coordsDaSub(sub);
    const map=L.map(mapRef.current,{scrollWheelZoom:true}).setView(coords,14);
    mapInstanceRef.current=map;
    const KEY=import.meta.env.VITE_TRACESTRACK_KEY||"";
    const tileUrl=KEY
      ?`https://tile.tracestrack.com/topo__/{z}/{x}/{y}.png?key=${KEY}`
      :"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    L.tileLayer(tileUrl,{attribution:KEY?"&copy; Tracestrack &copy; OpenStreetMap":"&copy; OpenStreetMap contributors",maxZoom:19}).addTo(map);
    L.marker(coords).addTo(map).bindPopup(`<strong>${end}</strong><br/>${sub}`).openPopup();
    return ()=>{ map.remove(); mapInstanceRef.current=null; };
  },[end,sub]);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",backdropFilter:"blur(4px)",zIndex:9500,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.card,border:`1px solid ${C.borda}`,borderRadius:14,width:1050,maxWidth:"94vw",padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:14,fontWeight:700,color:C.txt}}>📍 Localização · {sub}</div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.06)",border:"none",borderRadius:6,color:C.txt2,width:28,height:28,cursor:"pointer",fontSize:15}}>✕</button>
        </div>
        <div ref={mapRef} style={{width:"100%",height:624,borderRadius:10,overflow:"hidden"}}/>
        <div style={{fontSize:10,color:C.txt2,marginTop:8}}>📍 Localização aproximada (centro da subprefeitura) — coordenada exata do endereço em breve.</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// MAPA SVG INTERATIVO
// ══════════════════════════════════════════════════
function MapaSP({ocorrencias,selectedId,onSelect,filtSub,filtTipo,filtStatus}) {
  const [zoom,setZoom]=useState(1);
  const [pan,setPan]=useState({x:0,y:0});
  const [dragging,setDragging]=useState(false);
  const [lastPos,setLastPos]=useState(null);
  const [hovered,setHovered]=useState(null);
  const [showLocModal,setShowLocModal]=useState(false);

  const filtered=ocorrencias.filter(o=>
    (!filtSub||filtSub==="Todas"||o.sub===filtSub)&&
    (!filtTipo||o.tipo===filtTipo)&&
    (!filtStatus||o.status===filtStatus)
  );

  const onMouseDown=e=>{ setDragging(true); setLastPos({x:e.clientX,y:e.clientY}); };
  const onMouseMove=e=>{ if(!dragging||!lastPos) return; setPan(p=>({x:p.x+(e.clientX-lastPos.x),y:p.y+(e.clientY-lastPos.y)})); setLastPos({x:e.clientX,y:e.clientY}); };
  const onMouseUp=()=>{ setDragging(false); setLastPos(null); };
  const handleWheel=e=>{ e.preventDefault(); setZoom(z=>Math.max(0.6,Math.min(3,z-e.deltaY*0.001))); };
  const resetView=()=>{ setZoom(1); setPan({x:0,y:0}); };
  const hovOc=hovered?ocorrencias.find(o=>o.id===hovered):null;
  const selOc=selectedId?ocorrencias.find(o=>o.id===selectedId):null;

  return (
    <div style={{width:"100%",height:"100%",background:C.bg,position:"relative",overflow:"hidden",cursor:dragging?"grabbing":"grab"}}
      onWheel={handleWheel} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
      <svg width="100%" height="100%" viewBox="0 0 600 480"
        style={{transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`,transformOrigin:"center",transition:dragging?"none":"transform .1s"}}>
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#0f1a2e" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="600" height="480" fill="url(#grid)"/>
        <g opacity="0.15">
          <ellipse cx="300" cy="250" rx="260" ry="200" fill="none" stroke="#1d6fa4" strokeWidth="1"/>
          <line x1="300" y1="80" x2="300" y2="420" stroke="#1e2a42" strokeWidth="0.8" strokeDasharray="4,4"/>
          <line x1="100" y1="250" x2="500" y2="250" stroke="#1e2a42" strokeWidth="0.8" strokeDasharray="4,4"/>
        </g>
        {filtered.slice(0,500).map(oc=>{
          const isAlerta=oc.vezes>=3, isSelected=selectedId===oc.id;
          const cor=isAlerta?C.alerta:STATUS_COR[oc.status]||C.txt2;
          const r=isSelected?12:isAlerta?10:8;
          const x=150+(oc.id*37)%460, y=80+(oc.id*53)%360;
          return (
            <g key={oc.id} onClick={()=>onSelect(oc.id)} onMouseEnter={()=>setHovered(oc.id)} onMouseLeave={()=>setHovered(null)} style={{cursor:"pointer"}}>
              {isAlerta&&<circle cx={x} cy={y} r={18} fill={`${C.alerta}22`} style={{animation:"pulseR 1.5s ease infinite"}}/>}
              {isSelected&&<circle cx={x} cy={y} r={16} fill="none" stroke={cor} strokeWidth="2" opacity="0.5"/>}
              <circle cx={x} cy={y} r={r} fill={`${cor}dd`} stroke={isSelected?"#fff":cor} strokeWidth={isSelected?2:1}/>
              <text x={x} y={y+1} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#fff" style={{pointerEvents:"none"}}>
                {isAlerta?"⚠":TIPO_ICON[oc.tipo]}
              </text>
            </g>
          );
        })}
      </svg>

      {hovOc&&(
        <div style={{position:"absolute",top:16,left:"50%",transform:"translateX(-50%)",background:`${C.card}f0`,border:`1px solid ${C.borda}`,borderRadius:10,padding:"10px 14px",pointerEvents:"none",zIndex:100,minWidth:220,maxWidth:300}}>
          <div style={{fontSize:10,color:C.txt2,textTransform:"uppercase",letterSpacing:".5px"}}>{TIPO_ICON[hovOc.tipo]} {hovOc.tipo}</div>
          <div style={{fontSize:13,fontWeight:700,margin:"4px 0"}}>{hovOc.end.slice(0,44)}</div>
          <div style={{display:"flex",gap:6}}><StatusTag status={hovOc.status}/></div>
        </div>
      )}

      <div style={{position:"absolute",bottom:16,right:16,display:"flex",flexDirection:"column",gap:6}}>
        <button onClick={()=>setZoom(z=>Math.min(3,z+0.3))} style={{...s.btn,background:C.card2,color:C.txt,border:`1px solid ${C.borda}`,width:36,height:36,fontSize:18,padding:0}}>+</button>
        <button onClick={()=>setZoom(z=>Math.max(0.6,z-0.3))} style={{...s.btn,background:C.card2,color:C.txt,border:`1px solid ${C.borda}`,width:36,height:36,fontSize:18,padding:0}}>−</button>
        <button onClick={resetView} style={{...s.btn,background:C.card2,color:C.txt2,border:`1px solid ${C.borda}`,width:36,height:36,fontSize:12,padding:0}}>⊙</button>
      </div>

      <div style={{position:"absolute",bottom:16,left:16,background:`${C.card}ee`,border:`1px solid ${C.borda}`,borderRadius:10,padding:"10px 12px",fontSize:11}}>
        <div style={{fontSize:9,fontWeight:700,color:C.txt2,textTransform:"uppercase",letterSpacing:".8px",marginBottom:6}}>Legenda</div>
        {[["#ef4444","Aberta"],["#f59e0b","Em andamento"],["#00c47a","Concluída"],["#ff3b30","Crítica"]].map(([c,l])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:c,flexShrink:0}}/>
            <span style={{color:C.txt2,fontSize:10}}>{l}</span>
          </div>
        ))}
        <div style={{marginTop:6,paddingTop:6,borderTop:`1px solid ${C.borda}`}}>
          <div style={{fontSize:9,color:C.txt2}}>🖱 Arraste · Scroll = zoom · Clique = detalhe</div>
        </div>
      </div>

      <div style={{position:"absolute",top:16,right:16,display:"flex",gap:6}}>
        <button onClick={()=>setShowLocModal(true)} style={{...s.btn,background:"#1a2033",border:`1px solid ${C.borda}`,color:C.txt,display:"flex",alignItems:"center",gap:5}}>
          📍 Localização
        </button>
        <button onClick={()=>abrirView360(selOc?.sub||"Sé")} style={{...s.btn,background:"#1a2033",border:`1px solid ${C.borda}`,color:C.txt2,display:"flex",alignItems:"center",gap:5}}>
          👁 View-360
        </button>
      </div>

      {showLocModal&&(
        <LocalizacaoModal end={selOc?.end||"Centro de São Paulo"} sub={selOc?.sub||"Sé"} onClose={()=>setShowLocModal(false)}/>
      )}

      <style>{`
        @keyframes pulseR{0%,100%{transform:scale(1);opacity:0.6}50%{transform:scale(1.4);opacity:0.2}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════
// DETALHE DA OCORRÊNCIA
// ══════════════════════════════════════════════════
function DetalheOc({oc,onClose}) {
  const [showLocModal,setShowLocModal]=useState(false);
  if(!oc) return (
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.txt2,fontSize:13,textAlign:"center",padding:16}}>
      <div><div style={{fontSize:32,marginBottom:12}}>🗺</div><div>Clique numa ocorrência no mapa ou na lista</div></div>
    </div>
  );
  const isAlerta=oc.vezes>=3;
  const dt=new Date(oc.data).toLocaleString("pt-BR",{day:"2-digit",month:"short",year:"numeric"});
  return (
    <div style={{flex:1,overflowY:"auto",padding:16}}>
      {isAlerta&&(
        <div style={{background:`${C.alerta}12`,border:`1px solid ${C.alerta}44`,borderRadius:8,padding:"10px 12px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>⚠</span>
          <div><div style={{fontWeight:700,color:C.alerta,fontSize:13}}>REINCIDÊNCIA — {oc.vezes} atendimentos</div></div>
        </div>
      )}
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,color:C.txt2,marginBottom:4}}>{TIPO_ICON[oc.tipo]} {oc.tipo} · {oc.sub}</div>
        <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>{oc.end}</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <Tag tipo={oc.tipo}/><StatusTag status={oc.status}/>
          <span style={{...s.tag,background:"rgba(255,255,255,.04)",color:C.txt2,borderColor:C.borda,fontSize:10}}>{dt}</span>
        </div>
      </div>
      {[["📋 Descrição",oc.desc],["🔧 Ação",oc.acao],["👤 Responsável",oc.resp]].map(([l,v])=>v&&(
        <div key={l} style={{background:C.card2,border:`1px solid ${C.borda}`,borderRadius:8,padding:10,marginBottom:8}}>
          <div style={{fontSize:10,color:C.txt2,marginBottom:4}}>{l}</div>
          <div style={{fontSize:12,lineHeight:1.6}}>{v}</div>
        </div>
      ))}
      <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:10}}>
        <button onClick={()=>setShowLocModal(true)} style={{...s.btn,background:"#0f2744",border:`1px solid rgba(29,111,164,.4)`,color:C.txt,display:"flex",alignItems:"center",gap:6,justifyContent:"center",fontSize:12}}>
          📍 Localização
        </button>
        <button onClick={()=>abrirView360(oc.sub)} style={{...s.btn,background:"#0a1020",border:`1px solid ${C.borda}`,color:C.txt2,display:"flex",alignItems:"center",gap:6,justifyContent:"center",fontSize:12}}>
          👁 View-360
        </button>
      </div>
      {showLocModal&&<LocalizacaoModal end={oc.end} sub={oc.sub} onClose={()=>setShowLocModal(false)}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════
// MODAL NOVA OCORRÊNCIA
// ══════════════════════════════════════════════════
function Modal({onClose,onSave,aiDiag,onAiDiag,aiLoading}) {
  const [form,setForm]=useState({sub:"Sé",end:"",tipo:"Calçada",status:"Aberta",data:new Date().toISOString().slice(0,16),resp:"",desc:"",acao:"",vezes:1});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const handleSave=()=>{
    if(!form.end.trim()) return alert("Preencha o endereço");
    const [lat,lng]=coordsDaSub(form.sub);
    onSave({...form,id:Date.now(),fotos:[],lat,lng});
    onClose();
  };
  const fg={display:"flex",flexDirection:"column",gap:4,marginBottom:12};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",backdropFilter:"blur(4px)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.card,border:`1px solid ${C.borda}`,borderRadius:14,width:560,maxWidth:"95vw",maxHeight:"90vh",overflowY:"auto",padding:24,position:"relative"}}>
        <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"rgba(255,255,255,.06)",border:"none",borderRadius:6,color:C.txt2,width:28,height:28,cursor:"pointer",fontSize:15}}>✕</button>
        <div style={{fontSize:16,fontWeight:700,marginBottom:18}}>📌 Nova Ocorrência de Zeladoria</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={{...fg,gridColumn:"1/-1"}}>
            <label style={s.label}>Subprefeitura *</label>
            <select style={s.select} value={form.sub} onChange={e=>set("sub",e.target.value)}>
              {SUBPREFS.map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
          <div style={{...fg,gridColumn:"1/-1"}}>
            <label style={s.label}>Endereço *</label>
            <input style={s.input} value={form.end} onChange={e=>set("end",e.target.value)} placeholder="Rua, número, bairro..."/>
          </div>
          <div style={fg}>
            <label style={s.label}>Tipo *</label>
            <select style={s.select} value={form.tipo} onChange={e=>set("tipo",e.target.value)}>
              {TIPOS.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={fg}>
            <label style={s.label}>Status</label>
            <select style={s.select} value={form.status} onChange={e=>set("status",e.target.value)}>
              {STATUSES.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{...fg,gridColumn:"1/-1"}}>
            <label style={s.label}>Descrição</label>
            <textarea style={{...s.input,resize:"vertical",minHeight:72}} value={form.desc} onChange={e=>set("desc",e.target.value)} placeholder="Contexto, urgência..."/>
          </div>
        </div>
        {aiDiag&&(
          <div style={{background:"#0a1020",border:`1px solid rgba(0,196,122,.2)`,borderRadius:10,padding:14,marginTop:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <Pulse/>
              <span style={{fontSize:11,fontWeight:700,color:C.accent,textTransform:"uppercase",letterSpacing:".5px"}}>Diagnóstico IA</span>
            </div>
            <div style={{fontSize:12,lineHeight:1.7,color:C.txt2}} dangerouslySetInnerHTML={{__html:aiDiag}}/>
          </div>
        )}
        <button onClick={handleSave} style={{...s.btn,width:"100%",marginTop:14,background:`linear-gradient(135deg,${C.verde2},${C.verde})`,color:"#fff",fontSize:13,padding:12}}>
          ✦ Registrar Ocorrência
        </button>
        <button onClick={()=>onAiDiag(form)} disabled={aiLoading} style={{...s.btn,width:"100%",marginTop:8,background:"linear-gradient(135deg,#3730a3,#6366f1)",color:"#fff",fontSize:12,padding:10,opacity:aiLoading?.5:1}}>
          {aiLoading?"⟳ Analisando...":"🤖 Gerar Diagnóstico IA"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// ABA ZELADORIA
// ══════════════════════════════════════════════════
function TabZeladoria({ocorrencias,onAiSubpref}) {
  const [sub,setSub]=useState("Sé");
  const [locModalOc,setLocModalOc]=useState(null);
  const ocs=ocorrencias.filter(o=>o.sub===sub).sort((a,b)=>b.vezes-a.vezes);
  const alerta=ocs.filter(o=>o.vezes>=3);

  const exportCSV=()=>{
    let csv="ID,Tipo,Endereço,Status,Atend.,Data,Responsável\n";
    ocs.forEach(o=>{csv+=`${o.id},"${o.tipo}","${o.end}","${o.status}",${o.vezes},"${new Date(o.data).toLocaleDateString("pt-BR")}","${o.resp}"\n`;});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}));
    a.download=`Zeladoria_${sub.replace(/\//g,"_")}.csv`; a.click();
  };

  return (
    <div style={{padding:20,height:"100%",overflowY:"auto"}}>
      <div style={{fontSize:16,fontWeight:700,marginBottom:16}}>📋 Controle de Zeladoria</div>
      <div style={{display:"flex",gap:4,overflowX:"auto",marginBottom:14,paddingBottom:4}}>
        {SUBPREFS.map(p=>(
          <button key={p} onClick={()=>setSub(p)} style={{...s.btn,flexShrink:0,background:sub===p?"rgba(0,196,122,.1)":"transparent",border:`1px solid ${sub===p?C.verde:C.borda}`,color:sub===p?C.verde:C.txt2,padding:"5px 12px",fontSize:11}}>{p}</button>
        ))}
      </div>
      {alerta.length>0&&(
        <div style={{background:`${C.alerta}0f`,border:`1px solid ${C.alerta}33`,borderRadius:10,padding:12,marginBottom:14,fontSize:12}}>
          <strong style={{color:C.alerta}}>⚠ {alerta.length} local(is) com reincidência:</strong>
          {alerta.slice(0,5).map(o=><div key={o.id} style={{color:C.txt2,marginTop:4}}>→ {o.end} — {o.vezes}x ({o.tipo})</div>)}
        </div>
      )}
      {ocs.length===0
        ?<div style={{color:C.txt2,fontSize:13}}>Nenhuma ocorrência para {sub}.</div>
        :<div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${C.borda}`}}>
                {["#","Tipo","Endereço","Status","Atend.","Data","Links"].map(h=>(
                  <th key={h} style={{padding:"7px 8px",textAlign:"left",color:C.txt2,fontSize:10,textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ocs.slice(0,100).map(o=>(
                <tr key={o.id} style={{borderBottom:`1px solid rgba(30,42,66,.4)`}}>
                  <td style={{padding:"7px 8px",color:C.txt2}}>#{o.id}</td>
                  <td style={{padding:"7px 8px"}}><Tag tipo={o.tipo}/></td>
                  <td style={{padding:"7px 8px",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.end}</td>
                  <td style={{padding:"7px 8px"}}><StatusTag status={o.status}/></td>
                  <td style={{padding:"7px 8px",textAlign:"center",fontWeight:700,color:o.vezes>=3?C.alerta:C.txt}}>{o.vezes}</td>
                  <td style={{padding:"7px 8px",color:C.txt2}}>{new Date(o.data).toLocaleDateString("pt-BR")}</td>
                  <td style={{padding:"7px 8px",whiteSpace:"nowrap"}}>
                    <button onClick={()=>setLocModalOc(o)} style={{background:"none",border:"none",color:C.verde,fontSize:11,cursor:"pointer",marginRight:6,padding:0}}>📍</button>
                    <button onClick={()=>abrirView360(o.sub)} style={{background:"none",border:"none",color:C.ciano,fontSize:11,cursor:"pointer",padding:0}}>👁</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {ocs.length>100&&<div style={{color:C.txt2,fontSize:11,marginTop:8,textAlign:"center"}}>Mostrando 100 de {ocs.length}</div>}
        </div>
      }
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}>
        <button onClick={exportCSV} style={{...s.btn,background:"linear-gradient(135deg,#0f2744,#1d6fa4)",color:"#fff",display:"flex",alignItems:"center",gap:5}}>
          📥 Exportar CSV · {sub}
        </button>
        <button onClick={()=>onAiSubpref(sub,ocs)} style={{...s.btn,background:"linear-gradient(135deg,#3730a3,#6366f1)",color:"#fff",display:"flex",alignItems:"center",gap:5}}>
          🤖 Diagnóstico IA
        </button>
      </div>
      {locModalOc&&<LocalizacaoModal end={locModalOc.end} sub={locModalOc.sub} onClose={()=>setLocModalOc(null)}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════
// ABA RELATÓRIOS
// ══════════════════════════════════════════════════
function TabRelatorio({ocorrencias}) {
  const [sub,setSub]=useState("Sé");
  const [aiTxt,setAiTxt]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  const ocs=ocorrencias.filter(o=>o.sub===sub);
  const byTipo=TIPOS.map(t=>({t,n:ocs.filter(o=>o.tipo===t).length})).filter(x=>x.n>0).sort((a,b)=>b.n-a.n);
  const byStatus=STATUSES.map(t=>({t,n:ocs.filter(o=>o.status===t).length})).filter(x=>x.n>0);
  const maxN=Math.max(...byTipo.map(x=>x.n),1);

  const gerarPDF=()=>{
    const html=`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório NeuroUrbana · ${sub}</title>
<style>body{font-family:Arial,sans-serif;max-width:900px;margin:0 auto;padding:32px;font-size:12px;}
h1{color:#007a4d;border-bottom:2px solid #007a4d;padding-bottom:6px;font-size:16px;}
table{width:100%;border-collapse:collapse;}th{background:#f1f5f9;padding:7px 9px;text-align:left;border:1px solid #e2e8f0;font-size:10px;}
td{padding:6px 9px;border:1px solid #e2e8f0;}
.footer{margin-top:28px;padding-top:12px;border-top:1px solid #ccc;font-size:9px;color:#666;}
@media print{button{display:none;}}</style></head><body>
<h1>🏙 NeuroUrbana — Relatório · ${sub}</h1>
<p>Emitido em ${new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"})}</p>
<table><thead><tr><th>ID</th><th>Tipo</th><th>Endereço</th><th>Status</th><th>Data</th><th>Responsável</th></tr></thead>
<tbody>${ocs.slice(0,200).map(o=>`<tr><td>#${o.id}</td><td>${o.tipo}</td><td>${o.end}</td><td style="color:${STATUS_COR[o.status]};font-weight:700">${o.status}</td><td>${new Date(o.data).toLocaleDateString("pt-BR")}</td><td>${o.resp}</td></tr>`).join("")}</tbody></table>
<div class="footer">NeuroUrbana · Maíra de Melo Moreira CAU A1231707-0 · Human Care Design® | GeoSampa/PRODAM (Decreto 57.770/2017)</div>
<br><button onclick="window.print()">🖨 Imprimir / Salvar PDF</button>
</body></html>`;
    const w=window.open("","_blank"); w.document.write(html); w.document.close();
  };

  const gerarAI=async()=>{
    setAiLoading(true);
    await new Promise(r=>setTimeout(r,700));
    setAiTxt(`<h4>Diagnóstico Técnico · ${sub}</h4><ul>
      <li>Total: <strong>${ocs.length}</strong> ocorrências registradas</li>
      <li>Tipo mais frequente: <strong>${byTipo[0]?.t||"—"}</strong></li>
      <li>Recomendação: priorizar locais com reincidência para intervenção estrutural.</li>
    </ul>`);
    setAiLoading(false);
  };

  return (
    <div style={{padding:20,height:"100%",overflowY:"auto"}}>
      <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>📊 Relatórios por Subprefeitura</div>
      <div style={{fontSize:12,color:C.txt2,marginBottom:16}}>Diagnóstico integrado · Base normativa SP</div>
      <div style={{display:"flex",gap:4,overflowX:"auto",marginBottom:16,paddingBottom:4}}>
        {SUBPREFS.map(p=>(
          <button key={p} onClick={()=>{setSub(p);setAiTxt("");}} style={{...s.btn,flexShrink:0,background:sub===p?"rgba(0,196,122,.1)":"transparent",border:`1px solid ${sub===p?C.verde:C.borda}`,color:sub===p?C.verde:C.txt2,padding:"5px 12px",fontSize:11}}>{p}</button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
        {[[ocs.length,C.verde,"Total"],[ocs.filter(o=>o.vezes>=3).length,C.alerta,"Reincidências"],[ocs.filter(o=>["Aberta","Crítica"].includes(o.status)).length,C.vermelho,"Pendentes"],[ocs.filter(o=>o.status==="Concluída").length,C.verde,"Concluídas"]].map(([n,c,l])=>(
          <div key={l} style={{background:C.card2,border:`1px solid ${C.borda}`,borderRadius:10,padding:14,textAlign:"center"}}>
            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:28,fontWeight:700,color:c}}>{n}</div>
            <div style={{fontSize:10,color:C.txt2,marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        <div style={{background:C.card2,border:`1px solid ${C.borda}`,borderRadius:10,padding:14}}>
          <div style={{fontSize:11,fontWeight:700,color:C.txt2,textTransform:"uppercase",letterSpacing:".5px",marginBottom:10}}>Por Tipo</div>
          {byTipo.map(({t,n})=>(
            <div key={t} style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontSize:11}}>{TIPO_ICON[t]} {t}</span>
                <span style={{fontSize:11,fontWeight:700,color:TIPO_COR[t]}}>{n}</span>
              </div>
              <div style={{height:4,background:C.borda,borderRadius:2}}>
                <div style={{height:"100%",width:`${n/maxN*100}%`,background:TIPO_COR[t],borderRadius:2}}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{background:C.card2,border:`1px solid ${C.borda}`,borderRadius:10,padding:14}}>
          <div style={{fontSize:11,fontWeight:700,color:C.txt2,textTransform:"uppercase",letterSpacing:".5px",marginBottom:10}}>Por Status</div>
          {byStatus.map(({t,n})=>(
            <div key={t} style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontSize:11}}>{t}</span>
                <span style={{fontSize:11,fontWeight:700,color:STATUS_COR[t]||C.txt}}>{n}</span>
              </div>
              <div style={{height:4,background:C.borda,borderRadius:2}}>
                <div style={{height:"100%",width:`${n/ocs.length*100||0}%`,background:STATUS_COR[t]||C.txt2,borderRadius:2}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
        <button onClick={gerarPDF} style={{...s.btn,background:"linear-gradient(135deg,#0f2744,#1d6fa4)",color:"#fff",display:"flex",alignItems:"center",gap:5}}>
          📄 Relatório PDF · {sub}
        </button>
        <button onClick={gerarAI} disabled={aiLoading} style={{...s.btn,background:"linear-gradient(135deg,#3730a3,#6366f1)",color:"#fff",display:"flex",alignItems:"center",gap:5,opacity:aiLoading?.5:1}}>
          {aiLoading?"⟳ Analisando...":"🤖 Diagnóstico IA"}
        </button>
      </div>
      {aiTxt&&(
        <div style={{background:"#0a1020",border:`1px solid rgba(0,196,122,.2)`,borderRadius:10,padding:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <Pulse/>
            <span style={{fontSize:11,fontWeight:700,color:C.accent,textTransform:"uppercase",letterSpacing:".5px"}}>Diagnóstico IA · {sub}</span>
          </div>
          <div style={{fontSize:12,lineHeight:1.7,color:C.txt2}} dangerouslySetInnerHTML={{__html:aiTxt}}/>
        </div>
      )}
      <style>{`.lei{background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.25);border-radius:3px;padding:1px 5px;font-size:10px;color:#a5b4fc;}h4{color:#00c47a;font-size:12px;margin:8px 0 4px;}ul{padding-left:14px;margin:4px 0;}li{margin-bottom:3px;}`}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════
// ABA GEOSAMPA
// ══════════════════════════════════════════════════
function TabGeosampa() {
  const camadas=[
    {n:"Zoneamento (PDE 2016)",cat:"Uso do Solo",lei:"Lei 16.402/2016",cor:"#f59e0b"},
    {n:"Eixos de Estruturação Urbana",cat:"Mobilidade",lei:"Dec. 63.368/2024",cor:"#1d6fa4"},
    {n:"Macroáreas PDE",cat:"Planejamento",lei:"Lei 16.050/2014",cor:"#6366f1"},
    {n:"ZEIS (HIS / HMP)",cat:"Habitação",lei:"PDE Art. 45",cor:"#f97316"},
    {n:"Calçadas / Passeios",cat:"Acessibilidade",lei:"NBR 9050:2020",cor:"#84cc16"},
    {n:"Arborização Urbana",cat:"Meio Ambiente",lei:"Lei 10.365/1987",cor:"#00c47a"},
    {n:"Mancha de Inundação 25 anos",cat:"Risco",lei:"PDE Art. 272",cor:"#ef4444"},
    {n:"Mancha de Inundação 100 anos",cat:"Risco",lei:"PDE Art. 272",cor:"#dc2626"},
    {n:"Estações de Metrô",cat:"Transporte",lei:"Lei 12.587/2012",cor:"#60b4e8"},
    {n:"Operações Urbanas Consorciadas",cat:"Planejamento",lei:"Estatuto da Cidade",cor:"#818cf8"},
    {n:"Equipamentos de Saúde",cat:"Serviços",lei:"SUS / PDE",cor:"#f87171"},
    {n:"Escolas Municipais",cat:"Serviços",lei:"PDE / SME",cor:"#fbbf24"},
    {n:"Tombamentos CONPRESP",cat:"Patrimônio",lei:"Lei 12.350/1997",cor:"#c084fc"},
  ];
  return (
    <div style={{padding:20,height:"100%",overflowY:"auto"}}>
      <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>🌐 Camadas GeoSampa</div>
      <div style={{fontSize:12,color:C.txt2,marginBottom:16}}>Integração WMS/WFS · SMUL/PRODAM · 500+ camadas disponíveis</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10,marginBottom:16}}>
        {camadas.map((c,i)=>(
          <a key={i} href="https://geosampa.prefeitura.sp.gov.br/PaginasPublicas/_SBC.aspx" target="_blank" rel="noreferrer"
            style={{background:C.card2,border:`1px solid ${C.borda}`,borderRadius:10,padding:14,cursor:"pointer",textDecoration:"none",color:C.txt,display:"block"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:c.cor,flexShrink:0}}/>
              <span style={{fontSize:12,fontWeight:600}}>{c.n}</span>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <span style={{...s.tag,background:"rgba(255,255,255,.03)",color:C.txt2,borderColor:C.borda,fontSize:10}}>{c.cat}</span>
              <span style={{...s.tag,background:"rgba(99,102,241,.08)",color:"#a5b4fc",borderColor:"rgba(99,102,241,.2)",fontSize:10}}>{c.lei}</span>
            </div>
          </a>
        ))}
      </div>
      <a href="https://geosampa.prefeitura.sp.gov.br/PaginasPublicas/_SBC.aspx" target="_blank" rel="noreferrer"
        style={{...s.btn,background:"linear-gradient(135deg,#0f2744,#1d6fa4)",color:"#fff",textDecoration:"none",display:"flex",alignItems:"center",gap:6,justifyContent:"center",fontSize:13,padding:12}}>
        ↗ Abrir GeoSampa Completo · PMSP
      </a>
    </div>
  );
}

// ══════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════
export default function App() {
  const [user,setUser]=useState(null);
  const [ocorrencias,setOcorrencias]=useState([]);
  const [carregando,setCarregando]=useState(false);
  const [tab,setTab]=useState("mapa");
  const [selectedId,setSelectedId]=useState(null);
  const [showModal,setShowModal]=useState(false);
  const [filtSub,setFiltSub]=useState("Todas");
  const [filtTipo,setFiltTipo]=useState("");
  const [filtStatus,setFiltStatus]=useState("");
  const [aiDiag,setAiDiag]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  const [toast,setToast]=useState("");
  const [subDiagResult,setSubDiagResult]=useState({txt:"",sub:""});
  const [bgImgSrc,setBgImgSrc]=useState("/imagem_tela_login.jpg");
  const handleBgImgError=()=>{ if(bgImgSrc.endsWith(".jpg")) setBgImgSrc("/imagem_tela_login.png"); };

  useEffect(()=>{
    if(user) {
      setCarregando(true);
      carregarSP156().then(dados=>{ setOcorrencias(dados); setCarregando(false); });
    }
  },[user]);

  const showToast=msg=>{ setToast(msg); setTimeout(()=>setToast(""),3500); };

  const salvarOcorrencia=nova=>{ setOcorrencias(prev=>[nova,...prev]); showToast(`✅ Ocorrência registrada em ${nova.sub}`); };

  const gerarAiModal=async form=>{
    setAiLoading(true);
    await new Promise(r=>setTimeout(r,700));
    setAiDiag(`<h4>Diagnóstico Técnico</h4><ul><li>Tipo <strong>${form.tipo}</strong>: verificar conformidade com normas vigentes</li><li>Comunicar à Subprefeitura ${form.sub}</li></ul>`);
    setAiLoading(false);
  };

  const gerarAiSubpref=async(sub,ocs)=>{
    setSubDiagResult({txt:"⟳ Gerando...",sub});
    await new Promise(r=>setTimeout(r,700));
    setSubDiagResult({txt:`<h4>Diagnóstico · ${sub}</h4><ul><li>Total: ${ocs.length} ocorrências</li><li>Reincidências: ${ocs.filter(o=>o.vezes>=3).length} locais</li></ul>`,sub});
  };

  const handleLogout=async()=>{ await signOut(auth); setUser(null); setOcorrencias([]); };

  if(!user) return <LoginScreen onLoginSuccess={setUser}/>;

  const filtrados=ocorrencias.filter(o=>
    (filtSub==="Todas"||o.sub===filtSub)&&
    (!filtTipo||o.tipo===filtTipo)&&
    (!filtStatus||o.status===filtStatus)
  ).sort((a,b)=>b.vezes-a.vezes);

  const stats={ total:filtrados.length, pendentes:filtrados.filter(o=>["Aberta","Crítica"].includes(o.status)).length, reincid:filtrados.filter(o=>o.vezes>=3).length };
  const selectedOc=ocorrencias.find(o=>o.id===selectedId);
  const TABS=[["mapa","🗺 Mapa"],["zeladoria","📋 Zeladoria"],["relatorio","📊 Relatórios"],["geosampa","🌐 GeoSampa"]];

  return (
    <div style={{position:"fixed",inset:0,overflow:"hidden"}}>
      <img src={bgImgSrc} onError={handleBgImgError} alt="" style={{display:"none"}}/>
      <div style={{position:"fixed",inset:0,backgroundImage:`url('${bgImgSrc}')`,backgroundSize:"cover",backgroundPosition:"center"}}/>
      <div style={{position:"relative",zIndex:1,width:"90vw",height:"100vh",margin:"0 auto",background:C.bg,color:C.txt,display:"flex",flexDirection:"column",fontFamily:"Inter,system-ui,sans-serif",boxShadow:"0 0 40px rgba(0,0,0,.6)"}}>
      {/* TOPBAR */}
      <div style={{background:"linear-gradient(90deg,#05080e,#0a1020)",borderBottom:`1px solid ${C.borda}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",height:52,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:34,height:34,background:`linear-gradient(135deg,${C.verde},${C.ciano})`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🏙</div>
          <div>
            <div style={{fontFamily:"'Space Grotesk',Inter,sans-serif",fontSize:14,fontWeight:700}}>NeuroUrbana</div>
            <div style={{fontSize:10,color:C.txt2}}>{user.displayName} · Controle de Ocorrências</div>
          </div>
        </div>
        <div style={{display:"flex",gap:2}}>
          {TABS.map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{...s.btn,background:tab===k?"rgba(0,196,122,.12)":"transparent",border:`1px solid ${tab===k?C.verde:"transparent"}`,color:tab===k?C.verde:C.txt2,padding:"6px 12px",fontSize:12}}>
              {l}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{padding:"3px 9px",borderRadius:12,fontSize:10,fontWeight:700,background:"rgba(0,196,122,.12)",color:C.verde,border:`1px solid rgba(0,196,122,.25)`}}>✦ IA</span>
          <span style={{padding:"3px 9px",borderRadius:12,fontSize:10,fontWeight:700,background:"rgba(29,111,164,.12)",color:"#5bb3e8",border:"1px solid rgba(29,111,164,.25)"}}>SP156</span>
          <button onClick={()=>{setShowModal(true);setAiDiag("");}} style={{...s.btn,background:`linear-gradient(135deg,${C.verde2},${C.verde})`,color:"#fff",fontSize:12,padding:"6px 14px"}}>
            + Nova Ocorrência
          </button>
          <button onClick={handleLogout} style={{border:"none",background:C.card2,color:C.txt2,padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:12}}>
            🚪 Sair
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {/* PAINEL ESQUERDO */}
        <div style={{width:320,flexShrink:0,background:C.card,borderRight:`1px solid ${C.borda}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"10px 12px 0",borderBottom:`1px solid ${C.borda}`,flexShrink:0}}>
            <div style={{display:"flex",gap:3,overflowX:"auto",paddingBottom:8}}>
              {["Todas",...SUBPREFS].map(p=>(
                <button key={p} onClick={()=>{setFiltSub(p);setSelectedId(null);}} style={{...s.btn,flexShrink:0,background:filtSub===p?"rgba(0,196,122,.1)":"transparent",border:`1px solid ${filtSub===p?C.verde:C.borda}`,color:filtSub===p?C.verde:C.txt2,padding:"4px 10px",fontSize:10}}>{p}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:6,marginBottom:10}}>
              <select style={{...s.select,fontSize:11}} value={filtTipo} onChange={e=>setFiltTipo(e.target.value)}>
                <option value="">Todos os tipos</option>
                {TIPOS.map(t=><option key={t}>{t}</option>)}
              </select>
              <select style={{...s.select,fontSize:11}} value={filtStatus} onChange={e=>setFiltStatus(e.target.value)}>
                <option value="">Todos status</option>
                {STATUSES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10}}>
              {[[stats.total,C.verde,"Total"],[stats.pendentes,C.vermelho,"Pendentes"],[stats.reincid,C.alerta,"⚠ Reincid."]].map(([n,c,l])=>(
                <div key={l} style={{background:C.card2,border:`1px solid ${C.borda}`,borderRadius:8,padding:10,textAlign:"center"}}>
                  <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:22,fontWeight:700,color:c}}>{n}</div>
                  <div style={{fontSize:9,color:C.txt2,textTransform:"uppercase",letterSpacing:".5px",marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{overflowY:"auto",flex:1,padding:"10px 12px"}}>
            {carregando&&<div style={{color:C.txt2,fontSize:12,padding:16,textAlign:"center"}}>⟳ Carregando dados SP156...</div>}
            {!carregando&&filtrados.length===0&&<div style={{color:C.txt2,fontSize:12,padding:16,textAlign:"center"}}>Nenhuma ocorrência encontrada</div>}
            {filtrados.slice(0,150).map(oc=>{
              const isAlerta=oc.vezes>=3, isSelected=selectedId===oc.id;
              const cor=isAlerta?C.alerta:STATUS_COR[oc.status]||C.txt2;
              return (
                <div key={oc.id} onClick={()=>setSelectedId(isSelected?null:oc.id)}
                  style={{background:isSelected?"rgba(0,196,122,.05)":isAlerta?"rgba(255,59,48,.03)":C.card2,border:`1px solid ${isSelected?C.verde:isAlerta?`${C.alerta}66`:C.borda}`,borderRadius:10,padding:12,marginBottom:8,cursor:"pointer",position:"relative"}}>
                  {isAlerta&&<div style={{position:"absolute",top:8,right:8,background:C.alerta,color:"#fff",borderRadius:20,fontSize:9,fontWeight:800,padding:"2px 7px"}}>⚠ {oc.vezes}x</div>}
                  <div style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:7}}>
                    <div style={{width:32,height:32,borderRadius:8,background:`${cor}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{TIPO_ICON[oc.tipo]}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{oc.end}</div>
                      <div style={{fontSize:10,color:C.txt2,marginTop:2}}>📍 {oc.sub}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    <Tag tipo={oc.tipo}/><StatusTag status={oc.status}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ÁREA DIREITA */}
        <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          {tab==="mapa"&&(
            <div style={{display:"flex",flex:1,overflow:"hidden"}}>
              <div style={{flex:1,position:"relative"}}>
                <MapaSP ocorrencias={ocorrencias} selectedId={selectedId} onSelect={setSelectedId} filtSub={filtSub} filtTipo={filtTipo} filtStatus={filtStatus}/>
              </div>
              <div style={{width:260,borderLeft:`1px solid ${C.borda}`,display:"flex",flexDirection:"column",background:C.card,overflow:"hidden"}}>
                <div style={{padding:"10px 12px",borderBottom:`1px solid ${C.borda}`,fontSize:11,fontWeight:700,color:C.txt2,textTransform:"uppercase"}}>Detalhe</div>
                <DetalheOc oc={selectedOc} onClose={()=>setSelectedId(null)}/>
              </div>
            </div>
          )}
          {tab==="zeladoria"&&<TabZeladoria ocorrencias={ocorrencias} onAiSubpref={gerarAiSubpref}/>}
          {tab==="relatorio"&&<TabRelatorio ocorrencias={ocorrencias}/>}
          {tab==="geosampa"&&<TabGeosampa/>}
        </div>
      </div>

      {showModal&&<Modal onClose={()=>setShowModal(false)} onSave={salvarOcorrencia} aiDiag={aiDiag} onAiDiag={gerarAiModal} aiLoading={aiLoading}/>}
      <Toast msg={toast}/>

      {subDiagResult.txt&&(
        <div style={{position:"fixed",bottom:20,left:20,background:C.card,border:`1px solid rgba(0,196,122,.3)`,borderRadius:12,padding:16,maxWidth:380,zIndex:8000,maxHeight:"50vh",overflowY:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}><Pulse/><span style={{fontSize:11,fontWeight:700,color:C.accent,textTransform:"uppercase"}}>IA · {subDiagResult.sub}</span></div>
            <button onClick={()=>setSubDiagResult({txt:"",sub:""})} style={{background:"transparent",border:"none",color:C.txt2,cursor:"pointer",fontSize:14}}>✕</button>
          </div>
          <div style={{fontSize:12,lineHeight:1.7,color:C.txt2}} dangerouslySetInnerHTML={{__html:subDiagResult.txt}}/>
        </div>
      )}

      <style>{`
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#1e2a42;border-radius:2px;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes pulseR{0%,100%{transform:scale(1);opacity:0.6}50%{transform:scale(1.4);opacity:0.2}}
        h4{color:#00c47a;font-size:12px;margin:8px 0 4px;}
        ul{padding-left:14px;margin:4px 0;}
        li{margin-bottom:3px;}
      `}</style>
      </div>
    </div>
  );
}
