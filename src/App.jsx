import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const SUPABASE_URL  = "https://bgexobfmtukmkkzgdnds.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZXhvYmZtdHVrbWtremdkbmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMzUxMTgsImV4cCI6MjA5MzkxMTExOH0.8HY9rw70wwHjauf_0mxbIcUgKwSgsU7Bq1TpGaEN-0A";
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

const EMAILJS_SERVICE_ID="TU_SERVICE_ID",EMAILJS_TEMPLATE_ID="TU_TEMPLATE_ID",EMAILJS_PUBLIC_KEY="TU_PUBLIC_KEY";
async function enviarMailResuelto(ticket,emailDestino){
  if(!emailDestino||EMAILJS_SERVICE_ID==="TU_SERVICE_ID")return;
  try{await fetch("https://api.emailjs.com/api/v1.0/email/send",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({service_id:EMAILJS_SERVICE_ID,template_id:EMAILJS_TEMPLATE_ID,user_id:EMAILJS_PUBLIC_KEY,template_params:{to_email:emailDestino,activador_nombre:ticket.autor,ticket_id:ticket.id,ticket_titulo:ticket.titulo,ticket_categoria:ticket.categoria,fecha:new Date().toLocaleString("es-AR")}})});}catch(e){console.error("EmailJS:",e);}
}

const CATEGORIAS=[
  {label:"Devoluciones",titulos:["Devolución pendiente de acreditación","Devolución por producto incorrecto","Devolución no registrada en sistema","Cliente solicita devolución urgente"]},
  {label:"Facturación / Cobranza",titulos:["Error en monto facturado","Factura duplicada","Cargo no reconocido por el cliente","Retraso en aplicación de pago"]},
  {label:"Datos incorrectos de cliente",titulos:["Número de teléfono erróneo","Nombre del cliente mal cargado","CUIT/CUIL incorrecto","Dirección de entrega desactualizada"]},
  {label:"Consultas generales",titulos:["Consulta sobre estado de cuenta","Consulta sobre campaña activa","Consulta sobre límite de crédito","Consulta sobre historial de compras"]},
  {label:"General / Otro",titulos:[]},
];

const ESTADOS={iniciado:{label:"Iniciado",color:"#6366f1"},en_proceso:{label:"En proceso",color:"#f59e0b"},resuelto:{label:"Resuelto",color:"#10b981"}};
const MESES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const ROLES={admin:"Admin",activador:"Activador",cuentas:"Cuentas"};
function tktId(){return "TKT-"+String(Date.now()).slice(-6);}
function nuid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,5);}

const G={bg:"#08080f",surface:"#10101a",card:"#16161f",border:"#222235",accent:"#1d3a8a",accentL:"#4a6fd4",text:"#e8e8f2",muted:"#6a6a88",danger:"#ef4444",success:"#10b981",warn:"#f59e0b",red:"#cc2200"};
const css=`
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body,#root{height:100%}
  body{background:${G.bg};color:${G.text};font-family:'Plus Jakarta Sans',sans-serif;min-height:100vh}
  ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${G.border};border-radius:4px}
  input,textarea,select,button{font-family:'Plus Jakarta Sans',sans-serif;outline:none}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .fu{animation:fadeUp .3s ease both}.si{animation:slideIn .3s ease both}
`;
const mono={fontFamily:"'JetBrains Mono',monospace"};
const iS={background:G.bg,border:"1px solid "+G.border,borderRadius:8,color:G.text,padding:"10px 14px",fontSize:14,width:"100%"};

function CromosolLogo({size=36}){return(<svg width={size*3.2} height={size} viewBox="0 0 160 50" fill="none"><circle cx="25" cy="25" r="22" fill="#cc2200" opacity="0.12"/><path d="M25 5C14 5 5 14 5 25c0 11 9 20 20 20 5 0 9.5-2 12.8-5.2L31 33c-1.7 1.6-3.7 2.5-6 2.5-5.8 0-10.5-4.7-10.5-10.5S19.2 14.5 25 14.5c2.3 0 4.4.9 6 2.5l6.8-6.8C34.5 7 30 5 25 5z" fill="#cc2200"/><path d="M37.8 10.2L31 17l7 7 7-7z" fill="#1d3a8a"/><path d="M31 33l6.8 6.8L45 33l-7-7z" fill="#1d3a8a"/><text x="52" y="33" fontSize="20" fontWeight="800" fill={G.text} fontFamily="'Plus Jakarta Sans',sans-serif" letterSpacing="-0.5">cromosol</text></svg>);}
function CromosolLogoSmall(){return(<svg width="110" height="28" viewBox="0 0 160 50" fill="none"><path d="M25 5C14 5 5 14 5 25c0 11 9 20 20 20 5 0 9.5-2 12.8-5.2L31 33c-1.7 1.6-3.7 2.5-6 2.5-5.8 0-10.5-4.7-10.5-10.5S19.2 14.5 25 14.5c2.3 0 4.4.9 6 2.5l6.8-6.8C34.5 7 30 5 25 5z" fill="#cc2200"/><path d="M37.8 10.2L31 17l7 7 7-7z" fill="#1d3a8a"/><path d="M31 33l6.8 6.8L45 33l-7-7z" fill="#1d3a8a"/><text x="52" y="33" fontSize="20" fontWeight="800" fill={G.text} fontFamily="'Plus Jakarta Sans',sans-serif" letterSpacing="-0.5">cromosol</text></svg>);}

