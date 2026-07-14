import { useState, useEffect, createContext, useContext, useMemo } from "react";

// ══════════════════════════════════════════════════
// FIREBASE CONFIG — SUBSTITUA ESTES 3 VALORES DEPOIS
// ══════════════════════════════════════════════════
// Instruções: 
// 1. Vá a firebase.google.com → seu projeto → Settings (⚙️)
// 2. Procure por "Web app" → copie os 3 valores abaixo
const FIREBASE_CONFIG = {
  apiKey: "SUBSTITUA_AQUI_COM_SEU_API_KEY", // Ex: AIzaSyD_...
  projectId: "SUBSTITUA_AQUI_COM_PROJECT_ID", // Ex: neurourbana-12345
  authDomain: "SUBSTITUA_AQUI_COM_AUTH_DOMAIN", // Ex: neurourbana-12345.firebaseapp.com
  databaseURL: "https://SUBSTITUA_COM_PROJECT_ID.firebaseio.com",
  storageBucket: "SUBSTITUA_COM_PROJECT_ID.appspot.com",
};

// ══════════════════════════════════════════════════
// LISTA DE EMAILS AUTORIZADOS
// ══════════════════════════════════════════════════
const EMAILS_AUTORIZADOS = [
  "sarahgottardi1987@gmail.com",
  "suporte.iaethics@gmail.com",
  // ADICIONE AQUI quando precisar
];

// ══════════════════════════════════════════════════
// DADOS EXEMPLO (simulando Firestore)
// ══════════════════════════════════════════════════
const SEED_FIRESTORE = [
  {id:1,sub:"Sé",end:"R. Florêncio de Abreu, 701",tipo:"Calçada",status:"Crítica",data:"2026-06-10T08:30",resp:"João Silva",desc:"Calçada irregular",acao:"Interdição parcial",vezes:4,x:300,y:220,fotos:[],cep:"01005-000",fonte:"NeuroUrbana"},
  {id:2,sub:"Sé",end:"Praça da Sé, s/n",tipo:"Acessibilidade",status:"Em andamento",data:"2026-06-05T10:00",resp:"Maria Costa",desc:"Piso tátil danificado",acao:"Reposição em andamento",vezes:2,x:305,y:225,fotos:[],cep:"01005-010",fonte:"NeuroUrbana"},
  {id:3,sub:"Pinheiros",end:"R. Augusta, 1200",tipo:"Iluminação",status:"Aberta",data:"2026-06-18T22:15",resp:"—",desc:"8 luminárias apagadas",acao:"SP156 registrado",vezes:1,x:220,y:260,fotos:[],cep:"01305-100",fonte:"SP156"},
  {id:4,sub:"Pinheiros",end:"Av. Rebouças, 3450",tipo:"Inundação",status:"Crítica",data:"2026-06-12T16:45",resp:"Carlos Mendes",desc:"Alagamento recorrente",acao:"Desobstrução 3x",vezes:5,x:215,y:255,fotos:[],cep:"01411-100",fonte:"SP156"},
  {id:5,sub:"Lapa",end:"R. Guaicurus, 890",tipo:"Vegetação",status:"Concluída",data:"2026-05-28T09:00",resp:"Ana Freitas",desc:"Galhos na fiação",acao:"Poda realizada",vezes:1,x:170,y:220,fotos:[],cep:"05089-010",fonte:"NeuroUrbana"},
];

const SUBPREFS = ["Sé","Pinheiros","Lapa","Mooca","Santana/Tucuruvi","Jaçanã/Tremembé","Butantã","Ipiranga","Penha","Santo Amaro","Campo Limpo","M'Boi Mirim","Aricanduva","Vila Prudente","São Miguel"];
const TIPOS = ["Calçada","Inundação","Iluminação","Vegetação","Limpeza","Acessibilidade","Pavimentação","Segurança"];
const STATUSES = ["Aberta","Em andamento","Concluída","Crítica"];

