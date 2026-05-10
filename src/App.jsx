import { useState, useEffect, useRef, useCallback } from "react";

// ─── STORAGE ──────────────────────────────────────────────────────
function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

const USERS_KEY   = "cromosol_users";
const TICKETS_KEY = "cromosol_tickets";
const NOTIFS_KEY  = "cromosol_notifs_";

const DEFAULT_USERS = [
  { id:"admin", name:"Administrador",  role:"admin",     password:"admin123", active:true },
  { id:"a01",   name:"Lucas Méndez",    role:"activador", password:"1234",     active:true },
  { id:"a02",   name:"Sofía Ruiz",      role:"activador", password:"1234",     active:true },
  { id:"a03",   name:"Martín Torres",   role:"activador", password:"1234",     active:true },
  { id:"a04",   name:"Valentina López", role:"activador", password:"1234",     active:true },
  { id:"a05",   name:"Nicolás Vera",    role:"activador", password:"1234",     active:true },
  { id:"a06",   name:"Camila Díaz",     role:"activador", password:"1234",     active:true },
  { id:"a07",   name:"Rodrigo Soto",    role:"activador", password:"1234",     active:true },
  { id:"a08",   name:"Florencia Paz",   role:"activador", password:"1234",     active:true },
  { id:"a09",   name:"Ignacio Ramos",   role:"activador", password:"1234",     active:true },
  { id:"a10",   name:"Agustina Molina", role:"activador", password:"1234",     active:true },
  { id:"c01",   name:"Ana Gómez",       role:"cuentas",   password:"1234",     active:true },
  { id:"c02",   name:"Diego Ferrer",    role:"cuentas",   password:"1234",     active:true },
];

function getUsers()        { return lsGet(USERS_KEY, DEFAULT_USERS); }
function saveUsers(u)      { lsSet(USERS_KEY, u); }
function getTickets()      { return lsGet(TICKETS_KEY, []); }
function saveTickets(t)    { lsSet(TICKETS_KEY, t); }
function getNotifs(uid)    { return lsGet(NOTIFS_KEY + uid, []); }
function saveNotifs(uid,n) { lsSet(NOTIFS_KEY + uid, n); }

// ─── DATOS ────────────────────────────────────────────────────────
const CATEGORIAS = [
  { label:"Devoluciones", titulos:[
    "Devolución pendiente de acreditación",
    "Devolución por producto incorrecto",
    "Devolución no registrada en sistema",
    "Cliente solicita devolución urgente",
  ]},
  { label:"Facturación / Cobranza", titulos:[
    "Error en monto facturado",
    "Factura duplicada",
    "Cargo no reconocido por el cliente",
    "Retraso en aplicación de pago",
  ]},
  { label:"Datos incorrectos de cliente", titulos:[
    "Número de teléfono erróneo",
    "Nombre del cliente mal cargado",
    "CUIT/CUIL incorrecto",
    "Dirección de entrega desactualizada",
  ]},
  { label:"Consultas generales", titulos:[
    "Consulta sobre estado de cuenta",
    "Consulta sobre campaña activa",
    "Consulta sobre límite de crédito",
    "Consulta sobre historial de compras",
  ]},
  { label:"General / Otro", titulos:[] },
];

const ESTADOS = {
  iniciado:   { label:"Iniciado",   color:"#6366f1" },
  en_proceso: { label:"En proceso", color:"#f59e0b" },
  resuelto:   { label:"Resuelto",   color:"#10b981" },
};

const ROLES = { admin:"Admin", activador:"Activador", cuentas:"Cuentas" };

function tktId() { return "TKT-" + String(Date.now()).slice(-6); }
function nuid()  { return Date.now().toString(36) + Math.random().toString(36).slice(2,5); }

// ─── TEMA ─────────────────────────────────────────────────────────
const G = {
  bg:"#08080f", surface:"#10101a", card:"#16161f", border:"#222235",
  accent:"#1d3a8a", accentL:"#4a6fd4", text:"#e8e8f2", muted:"#6a6a88",
  danger:"#ef4444", success:"#10b981", warn:"#f59e0b", red:"#cc2200",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body,#root{height:100%}
  body{background:${G.bg};color:${G.text};font-family:'Plus Jakarta Sans',sans-serif;min-height:100vh}
  ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:${G.border};border-radius:4px}
  input,textarea,select,button{font-family:'Plus Jakarta Sans',sans-serif;outline:none}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .fu{animation:fadeUp .3s ease both}
  .si{animation:slideIn .3s ease both}
