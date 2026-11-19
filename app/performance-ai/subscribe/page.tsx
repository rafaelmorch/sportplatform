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
    <main style={{minHeight:"100dvh",background:"#08090c",color:"#fff",fontFamily:"Montserrat,Arial,sans-serif",padding:"max(28px,env(safe-area-inset-top)) 18px calc(50px + env(safe-area-inset-bottom))",boxSizing:"border-box"}}>
      <div style={{maxWidth:440,margin:"0 auto"}}>
        <header style={{position:"relative",textAlign:"left",padding:"14px 0 12px"}}>
          <div style={{fontSize:22,fontWeight:900,letterSpacing:".055em",marginBottom:22}}>ASHL<span style={{color:"#f52a36"}}>AI</span> <span style={{fontSize:11,fontWeight:650,color:"#9999a4",letterSpacing:".12em"}}>COACH</span></div>
          <p style={{fontSize:10,fontWeight:800,letterSpacing:".20em",color:"#f52a36",margin:"0 0 11px"}}><span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:"#f52a36",marginRight:8,boxShadow:"0 0 12px #f52a36"}}/>{t.subtitle}</p>
          <h1 style={{fontSize:"clamp(33px,8vw,45px)",fontWeight:900,letterSpacing:"-.055em",lineHeight:1.05,margin:"0 0 12px"}}>{t.headline}</h1>
          <p style={{color:"#aaaab4",fontSize:13,lineHeight:1.65,margin:0,maxWidth:380}}>{t.intro}</p>
          {paymentState === "cancelled" && <p role="status" style={noticeStyle}>{t.cancelled}</p>}
          {paymentState === "processing" && <p role="status" style={noticeStyle}>{t.processing}</p>}
        </header>
        <section aria-label={t.benefits} style={{margin:"14px 0 25px"}}>
          <div style={{position:"relative",margin:"0 auto 20px",width:"min(72%,260px)",filter:"drop-shadow(0 12px 35px rgba(220,20,48,.17))"}}>
            <img src={showcaseImages[0].src} alt="ASHLAI Coach performance screen" style={{display:"block",width:"100%",height:"auto",borderRadius:14}} />
          </div>
          <div style={{borderTop:"1px solid #ffffff1c",paddingTop:19}}>
            <p style={{fontSize:10,letterSpacing:".18em",fontWeight:800,color:"#f52a36",margin:"0 0 12px"}}>{t.differenceTitle}</p>
            {t.differences.slice(0,2).map((feature,index)=>(
              <div key={index} style={{display:"flex",gap:13,padding:"14px 0",borderBottom:"1px solid #ffffff12"}}>
                <span style={{color:"#f52a36",fontSize:19,fontWeight:900,flexShrink:0}}>{index===0?"↗":"✦"}</span>
                <div><h3 style={{fontSize:15,fontWeight:800,margin:"0 0 5px"}}>{feature[0]}</h3><p style={{fontSize:12,color:"#a9a9b3",lineHeight:1.6,margin:0}}>{feature[1]}</p></div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"center",margin:"24px 0"}}>
            <img src={showcaseImages[1].src} alt="ASHLAI Coach training plan screen" loading="lazy" style={{display:"block",width:"min(69%,250px)",height:"auto",borderRadius:14,boxShadow:"0 16px 38px #000b"}} />
          </div>
          {t.differences.slice(2,4).map((feature,index)=>(
            <div key={index} style={{display:"flex",gap:13,padding:"14px 0",borderBottom:"1px solid #ffffff12"}}>
              <span style={{color:"#f52a36",fontSize:19,fontWeight:900,flexShrink:0}}>{index===0?"◉":"◎"}</span>
              <div><h3 style={{fontSize:15,fontWeight:800,margin:"0 0 5px"}}>{feature[0]}</h3><p style={{fontSize:12,color:"#a9a9b3",lineHeight:1.6,margin:0}}>{feature[1]}</p></div>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"center",margin:"24px 0"}}>
            <img src={showcaseImages[2].src} alt="ASHLAI Coach nutrition screen" loading="lazy" style={{display:"block",width:"min(69%,250px)",height:"auto",borderRadius:14,boxShadow:"0 16px 38px #000b"}} />
          </div>
          {t.differences.slice(4,6).map((feature,index)=>(
            <div key={index} style={{display:"flex",gap:13,padding:"14px 0",borderBottom:"1px solid #ffffff12"}}>
              <span style={{color:"#f52a36",fontSize:19,fontWeight:900,flexShrink:0}}>{index===0?"♡":"✧"}</span>
              <div><h3 style={{fontSize:15,fontWeight:800,margin:"0 0 5px"}}>{feature[0]}</h3><p style={{fontSize:12,color:"#a9a9b3",lineHeight:1.6,margin:0}}>{feature[1]}</p></div>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"center",margin:"24px 0 8px"}}>
            <img src={showcaseImages[3].src} alt="ASHLAI Coach daily workout screen" loading="lazy" style={{display:"block",width:"min(69%,250px)",height:"auto",borderRadius:14,boxShadow:"0 16px 38px #000b"}} />
          </div>
        </section>
        <section style={{background:"linear-gradient(125deg,#231a20,#111217 80%)",border:"1px solid #f52a3655",borderRadius:14,padding:"19px 18px",margin:"8px 0 18px"}}>
          <h2 style={{fontSize:16,margin:"0 0 15px",fontWeight:700}}>{t.membership}</h2>
          <div style={{fontSize:30,fontWeight:800,letterSpacing:"-.03em"}}>
            {nativeIos ? (applePrice || (priceError ? t.priceUnavailable : t.priceLoading)) : t.webPrice}
          </div>
          {nativeIos && applePrice && <p style={{color:"#aaa",fontSize:13,margin:"5px 0 0"}}>{t.month}</p>}
          <p style={{color:"#bdbdc5",fontSize:12,lineHeight:1.65,margin:"14px 0 0"}}>{t.renewal}</p>
          <p style={{color:"#bdbdc5",fontSize:12,lineHeight:1.65,margin:"9px 0 0"}}>{t.cancelInfo}</p>
          <p style={{color:"#bdbdc5",fontSize:12,lineHeight:1.65,margin:"9px 0 0"}}>{nativeIos?t.cancelApple:t.cancelOther}</p>
        </section>
        <label style={{display:"flex",alignItems:"flex-start",gap:11,color:"#e3e3e7",fontSize:13,lineHeight:1.6,cursor:"pointer"}}>
          <input type="checkbox" checked={acceptedTerms} onChange={e=>setAcceptedTerms(e.target.checked)} style={{width:19,height:19,marginTop:1,accentColor:"#e02642",flexShrink:0}} />
          <span>{t.agree} <a href="/terms" target="_blank" rel="noopener noreferrer" style={{color:"#ff6679",textDecoration:"underline"}}>{t.terms}</a> {t.and} <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{color:"#ff6679",textDecoration:"underline"}}>{t.privacy}</a>.</span>
        </label>
        {errorMessage && <p role="alert" style={{color:"#ff9da9",fontSize:12,marginTop:12}}>{errorMessage}</p>}
        <button type="button" onClick={()=>void beginCheckout()} disabled={loading || !acceptedTerms || (nativeIos && !applePrice)} style={{width:"100%",minHeight:52,marginTop:19,border:0,borderRadius:11,background:loading || !acceptedTerms || (nativeIos && !applePrice)?"#59232e":"#f52a36",color:"#fff",fontSize:15,fontWeight:750,cursor:"pointer"}}>
          {loading?t.busy:t.buy}
        </button>
        {nativeIos && <button type="button" onClick={()=>void restorePurchases()} disabled={restoring} style={{display:"block",width:"100%",padding:16,border:0,background:"transparent",color:"#ff6679",fontSize:13,cursor:"pointer"}}>{restoring?t.restoring:t.restore}</button>}
        {paymentState==="processing" && <button type="button" onClick={()=>router.replace("/performance-ai")} style={{display:"block",margin:"10px auto",padding:10,border:0,background:"transparent",color:"#fff"}}>{t.retry}</button>}
      </div>
    </main>
  );
}
const noticeStyle: React.CSSProperties = {marginTop:12,padding:12,border:"1px solid rgba(212,175,55,.3)",borderRadius:10,color:"#ddd",fontSize:12};