const TIPO_ICON = { Calçada:"🔲", Inundação:"💧", Iluminação:"💡", Vegetação:"🌳", Limpeza:"🧹", Acessibilidade:"♿", Pavimentação:"🔧", Segurança:"🚨" };
const TIPO_COR = { Calçada:"#00c47a", Inundação:"#ef4444", Iluminação:"#f59e0b", Vegetação:"#7c3aed", Limpeza:"#06b6d4", Acessibilidade:"#3b82f6", Pavimentação:"#f97316", Segurança:"#ef4444" };
const STATUS_COR = { "Aberta":"#ef4444", "Em andamento":"#f59e0b", "Concluída":"#00c47a", "Crítica":"#ff3b30" };

const DARK = {
  bg:"#07090f", card:"#0f1420", card2:"#131929", borda:"#1e2a42",
  verde:"#00c47a", verde2:"#008f58", azul:"#1d6fa4", laranja:"#f59e0b",
  vermelho:"#ef4444", roxo:"#7c3aed", ciano:"#06b6d4",
  txt:"#e8edf5", txt2:"#6b7fa0", accent:"#00e5c0", alerta:"#ff3b30",
};

function buildStyles(C) {
  return {
    btn:{ border:"none", borderRadius:8, padding:"9px 14px", fontWeight:700, cursor:"pointer", fontSize:12, transition:"opacity .2s" },
    input:{ background:"#0a0e18", border:`1px solid ${C.borda}`, borderRadius:8, padding:"9px 12px", color:C.txt, fontSize:13, outline:"none", width:"100%", fontFamily:"inherit" },
  };
}

const ThemeContext = createContext(null);
function useThemeCtx() { return useContext(ThemeContext); }

