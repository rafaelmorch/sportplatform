"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, BrainCircuit, CalendarDays, Camera, HeartPulse, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";

type Lang = "en" | "pt" | "es";
const copy = {
  en: { eyebrow:"MEET YOUR AI PERSONAL COACH", title:"Your progress. A smarter way.", intro:"Training, nutrition, progress and wellness context, together in one personal coaching experience.", explore:"WHAT ASHLAI CAN DO", start:"Explore your membership", note:"Illustrative previews. Your own results depend on your data.", cards:[["Training calendar","See your training and recovery at a glance."],["Nutrition insights","Track meals and explore your nutrition habits."],["Ask your AI coach","Get guidance tailored to the information you share."],["Performance trends","Understand how your activity changes over time."],["Body & blood records","Keep measurements and test records organized."]], sample:"ILLUSTRATIVE DATA", coach:"How can I improve my recovery?", reply:"Start with consistent sleep, hydration and a lighter session when needed.", meal:"Meal analysis", mealText:"Review ingredients and portions", week:"YOUR WEEK", health:"BODY & HEALTH" },
  pt: { eyebrow:"CONHEÇA SEU PERSONAL COACH COM IA", title:"Sua evolução. De um jeito mais inteligente.", intro:"Treinos, nutrição, evolução e informações de saúde em uma experiência de acompanhamento personalizada.", explore:"O QUE A ASHLAI OFERECE", start:"Conhecer a assinatura", note:"Pré-visualizações ilustrativas. Seus resultados dependem dos seus dados.", cards:[["Calendário de treinos","Veja treinos e recuperação em um só lugar."],["Nutrição inteligente","Registre refeições e acompanhe seus hábitos."],["Converse com sua IA","Receba orientações com base nas informações que compartilhar."],["Evolução e performance","Entenda como sua atividade muda ao longo do tempo."],["Corpo e exames","Organize medidas e registros de exames."]], sample:"DADOS ILUSTRATIVOS", coach:"Como posso melhorar minha recuperação?", reply:"Priorize sono, hidratação e treinos mais leves quando necessário.", meal:"Análise de refeição", mealText:"Confira ingredientes e porções", week:"SUA SEMANA", health:"CORPO E SAÚDE" },
  es: { eyebrow:"CONOCE A TU ENTRENADORA CON IA", title:"Tu progreso. De forma más inteligente.", intro:"Entrenamiento, nutrición, progreso y datos de bienestar en una experiencia de acompañamiento personal.", explore:"DESCUBRE ASHLAI", start:"Conocer la suscripción", note:"Vistas ilustrativas. Tus resultados dependen de tus datos.", cards:[["Calendario de entrenamiento","Visualiza entrenamientos y recuperación."],["Nutrición inteligente","Registra comidas y observa tus hábitos."],["Habla con tu IA","Recibe orientación según la información que compartas."],["Progreso y rendimiento","Comprende cómo cambia tu actividad."],["Cuerpo y análisis","Organiza medidas y resultados de análisis."]], sample:"DATOS ILUSTRATIVOS", coach:"¿Cómo puedo recuperarme mejor?", reply:"Prioriza el sueño, la hidratación y sesiones suaves cuando sea necesario.", meal:"Análisis de comida", mealText:"Revisa ingredientes y porciones", week:"TU SEMANA", health:"CUERPO Y SALUD" }
} as const;
const red = "#ff334b";
const card: React.CSSProperties = {border:"1px solid rgba(255,255,255,.11)",background:"linear-gradient(145deg,#18181c,#0d0d10)",borderRadius:22,padding:20,overflow:"hidden",minWidth:0};
const muted: React.CSSProperties = {color:"#aaaab5",fontSize:13,lineHeight:1.6};
const mini: React.CSSProperties = {fontSize:10,letterSpacing:".13em",fontWeight:700,color:"#9999a5"};
export default function AshlaiIntroPage() {
  const [lang,setLang] = useState<Lang>("en");
  useEffect(()=>{const l=navigator.language.toLowerCase();setLang(l.startsWith("pt")?"pt":l.startsWith("es")?"es":"en");},[]);
  const t=copy[lang];
  return <main style={{minHeight:"100dvh",background:"#070709",color:"#fff",fontFamily:"Montserrat,Arial,sans-serif",padding:"max(24px,env(safe-area-inset-top)) 18px calc(55px + env(safe-area-inset-bottom))",overflow:"hidden"}}>
    <style>{`
      .ashlai-wrap{max-width:850px;margin:0 auto;position:relative}
      .ashlai-wrap:before{content:"";position:absolute;inset:-100px -25% auto;height:400px;background:radial-gradient(ellipse,rgba(240,0,43,.18),transparent 65%);pointer-events:none}
      .ashlai-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
      .ashlai-card{transition:transform .2s ease,border-color .2s ease}
      .ashlai-card:hover{transform:translateY(-3px);border-color:rgba(255,51,75,.4)!important}
      .ashlai-card-wide{grid-column:span 2}
      .ashlai-bars{display:flex;align-items:flex-end;gap:9px;height:96px;margin-top:15px}
      .ashlai-bars span{flex:1;border-radius:6px 6px 2px 2px;background:linear-gradient(0deg,#7e1128,#ff415a)}
      @media(max-width:520px){.ashlai-grid{gap:12px}.ashlai-card{padding:15px!important;border-radius:17px!important}.ashlai-card-wide{grid-column:span 2}}
    `}</style>
    <div className="ashlai-wrap">
      <header style={{textAlign:"center",padding:"20px 0 32px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:22}}><HeartPulse size={35} color={red}/><span style={{fontWeight:800,fontSize:22,letterSpacing:"-.035em"}}>ASHLAI <span style={{color:red}}>Coach</span></span></div>
        <p style={{...mini,color:red,margin:"0 0 14px"}}>{t.eyebrow}</p>
        <h1 style={{fontSize:"clamp(32px,7vw,56px)",letterSpacing:"-.055em",lineHeight:1.08,margin:"0 auto 16px",maxWidth:650}}>{t.title}</h1>
        <p style={{...muted,maxWidth:550,margin:"0 auto 25px",fontSize:15}}>{t.intro}</p>
        <Link href="/performance-ai/subscribe" style={{display:"inline-flex",alignItems:"center",gap:10,padding:"15px 24px",background:"#d91432",color:"#fff",borderRadius:12,fontWeight:700,textDecoration:"none",fontSize:14}}>{t.start}<ArrowRight size={18}/></Link>
      </header>
      <section aria-label={t.explore}>
        <p style={{...mini,color:"#ff6677",margin:"0 0 16px"}}>{t.explore}</p>
        <div className="ashlai-grid">
          <article className="ashlai-card" style={card}>
            <CalendarDays color={red} size={24}/><h2 style={{fontSize:17,margin:"12px 0 6px"}}>{t.cards[0][0]}</h2><p style={muted}>{t.cards[0][1]}</p>
            <div style={{background:"#0a0a0d",borderRadius:12,padding:12,marginTop:15}}><span style={mini}>{t.week}</span><div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginTop:12}}>{["M","T","W","T","F","S","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:10,color:"#888"}}>{d}<div style={{height:24,borderRadius:6,marginTop:7,background:[1,3,5].includes(i)?"#a61732":"#24242a",border:i===3?"1px solid #ff6274":"1px solid transparent"}}/></div>)}</div></div>
          </article>
          <article className="ashlai-card" style={card}>
            <Camera color={red} size={24}/><h2 style={{fontSize:17,margin:"12px 0 6px"}}>{t.cards[1][0]}</h2><p style={muted}>{t.cards[1][1]}</p>
            <div style={{background:"#0a0a0d",borderRadius:12,padding:13,marginTop:15}}><span style={mini}>{t.meal}</span><div style={{display:"flex",gap:10,alignItems:"center",marginTop:13}}><div style={{width:52,height:52,borderRadius:12,background:"radial-gradient(circle at 30% 30%,#9dc16a,#276c46 60%,#192a22)",display:"grid",placeItems:"center",fontSize:25}}>🥗</div><div style={{fontSize:12,color:"#e2e2e7"}}>{t.mealText}<div style={{height:5,width:90,background:"#e04a60",borderRadius:9,marginTop:9}}/></div></div></div>
          </article>
          <article className="ashlai-card ashlai-card-wide" style={card}>
            <BrainCircuit color={red} size={25}/><h2 style={{fontSize:18,margin:"12px 0 6px"}}>{t.cards[2][0]}</h2><p style={muted}>{t.cards[2][1]}</p>
            <div style={{maxWidth:520,margin:"18px auto 0",display:"grid",gap:10}}><div style={{justifySelf:"end",maxWidth:"85%",background:"#832037",padding:"12px 15px",borderRadius:"15px 15px 3px 15px",fontSize:13}}>{t.coach}</div><div style={{justifySelf:"start",maxWidth:"90%",background:"#24242b",padding:"12px 15px",borderRadius:"15px 15px 15px 3px",fontSize:13,lineHeight:1.5}}><Sparkles size={13} color={red} style={{display:"inline",marginRight:7}}/>{t.reply}</div></div>
          </article>
          <article className="ashlai-card" style={card}>
            <Activity color={red} size={24}/><h2 style={{fontSize:17,margin:"12px 0 6px"}}>{t.cards[3][0]}</h2><p style={muted}>{t.cards[3][1]}</p>
            <div className="ashlai-bars">{[43,70,58,84,64,95,77].map((h,i)=><span key={i} style={{height:h+"%"}}/>)}</div>
          </article>
          <article className="ashlai-card" style={card}>
            <HeartPulse color={red} size={24}/><h2 style={{fontSize:17,margin:"12px 0 6px"}}>{t.cards[4][0]}</h2><p style={muted}>{t.cards[4][1]}</p>
            <div style={{marginTop:17,padding:13,background:"#0b0b0e",borderRadius:12}}><span style={mini}>{t.health}</span>{[["#ff435d",76],["#b0b0bb",54],["#ff8a59",87]].map(([color,width],i)=><div key={i} style={{height:7,background:"#292930",borderRadius:9,marginTop:15,overflow:"hidden"}}><div style={{width:width+"%",height:"100%",background:color as string,borderRadius:9}}/></div>)}</div>
          </article>
        </div>
        <p style={{...muted,fontSize:11,textAlign:"center",margin:"16px 0 30px"}}><ShieldCheck size={13} style={{display:"inline",verticalAlign:"middle",marginRight:5}}/>{t.note}</p>
      </section>
      <div style={{textAlign:"center",padding:"12px 0 30px"}}><Link href="/performance-ai/subscribe" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:10,width:"min(420px,100%)",boxSizing:"border-box",padding:"17px 20px",background:"#d91432",color:"white",borderRadius:12,fontWeight:800,textDecoration:"none"}}>{t.start}<ArrowRight size={18}/></Link></div>
    </div>
  </main>;
}