`;

const mono = { fontFamily:"'JetBrains Mono',monospace" };
const iS = { background:G.bg, border:"1px solid "+G.border, borderRadius:8, color:G.text, padding:"10px 14px", fontSize:14, width:"100%" };

// ─── LOGO SVG ─────────────────────────────────────────────────────
function CromosolLogo({ size = 36 }) {
  return (
    <svg width={size * 3.2} height={size} viewBox="0 0 160 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ícono */}
      <circle cx="25" cy="25" r="22" fill="#cc2200" opacity="0.15"/>
      <path d="M25 5 C14 5 5 14 5 25 C5 36 14 45 25 45 C30 45 34.5 43 37.8 39.8 L31 33 C29.3 34.6 27.3 35.5 25 35.5 C19.2 35.5 14.5 30.8 14.5 25 C14.5 19.2 19.2 14.5 25 14.5 C27.3 14.5 29.4 15.4 31 17 L37.8 10.2 C34.5 7 30 5 25 5Z" fill="#cc2200"/>
      <path d="M37.8 10.2 L31 17 L38 24 L45 17 Z" fill="#1d3a8a"/>
      <path d="M31 33 L37.8 39.8 L45 33 L38 26 Z" fill="#1d3a8a"/>
      {/* Texto */}
      <text x="52" y="32" fontSize="20" fontWeight="800" fill={G.text} fontFamily="'Plus Jakarta Sans',sans-serif" letterSpacing="-0.5">cromosol</text>
    </svg>
  );
}

function CromosolLogoSmall() {
  return (
    <svg width="110" height="28" viewBox="0 0 160 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 5 C14 5 5 14 5 25 C5 36 14 45 25 45 C30 45 34.5 43 37.8 39.8 L31 33 C29.3 34.6 27.3 35.5 25 35.5 C19.2 35.5 14.5 30.8 14.5 25 C14.5 19.2 19.2 14.5 25 14.5 C27.3 14.5 29.4 15.4 31 17 L37.8 10.2 C34.5 7 30 5 25 5Z" fill="#cc2200"/>
      <path d="M37.8 10.2 L31 17 L38 24 L45 17 Z" fill="#1d3a8a"/>
      <path d="M31 33 L37.8 39.8 L45 33 L38 26 Z" fill="#1d3a8a"/>
      <text x="52" y="32" fontSize="20" fontWeight="800" fill={G.text} fontFamily="'Plus Jakarta Sans',sans-serif" letterSpacing="-0.5">cromosol</text>
    </svg>
  );
}

// ─── ATOMS ────────────────────────────────────────────────────────
function Badge({ estado }) {
  const e = ESTADOS[estado] || ESTADOS.iniciado;
  return <span style={{ background:e.color+"22", color:e.color, border:"1px solid "+e.color+"44", borderRadius:6, padding:"2px 10px", fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase", ...mono, whiteSpace:"nowrap" }}>{e.label}</span>;
}

function RoleBadge({ role }) {
  const cols = { admin:"#a855f7", activador:G.accentL, cuentas:G.success };
  const c = cols[role] || G.muted;
  return <span style={{ background:c+"22", color:c, border:"1px solid "+c+"44", borderRadius:6, padding:"2px 8px", fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase", ...mono }}>{ROLES[role]||role}</span>;
}

function Btn({ children, variant="primary", style:s, ...p }) {
  const v = {
    primary:{ background:G.accent, color:"#fff", border:"none" },
    ghost:  { background:"transparent", color:G.muted, border:"1px solid "+G.border },
    danger: { background:G.danger+"18", color:G.danger, border:"1px solid "+G.danger+"33" },
    success:{ background:G.success+"18", color:G.success, border:"1px solid "+G.success+"33" },
    warn:   { background:G.warn+"18", color:G.warn, border:"1px solid "+G.warn+"33" },
  };
  return <button style={{ padding:"9px 18px", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", ...v[variant], ...s }} {...p}>{children}</button>;
}

function Field({ label, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {label && <label style={{ fontSize:11, color:G.muted, letterSpacing:1.2, textTransform:"uppercase", fontWeight:700 }}>{label}</label>}
      {children}
    </div>
  );
}

// ─── TOASTS ───────────────────────────────────────────────────────
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((title, body, icon="🔔") => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, title, body, icon }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000);
  }, []);
  const dismiss = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, add, dismiss };
}

function Toasts({ toasts, onDismiss }) {
  return (
    <div style={{ position:"fixed", top:68, right:16, zIndex:999, display:"flex", flexDirection:"column", gap:8, maxWidth:310 }}>
      {toasts.map(t => (
        <div key={t.id} onClick={() => onDismiss(t.id)} className="si" style={{
          background:G.card, border:"1px solid "+G.accentL+"44", borderLeft:"3px solid "+G.accent,
          borderRadius:10, padding:"12px 14px", cursor:"pointer",
          display:"flex", gap:10, alignItems:"flex-start", boxShadow:"0 8px 24px #0009",
        }}>
          <span style={{ fontSize:16, flexShrink:0 }}>{t.icon}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:12, fontWeight:700, color:G.accentL, marginBottom:2 }}>{t.title}</p>
            <p style={{ fontSize:11, color:G.muted, lineHeight:1.4 }}>{t.body}</p>
          </div>
          <span style={{ color:G.muted, fontSize:18, flexShrink:0 }}>×</span>
        </div>
      ))}
    </div>
  );
}

// ─── NOTIF PANEL ──────────────────────────────────────────────────
function NotifBtn({ notifs, onClear }) {
  const [open, setOpen] = useState(false);
  const unread = notifs.filter(n => !n.read).length;
  return (
    <div style={{ position:"relative" }}>
      <button onClick={() => setOpen(!open)} style={{ background:"none", border:"1px solid "+G.border, borderRadius:8, color:G.muted, padding:"6px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontSize:15 }}>
        🔔 {unread > 0 && <span style={{ background:G.accent, color:"#fff", borderRadius:10, padding:"1px 6px", fontSize:10, fontWeight:700, ...mono }}>{unread}</span>}
      </button>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, background:G.card, border:"1px solid "+G.border, borderRadius:12, width:290, zIndex:300, boxShadow:"0 12px 40px #000a", overflow:"hidden" }}>
          <div style={{ padding:"12px 16px", borderBottom:"1px solid "+G.border, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:13, fontWeight:700 }}>Notificaciones</span>
            {notifs.length > 0 && <button onClick={onClear} style={{ background:"none", border:"none", color:G.muted, fontSize:11, cursor:"pointer" }}>Limpiar</button>}
          </div>
          <div style={{ maxHeight:300, overflowY:"auto" }}>
            {notifs.length === 0
              ? <p style={{ padding:"20px 16px", color:G.muted, fontSize:13, textAlign:"center" }}>Sin notificaciones</p>
              : notifs.slice().reverse().map((n,i) => (
                <div key={i} style={{ padding:"11px 16px", borderBottom:"1px solid "+G.border, background:n.read?"transparent":G.accent+"0a" }}>
                  <p style={{ fontSize:12, fontWeight:700, color:n.read?G.muted:G.accentL, marginBottom:2 }}>{n.title}</p>
                  <p style={{ fontSize:11, color:G.muted }}>{n.body}</p>
                  <p style={{ fontSize:10, color:G.border, marginTop:3, ...mono }}>{new Date(n.ts).toLocaleString("es-AR")}</p>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [user, setUser]   = useState("");
  const [pass, setPass]   = useState("");
  const [error, setError] = useState("");

  function handle() {
    const users = getUsers();
    const found = users.find(u => u.name.toLowerCase() === user.trim().toLowerCase() && u.password === pass && u.active !== false);
    if (found) onLogin(found);
    else setError("Usuario o contraseña incorrectos.");
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"radial-gradient(ellipse at 50% 25%, #0d1e4a 0%, "+G.bg+" 65%)", padding:20 }}>
      <div className="fu" style={{ width:"100%", maxWidth:360 }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <CromosolLogo size={40} />
          <p style={{ color:G.muted, fontSize:13, marginTop:12 }}>Ticketera interna</p>
        </div>
        <div style={{ background:G.card, border:"1px solid "+G.border, borderRadius:16, padding:28, display:"flex", flexDirection:"column", gap:16 }}>
          <Field label="Usuario">
            <input style={iS} value={user} onChange={e => setUser(e.target.value)} placeholder="Nombre de usuario" autoFocus />
          </Field>
          <Field label="Contraseña">
            <input style={iS} type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key==="Enter" && handle()} />
          </Field>
          {error && <p style={{ color:G.danger, fontSize:12 }}>{error}</p>}
          <Btn onClick={handle} style={{ padding:"12px", fontSize:14, marginTop:4, background:G.red }}>Ingresar →</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── SHELL ────────────────────────────────────────────────────────
function Shell({ user, onLogout, notifs, onClearNotifs, tab, setTab, children }) {
  const tabs = user.role === "admin"
    ? [["tickets","Tickets"],["usuarios","Usuarios"]]
    : [["tickets","Mis Tickets"]];

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      <header style={{ background:G.surface, borderBottom:"1px solid "+G.border, padding:"0 20px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:200 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <CromosolLogoSmall />
          <div style={{ display:"flex", gap:4 }}>
            {tabs.map(([k,lbl]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                background: tab===k ? G.accent+"22" : "none",
                color: tab===k ? G.accentL : G.muted,
                border: tab===k ? "1px solid "+G.accent+"44" : "1px solid transparent",
                borderRadius:8, padding:"5px 14px", fontSize:12, fontWeight:700, cursor:"pointer",
              }}>{lbl}</button>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <RoleBadge role={user.role} />
          <span style={{ fontSize:12, color:G.muted }}>{user.name}</span>
          <NotifBtn notifs={notifs} onClear={onClearNotifs} />
          <Btn variant="ghost" onClick={onLogout} style={{ padding:"6px 12px", fontSize:11 }}>Salir</Btn>
        </div>
      </header>
      <main style={{ flex:1, padding:"28px 20px", maxWidth:960, margin:"0 auto", width:"100%" }}>{children}</main>
    </div>
  );
}

// ─── FORMULARIO TICKET ────────────────────────────────────────────
function NuevoTicketForm({ user, onCrear, onCancel }) {
  const [cat,    setCat]    = useState(CATEGORIAS[0].label);
  const [titulo, setTitulo] = useState("");
  const [titCustom, setTitCustom] = useState("");
  const [desc,   setDesc]   = useState("");
  const [err,    setErr]    = useState("");

  const catObj  = CATEGORIAS.find(c => c.label === cat) || CATEGORIAS[0];
  const esLibre = catObj.titulos.length === 0;
  const titFinal = esLibre ? titCustom : titulo;

  function handleCat(v) { setCat(v); setTitulo(""); setTitCustom(""); }

  function crear() {
    if (!titFinal.trim()) { setErr("Seleccioná o escribí un título."); return; }
    if (!desc.trim())     { setErr("Escribí una descripción."); return; }
    onCrear({ categoria: cat, titulo: titFinal, descripcion: desc });
  }

  return (
    <div className="fu" style={{ background:G.card, border:"1px solid "+G.accentL+"44", borderRadius:14, padding:24, display:"flex", flexDirection:"column", gap:16 }}>
      <h3 style={{ fontSize:15, fontWeight:700, color:G.accentL }}>Nuevo Ticket</h3>
      <Field label="Categoría">
        <select style={iS} value={cat} onChange={e => handleCat(e.target.value)}>
          {CATEGORIAS.map(c => <option key={c.label}>{c.label}</option>)}
        </select>
      </Field>
      {esLibre ? (
        <Field label="Título">
          <input style={iS} value={titCustom} onChange={e => setTitCustom(e.target.value)} placeholder="Describí brevemente el problema" />
        </Field>
      ) : (
        <Field label="Título">
          <select style={iS} value={titulo} onChange={e => setTitulo(e.target.value)}>
            <option value="">— Seleccioná un título —</option>
            {catObj.titulos.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
      )}
      <Field label="Descripción detallada">
        <textarea style={{ ...iS, resize:"vertical", height:90 }} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Detallá el problema, cliente afectado, contexto..." />
      </Field>
      {err && <p style={{ color:G.danger, fontSize:12 }}>{err}</p>}
      <div style={{ display:"flex", gap:10 }}>
        <Btn onClick={crear}>Enviar Ticket</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
      </div>
    </div>
  );
}

// ─── MODAL TICKET ─────────────────────────────────────────────────
function TicketModal({ ticket, user, onClose, onUpdate }) {
  const [resp,   setResp]   = useState("");
  const [estado, setEstado] = useState(ticket.estado);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [ticket.mensajes?.length]);

  function enviar() {
    if (!resp.trim()) return;
    const msg = { id:nuid(), from:user.name, role:user.role, text:resp, ts:new Date().toISOString() };
    onUpdate(ticket.id, { mensajes:[...(ticket.mensajes||[]), msg] }, null);
    setResp("");
  }

  function cambiarEstado(s) { setEstado(s); onUpdate(ticket.id, { estado:s }, s); }

  const puedeEditarEstado = user.role === "cuentas" || user.role === "admin";

  return (
    <div style={{ position:"fixed", inset:0, background:"#000c", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300, padding:16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:G.card, border:"1px solid "+G.border, borderRadius:16, width:"100%", maxWidth:580, maxHeight:"88vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ padding:"18px 22px", borderBottom:"1px solid "+G.border, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
              <span style={{ color:G.accentL, fontSize:12, fontWeight:700, ...mono }}>{ticket.id}</span>
              <Badge estado={estado} />
              <span style={{ background:G.border, color:G.muted, borderRadius:5, padding:"1px 8px", fontSize:11 }}>{ticket.categoria}</span>
            </div>
            <h2 style={{ fontSize:15, fontWeight:700 }}>{ticket.titulo}</h2>
            <p style={{ color:G.muted, fontSize:11, marginTop:4 }}>{ticket.autor} · {new Date(ticket.ts).toLocaleString("es-AR")}</p>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:G.muted, fontSize:22, cursor:"pointer", flexShrink:0 }}>×</button>
        </div>

        {/* Cambio de estado */}
        {puedeEditarEstado && (
          <div style={{ padding:"10px 22px", borderBottom:"1px solid "+G.border, display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
            <span style={{ fontSize:11, color:G.muted, marginRight:4 }}>Estado:</span>
            {Object.entries(ESTADOS).map(([k,v]) => (
              <button key={k} onClick={() => cambiarEstado(k)} style={{
                padding:"4px 12px", borderRadius:6, fontSize:11, fontWeight:700,
                textTransform:"uppercase", letterSpacing:0.8, cursor:"pointer",
                background: estado===k ? v.color+"28" : "transparent",
                color: estado===k ? v.color : G.muted,
                border:"1px solid "+(estado===k ? v.color+"66" : G.border),
              }}>{v.label}</button>
            ))}
          </div>
        )}

        {/* Mensajes */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 22px", display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ background:G.surface, border:"1px solid "+G.border, borderRadius:10, padding:14 }}>
            <p style={{ fontSize:10, color:G.muted, marginBottom:6, letterSpacing:1, ...mono }}>DESCRIPCIÓN ORIGINAL</p>
            <p style={{ fontSize:13, lineHeight:1.65 }}>{ticket.descripcion}</p>
          </div>
          {(ticket.mensajes||[]).map((m,i) => (
            <div key={i} style={{
              alignSelf: m.role===user.role ? "flex-end" : "flex-start",
              background: m.role==="cuentas" || m.role==="admin" ? G.accent+"1a" : G.surface,
              border:"1px solid "+(m.role==="cuentas"||m.role==="admin" ? G.accentL+"33" : G.border),
              borderRadius:10, padding:"10px 14px", maxWidth:"82%",
            }}>
              <p style={{ fontSize:10, color:G.muted, marginBottom:4, ...mono }}>{m.from} · {new Date(m.ts).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}</p>
              <p style={{ fontSize:13, lineHeight:1.55 }}>{m.text}</p>
            </div>
          ))}
          {(!ticket.mensajes || ticket.mensajes.length===0) && <p style={{ color:G.muted, fontSize:13, textAlign:"center", padding:"16px 0" }}>Sin respuestas aún.</p>}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding:"14px 22px", borderTop:"1px solid "+G.border, display:"flex", gap:10 }}>
          <textarea value={resp} onChange={e => setResp(e.target.value)} placeholder="Escribí tu mensaje... (Enter para enviar)"
            onKeyDown={e => { if(e.key==="Enter" && !e.shiftKey){e.preventDefault();enviar();} }}
            style={{ flex:1, ...iS, width:"auto", resize:"none", height:68, fontSize:13 }} />
          <Btn onClick={enviar} style={{ alignSelf:"flex-end", padding:"10px 16px", background:G.red, border:"none" }}>Enviar</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── TICKET ROW ───────────────────────────────────────────────────
function TicketRow({ ticket, onClick, showAutor, isNew }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      background: hov ? G.card+"ee" : G.card,
      border:"1px solid "+(hov ? G.accentL+"44" : G.border),
      borderRadius:12, padding:"14px 18px", cursor:"pointer",
      display:"flex", justifyContent:"space-between", alignItems:"center", gap:12,
    }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5, flexWrap:"wrap" }}>
          <span style={{ color:G.accentL, fontSize:11, fontWeight:700, ...mono }}>{ticket.id}</span>
          <Badge estado={ticket.estado} />
          <span style={{ background:G.border, color:G.muted, borderRadius:5, padding:"1px 7px", fontSize:10 }}>{ticket.categoria}</span>
          {isNew && <span style={{ background:G.warn+"22", color:G.warn, border:"1px solid "+G.warn+"44", borderRadius:5, padding:"1px 7px", fontSize:10, fontWeight:700 }}>NUEVO</span>}
        </div>
        <p style={{ fontWeight:600, fontSize:14, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{ticket.titulo}</p>
        {showAutor && <p style={{ color:G.muted, fontSize:12, marginTop:3 }}>{ticket.autor}</p>}
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <p style={{ fontSize:11, color:G.muted, ...mono }}>{new Date(ticket.ts).toLocaleDateString("es-AR")}</p>
        {ticket.mensajes?.length > 0 && (
          <span style={{ background:G.accent+"22", color:G.accentL, borderRadius:10, padding:"2px 8px", fontSize:10, fontWeight:700, marginTop:4, display:"inline-block" }}>
            {ticket.mensajes.length} msg
          </span>
        )}
      </div>
    </div>
  );
}

// ─── VISTA ACTIVADOR ──────────────────────────────────────────────
function VistaActivador({ user, tickets, onCrear, onOpenTicket }) {
  const [showForm, setShowForm] = useState(false);
  const [filtro,   setFiltro]   = useState("todos");
  const mis = tickets.filter(t => t.autorId === user.id).sort((a,b) => b.ts - a.ts);
  const filtrados = filtro === "todos" ? mis : mis.filter(t => t.estado === filtro);

  function crear(data) {
    onCrear({ ...data, autorId:user.id, autor:user.name });
    setShowForm(false);
  }

  const counts = {
    todos: mis.length,
    iniciado: mis.filter(t=>t.estado==="iniciado").length,
    en_proceso: mis.filter(t=>t.estado==="en_proceso").length,
    resuelto: mis.filter(t=>t.estado==="resuelto").length,
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800 }}>Mis Tickets</h1>
          <p style={{ color:G.muted, fontSize:13, marginTop:3 }}>Seguí tus solicitudes al área de Cuentas.</p>
        </div>
        {!showForm && <Btn onClick={() => setShowForm(true)} style={{ background:G.red, border:"none" }}>+ Nuevo Ticket</Btn>}
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
        {[
          { label:"Total",      val:counts.todos,      color:G.muted,   k:"todos" },
          { label:"Iniciados",  val:counts.iniciado,   color:"#6366f1", k:"iniciado" },
          { label:"En proceso", val:counts.en_proceso, color:G.warn,    k:"en_proceso" },
          { label:"Resueltos",  val:counts.resuelto,   color:G.success, k:"resuelto" },
        ].map(s => (
          <div key={s.k} onClick={() => setFiltro(s.k)} style={{
            background: filtro===s.k ? s.color+"18" : G.card,
            border:"1px solid "+(filtro===s.k ? s.color+"55" : G.border),
            borderRadius:10, padding:"14px 16px", cursor:"pointer",
          }}>
            <p style={{ fontSize:24, fontWeight:800, color:s.color, ...mono }}>{s.val}</p>
            <p style={{ fontSize:11, color:G.muted, marginTop:3 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {showForm && <NuevoTicketForm user={user} onCrear={crear} onCancel={() => setShowForm(false)} />}

      {filtrados.length === 0 && !showForm ? (
        <div style={{ textAlign:"center", padding:"48px 0", color:G.muted }}>
          <p style={{ fontSize:32, marginBottom:12 }}>◈</p>
          <p style={{ fontSize:14 }}>{mis.length === 0 ? "No tenés tickets cargados aún." : "No hay tickets en esta categoría."}</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {filtrados.map(t => <TicketRow key={t.id} ticket={t} onClick={() => onOpenTicket(t)} />)}
        </div>
      )}
    </div>
  );
}

// ─── VISTA CUENTAS / ADMIN TICKETS ────────────────────────────────
function VistaCuentas({ tickets, onOpenTicket, unseenIds, isAdmin }) {
  const [filtro,  setFiltro]  = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  let lista = [...tickets].sort((a,b) => b.ts - a.ts);
  if (filtro !== "todos") lista = lista.filter(t => t.estado === filtro);
  if (busqueda.trim()) {
    const q = busqueda.toLowerCase();
    lista = lista.filter(t => t.titulo.toLowerCase().includes(q) || t.autor.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
  }

  const counts = {
    todos: tickets.length,
    iniciado: tickets.filter(t=>t.estado==="iniciado").length,
    en_proceso: tickets.filter(t=>t.estado==="en_proceso").length,
    resuelto: tickets.filter(t=>t.estado==="resuelto").length,
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div>
        <h1 style={{ fontSize:22, fontWeight:800 }}>{isAdmin ? "Todos los Tickets" : "Cola de Tickets"}</h1>
        <p style={{ color:G.muted, fontSize:13, marginTop:3 }}>Reclamos recibidos de los activadores.</p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
        {[
          { label:"Total",      val:counts.todos,      color:G.muted,   k:"todos" },
          { label:"Iniciados",  val:counts.iniciado,   color:"#6366f1", k:"iniciado" },
          { label:"En proceso", val:counts.en_proceso, color:G.warn,    k:"en_proceso" },
          { label:"Resueltos",  val:counts.resuelto,   color:G.success, k:"resuelto" },
        ].map(s => (
          <div key={s.k} onClick={() => setFiltro(s.k)} style={{
            background: filtro===s.k ? s.color+"18" : G.card,
            border:"1px solid "+(filtro===s.k ? s.color+"55" : G.border),
            borderRadius:10, padding:"14px 16px", cursor:"pointer",
          }}>
            <p style={{ fontSize:24, fontWeight:800, color:s.color, ...mono }}>{s.val}</p>
            <p style={{ fontSize:11, color:G.muted, marginTop:3 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <input style={{ ...iS, width:"100%" }} value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por título, autor o número de ticket..." />

      {lista.length === 0 ? (
        <div style={{ textAlign:"center", padding:"48px 0", color:G.muted }}>
          <p style={{ fontSize:14 }}>No hay tickets en esta categoría.</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {lista.map(t => <TicketRow key={t.id} ticket={t} onClick={() => onOpenTicket(t)} showAutor isNew={unseenIds.has(t.id)} />)}
        </div>
      )}
    </div>
  );
}

// ─── VISTA ADMIN USUARIOS ─────────────────────────────────────────
function VistaUsuarios() {
  const [users,     setUsersLocal] = useState(getUsers());
  const [showForm,  setShowForm]   = useState(false);
  const [editing,   setEditing]    = useState(null);
  const [form,      setForm]       = useState({ name:"", role:"activador", password:"" });
  const [err,       setErr]        = useState("");
  const [msg,       setMsg]        = useState("");

  function refresh() { setUsersLocal(getUsers()); }

  function openNew()  { setEditing(null); setForm({ name:"", role:"activador", password:"" }); setErr(""); setShowForm(true); }
  function openEdit(u){ setEditing(u); setForm({ name:u.name, role:u.role, password:u.password }); setErr(""); setShowForm(true); }

  function guardar() {
    if (!form.name.trim())     { setErr("El nombre es obligatorio."); return; }
    if (!form.password.trim()) { setErr("La contraseña es obligatoria."); return; }
    const all = getUsers();
    if (editing) {
      const updated = all.map(u => u.id === editing.id ? { ...u, ...form } : u);
      saveUsers(updated); setUsersLocal(updated);
    } else {
      if (all.find(u => u.name.toLowerCase() === form.name.toLowerCase())) { setErr("Ya existe un usuario con ese nombre."); return; }
      const nuevo = { id: nuid(), ...form, active:true };
      saveUsers([...all, nuevo]); setUsersLocal([...all, nuevo]);
    }
    setShowForm(false); setMsg(editing ? "Usuario actualizado." : "Usuario creado."); setTimeout(() => setMsg(""), 3000);
  }

  function toggleActive(u) {
    if (u.id === "admin") return;
    const all = getUsers().map(x => x.id===u.id ? { ...x, active:!x.active } : x);
    saveUsers(all); setUsersLocal(all);
  }

  const roles = ["activador","cuentas","admin"];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800 }}>Gestión de Usuarios</h1>
          <p style={{ color:G.muted, fontSize:13, marginTop:3 }}>Crear, editar y activar/desactivar perfiles.</p>
        </div>
        {!showForm && <Btn onClick={openNew} style={{ background:G.red, border:"none" }}>+ Nuevo Usuario</Btn>}
      </div>

      {msg && <div style={{ background:G.success+"18", border:"1px solid "+G.success+"44", borderRadius:8, padding:"10px 16px", color:G.success, fontSize:13 }}>{msg}</div>}

      {/* Formulario */}
      {showForm && (
        <div className="fu" style={{ background:G.card, border:"1px solid "+G.accentL+"44", borderRadius:14, padding:24, display:"flex", flexDirection:"column", gap:14 }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:G.accentL }}>{editing ? "Editar Usuario" : "Nuevo Usuario"}</h3>
          <Field label="Nombre completo">
            <input style={iS} value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Nombre y apellido" />
          </Field>
          <Field label="Rol">
            <select style={iS} value={form.role} onChange={e => setForm({...form, role:e.target.value})}>
              {roles.map(r => <option key={r} value={r}>{ROLES[r]}</option>)}
            </select>
          </Field>
          <Field label="Contraseña">
            <input style={iS} value={form.password} onChange={e => setForm({...form, password:e.target.value})} placeholder="Contraseña de acceso" />
          </Field>
          {err && <p style={{ color:G.danger, fontSize:12 }}>{err}</p>}
          <div style={{ display:"flex", gap:10 }}>
            <Btn onClick={guardar} style={{ background:G.red, border:"none" }}>{editing ? "Guardar cambios" : "Crear usuario"}</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {users.map(u => (
          <div key={u.id} style={{
            background:G.card, border:"1px solid "+G.border, borderRadius:12,
            padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
            opacity: u.active===false ? 0.5 : 1,
          }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <span style={{ fontWeight:700, fontSize:14 }}>{u.name}</span>
                <RoleBadge role={u.role} />
                {u.active===false && <span style={{ background:G.danger+"22", color:G.danger, border:"1px solid "+G.danger+"44", borderRadius:5, padding:"1px 7px", fontSize:10, fontWeight:700 }}>INACTIVO</span>}
              </div>
              <p style={{ color:G.muted, fontSize:12, ...mono }}>ID: {u.id} · Pass: {"•".repeat(u.password.length)}</p>
            </div>
            <div style={{ display:"flex", gap:8, flexShrink:0 }}>
              {u.id !== "admin" && (
                <>
                  <Btn variant="ghost" style={{ padding:"6px 12px", fontSize:11 }} onClick={() => openEdit(u)}>Editar</Btn>
                  <Btn variant={u.active===false?"success":"danger"} style={{ padding:"6px 12px", fontSize:11 }} onClick={() => toggleActive(u)}>
                    {u.active===false ? "Activar" : "Desactivar"}
                  </Btn>
                </>
              )}
              {u.id === "admin" && <span style={{ fontSize:11, color:G.muted }}>Cuenta protegida</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────
export default function App() {
  const [user,       setUser]       = useState(null);
  const [tickets,    setTickets]    = useState([]);
  const [openTicket, setOpenTicket] = useState(null);
  const [notifs,     setNotifs]     = useState([]);
  const [unseenIds,  setUnseenIds]  = useState(new Set());
  const [tab,        setTab]        = useState("tickets");
  const { toasts, add:addToast, dismiss } = useToasts();
  const pollRef = useRef(null);
  const prevRef = useRef([]);

  // Carga inicial
  useEffect(() => {
    if (!user) return;
    const t = getTickets();
    setTickets(t); prevRef.current = t;
    setNotifs(getNotifs(user.id));
  }, [user]);

  // Polling cada 8s
  useEffect(() => {
    if (!user) return;
    pollRef.current = setInterval(() => {
      const fresh = getTickets();
      const prev  = prevRef.current;

      fresh.forEach(ft => {
        const old = prev.find(p => p.id === ft.id);
        if (!old) return;

        // Activador: cambio de estado en su ticket
        if (user.role === "activador" && ft.autorId === user.id && old.estado !== ft.estado) {
          const label = ESTADOS[ft.estado]?.label || ft.estado;
          const n = { title:"Ticket "+ft.id+" actualizado", body:"\""+ft.titulo+"\" pasó a "+label+".", ts:Date.now(), read:false };
          addToast(n.title, n.body, "🔔");
          setNotifs(p => { const u=[...p,n]; saveNotifs(user.id,u); return u; });
        }

        // Activador: nueva respuesta de cuentas
        if (user.role === "activador" && ft.autorId === user.id && (ft.mensajes?.length||0) > (old.mensajes?.length||0)) {
          const ultimo = ft.mensajes[ft.mensajes.length-1];
          if (ultimo.role !== "activador") addToast("Nueva respuesta en "+ft.id, ultimo.from+" respondió tu ticket.", "💬");
        }

        // Cuentas/admin: nuevo mensaje
        if ((user.role==="cuentas"||user.role==="admin") && (ft.mensajes?.length||0) > (old.mensajes?.length||0)) {
          const ultimo = ft.mensajes[ft.mensajes.length-1];
          if (ultimo.role==="activador") {
            addToast("Nuevo mensaje en "+ft.id, ultimo.from+": "+ultimo.text.slice(0,50)+"...", "💬");
            setUnseenIds(p => new Set([...p, ft.id]));
          }
        }
      });

      // Cuentas/admin: ticket nuevo
      if (user.role==="cuentas"||user.role==="admin") {
        fresh.forEach(ft => {
          if (!prev.find(p => p.id===ft.id)) {
            addToast("Nuevo ticket recibido", ft.autor+" abrió: \""+ft.titulo+"\"", "🎫");
            setUnseenIds(p => new Set([...p, ft.id]));
          }
        });
      }

      setTickets(fresh); prevRef.current = fresh;
    }, 8000);
    return () => clearInterval(pollRef.current);
  }, [user, addToast]);

  function crearTicket(data) {
    const nuevo = { id:tktId(), ...data, estado:"iniciado", mensajes:[], ts:Date.now() };
    const updated = [nuevo, ...tickets];
    setTickets(updated); prevRef.current = updated;
    saveTickets(updated);
  }

  function actualizarTicket(id, changes, nuevoEstado) {
    const updated = tickets.map(t => t.id===id ? { ...t, ...changes } : t);
    setTickets(updated); prevRef.current = updated;
    if (openTicket?.id===id) setOpenTicket(p => ({ ...p, ...changes }));
    saveTickets(updated);
    if (nuevoEstado && (user.role==="cuentas"||user.role==="admin")) {
      const label = ESTADOS[nuevoEstado]?.label || nuevoEstado;
      addToast("Estado actualizado", "Ticket "+id+" → "+label, "✅");
    }
  }

  function handleOpenTicket(t) {
    setOpenTicket(t);
    setUnseenIds(p => { const s=new Set(p); s.delete(t.id); return s; });
  }

  function clearNotifs() {
    const u = notifs.map(n => ({...n,read:true}));
    setNotifs(u); saveNotifs(user.id, u);
  }

  function logout() {
    clearInterval(pollRef.current);
    setUser(null); setTickets([]); setNotifs([]); setUnseenIds(new Set()); setTab("tickets");
  }

  if (!user) return <Login onLogin={u => setUser(u)} />;

  return (
    <Shell user={user} onLogout={logout} notifs={notifs} onClearNotifs={clearNotifs} tab={tab} setTab={setTab}>
      {tab === "tickets" && (
        user.role === "activador"
          ? <VistaActivador user={user} tickets={tickets} onCrear={crearTicket} onOpenTicket={handleOpenTicket} />
          : <VistaCuentas tickets={tickets} onOpenTicket={handleOpenTicket} unseenIds={unseenIds} isAdmin={user.role==="admin"} />
      )}
      {tab === "usuarios" && user.role === "admin" && <VistaUsuarios />}

      {openTicket && (
        <TicketModal ticket={openTicket} user={user} onClose={() => setOpenTicket(null)} onUpdate={actualizarTicket} />
      )}
      <Toasts toasts={toasts} onDismiss={dismiss} />
      <style>{css}</style>
    </Shell>
  );
}