// ══════════════════════════════════════════════════
// TELA DE LOGIN
// ══════════════════════════════════════════════════
function LoginScreen({ onLoginSuccess }) {
  const C = DARK;
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setErro("");
    setLoading(true);

    // Simular delay (como se fosse chamada ao Firebase)
    await new Promise(r => setTimeout(r, 800));

    if (!EMAILS_AUTORIZADOS.includes(email)) {
      setErro("❌ Email não autorizado. Verifique com o administrador.");
      setLoading(false);
      return;
    }

    if (senha.length < 6) {
      setErro("❌ Senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    // ✅ Login simulado bem-sucedido
    onLoginSuccess({ email, displayName: email.split("@")[0] });
  };

  const handleGoogleLogin = () => {
    setErro("");
    setLoading(true);
    setTimeout(() => {
      // Em produção: usar Firebase Google Auth
      // Por enquanto, simular com email de teste
      const testEmail = "sarah@exemplo.com";
      if (EMAILS_AUTORIZADOS.includes(testEmail)) {
        onLoginSuccess({ email: testEmail, displayName: "Sarah" });
      } else {
        setErro("❌ Conta Google não autorizada.");
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div style={{
      background: `linear-gradient(135deg,${C.bg},${C.card})`,
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Inter,sans-serif",
      color: C.txt,
    }}>
      <div style={{
        background: C.card,
        border: `1px solid ${C.borda}`,
        borderRadius: 16,
        padding: 40,
        width: "100%",
        maxWidth: 400,
        boxShadow: "0 16px 64px rgba(0,0,0,.5)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏙</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>SP·PLAT Zeladoria</div>
          <div style={{ fontSize: 13, color: C.txt2 }}>Sistema de Controle de Ocorrências Urbanas</div>
        </div>

        {erro && (
          <div style={{
            background: "rgba(239,68,68,.1)",
            border: "1px solid rgba(239,68,68,.3)",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            fontSize: 12,
            color: "#fca5a5",
          }}>
            {erro}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.txt2, display: "block", marginBottom: 6 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu-email@exemplo.com"
            style={{
              background: "#0a0e18",
              border: `1px solid ${C.borda}`,
              borderRadius: 8,
              padding: "9px 12px",
              color: C.txt,
              fontSize: 13,
              outline: "none",
              width: "100%",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.txt2, display: "block", marginBottom: 6 }}>Senha</label>
          <input
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            placeholder="••••••"
            style={{
              background: "#0a0e18",
              border: `1px solid ${C.borda}`,
              borderRadius: 8,
              padding: "9px 12px",
              color: C.txt,
              fontSize: 13,
              outline: "none",
              width: "100%",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
            disabled={loading}
            onKeyPress={e => e.key === "Enter" && handleLogin()}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            background: `linear-gradient(135deg,${C.verde2},${C.verde})`,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: 12,
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? "⟳ Entrando..." : "Entrar"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, height: 1, background: C.borda }} />
          <span style={{ fontSize: 11, color: C.txt2 }}>OU</span>
          <div style={{ flex: 1, height: 1, background: C.borda }} />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            background: C.card2,
            border: `1px solid ${C.borda}`,
            color: C.txt,
            borderRadius: 8,
            fontWeight: 700,
            cursor: "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          🔐 Entrar com Google
        </button>

        <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C.borda}`, fontSize: 11, color: C.txt2, textAlign: "center" }}>
          <strong>Teste:</strong> Use sarahgottardi1987@gmail.com / senha123
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// COMPONENTES DO ARTEFATO PRINCIPAL
// ══════════════════════════════════════════════════
function Tag({ tipo }) {
  const bg = TIPO_COR[tipo] || "#00c47a";
  return <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:4, fontWeight:700, fontSize:10, border:"1px solid", background:`${bg}18`, color:bg, borderColor:`${bg}44` }}>{tipo}</span>;
}

function StatusTag({ status }) {
  const c = STATUS_COR[status] || "#6b7fa0";
  return <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:4, fontWeight:700, fontSize:10, border:"1px solid", background:`${c}15`, color:c, borderColor:`${c}35` }}>{status}</span>;
}

function MapaSP({ ocorrencias, filtSub }) {
  const C = DARK;
  const filtered = ocorrencias.filter(o => !filtSub || filtSub === "Todas" || o.sub === filtSub);

  return (
    <div style={{ width:"100%", height:"100%", background:C.bg, position:"relative", overflow:"hidden" }}>
      <svg width="100%" height="100%" viewBox="0 0 600 480" style={{ background: C.bg }}>
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#0f1a2e" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="600" height="480" fill="url(#grid)"/>
        
        {filtered.map(oc => {
          const cor = STATUS_COR[oc.status] || C.txt2;
          return (
            <g key={oc.id}>
              <circle cx={oc.x} cy={oc.y} r="8" fill={cor} opacity="0.8"/>
              <text x={oc.x} y={oc.y+1} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#fff" style={{pointerEvents:"none"}}>
                {TIPO_ICON[oc.tipo]}
              </text>
            </g>
          );
        })}
      </svg>

      <div style={{ position:"absolute", top:16, left:16, background:`${C.card}ee`, border:`1px solid ${C.borda}`, borderRadius:10, padding:"10px 12px", fontSize:11 }}>
        <div style={{fontSize:9, fontWeight:700, color:C.txt2, marginBottom:6}}>Total: {filtered.length} ocorrências</div>
      </div>
    </div>
  );
}

function DetalheOc({ oc, C }) {
  if (!oc) return <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:C.txt2}}>Clique numa ocorrência</div>;

  return (
    <div style={{flex:1, overflowY:"auto", padding:16}}>
      <div style={{fontSize:15, fontWeight:700, marginBottom:8, color:C.txt}}>{oc.end}</div>
      <div style={{display:"flex", gap:6, flexWrap:"wrap", marginBottom:12}}>
        <Tag tipo={oc.tipo}/><StatusTag status={oc.status}/>
      </div>
      <div style={{background:C.card2, border:`1px solid ${C.borda}`, borderRadius:8, padding:10, marginBottom:8}}>
        <div style={{fontSize:10, color:C.txt2, marginBottom:4}}>📋 Descrição</div>
        <div style={{fontSize:12, color:C.txt}}>{oc.desc}</div>
      </div>
      <div style={{background:C.card2, border:`1px solid ${C.borda}`, borderRadius:8, padding:10}}>
        <div style={{fontSize:10, color:C.txt2, marginBottom:4}}>🔧 Ação</div>
        <div style={{fontSize:12, color:C.txt}}>{oc.acao}</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════
export default function App() {
  const C = DARK;
  const s = useMemo(() => buildStyles(C), [C]);
  const ctxValue = useMemo(() => ({ C, s }), [C, s]);

  const [user, setUser] = useState(null);
  const [ocorrencias, setOcorrencias] = useState(SEED_FIRESTORE);
  const [filtSub, setFiltSub] = useState("Todas");
  const [selectedId, setSelectedId] = useState(null);

  // Simular carregamento do Firestore
  useEffect(() => {
    if (user) {
      // Em produção: `db.collection('ocorrencias').onSnapshot(...)`
      console.log("Firestore carregado para usuário:", user.email);
    }
  }, [user]);

  if (!user) {
    return <LoginScreen onLoginSuccess={setUser} />;
  }

  const selectedOc = ocorrencias.find(o => o.id === selectedId);

  return (
    <ThemeContext.Provider value={ctxValue}>
    <div style={{background:C.bg, color:C.txt, height:"100vh", display:"flex", flexDirection:"column", fontFamily:"Inter,system-ui,sans-serif"}}>
      
      {/* TOPBAR */}
      <div style={{background:`linear-gradient(90deg,#05080e,#0a1020)`, borderBottom:`1px solid ${C.borda}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", height:52}}>
        <div style={{display:"flex", alignItems:"center", gap:12}}>
          <div style={{width:34, height:34, background:`linear-gradient(135deg,${C.verde},${C.ciano})`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18}}>🏙</div>
          <div>
            <div style={{fontFamily:"'Space Grotesk',Inter,sans-serif", fontSize:14, fontWeight:700}}>SP·PLAT Zeladoria</div>
            <div style={{fontSize:10, color:C.txt2}}>Bem-vindo, {user.displayName}!</div>
          </div>
        </div>
        <button onClick={() => setUser(null)} style={{border:"none", background:C.card2, color:C.txt2, padding:"6px 12px", borderRadius:8, cursor:"pointer", fontSize:12}}>
          🚪 Sair
        </button>
      </div>

      {/* MAIN */}
      <div style={{display:"flex", flex:1, overflow:"hidden"}}>
        
        {/* PAINEL ESQUERDO */}
        <div style={{width:320, flexShrink:0, background:C.card, borderRight:`1px solid ${C.borda}`, display:"flex", flexDirection:"column", overflow:"hidden"}}>
          <div style={{padding:"10px 12px 0", borderBottom:`1px solid ${C.borda}`, flexShrink:0}}>
            <div style={{display:"flex", gap:3, overflowX:"auto", paddingBottom:8, marginBottom:10}}>
              {["Todas",...SUBPREFS].map(p => (
                <button key={p} onClick={() => setFiltSub(p)}
                  style={{...s.btn, flexShrink:0, background:filtSub===p?"rgba(0,196,122,.1)":"transparent", border:`1px solid ${filtSub===p?C.verde:C.borda}`, color:filtSub===p?C.verde:C.txt2, padding:"4px 10px", fontSize:10}}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div style={{overflowY:"auto", flex:1, padding:"10px 12px"}}>
            {ocorrencias.filter(o => !filtSub || filtSub === "Todas" || o.sub === filtSub).map(oc => (
              <div key={oc.id} onClick={() => setSelectedId(selectedId === oc.id ? null : oc.id)}
                style={{background:selectedId===oc.id?"rgba(0,196,122,.05)":"#131929", border:`1px solid ${selectedId===oc.id?C.verde:C.borda}`, borderRadius:10, padding:12, marginBottom:8, cursor:"pointer"}}>
                <div style={{fontSize:12, fontWeight:600, marginBottom:4, color:C.txt}}>{oc.end.slice(0,30)}</div>
                <div style={{display:"flex", gap:5, flexWrap:"wrap"}}>
                  <Tag tipo={oc.tipo}/><StatusTag status={oc.status}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ÁREA DIREITA */}
        <div style={{flex:1, overflow:"hidden", display:"flex"}}>
          <div style={{flex:1, position:"relative"}}>
            <MapaSP ocorrencias={ocorrencias} filtSub={filtSub}/>
          </div>
          <div style={{width:260, borderLeft:`1px solid ${C.borda}`, display:"flex", flexDirection:"column", background:C.card, overflow:"hidden"}}>
            <div style={{padding:"10px 12px", borderBottom:`1px solid ${C.borda}`, fontSize:11, fontWeight:700, color:C.txt2}}>
              Detalhe
            </div>
            <DetalheOc oc={selectedOc} C={C}/>
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e2a42; border-radius: 2px; }
      `}</style>
    </div>
    </ThemeContext.Provider>
  );
}