function Badge({estado}){const e=ESTADOS[estado]||ESTADOS.iniciado;return<span style={{background:e.color+"22",color:e.color,border:"1px solid "+e.color+"44",borderRadius:6,padding:"2px 10px",fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",...mono,whiteSpace:"nowrap"}}>{e.label}</span>;}
function RoleBadge({role}){const cols={admin:"#a855f7",activador:G.accentL,cuentas:G.success};const c=cols[role]||G.muted;return<span style={{background:c+"22",color:c,border:"1px solid "+c+"44",borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",...mono}}>{ROLES[role]||role}</span>;}
function Btn({children,variant="primary",style:s,...p}){const v={primary:{background:G.accent,color:"#fff",border:"none"},ghost:{background:"transparent",color:G.muted,border:"1px solid "+G.border},danger:{background:G.danger+"18",color:G.danger,border:"1px solid "+G.danger+"33"},success:{background:G.success+"18",color:G.success,border:"1px solid "+G.success+"33"}};return<button style={{padding:"9px 18px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",...v[variant],...s}} {...p}>{children}</button>;}
function Field({label,children}){return(<div style={{display:"flex",flexDirection:"column",gap:6}}>{label&&<label style={{fontSize:11,color:G.muted,letterSpacing:1.2,textTransform:"uppercase",fontWeight:700}}>{label}</label>}{children}</div>);}

function useToasts(){const[toasts,setToasts]=useState([]);const add=useCallback((title,body,icon="🔔")=>{const id=Date.now()+Math.random();setToasts(p=>[...p,{id,title,body,icon}]);setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),5000);},[]);const dismiss=useCallback(id=>setToasts(p=>p.filter(t=>t.id!==id)),[]);return{toasts,add,dismiss};}
function Toasts({toasts,onDismiss}){return(<div style={{position:"fixed",top:68,right:16,zIndex:999,display:"flex",flexDirection:"column",gap:8,maxWidth:310}}>{toasts.map(t=>(<div key={t.id} onClick={()=>onDismiss(t.id)} className="si" style={{background:G.card,border:"1px solid "+G.accentL+"44",borderLeft:"3px solid "+G.accent,borderRadius:10,padding:"12px 14px",cursor:"pointer",display:"flex",gap:10,alignItems:"flex-start",boxShadow:"0 8px 24px #0009"}}><span style={{fontSize:16,flexShrink:0}}>{t.icon}</span><div style={{flex:1,minWidth:0}}><p style={{fontSize:12,fontWeight:700,color:G.accentL,marginBottom:2}}>{t.title}</p><p style={{fontSize:11,color:G.muted,lineHeight:1.4}}>{t.body}</p></div><span style={{color:G.muted,fontSize:18,flexShrink:0}}>×</span></div>))}</div>);}

function NotifBtn({notifs,onClear}){const[open,setOpen]=useState(false);const unread=notifs.filter(n=>!n.read).length;return(<div style={{position:"relative"}}><button onClick={()=>setOpen(!open)} style={{background:"none",border:"1px solid "+G.border,borderRadius:8,color:G.muted,padding:"6px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:15}}>🔔 {unread>0&&<span style={{background:G.accent,color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:10,fontWeight:700,...mono}}>{unread}</span>}</button>{open&&(<div style={{position:"absolute",top:"calc(100% + 8px)",right:0,background:G.card,border:"1px solid "+G.border,borderRadius:12,width:290,zIndex:300,boxShadow:"0 12px 40px #000a",overflow:"hidden"}}><div style={{padding:"12px 16px",borderBottom:"1px solid "+G.border,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:13,fontWeight:700}}>Notificaciones</span>{notifs.length>0&&<button onClick={onClear} style={{background:"none",border:"none",color:G.muted,fontSize:11,cursor:"pointer"}}>Limpiar</button>}</div><div style={{maxHeight:300,overflowY:"auto"}}>{notifs.length===0?<p style={{padding:"20px 16px",color:G.muted,fontSize:13,textAlign:"center"}}>Sin notificaciones</p>:notifs.slice().reverse().map((n,i)=>(<div key={i} style={{padding:"11px 16px",borderBottom:"1px solid "+G.border,background:n.read?"transparent":G.accent+"0a"}}><p style={{fontSize:12,fontWeight:700,color:n.read?G.muted:G.accentL,marginBottom:2}}>{n.title}</p><p style={{fontSize:11,color:G.muted}}>{n.body}</p><p style={{fontSize:10,color:G.border,marginTop:3,...mono}}>{new Date(n.ts).toLocaleString("es-AR")}</p></div>))}</div></div>)}</div>);}

function Login({onLogin}){
  const[username,setUsername]=useState("");const[pass,setPass]=useState("");const[error,setError]=useState("");const[loading,setLoading]=useState(false);
  async function handle(){
    if(!username.trim()||!pass.trim()){setError("Completá usuario y contraseña.");return;}
    setLoading(true);setError("");
    const{data,error:err}=await sb.from("usuarios").select("*").eq("active",true);
    if(err){setError("Error de conexión.");setLoading(false);return;}
    const found=data.find(u=>u.name.toLowerCase()===username.trim().toLowerCase()&&u.password===pass);
    if(found)onLogin(found);else setError("Usuario o contraseña incorrectos.");
    setLoading(false);
  }
  return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"radial-gradient(ellipse at 50% 25%, #0d1e4a 0%, "+G.bg+" 65%)",padding:20}}><div className="fu" style={{width:"100%",maxWidth:360}}><div style={{textAlign:"center",marginBottom:40}}><CromosolLogo size={40}/><p style={{color:G.muted,fontSize:13,marginTop:12}}>Ticketera interna</p></div><div style={{background:G.card,border:"1px solid "+G.border,borderRadius:16,padding:28,display:"flex",flexDirection:"column",gap:16}}><Field label="Usuario"><input style={iS} value={username} onChange={e=>setUsername(e.target.value)} placeholder="Nombre de usuario" autoFocus/></Field><Field label="Contraseña"><input style={iS} type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handle()}/></Field>{error&&<p style={{color:G.danger,fontSize:12}}>{error}</p>}<Btn onClick={handle} style={{padding:"12px",fontSize:14,marginTop:4,background:G.red,border:"none"}} disabled={loading}>{loading?"Ingresando...":"Ingresar →"}</Btn></div></div></div>);
}

function Shell({user,onLogout,notifs,onClearNotifs,tab,setTab,children}){
  const tabs=user.role==="admin"?[["dashboard","Dashboard"],["tickets","Tickets"],["usuarios","Usuarios"]]:[["tickets","Mis Tickets"]];
  return(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}><header style={{background:G.surface,borderBottom:"1px solid "+G.border,padding:"0 20px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:200}}><div style={{display:"flex",alignItems:"center",gap:16}}><CromosolLogoSmall/><div style={{display:"flex",gap:4}}>{tabs.map(([k,lbl])=>(<button key={k} onClick={()=>setTab(k)} style={{background:tab===k?G.accent+"22":"none",color:tab===k?G.accentL:G.muted,border:tab===k?"1px solid "+G.accent+"44":"1px solid transparent",borderRadius:8,padding:"5px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>{lbl}</button>))}</div></div><div style={{display:"flex",alignItems:"center",gap:10}}><RoleBadge role={user.role}/><span style={{fontSize:12,color:G.muted}}>{user.name}</span><NotifBtn notifs={notifs} onClear={onClearNotifs}/><Btn variant="ghost" onClick={onLogout} style={{padding:"6px 12px",fontSize:11}}>Salir</Btn></div></header><main style={{flex:1,padding:"28px 20px",maxWidth:1100,margin:"0 auto",width:"100%"}}>{children}</main></div>);
}

// ─── FILTROS COMPARTIDOS ──────────────────────────────────────────
function FiltrosPanel({tickets,filtros,setFiltros,mostrarUsuario}){
  const now=new Date();
  const usuarios=[...new Set(tickets.map(t=>t.autor))].sort();
  return(
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10}}>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        <label style={{fontSize:11,color:G.muted,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Estado</label>
        <select style={iS} value={filtros.estado} onChange={e=>setFiltros(f=>({...f,estado:e.target.value}))}>
          <option value="">Todos</option>
          {Object.entries(ESTADOS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        <label style={{fontSize:11,color:G.muted,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Mes</label>
        <select style={iS} value={filtros.mes} onChange={e=>setFiltros(f=>({...f,mes:e.target.value}))}>
          <option value="">Todos</option>
          {MESES.map((m,i)=><option key={i} value={i}>{m}</option>)}
        </select>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        <label style={{fontSize:11,color:G.muted,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Año</label>
        <select style={iS} value={filtros.anio} onChange={e=>setFiltros(f=>({...f,anio:e.target.value}))}>
          <option value="">Todos</option>
          {[now.getFullYear()-1,now.getFullYear()].map(a=><option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      {mostrarUsuario&&(
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          <label style={{fontSize:11,color:G.muted,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Activador</label>
          <select style={iS} value={filtros.usuario} onChange={e=>setFiltros(f=>({...f,usuario:e.target.value}))}>
            <option value="">Todos</option>
            {usuarios.map(u=><option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        <label style={{fontSize:11,color:G.muted,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Desde</label>
        <input type="date" style={iS} value={filtros.desde} onChange={e=>setFiltros(f=>({...f,desde:e.target.value}))}/>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        <label style={{fontSize:11,color:G.muted,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Hasta</label>
        <input type="date" style={iS} value={filtros.hasta} onChange={e=>setFiltros(f=>({...f,hasta:e.target.value}))}/>
      </div>
      <div style={{display:"flex",alignItems:"flex-end"}}>
        <button onClick={()=>setFiltros({estado:"",mes:"",anio:"",usuario:"",desde:"",hasta:""})} style={{background:"transparent",color:G.muted,border:"1px solid "+G.border,borderRadius:8,padding:"10px 14px",fontSize:12,cursor:"pointer",width:"100%"}}>Limpiar filtros</button>
      </div>
    </div>
  );
}

function aplicarFiltros(tickets,filtros){
  return tickets.filter(t=>{
    const d=new Date(t.ts);
    if(filtros.estado&&t.estado!==filtros.estado)return false;
    if(filtros.mes!==""&&filtros.mes!==undefined&&d.getMonth()!==parseInt(filtros.mes))return false;
    if(filtros.anio&&d.getFullYear()!==parseInt(filtros.anio))return false;
    if(filtros.usuario&&t.autor!==filtros.usuario)return false;
    if(filtros.desde&&d<new Date(filtros.desde))return false;
    if(filtros.hasta&&d>new Date(filtros.hasta+"T23:59:59"))return false;
    return true;
  });
}

// ─── MODAL TICKET ─────────────────────────────────────────────────
function TicketModal({ticket,user,users,onClose,onUpdate}){
  const[resp,setResp]=useState("");const[estado,setEstado]=useState(ticket.estado);const[tabModal,setTabModal]=useState("mensajes");const bottomRef=useRef(null);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[ticket.mensajes?.length]);
  async function enviar(){if(!resp.trim())return;const msg={id:nuid(),from:user.name,role:user.role,text:resp,ts:new Date().toISOString()};const nuevos=[...(ticket.mensajes||[]),msg];await onUpdate(ticket.id,{mensajes:nuevos},null);setResp("");}
  async function cambiarEstado(s){setEstado(s);const entrada={tipo:"estado",usuario:user.name,estadoNuevo:s,ts:Date.now()};const auditoria=[...(ticket.auditoria||[]),entrada];await onUpdate(ticket.id,{estado:s,auditoria},s);}
  const puedeEditar=user.role==="cuentas"||user.role==="admin";
  return(
    <div style={{position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:G.card,border:"1px solid "+G.border,borderRadius:16,width:"100%",maxWidth:600,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"18px 22px",borderBottom:"1px solid "+G.border,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
              <span style={{color:G.accentL,fontSize:12,fontWeight:700,...mono}}>{ticket.id}</span>
              <Badge estado={estado}/>
              <span style={{background:G.border,color:G.muted,borderRadius:5,padding:"1px 8px",fontSize:11}}>{ticket.categoria}</span>
              {ticket.nro_cliente&&<span style={{background:G.warn+"22",color:G.warn,border:"1px solid "+G.warn+"44",borderRadius:5,padding:"1px 8px",fontSize:11,fontWeight:700,...mono}}>Cliente #{ticket.nro_cliente}</span>}
            </div>
            <h2 style={{fontSize:15,fontWeight:700}}>{ticket.titulo}</h2>
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:5,flexWrap:"wrap"}}>
              <span style={{fontSize:11,color:G.muted}}>Creado por</span>
              <span style={{fontSize:11,fontWeight:700,color:G.accentL}}>{ticket.autor}</span>
              <span style={{fontSize:11,color:G.muted}}>·</span>
              <span style={{fontSize:11,color:G.muted}}>{new Date(ticket.ts).toLocaleString("es-AR")}</span>
            </div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:G.muted,fontSize:22,cursor:"pointer",flexShrink:0}}>×</button>
        </div>
        {puedeEditar&&(<div style={{padding:"10px 22px",borderBottom:"1px solid "+G.border,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}><span style={{fontSize:11,color:G.muted,marginRight:4}}>Estado:</span>{Object.entries(ESTADOS).map(([k,v])=>(<button key={k} onClick={()=>cambiarEstado(k)} style={{padding:"4px 12px",borderRadius:6,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,cursor:"pointer",background:estado===k?v.color+"28":"transparent",color:estado===k?v.color:G.muted,border:"1px solid "+(estado===k?v.color+"66":G.border)}}>{v.label}</button>))}</div>)}
        <div style={{display:"flex",borderBottom:"1px solid "+G.border}}>{[["mensajes","Mensajes"],["historial","Historial"]].map(([k,lbl])=>(<button key={k} onClick={()=>setTabModal(k)} style={{flex:1,padding:"10px",fontSize:12,fontWeight:700,cursor:"pointer",background:"none",border:"none",color:tabModal===k?G.accentL:G.muted,borderBottom:tabModal===k?"2px solid "+G.accentL:"2px solid transparent"}}>{lbl}</button>))}</div>
        <div style={{flex:1,overflowY:"auto",padding:"16px 22px",display:"flex",flexDirection:"column",gap:10}}>
          {tabModal==="mensajes"&&(<>
            <div style={{background:G.surface,border:"1px solid "+G.border,borderRadius:10,padding:14}}>
              <p style={{fontSize:10,color:G.muted,marginBottom:6,letterSpacing:1,...mono}}>DESCRIPCIÓN ORIGINAL</p>
              <p style={{fontSize:13,lineHeight:1.65}}>{ticket.descripcion}</p>
            </div>
            {(ticket.mensajes||[]).map((m,i)=>(<div key={i} style={{alignSelf:m.role===user.role?"flex-end":"flex-start",background:m.role==="cuentas"||m.role==="admin"?G.accent+"1a":G.surface,border:"1px solid "+(m.role==="cuentas"||m.role==="admin"?G.accentL+"33":G.border),borderRadius:10,padding:"10px 14px",maxWidth:"82%"}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,flexWrap:"wrap"}}><span style={{fontSize:11,fontWeight:700,color:G.accentL,...mono}}>{m.from}</span><RoleBadge role={m.role}/><span style={{fontSize:10,color:G.muted,...mono}}>{new Date(m.ts).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}</span></div><p style={{fontSize:13,lineHeight:1.55}}>{m.text}</p></div>))}
            {(!ticket.mensajes||ticket.mensajes.length===0)&&<p style={{color:G.muted,fontSize:13,textAlign:"center",padding:"16px 0"}}>Sin respuestas aún.</p>}
            <div ref={bottomRef}/>
          </>)}
          {tabModal==="historial"&&(
            <div style={{padding:"8px 0",display:"flex",flexDirection:"column",gap:12}}>
              {(ticket.auditoria||[]).length>0
                ?(ticket.auditoria||[]).map((a,i)=>{const color=a.tipo==="creacion"?G.accentL:ESTADOS[a.estadoNuevo]?.color||G.muted;return(<div key={i} style={{display:"flex",alignItems:"flex-start",gap:10}}><div style={{width:8,height:8,borderRadius:"50%",background:color,marginTop:4,flexShrink:0}}/><div><p style={{fontSize:13,color:G.text}}><span style={{fontWeight:700,color:color}}>{a.usuario}</span>{a.tipo==="creacion"&&" creó el ticket"}{a.tipo==="estado"&&<> cambió el estado a <span style={{fontWeight:700,color:color}}>{ESTADOS[a.estadoNuevo]?.label||a.estadoNuevo}</span></>}</p><p style={{fontSize:11,color:G.muted,...mono}}>{new Date(a.ts).toLocaleString("es-AR")}</p></div></div>);})
                :<p style={{color:G.muted,fontSize:13,textAlign:"center",padding:"16px 0"}}>Sin historial registrado.</p>
              }
            </div>
          )}
        </div>
        <div style={{padding:"14px 22px",borderTop:"1px solid "+G.border,display:"flex",gap:10}}>
          <textarea value={resp} onChange={e=>setResp(e.target.value)} placeholder="Escribí tu mensaje... (Enter para enviar)" onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();enviar();}}} style={{flex:1,...iS,width:"auto",resize:"none",height:68,fontSize:13}}/>
          <Btn onClick={enviar} style={{alignSelf:"flex-end",padding:"10px 16px",background:G.red,border:"none"}}>Enviar</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── TICKET ROW ───────────────────────────────────────────────────
function TicketRow({ticket,onClick,showAutor,isNew,onEliminar}){
  const[hov,setHov]=useState(false);const[confirm,setConfirm]=useState(false);
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>{setHov(false);setConfirm(false);}} style={{background:hov?G.card+"ee":G.card,border:"1px solid "+(hov?G.accentL+"44":G.border),borderRadius:12,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
      <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={onClick}>
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5,flexWrap:"wrap"}}>
          <span style={{color:G.accentL,fontSize:11,fontWeight:700,...mono}}>{ticket.id}</span>
          <Badge estado={ticket.estado}/>
          <span style={{background:G.border,color:G.muted,borderRadius:5,padding:"1px 7px",fontSize:10}}>{ticket.categoria}</span>
          {ticket.nro_cliente&&<span style={{background:G.warn+"22",color:G.warn,border:"1px solid "+G.warn+"33",borderRadius:5,padding:"1px 7px",fontSize:10,fontWeight:700,...mono}}>#{ticket.nro_cliente}</span>}
          {isNew&&<span style={{background:G.warn+"22",color:G.warn,border:"1px solid "+G.warn+"44",borderRadius:5,padding:"1px 7px",fontSize:10,fontWeight:700}}>NUEVO</span>}
        </div>
        <p style={{fontWeight:600,fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ticket.titulo}</p>
        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4,flexWrap:"wrap"}}>
          {showAutor&&<span style={{fontSize:11,color:G.accentL,fontWeight:600}}>{ticket.autor}</span>}
          {showAutor&&<span style={{fontSize:11,color:G.border}}>·</span>}
          <span style={{fontSize:11,color:G.muted,...mono}}>{new Date(ticket.ts).toLocaleDateString("es-AR")}</span>
          {ticket.auditoria?.length>1&&<span style={{fontSize:10,color:G.muted}}>· Última acción: <span style={{color:G.accentL}}>{ticket.auditoria[ticket.auditoria.length-1].usuario}</span></span>}
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        {ticket.mensajes?.length>0&&<span style={{background:G.accent+"22",color:G.accentL,borderRadius:10,padding:"2px 8px",fontSize:10,fontWeight:700}}>{ticket.mensajes.length} msg</span>}
        {onEliminar&&(
          confirm
            ?<div style={{display:"flex",gap:6}}>
               <button onClick={e=>{e.stopPropagation();onEliminar(ticket.id);}} style={{background:G.danger,color:"#fff",border:"none",borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Confirmar</button>
               <button onClick={e=>{e.stopPropagation();setConfirm(false);}} style={{background:"transparent",color:G.muted,border:"1px solid "+G.border,borderRadius:7,padding:"4px 10px",fontSize:11,cursor:"pointer"}}>No</button>
             </div>
            :<button onClick={e=>{e.stopPropagation();setConfirm(true);}} style={{background:G.danger+"18",color:G.danger,border:"1px solid "+G.danger+"33",borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Eliminar</button>
        )}
      </div>
    </div>
  );
}

// ─── FORMULARIO TICKET ────────────────────────────────────────────
function NuevoTicketForm({user,onCrear,onCancel}){
  const[cat,setCat]=useState(CATEGORIAS[0].label);const[titulo,setTitulo]=useState("");const[titCustom,setTitCustom]=useState("");const[desc,setDesc]=useState("");const[nroCliente,setNroCliente]=useState("");const[err,setErr]=useState("");
  const catObj=CATEGORIAS.find(c=>c.label===cat)||CATEGORIAS[0];const esLibre=catObj.titulos.length===0;const titFinal=esLibre?titCustom:titulo;
  function handleCat(v){setCat(v);setTitulo("");setTitCustom("");}
  function crear(){
    if(!nroCliente.trim()){setErr("Ingresá el número de cliente.");return;}
    if(!titFinal.trim()){setErr("Seleccioná o escribí un título.");return;}
    if(!desc.trim()){setErr("Escribí una descripción.");return;}
    onCrear({categoria:cat,titulo:titFinal,descripcion:desc,nro_cliente:nroCliente});
  }
  return(
    <div className="fu" style={{background:G.card,border:"1px solid "+G.accentL+"44",borderRadius:14,padding:24,display:"flex",flexDirection:"column",gap:16}}>
      <h3 style={{fontSize:15,fontWeight:700,color:G.accentL}}>Nuevo Ticket</h3>
      <Field label="Número de cliente *"><input style={iS} value={nroCliente} onChange={e=>setNroCliente(e.target.value)} placeholder="Ej: 123456"/></Field>
      <Field label="Categoría"><select style={iS} value={cat} onChange={e=>handleCat(e.target.value)}>{CATEGORIAS.map(c=><option key={c.label}>{c.label}</option>)}</select></Field>
      {esLibre?<Field label="Título"><input style={iS} value={titCustom} onChange={e=>setTitCustom(e.target.value)} placeholder="Describí brevemente el problema"/></Field>:<Field label="Título"><select style={iS} value={titulo} onChange={e=>setTitulo(e.target.value)}><option value="">— Seleccioná un título —</option>{catObj.titulos.map(t=><option key={t}>{t}</option>)}</select></Field>}
      <Field label="Descripción detallada"><textarea style={{...iS,resize:"vertical",height:90}} value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Detallá el problema, cliente afectado, contexto..."/></Field>
      {err&&<p style={{color:G.danger,fontSize:12}}>{err}</p>}
      <div style={{display:"flex",gap:10}}><Btn onClick={crear} style={{background:G.red,border:"none"}}>Enviar Ticket</Btn><Btn variant="ghost" onClick={onCancel}>Cancelar</Btn></div>
    </div>
  );
}

// ─── VISTA ACTIVADOR ──────────────────────────────────────────────
function VistaActivador({user,tickets,onCrear,onOpenTicket,onEliminar}){
  const[showForm,setShowForm]=useState(false);
  const[filtros,setFiltros]=useState({estado:"",mes:"",anio:"",usuario:"",desde:"",hasta:""});
  const[busqueda,setBusqueda]=useState("");
  const[showFiltros,setShowFiltros]=useState(false);
  const mis=tickets.filter(t=>t.autor_id===user.id).sort((a,b)=>b.ts-a.ts);
  let filtrados=aplicarFiltros(mis,filtros);
  if(busqueda.trim()){const q=busqueda.toLowerCase();filtrados=filtrados.filter(t=>t.titulo.toLowerCase().includes(q)||t.id.toLowerCase().includes(q)||(t.nro_cliente||"").includes(q));}
  function crear(data){onCrear({...data,autor_id:user.id,autor:user.name});setShowForm(false);}
  const counts={todos:mis.length,iniciado:mis.filter(t=>t.estado==="iniciado").length,en_proceso:mis.filter(t=>t.estado==="en_proceso").length,resuelto:mis.filter(t=>t.estado==="resuelto").length};
  const hayFiltros=Object.values(filtros).some(v=>v!=="");
  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div><h1 style={{fontSize:22,fontWeight:800}}>Mis Tickets</h1><p style={{color:G.muted,fontSize:13,marginTop:3}}>Seguí tus solicitudes al área de Cuentas.</p></div>
        {!showForm&&<Btn onClick={()=>setShowForm(true)} style={{background:G.red,border:"none"}}>+ Nuevo Ticket</Btn>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {[{label:"Total",val:counts.todos,color:G.muted},{label:"Iniciados",val:counts.iniciado,color:"#6366f1"},{label:"En proceso",val:counts.en_proceso,color:G.warn},{label:"Resueltos",val:counts.resuelto,color:G.success}].map(s=>(<div key={s.label} style={{background:G.card,border:"1px solid "+G.border,borderRadius:10,padding:"14px 16px"}}><p style={{fontSize:24,fontWeight:800,color:s.color,...mono}}>{s.val}</p><p style={{fontSize:11,color:G.muted,marginTop:3}}>{s.label}</p></div>))}
      </div>
      {showForm&&<NuevoTicketForm user={user} onCrear={crear} onCancel={()=>setShowForm(false)}/>}
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <input style={{...iS,flex:1}} value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar por título, número de ticket o cliente..."/>
        <button onClick={()=>setShowFiltros(!showFiltros)} style={{background:hayFiltros?G.accent+"22":"transparent",color:hayFiltros?G.accentL:G.muted,border:"1px solid "+(hayFiltros?G.accent+"55":G.border),borderRadius:8,padding:"10px 16px",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
          {hayFiltros?"Filtros activos ●":"Filtros"}
        </button>
      </div>
      {showFiltros&&<FiltrosPanel tickets={mis} filtros={filtros} setFiltros={setFiltros} mostrarUsuario={false}/>}
      {filtrados.length===0&&!showForm
        ?<div style={{textAlign:"center",padding:"48px 0",color:G.muted}}><p style={{fontSize:32,marginBottom:12}}>◈</p><p style={{fontSize:14}}>{mis.length===0?"No tenés tickets cargados aún.":"No hay tickets con estos filtros."}</p></div>
        :<div style={{display:"flex",flexDirection:"column",gap:8}}>{filtrados.map(t=><TicketRow key={t.id} ticket={t} onClick={()=>onOpenTicket(t)} onEliminar={onEliminar}/>)}</div>
      }
    </div>
  );
}

// ─── VISTA CUENTAS / ADMIN TICKETS ────────────────────────────────
function VistaCuentas({tickets,onOpenTicket,unseenIds,isAdmin}){
  const[filtros,setFiltros]=useState({estado:"",mes:"",anio:"",usuario:"",desde:"",hasta:""});
  const[busqueda,setBusqueda]=useState("");
  const[showFiltros,setShowFiltros]=useState(false);
  let lista=[...tickets].sort((a,b)=>b.ts-a.ts);
  lista=aplicarFiltros(lista,filtros);
  if(busqueda.trim()){const q=busqueda.toLowerCase();lista=lista.filter(t=>t.titulo.toLowerCase().includes(q)||t.autor.toLowerCase().includes(q)||t.id.toLowerCase().includes(q)||(t.nro_cliente||"").includes(q));}
  const counts={todos:tickets.length,iniciado:tickets.filter(t=>t.estado==="iniciado").length,en_proceso:tickets.filter(t=>t.estado==="en_proceso").length,resuelto:tickets.filter(t=>t.estado==="resuelto").length};
  const hayFiltros=Object.values(filtros).some(v=>v!=="");
  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div><h1 style={{fontSize:22,fontWeight:800}}>{isAdmin?"Todos los Tickets":"Cola de Tickets"}</h1><p style={{color:G.muted,fontSize:13,marginTop:3}}>Reclamos recibidos de los activadores.</p></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {[{label:"Total",val:counts.todos,color:G.muted},{label:"Iniciados",val:counts.iniciado,color:"#6366f1"},{label:"En proceso",val:counts.en_proceso,color:G.warn},{label:"Resueltos",val:counts.resuelto,color:G.success}].map(s=>(<div key={s.label} style={{background:G.card,border:"1px solid "+G.border,borderRadius:10,padding:"14px 16px"}}><p style={{fontSize:24,fontWeight:800,color:s.color,...mono}}>{s.val}</p><p style={{fontSize:11,color:G.muted,marginTop:3}}>{s.label}</p></div>))}
      </div>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <input style={{...iS,flex:1}} value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar por título, autor, número de ticket o cliente..."/>
        <button onClick={()=>setShowFiltros(!showFiltros)} style={{background:hayFiltros?G.accent+"22":"transparent",color:hayFiltros?G.accentL:G.muted,border:"1px solid "+(hayFiltros?G.accent+"55":G.border),borderRadius:8,padding:"10px 16px",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
          {hayFiltros?"Filtros activos ●":"Filtros"}
        </button>
      </div>
      {showFiltros&&<FiltrosPanel tickets={tickets} filtros={filtros} setFiltros={setFiltros} mostrarUsuario={true}/>}
      {lista.length===0
        ?<div style={{textAlign:"center",padding:"48px 0",color:G.muted}}><p style={{fontSize:14}}>No hay tickets con estos filtros.</p></div>
        :<div style={{display:"flex",flexDirection:"column",gap:8}}>{lista.map(t=><TicketRow key={t.id} ticket={t} onClick={()=>onOpenTicket(t)} showAutor isNew={unseenIds.has(t.id)}/>)}</div>
      }
    </div>
  );
}

// ─── VISTA USUARIOS ───────────────────────────────────────────────
function VistaUsuarios(){
  const[users,setUsersLocal]=useState([]);const[showForm,setShowForm]=useState(false);const[editing,setEditing]=useState(null);const[form,setForm]=useState({name:"",role:"activador",password:"",email:""});const[err,setErr]=useState("");const[msg,setMsg]=useState("");const[busqueda,setBusqueda]=useState("");
  useEffect(()=>{sb.from("usuarios").select("*").order("name").then(({data})=>{if(data)setUsersLocal(data);});},[]);
  function openNew(){setEditing(null);setForm({name:"",role:"activador",password:"",email:""});setErr("");setShowForm(true);}
  function openEdit(u){setEditing(u);setForm({name:u.name,role:u.role,password:u.password,email:u.email||""});setErr("");setShowForm(true);}
  async function guardar(){
    if(!form.name.trim()){setErr("El nombre es obligatorio.");return;}
    if(!form.password.trim()){setErr("La contraseña es obligatoria.");return;}
    if(editing){const{error}=await sb.from("usuarios").update({name:form.name,role:form.role,password:form.password,email:form.email}).eq("id",editing.id);if(error){setErr("Error al guardar.");return;}}
    else{const exists=users.find(u=>u.name.toLowerCase()===form.name.toLowerCase());if(exists){setErr("Ya existe un usuario con ese nombre.");return;}const nuevo={id:nuid(),name:form.name,role:form.role,password:form.password,email:form.email,active:true};const{error}=await sb.from("usuarios").insert(nuevo);if(error){setErr("Error al crear.");return;}}
    const{data}=await sb.from("usuarios").select("*").order("name");if(data)setUsersLocal(data);
    setShowForm(false);setMsg(editing?"Usuario actualizado.":"Usuario creado.");setTimeout(()=>setMsg(""),3000);
  }
  async function toggleActive(u){if(u.id==="admin")return;await sb.from("usuarios").update({active:!u.active}).eq("id",u.id);const{data}=await sb.from("usuarios").select("*").order("name");if(data)setUsersLocal(data);}
  const filtrados=busqueda.trim()?users.filter(u=>u.name.toLowerCase().includes(busqueda.toLowerCase())||u.role.includes(busqueda.toLowerCase())):users;
  const porRol={admin:filtrados.filter(u=>u.role==="admin"),activador:filtrados.filter(u=>u.role==="activador"),cuentas:filtrados.filter(u=>u.role==="cuentas")};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div><h1 style={{fontSize:22,fontWeight:800}}>Gestión de Usuarios</h1><p style={{color:G.muted,fontSize:13,marginTop:3}}>Total: <span style={{color:G.accentL,fontWeight:700}}>{users.length}</span> · Activos: <span style={{color:G.success,fontWeight:700}}>{users.filter(u=>u.active).length}</span></p></div>
        {!showForm&&<Btn onClick={openNew} style={{background:G.red,border:"none"}}>+ Nuevo Usuario</Btn>}
      </div>
      {msg&&<div style={{background:G.success+"18",border:"1px solid "+G.success+"44",borderRadius:8,padding:"10px 16px",color:G.success,fontSize:13}}>{msg}</div>}
      {showForm&&(
        <div className="fu" style={{background:G.card,border:"1px solid "+G.accentL+"44",borderRadius:14,padding:24,display:"flex",flexDirection:"column",gap:14}}>
          <h3 style={{fontSize:15,fontWeight:700,color:G.accentL}}>{editing?"Editar Usuario":"Nuevo Usuario"}</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Field label="Nombre completo"><input style={iS} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Nombre y apellido"/></Field>
            <Field label="Rol"><select style={iS} value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>{["activador","cuentas","admin"].map(r=><option key={r} value={r}>{ROLES[r]}</option>)}</select></Field>
            <Field label="Contraseña"><input style={iS} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Contraseña de acceso"/></Field>
            <Field label="Email (notificaciones)"><input style={iS} type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="correo@empresa.com"/></Field>
          </div>
          {err&&<p style={{color:G.danger,fontSize:12}}>{err}</p>}
          <div style={{display:"flex",gap:10}}><Btn onClick={guardar} style={{background:G.red,border:"none"}}>{editing?"Guardar cambios":"Crear usuario"}</Btn><Btn variant="ghost" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
        </div>
      )}
      <input style={{...iS,width:"100%"}} value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar usuario..."/>
      {Object.entries(porRol).map(([rol,lista])=>{
        if(lista.length===0)return null;
        const cols={admin:"#a855f7",activador:G.accentL,cuentas:G.success};const c=cols[rol]||G.muted;
        return(<div key={rol}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><span style={{fontSize:11,fontWeight:700,color:c,letterSpacing:1.5,textTransform:"uppercase"}}>{ROLES[rol]}</span><span style={{fontSize:11,color:G.muted,...mono}}>({lista.length})</span><div style={{flex:1,height:1,background:G.border}}/></div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>{lista.map(u=>(<div key={u.id} style={{background:G.card,border:"1px solid "+G.border,borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,opacity:u.active===false?0.5:1}}><div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}><span style={{fontWeight:700,fontSize:14}}>{u.name}</span>{u.active===false&&<span style={{background:G.danger+"22",color:G.danger,border:"1px solid "+G.danger+"44",borderRadius:5,padding:"1px 7px",fontSize:10,fontWeight:700}}>INACTIVO</span>}</div><p style={{color:G.muted,fontSize:12,...mono}}>{u.email?<span style={{color:G.accentL}}>✉ {u.email}</span>:<span style={{color:G.danger+"88"}}>Sin email cargado</span>}</p></div><div style={{display:"flex",gap:8,flexShrink:0}}><Btn variant="ghost" style={{padding:"6px 12px",fontSize:11}} onClick={()=>openEdit(u)}>Editar</Btn>{u.id!=="admin"&&<Btn variant={u.active===false?"success":"danger"} style={{padding:"6px 12px",fontSize:11}} onClick={()=>toggleActive(u)}>{u.active===false?"Activar":"Desactivar"}</Btn>}</div></div>))}</div>
        </div>);
      })}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────
function VistaDashboard({tickets}){
  const now=new Date();const[anio,setAnio]=useState(now.getFullYear());const[mes,setMes]=useState("todos");
  const filtrados=tickets.filter(t=>{const d=new Date(t.ts);if(d.getFullYear()!==anio)return false;if(mes!=="todos"&&d.getMonth()!==parseInt(mes))return false;return true;});
  const total=filtrados.length;const iniciado=filtrados.filter(t=>t.estado==="iniciado").length;const enProceso=filtrados.filter(t=>t.estado==="en_proceso").length;const resuelto=filtrados.filter(t=>t.estado==="resuelto").length;
  const pct=(n)=>total>0?Math.round((n/total)*100):0;
  const datosMensuales=MESES.map((m,i)=>({mes:m.slice(0,3),iniciado:tickets.filter(t=>{const d=new Date(t.ts);return d.getFullYear()===anio&&d.getMonth()===i&&t.estado==="iniciado";}).length,en_proceso:tickets.filter(t=>{const d=new Date(t.ts);return d.getFullYear()===anio&&d.getMonth()===i&&t.estado==="en_proceso";}).length,resuelto:tickets.filter(t=>{const d=new Date(t.ts);return d.getFullYear()===anio&&d.getMonth()===i&&t.estado==="resuelto";}).length}));
  const datosTorta=[{name:"Iniciado",value:iniciado,color:"#6366f1"},{name:"En proceso",value:enProceso,color:G.warn},{name:"Resuelto",value:resuelto,color:G.success}].filter(d=>d.value>0);
  const porCategoria=CATEGORIAS.map(c=>({name:c.label==="General / Otro"?"Otro":c.label.split("/")[0].trim(),value:filtrados.filter(t=>t.categoria===c.label).length})).filter(d=>d.value>0);
  const porActivador=[...new Set(filtrados.map(t=>t.autor))].map(a=>({name:a.split(" ")[0],value:filtrados.filter(t=>t.autor===a).length})).sort((a,b)=>b.value-a.value).slice(0,6);
  const ttStyle={background:G.card,border:"1px solid "+G.border,borderRadius:8,color:G.text,fontSize:12};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:28}} className="fu">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:12}}>
        <div><h1 style={{fontSize:22,fontWeight:800}}>Dashboard</h1><p style={{color:G.muted,fontSize:13,marginTop:3}}>Resumen de tickets y actividad del equipo.</p></div>
        <div style={{display:"flex",gap:10}}>
          <select style={{...iS,width:"auto",padding:"8px 12px",fontSize:13}} value={anio} onChange={e=>setAnio(parseInt(e.target.value))}>{[now.getFullYear()-1,now.getFullYear()].map(a=><option key={a} value={a}>{a}</option>)}</select>
          <select style={{...iS,width:"auto",padding:"8px 12px",fontSize:13}} value={mes} onChange={e=>setMes(e.target.value)}><option value="todos">Todos los meses</option>{MESES.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[{label:"Total tickets",val:total,color:G.accentL,icon:"◈",pct:null},{label:"Iniciados",val:iniciado,color:"#6366f1",icon:"○",pct:pct(iniciado)},{label:"En proceso",val:enProceso,color:G.warn,icon:"◑",pct:pct(enProceso)},{label:"Resueltos",val:resuelto,color:G.success,icon:"●",pct:pct(resuelto)}].map(s=>(<div key={s.label} style={{background:G.card,border:"1px solid "+G.border,borderRadius:14,padding:"20px 20px 16px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}><span style={{fontSize:20,color:s.color}}>{s.icon}</span>{s.pct!==null&&<span style={{background:s.color+"22",color:s.color,border:"1px solid "+s.color+"44",borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700,...mono}}>{s.pct}%</span>}</div><p style={{fontSize:32,fontWeight:800,color:s.color,...mono,lineHeight:1}}>{s.val}</p><p style={{fontSize:12,color:G.muted,marginTop:6}}>{s.label}</p>{s.pct!==null&&<div style={{marginTop:12,background:G.border,borderRadius:4,height:4}}><div style={{width:s.pct+"%",background:s.color,borderRadius:4,height:4,transition:"width 0.6s ease"}}/></div>}</div>))}
      </div>
      <div style={{background:G.card,border:"1px solid "+G.border,borderRadius:14,padding:24}}>
        <h2 style={{fontSize:15,fontWeight:700,marginBottom:20}}>Tickets por mes — {anio}</h2>
        <ResponsiveContainer width="100%" height={220}><BarChart data={datosMensuales} barSize={14} barGap={3}><XAxis dataKey="mes" tick={{fill:G.muted,fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:G.muted,fontSize:11}} axisLine={false} tickLine={false} allowDecimals={false}/><Tooltip contentStyle={ttStyle} cursor={{fill:G.border+"55"}}/><Legend wrapperStyle={{fontSize:12,color:G.muted,paddingTop:12}}/><Bar dataKey="iniciado" name="Iniciado" fill="#6366f1" radius={[4,4,0,0]}/><Bar dataKey="en_proceso" name="En proceso" fill={G.warn} radius={[4,4,0,0]}/><Bar dataKey="resuelto" name="Resuelto" fill={G.success} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        <div style={{background:G.card,border:"1px solid "+G.border,borderRadius:14,padding:24}}><h2 style={{fontSize:14,fontWeight:700,marginBottom:16}}>Estados</h2>{datosTorta.length>0?<ResponsiveContainer width="100%" height={200}><PieChart><Pie data={datosTorta} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">{datosTorta.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip contentStyle={ttStyle}/><Legend wrapperStyle={{fontSize:11,color:G.muted}}/></PieChart></ResponsiveContainer>:<div style={{height:200,display:"flex",alignItems:"center",justifyContent:"center",color:G.muted,fontSize:13}}>Sin datos</div>}</div>
        <div style={{background:G.card,border:"1px solid "+G.border,borderRadius:14,padding:24}}><h2 style={{fontSize:14,fontWeight:700,marginBottom:16}}>Por categoría</h2>{porCategoria.length>0?<ResponsiveContainer width="100%" height={200}><BarChart data={porCategoria} layout="vertical" barSize={14}><XAxis type="number" tick={{fill:G.muted,fontSize:10}} axisLine={false} tickLine={false} allowDecimals={false}/><YAxis type="category" dataKey="name" tick={{fill:G.muted,fontSize:10}} axisLine={false} tickLine={false} width={72}/><Tooltip contentStyle={ttStyle} cursor={{fill:G.border+"55"}}/><Bar dataKey="value" name="Tickets" fill={G.accentL} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>:<div style={{height:200,display:"flex",alignItems:"center",justifyContent:"center",color:G.muted,fontSize:13}}>Sin datos</div>}</div>
        <div style={{background:G.card,border:"1px solid "+G.border,borderRadius:14,padding:24}}><h2 style={{fontSize:14,fontWeight:700,marginBottom:16}}>Top activadores</h2>{porActivador.length>0?<div style={{display:"flex",flexDirection:"column",gap:10}}>{porActivador.map((a,i)=>(<div key={i}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,color:G.text,fontWeight:600}}>{a.name}</span><span style={{fontSize:12,color:G.accentL,fontWeight:700,...mono}}>{a.value}</span></div><div style={{background:G.border,borderRadius:4,height:5}}><div style={{width:(porActivador[0].value>0?(a.value/porActivador[0].value)*100:0)+"%",background:i===0?G.red:i===1?G.accentL:G.muted,borderRadius:4,height:5,transition:"width 0.5s ease"}}/></div></div>))}</div>:<div style={{height:200,display:"flex",alignItems:"center",justifyContent:"center",color:G.muted,fontSize:13}}>Sin datos</div>}</div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────
export default function App(){
  const[user,setUser]=useState(null);const[users,setUsers]=useState([]);const[tickets,setTickets]=useState([]);const[openTicket,setOpenTicket]=useState(null);const[notifs,setNotifs]=useState([]);const[unseenIds,setUnseenIds]=useState(new Set());const[tab,setTab]=useState("tickets");const[inicializado,setInicializado]=useState(false);
  const{toasts,add:addToast,dismiss}=useToasts();

  useEffect(()=>{
    async function init(){const{data}=await sb.from("usuarios").select("count",{count:"exact",head:true});setInicializado(true);}
    init();
  },[]);

  useEffect(()=>{
    if(!user)return;
    setTab(user.role==="admin"?"dashboard":"tickets");
    sb.from("usuarios").select("*").then(({data})=>{if(data)setUsers(data);});
    sb.from("tickets").select("*").order("ts",{ascending:false}).then(({data})=>{if(data)setTickets(data);});
    try{const n=localStorage.getItem("notifs_"+user.id);if(n)setNotifs(JSON.parse(n));}catch{}
  },[user]);

  useEffect(()=>{
    if(!user)return;
    const channel=sb.channel("tickets-rt").on("postgres_changes",{event:"*",schema:"public",table:"tickets"},payload=>{
      if(payload.eventType==="INSERT"){
        const nuevo=payload.new;
        setTickets(p=>[nuevo,...p.filter(t=>t.id!==nuevo.id)]);
        if(user.role==="cuentas"||user.role==="admin"){addToast("Nuevo ticket recibido",nuevo.autor+" abrió: \""+nuevo.titulo+"\"","🎫");setUnseenIds(p=>new Set([...p,nuevo.id]));}
      }
      if(payload.eventType==="UPDATE"){
        const upd=payload.new;
        setTickets(p=>p.map(t=>t.id===upd.id?upd:t));
        setOpenTicket(p=>p?.id===upd.id?upd:p);
        if(user.role==="activador"&&upd.autor_id===user.id){
          const label=ESTADOS[upd.estado]?.label||upd.estado;
          const n={title:"Ticket "+upd.id+" actualizado",body:"\""+upd.titulo+"\" pasó a "+label+".",ts:Date.now(),read:false};
          addToast(n.title,n.body,"🔔");
          setNotifs(prev=>{const u=[...prev,n];try{localStorage.setItem("notifs_"+user.id,JSON.stringify(u));}catch{}return u;});
        }
        if((user.role==="cuentas"||user.role==="admin")&&(upd.mensajes?.length||0)>0){
          const ultimo=upd.mensajes[upd.mensajes.length-1];
          if(ultimo?.role==="activador"){addToast("Nuevo mensaje en "+upd.id,ultimo.from+": "+ultimo.text.slice(0,50)+"...","💬");setUnseenIds(p=>new Set([...p,upd.id]));}
        }
      }
      if(payload.eventType==="DELETE"){setTickets(p=>p.filter(t=>t.id!==payload.old.id));}
    }).subscribe();
    return()=>{sb.removeChannel(channel);};
  },[user,addToast]);

  async function crearTicket(data){
    const auditoria=[{tipo:"creacion",usuario:data.autor,ts:Date.now()}];
    const nuevo={id:tktId(),...data,estado:"iniciado",mensajes:[],auditoria,ts:Date.now()};
    await sb.from("tickets").insert(nuevo);
  }

  async function actualizarTicket(id,changes,nuevoEstado){
    await sb.from("tickets").update(changes).eq("id",id);
    if(nuevoEstado&&(user.role==="cuentas"||user.role==="admin")){
      const label=ESTADOS[nuevoEstado]?.label||nuevoEstado;
      addToast("Estado actualizado","Ticket "+id+" → "+label,"✅");
      if(nuevoEstado==="resuelto"){const ticket=tickets.find(t=>t.id===id);if(ticket){const autorUser=users.find(u=>u.id===ticket.autor_id||u.name===ticket.autor);if(autorUser?.email)enviarMailResuelto(ticket,autorUser.email);}}
    }
  }

  async function eliminarTicket(id){
    await sb.from("tickets").delete().eq("id",id);
  }

  function handleOpenTicket(t){setOpenTicket(t);setUnseenIds(p=>{const s=new Set(p);s.delete(t.id);return s;});}
  function clearNotifs(){const u=notifs.map(n=>({...n,read:true}));setNotifs(u);try{localStorage.setItem("notifs_"+user?.id,JSON.stringify(u));}catch{};}
  function logout(){setUser(null);setTickets([]);setNotifs([]);setUnseenIds(new Set());setTab("tickets");}

  if(!inicializado)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:G.bg}}><span style={{color:G.muted,...mono,animation:"pulse 1.5s infinite"}}>Conectando...</span></div>;
  if(!user)return<Login onLogin={u=>setUser(u)}/>;

  return(
    <Shell user={user} onLogout={logout} notifs={notifs} onClearNotifs={clearNotifs} tab={tab} setTab={setTab}>
      {tab==="dashboard"&&user.role==="admin"&&<VistaDashboard tickets={tickets}/>}
      {tab==="tickets"&&(
        user.role==="activador"
          ?<VistaActivador user={user} tickets={tickets} onCrear={crearTicket} onOpenTicket={handleOpenTicket} onEliminar={eliminarTicket}/>
          :<VistaCuentas tickets={tickets} onOpenTicket={handleOpenTicket} unseenIds={unseenIds} isAdmin={user.role==="admin"}/>
      )}
      {tab==="usuarios"&&user.role==="admin"&&<VistaUsuarios/>}
      {openTicket&&<TicketModal ticket={openTicket} user={user} users={users} onClose={()=>setOpenTicket(null)} onUpdate={actualizarTicket}/>}
      <Toasts toasts={toasts} onDismiss={dismiss}/>
      <style>{css}</style>
    </Shell>
  );
}