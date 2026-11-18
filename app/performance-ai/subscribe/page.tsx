"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { supabaseBrowser } from "@/lib/supabase-browser";
import { Capacitor } from "@capacitor/core";
import { APPLE_PERFORMANCE_AI_PRODUCT_ID } from "@/lib/apple-iap-products";

export default function PerformanceAiSubscribePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => supabaseBrowser, []);

  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [applePrice, setApplePrice] = useState<string | null>(null);
  const [priceError, setPriceError] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const nativeIos = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  const t = copy[lang];

  useEffect(() => {
    const language = (typeof navigator !== "undefined" ? navigator.language : "en").toLowerCase();
    setLang(language.startsWith("pt") ? "pt" : language.startsWith("es") ? "es" : "en");
  }, []);

  useEffect(() => {
    if (!nativeIos) return;
    let active = true;
    (async () => {
      try {
        const { NativePurchases, PURCHASE_TYPE } = await import("@capgo/native-purchases");
        const { products } = await NativePurchases.getProducts({
          productIdentifiers: [APPLE_PERFORMANCE_AI_PRODUCT_ID],
          productType: PURCHASE_TYPE.SUBS,
        });
        const price = products.find(p => p.identifier === APPLE_PERFORMANCE_AI_PRODUCT_ID)?.priceString || products[0]?.priceString;
        if (active) { setApplePrice(price || null); setPriceError(!price); }
      } catch {
        if (active) setPriceError(true);
      }
    })();
    return () => { active = false; };
  }, [nativeIos]);

  const restorePurchases = async () => {
    if (!nativeIos || restoring) return;
    setRestoring(true);
    setErrorMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { router.push("/login"); return; }
      const { NativePurchases, PURCHASE_TYPE } = await import("@capgo/native-purchases");
      await NativePurchases.restorePurchases();
      const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.SUBS });
      const candidates = purchases.filter(p => p.productIdentifier === APPLE_PERFORMANCE_AI_PRODUCT_ID && p.isActive);
      let validated = false;
      for (const purchase of candidates) {
        const jws = (purchase as typeof purchase & { jwsRepresentation?: string }).jwsRepresentation;
        if (!jws) continue;
        const response = await fetch("/api/apple-iap/performance-ai/validate", {
          method:"POST", headers: { "Content-Type":"application/json", Authorization: "Bearer " + session.access_token },
          body: JSON.stringify({ jwsRepresentation: jws }),
        });
        if (response.ok) { validated = true; break; }
      }
      if (validated) router.replace("/performance-ai");
      else setErrorMessage(t.restoreMissing);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t.restoreMissing);
    } finally { setRestoring(false); }
  };

  const [acceptedTerms, setAcceptedTerms] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const paymentState =
    searchParams.get("payment");

  const beginCheckout = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const session = sessionData.session;
      const accessToken = session?.access_token;
      const userId = session?.user?.id;

      if (!accessToken || !userId) {
        router.push("/login");
        return;
      }

      const isNativeIos =
        Capacitor.isNativePlatform() &&
        Capacitor.getPlatform() === "ios";

      if (isNativeIos && !Capacitor.isPluginAvailable("NativePurchases")) {
        throw new Error("Apple purchases are unavailable. Please update the app.");
      }

      if (isNativeIos) {
        if (!applePrice) throw new Error(t.priceUnavailable);
        const { NativePurchases } = await import(
          "@capgo/native-purchases"
        );

        const transaction =
          await NativePurchases.purchaseProduct({
            productIdentifier:
              APPLE_PERFORMANCE_AI_PRODUCT_ID,
            appAccountToken: userId,
            autoAcknowledgePurchases: false,
          });

        if (!transaction.jwsRepresentation) {
          throw new Error(
            "A Apple não retornou uma transação StoreKit para validação."
          );
        }

        const validationResponse = await fetch(
          "/api/apple-iap/performance-ai/validate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              jwsRepresentation:
                transaction.jwsRepresentation,
            }),
          }
        );

        const validationData =
          await validationResponse
            .json()
            .catch(() => null);

        if (!validationResponse.ok) {
          throw new Error(
            validationData?.error ||
              "Não foi possível validar a assinatura da Apple."
          );
        }

        await NativePurchases.acknowledgePurchase({
          purchaseToken: transaction.transactionId,
        });

        router.replace("/performance-ai");
        return;
      }

      const response = await fetch(
        "/api/performance-ai/create-checkout",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const json =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          json?.error ??
            "Não foi possível iniciar o pagamento."
        );
      }

      if (
        typeof json?.url !== "string" ||
        !json.url
      ) {
        throw new Error(
          "O Stripe não retornou a página de pagamento."
        );
      }

      const { Browser } = await import(
        "@capacitor/browser"
      );

      await Browser.open({
        url: json.url,
      });
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao iniciar o pagamento."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="ashlai-paywall" style={{ minHeight:"100dvh", position:"relative", isolation:"isolate", overflow:"hidden", background:"#070707",color:"#fff",fontFamily:"Montserrat,sans-serif",padding:"max(24px,env(safe-area-inset-top)) 18px calc(88px + env(safe-area-inset-bottom))",boxSizing:"border-box" }}>
      <style>{`
        .ashlai-paywall::before {
          content: "";
          position: absolute;
          z-index: -1;
          pointer-events: none;
          inset: 0;
          background:
            radial-gradient(ellipse 65% 15% at 112% 12%, rgba(244,14,48,.27), transparent 75%),
            radial-gradient(ellipse 65% 13% at -18% 65%, rgba(188,0,37,.22), transparent 80%),
            radial-gradient(ellipse 75% 12% at 88% 100%, rgba(210,0,36,.28), transparent 80%);
        }
        .ashlai-paywall::after {
          content: "";
          position: absolute;
          z-index: -1;
          pointer-events: none;
          left: -25%;
          right: -25%;
          bottom: 2%;
          height: 26%;
          border-top: 2px solid rgba(255,25,58,.62);
          border-radius: 55% 80% 0 0 / 35% 45% 0 0;
          transform: rotate(-7deg);
          box-shadow: 0 -7px 26px rgba(255,0,46,.28), 0 -24px 85px rgba(190,0,34,.12);
        }
      `}</style>
      <div style={{ maxWidth:600,margin:"0 auto",position:"relative",zIndex:1 }}>
        <header style={{ textAlign:"center",marginBottom:28 }}>
          <img src="/performance-ai/subscribe/ashlai-coach.png" onError={e=>{e.currentTarget.style.display="none";}} alt="ASHLAI Coach" style={{display:"block",width:82,maxWidth:"25%",height:"auto",margin:"0 auto 8px"}} />
          <p style={{fontSize:10,letterSpacing:".2em",color:"#ff3b4d",margin:"9px 0 24px"}}>{t.subtitle}</p>
          <h1 style={{fontSize:"clamp(29px,7vw,42px)",lineHeight:1.12,letterSpacing:"-.04em",margin:"0 0 12px",fontWeight:650}}>{t.headline}</h1>
          <p style={{fontSize:14,color:"#bdbdc4",lineHeight:1.6,margin:0}}>{t.intro}</p>
          {paymentState === "cancelled" && <p role="status" style={noticeStyle}>{t.cancelled}</p>}
          {paymentState === "processing" && <p role="status" style={noticeStyle}>{t.processing}</p>}
        </header>
        <section aria-label={t.benefits}>
          <h2 style={{fontSize:11,color:"#d4af37",letterSpacing:".16em",margin:"0 0 15px"}}>{t.benefits}</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:20,padding:"14px 10px"}}>
            {highlights.map((image,index)=>(
              <article key={image} style={{background:"transparent",border:"none",borderRadius:15,overflow:"visible"}}>
                <div style={{padding:"18px 10px 8px",background:"radial-gradient(ellipse at 50% 90%,rgba(190,0,38,.2),transparent 72%)",transform:`rotate(${index%2===0?"-8deg":"8deg"}) translateY(${index%2===0?"0":"20px"})`}}>
                  <div style={{position:"relative",maxWidth:210,margin:"0 auto",aspectRatio:"9 / 17",border:"4px solid #36363a",borderRadius:25,background:"#050505",padding:4,boxShadow:"0 8px 28px rgba(0,0,0,.65),inset 0 0 0 1px #777",overflow:"hidden"}}>
                    <div aria-hidden="true" style={{position:"absolute",top:7,left:"50%",transform:"translateX(-50%)",width:"31%",height:9,borderRadius:10,background:"#030303",zIndex:2}} />
                    <div style={{width:"100%",height:"100%",borderRadius:18,overflow:"hidden",background:"#050505"}}>
                      <img src={image} alt={t.items[index][0]} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top",display:"block"}} />
                    </div>
                  </div>
                </div>
                <div style={{padding:"20px 6px 15px"}}>
                  <div style={{fontSize:10,color:"#d4af37",marginBottom:6}}>0{index+1}</div>
                  <h3 style={{fontSize:14,lineHeight:1.25,margin:"0 0 6px",fontWeight:650}}>{t.items[index][0]}</h3>
                  <p style={{fontSize:11,lineHeight:1.5,color:"#b5b5bf",margin:0}}>{t.items[index][1]}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <footer style={{borderTop:"1px solid #303035",marginTop:25,paddingTop:20}}>
          <div style={{textAlign:"center",marginBottom:16}}>
            {nativeIos ? (
              <>
                <div style={{fontSize:34,fontWeight:700,letterSpacing:"-.03em"}}>{applePrice || (priceError ? t.priceUnavailable : t.priceLoading)}</div>
                {applePrice && <p style={{color:"#bbb",fontSize:13,margin:"4px 0"}}>{t.month}</p>}
              </>
            ) : <p style={{fontSize:13,color:"#ccc"}}>{t.webPrice}</p>}
            <p style={{color:"#b7b7c0",fontSize:12,lineHeight:1.5}}>{t.renewal}</p>
          </div>
          <label style={{display:"flex",gap:10,alignItems:"flex-start",fontSize:12,color:"#ddd",lineHeight:1.6}}>
            <input type="checkbox" checked={acceptedTerms} onChange={e=>setAcceptedTerms(e.target.checked)} style={{accentColor:"#c8102e",width:18,height:18,flexShrink:0}} />
            <span>{t.agree} <a href="/terms" target="_blank" rel="noopener noreferrer" style={{color:"#d4af37"}}>{t.terms}</a> {t.and} <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{color:"#d4af37"}}>{t.privacy}</a>.</span>
          </label>
          {errorMessage && <p role="alert" style={{color:"#ffb4b4",fontSize:12}}>{errorMessage}</p>}
          <button type="button" onClick={()=>void beginCheckout()} disabled={loading || !acceptedTerms || (nativeIos && !applePrice)} style={{width:"100%",marginTop:16,minHeight:50,border:0,borderRadius:10,background:loading || !acceptedTerms || (nativeIos && !applePrice)?"#50202a":"#c8102e",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer"}}>
            {loading?t.busy:t.buy}
          </button>
          {nativeIos && <button type="button" onClick={()=>void restorePurchases()} disabled={restoring} style={{display:"block",width:"100%",background:"transparent",border:0,color:"#d4af37",padding:15,fontSize:13,cursor:"pointer"}}>{restoring?t.restoring:t.restore}</button>}
          {paymentState==="processing" && <button type="button" onClick={()=>router.replace("/performance-ai")} style={{display:"block",margin:"0 auto",padding:10,background:"transparent",color:"#fff",border:0}}>{t.retry}</button>}
        </footer>
      </div>
    </main>
  );
}
const noticeStyle: React.CSSProperties = {marginTop:12,padding:12,border:"1px solid rgba(212,175,55,.3)",borderRadius:10,color:"#ddd",fontSize:12};

type Lang = "pt" | "en" | "es";
const copy = {
  pt: { subtitle:"SEU PERSONAL TRAINER COM IA", headline:"Seu próximo passo começa aqui.", intro:"Treinos, alimentação e evolução em uma experiência personalizada.", benefits:"DESCUBRA A ASHLAI", month:"por mês", renewal:"Assinatura mensal com renovação automática. Cancele quando quiser.", agree:"Li e concordo com os", terms:"Termos de Uso", and:"e com a", privacy:"Política de Privacidade", buy:"Assinar ASHLAI Coach", busy:"Processando...", restore:"Restaurar compras", restoring:"Restaurando...", priceLoading:"Consultando preço na Apple...", priceUnavailable:"Preço indisponível. Verifique sua conexão e tente novamente.", cancelled:"O pagamento foi cancelado. Nenhuma cobrança foi realizada.", processing:"Sua assinatura está sendo confirmada.", retry:"Verificar assinatura novamente", restored:"Compra restaurada. Estamos verificando seu acesso.", restoreMissing:"Nenhuma assinatura ativa encontrada para restaurar.", webPrice:"Confira o valor e as condições no checkout seguro do Stripe.", items:[["Seu plano de treinos","Visualize seu calendário e treinos personalizados."],["Nutrição inteligente","Acompanhe refeições e seus hábitos alimentares."],["Converse com a ASHLAI","Orientação com IA disponível quando você precisar."],["Sua evolução","Acompanhe seu desempenho e progresso."],["Corpo e exames","Organize medidas corporais e exames para orientar seu acompanhamento."]] },
  en: { subtitle:"YOUR AI PERSONAL COACH", headline:"Your next chapter starts here.", intro:"Training, nutrition and progress in one personalized experience.", benefits:"EXPLORE ASHLAI", month:"per month", renewal:"Auto-renewable monthly subscription. Cancel anytime.", agree:"I agree to the", terms:"Terms of Use", and:"and", privacy:"Privacy Policy", buy:"Subscribe to ASHLAI Coach", busy:"Processing...", restore:"Restore Purchases", restoring:"Restoring...", priceLoading:"Loading price from Apple...", priceUnavailable:"Price unavailable. Check your connection and try again.", cancelled:"Payment cancelled. No charge was made.", processing:"Your subscription is being confirmed.", retry:"Check subscription again", restored:"Purchase restored. Verifying your access.", restoreMissing:"No active subscription found to restore.", webPrice:"Price and terms will be shown in the secure Stripe checkout.", items:[["Your training plan","See your personalized calendar and workouts."],["Smart nutrition","Track meals and nutrition habits."],["Chat with ASHLAI","AI guidance whenever you need it."],["Your progress","Follow your performance and improvement."],["Body & blood","Keep body measurements and blood test records together."]] },
  es: { subtitle:"TU ENTRENADORA PERSONAL CON IA", headline:"Tu próximo paso empieza aquí.", intro:"Entrenamiento, nutrición y progreso en una experiencia personalizada.", benefits:"DESCUBRE ASHLAI", month:"al mes", renewal:"Suscripción mensual con renovación automática. Cancela cuando quieras.", agree:"Acepto los", terms:"Términos de Uso", and:"y la", privacy:"Política de Privacidad", buy:"Suscribirme a ASHLAI Coach", busy:"Procesando...", restore:"Restaurar compras", restoring:"Restaurando...", priceLoading:"Consultando precio en Apple...", priceUnavailable:"Precio no disponible. Comprueba tu conexión e inténtalo de nuevo.", cancelled:"Pago cancelado. No se realizó ningún cargo.", processing:"Tu suscripción se está confirmando.", retry:"Comprobar suscripción de nuevo", restored:"Compra restaurada. Verificando tu acceso.", restoreMissing:"No se encontró una suscripción activa para restaurar.", webPrice:"El precio y las condiciones aparecerán en el pago seguro de Stripe.", items:[["Tu plan de entrenamiento","Consulta tu calendario y entrenamientos personalizados."],["Nutrición inteligente","Registra comidas y hábitos alimentarios."],["Habla con ASHLAI","Orientación con IA siempre que la necesites."],["Tu progreso","Sigue tu rendimiento y evolución."],["Cuerpo y análisis","Organiza tus medidas corporales y análisis de sangre."]] },
} as const;
const highlights = ["/performance-ai/subscribe/plan-calendar.png","/performance-ai/subscribe/nutrition-ai.png","/performance-ai/subscribe/coach-chat.png","/performance-ai/subscribe/performance.png","/performance-ai/subscribe/exames.png"];