type Lang = "pt" | "en" | "es";
const copy = {
  pt: { differenceTitle:"O QUE TORNA A ASHLAI DIFERENTE", differences:[["Inteligência nos treinos","Acompanhe seus treinos no contexto da rotina e dos hábitos que impulsionam sua evolução."],["Orientação com IA","Receba orientações baseadas nas informações que você decidir compartilhar."],["Consciência nutricional","Registre refeições e entenda como a alimentação contribui para o treino e a recuperação."],["Refeições e fotos dos pratos","Envie fotos das refeições e acompanhe seus hábitos alimentares."],["Corpo e saúde","Reúna medidas corporais e registros de saúde para uma visão mais completa."],["Exames e bioimpedância","Organize exames de sangue e avaliações corporais para contextualizar suas orientações."]], reasons:["Treinos personalizados com IA","Nutrição inteligente por foto","Sua evolução em um só lugar"], swipe:"DESLIZE PARA EXPLORAR →", showcase:[["Performance com IA","Acompanhe sua evolução e receba orientações personalizadas."],["Plano de treinos","Organize treinos e alimentação no calendário."],["Nutrição inteligente","Analise refeições com ajuda da inteligência artificial."],["Treino do dia","Veja metas, intensidade e dicas para cada treino."]], membership:"Sua assinatura",cancelInfo:"Você pode cancelar quando quiser. O acesso normalmente continua até o final do período já pago.",cancelApple:"No iPhone: Ajustes > seu nome > Assinaturas > ASHLAI Coach > Cancelar assinatura.",cancelOther:"Gerencie ou cancele pelo serviço de pagamento usado na contratação.", subtitle:"SEU PERSONAL TRAINER COM IA", headline:"Seu próximo passo começa aqui.", intro:"Treinos, alimentação e evolução em uma experiência personalizada.", benefits:"DESCUBRA A ASHLAI", month:"por mês", renewal:"Assinatura mensal com renovação automática. Cancele quando quiser.", agree:"Li e concordo com os", terms:"Termos de Uso", and:"e com a", privacy:"Política de Privacidade", buy:"Assinar ASHLAI Coach", busy:"Processando...", restore:"Restaurar compras", restoring:"Restaurando...", priceLoading:"Consultando preço na Apple...", priceUnavailable:"Preço indisponível. Verifique sua conexão e tente novamente.", cancelled:"O pagamento foi cancelado. Nenhuma cobrança foi realizada.", processing:"Sua assinatura está sendo confirmada.", retry:"Verificar assinatura novamente", restored:"Compra restaurada. Estamos verificando seu acesso.", restoreMissing:"Nenhuma assinatura ativa encontrada para restaurar.", webPrice:"Confira o valor e as condições no checkout seguro do Stripe.", items:[["Seu plano de treinos","Visualize seu calendário e treinos personalizados."],["Nutrição inteligente","Acompanhe refeições e seus hábitos alimentares."],["Converse com a ASHLAI","Orientação com IA disponível quando você precisar."],["Sua evolução","Acompanhe seu desempenho e progresso."],["Corpo e exames","Organize medidas corporais e exames para orientar seu acompanhamento."]] },
  en: { differenceTitle:"WHAT MAKES ASHLAI DIFFERENT", differences:[["Intelligent training","Understand your workouts in the context of your routine and habits."],["AI-powered guidance","Get guidance based on the information you choose to share."],["Nutrition awareness","See how your meals support training and recovery."],["Meal photos and tracking","Log meals with photos and follow your nutrition habits."],["Body and health","Keep body measurements and health records together."],["Blood tests and body composition","Organize blood test results and body composition assessments for more informed guidance."]], reasons:["Personalized AI training plans","Smart nutrition from meal photos","Track your progress in one place"], swipe:"SWIPE TO EXPLORE →", showcase:[["AI performance","Track your progress with personalized coaching."],["Your training plan","Plan workouts and nutrition in your calendar."],["Smart nutrition","Analyze meals with AI-powered insights."],["Daily workout","See your goals, intensity and coaching tips."]], membership:"Your membership",cancelInfo:"Cancel anytime. Access normally continues until the end of the paid billing period.",cancelApple:"On iPhone: Settings > your name > Subscriptions > ASHLAI Coach > Cancel Subscription.",cancelOther:"Manage or cancel through the payment service used at checkout.", subtitle:"YOUR AI PERSONAL COACH", headline:"Your next chapter starts here.", intro:"Training, nutrition and progress in one personalized experience.", benefits:"EXPLORE ASHLAI", month:"per month", renewal:"Auto-renewable monthly subscription. Cancel anytime.", agree:"I agree to the", terms:"Terms of Use", and:"and", privacy:"Privacy Policy", buy:"Subscribe to ASHLAI Coach", busy:"Processing...", restore:"Restore Purchases", restoring:"Restoring...", priceLoading:"Loading price from Apple...", priceUnavailable:"Price unavailable. Check your connection and try again.", cancelled:"Payment cancelled. No charge was made.", processing:"Your subscription is being confirmed.", retry:"Check subscription again", restored:"Purchase restored. Verifying your access.", restoreMissing:"No active subscription found to restore.", webPrice:"Price and terms will be shown in the secure Stripe checkout.", items:[["Your training plan","See your personalized calendar and workouts."],["Smart nutrition","Track meals and nutrition habits."],["Chat with ASHLAI","AI guidance whenever you need it."],["Your progress","Follow your performance and improvement."],["Body & blood","Keep body measurements and blood test records together."]] },
  es: { differenceTitle:"QUÉ HACE DIFERENTE A ASHLAI", differences:[["Entrenamiento inteligente","Comprende tus entrenamientos en el contexto de tu rutina y hábitos."],["Orientación con IA","Recibe orientación según los datos que decidas compartir."],["Conciencia nutricional","Descubre cómo tu alimentación contribuye al entrenamiento y la recuperación."],["Fotos y registro de comidas","Registra tus comidas con fotos y sigue tus hábitos alimentarios."],["Cuerpo y salud","Reúne medidas corporales y registros de salud."],["Análisis de sangre y composición corporal","Organiza resultados de análisis y evaluaciones corporales para orientar tu seguimiento."]], reasons:["Planes de entrenamiento con IA","Nutrición inteligente con fotos","Tu progreso en un solo lugar"], swipe:"DESLIZA PARA EXPLORAR →", showcase:[["Rendimiento con IA","Sigue tu progreso con orientación personalizada."],["Plan de entrenamiento","Organiza entrenamientos y alimentación en el calendario."],["Nutrición inteligente","Analiza comidas con inteligencia artificial."],["Entrenamiento diario","Consulta metas, intensidad y consejos para entrenar."]], membership:"Tu suscripción",cancelInfo:"Cancela cuando quieras. Normalmente mantienes el acceso hasta que termine el período pagado.",cancelApple:"En iPhone: Ajustes > tu nombre > Suscripciones > ASHLAI Coach > Cancelar suscripción.",cancelOther:"Gestiona o cancela desde el servicio de pago utilizado.", subtitle:"TU ENTRENADORA PERSONAL CON IA", headline:"Tu próximo paso empieza aquí.", intro:"Entrenamiento, nutrición y progreso en una experiencia personalizada.", benefits:"DESCUBRE ASHLAI", month:"al mes", renewal:"Suscripción mensual con renovación automática. Cancela cuando quieras.", agree:"Acepto los", terms:"Términos de Uso", and:"y la", privacy:"Política de Privacidad", buy:"Suscribirme a ASHLAI Coach", busy:"Procesando...", restore:"Restaurar compras", restoring:"Restaurando...", priceLoading:"Consultando precio en Apple...", priceUnavailable:"Precio no disponible. Comprueba tu conexión e inténtalo de nuevo.", cancelled:"Pago cancelado. No se realizó ningún cargo.", processing:"Tu suscripción se está confirmando.", retry:"Comprobar suscripción de nuevo", restored:"Compra restaurada. Verificando tu acceso.", restoreMissing:"No se encontró una suscripción activa para restaurar.", webPrice:"El precio y las condiciones aparecerán en el pago seguro de Stripe.", items:[["Tu plan de entrenamiento","Consulta tu calendario y entrenamientos personalizados."],["Nutrición inteligente","Registra comidas y hábitos alimentarios."],["Habla con ASHLAI","Orientación con IA siempre que la necesites."],["Tu progreso","Sigue tu rendimiento y evolución."],["Cuerpo y análisis","Organiza tus medidas corporales y análisis de sangre."]] },
} as const;
const showcaseImages = [
  {src:"/performance-ai/subscribe/ashlai-score.png"},
  {src:"/performance-ai/subscribe/ashlai-calendar.png"},
  {src:"/performance-ai/subscribe/ashlai-nutrition.png"},
  {src:"/performance-ai/subscribe/ashlai-day-details.png"},
];
