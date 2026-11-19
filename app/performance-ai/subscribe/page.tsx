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
    <main style={{minHeight:"100dvh",background:"#08080a",color:"#fff",fontFamily:"Montserrat,Arial,sans-serif",padding:"max(28px,env(safe-area-inset-top)) 18px calc(50px + env(safe-area-inset-bottom))",boxSizing:"border-box"}}>
      <div style={{maxWidth:480,margin:"0 auto"}}>
        <header style={{textAlign:"center",padding:"22px 0 20px"}}>
          <div style={{fontSize:24,fontWeight:800,letterSpacing:"-.04em",marginBottom:13}}>ASHLAI <span style={{color:"#f0354c"}}>Coach</span></div>
          <p style={{color:"#f55a6d",fontSize:10,fontWeight:700,letterSpacing:".16em",margin:"0 0 12px"}}>{t.subtitle}</p>
          <h1 style={{fontSize:27,lineHeight:1.18,margin:"0 0 10px"}}>{t.headline}</h1>
          <p style={{color:"#aaaab4",fontSize:13,lineHeight:1.6,margin:0}}>{t.intro}</p>
          {paymentState === "cancelled" && <p role="status" style={noticeStyle}>{t.cancelled}</p>}
          {paymentState === "processing" && <p role="status" style={noticeStyle}>{t.processing}</p>}
        </header>
        <section aria-label={t.benefits} style={{margin:"24px 0 34px"}}>
          <h2 style={{fontSize:12,fontWeight:800,letterSpacing:".15em",color:"#ff536a",margin:"0 0 20px",textAlign:"center"}}>{t.benefits}</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:"24px 12px",alignItems:"start"}}>
            {showcaseImages.map((item,index)=>(
              <article key={item.src} style={{minWidth:0,marginTop:index%2===1?24:0}}>
                <div style={{padding:"12px 7px 15px",background:"radial-gradient(ellipse at 50% 50%,rgba(220,15,49,.16),transparent 72%)"}}>
                  <div style={{position:"relative",width:"100%",maxWidth:215,aspectRatio:"9 / 17",margin:"0 auto",padding:5,border:"4px solid #38383f",borderRadius:25,background:"#050505",boxShadow:"0 18px 34px rgba(0,0,0,.75),0 0 15px rgba(225,16,58,.16)",transform:index%2===0?"perspective(900px) rotateY(-7deg) rotate(-3deg)":"perspective(900px) rotateY(7deg) rotate(3deg)",boxSizing:"border-box",overflow:"hidden"}}>
                    <img src={item.src} alt={t.showcase[index][0]} style={{display:"block",width:"100%",height:"100%",objectFit:"contain",borderRadius:16,background:"#000"}} />
                  </div>
                </div>
                <h3 style={{fontSize:14,lineHeight:1.35,fontWeight:800,margin:"13px 0 5px"}}>{t.showcase[index][0]}</h3>
                <p style={{fontSize:12,lineHeight:1.55,color:"#bdbdc5",margin:0}}>{t.showcase[index][1]}</p>
              </article>
            ))}
          </div>
        </section>
        <section style={{background:"#151519",border:"1px solid #303036",borderRadius:18,padding:"23px 20px",margin:"12px 0 20px"}}>
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
        <button type="button" onClick={()=>void beginCheckout()} disabled={loading || !acceptedTerms || (nativeIos && !applePrice)} style={{width:"100%",minHeight:52,marginTop:19,border:0,borderRadius:11,background:loading || !acceptedTerms || (nativeIos && !applePrice)?"#59232e":"#df1938",color:"#fff",fontSize:15,fontWeight:750,cursor:"pointer"}}>
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
  pt: { showcase:[["Performance com IA","Acompanhe sua evolução e receba orientações personalizadas."],["Plano de treinos","Organize treinos e alimentação no calendário."],["Nutrição inteligente","Analise refeições com ajuda da inteligência artificial."],["Treino do dia","Veja metas, intensidade e dicas para cada treino."]], membership:"Sua assinatura",cancelInfo:"Você pode cancelar quando quiser. O acesso normalmente continua até o final do período já pago.",cancelApple:"No iPhone: Ajustes > seu nome > Assinaturas > ASHLAI Coach > Cancelar assinatura.",cancelOther:"Gerencie ou cancele pelo serviço de pagamento usado na contratação.", subtitle:"SEU PERSONAL TRAINER COM IA", headline:"Seu próximo passo começa aqui.", intro:"Treinos, alimentação e evolução em uma experiência personalizada.", benefits:"DESCUBRA A ASHLAI", month:"por mês", renewal:"Assinatura mensal com renovação automática. Cancele quando quiser.", agree:"Li e concordo com os", terms:"Termos de Uso", and:"e com a", privacy:"Política de Privacidade", buy:"Assinar ASHLAI Coach", busy:"Processando...", restore:"Restaurar compras", restoring:"Restaurando...", priceLoading:"Consultando preço na Apple...", priceUnavailable:"Preço indisponível. Verifique sua conexão e tente novamente.", cancelled:"O pagamento foi cancelado. Nenhuma cobrança foi realizada.", processing:"Sua assinatura está sendo confirmada.", retry:"Verificar assinatura novamente", restored:"Compra restaurada. Estamos verificando seu acesso.", restoreMissing:"Nenhuma assinatura ativa encontrada para restaurar.", webPrice:"Confira o valor e as condições no checkout seguro do Stripe.", items:[["Seu plano de treinos","Visualize seu calendário e treinos personalizados."],["Nutrição inteligente","Acompanhe refeições e seus hábitos alimentares."],["Converse com a ASHLAI","Orientação com IA disponível quando você precisar."],["Sua evolução","Acompanhe seu desempenho e progresso."],["Corpo e exames","Organize medidas corporais e exames para orientar seu acompanhamento."]] },
  en: { showcase:[["AI performance","Track your progress with personalized coaching."],["Your training plan","Plan workouts and nutrition in your calendar."],["Smart nutrition","Analyze meals with AI-powered insights."],["Daily workout","See your goals, intensity and coaching tips."]], membership:"Your membership",cancelInfo:"Cancel anytime. Access normally continues until the end of the paid billing period.",cancelApple:"On iPhone: Settings > your name > Subscriptions > ASHLAI Coach > Cancel Subscription.",cancelOther:"Manage or cancel through the payment service used at checkout.", subtitle:"YOUR AI PERSONAL COACH", headline:"Your next chapter starts here.", intro:"Training, nutrition and progress in one personalized experience.", benefits:"EXPLORE ASHLAI", month:"per month", renewal:"Auto-renewable monthly subscription. Cancel anytime.", agree:"I agree to the", terms:"Terms of Use", and:"and", privacy:"Privacy Policy", buy:"Subscribe to ASHLAI Coach", busy:"Processing...", restore:"Restore Purchases", restoring:"Restoring...", priceLoading:"Loading price from Apple...", priceUnavailable:"Price unavailable. Check your connection and try again.", cancelled:"Payment cancelled. No charge was made.", processing:"Your subscription is being confirmed.", retry:"Check subscription again", restored:"Purchase restored. Verifying your access.", restoreMissing:"No active subscription found to restore.", webPrice:"Price and terms will be shown in the secure Stripe checkout.", items:[["Your training plan","See your personalized calendar and workouts."],["Smart nutrition","Track meals and nutrition habits."],["Chat with ASHLAI","AI guidance whenever you need it."],["Your progress","Follow your performance and improvement."],["Body & blood","Keep body measurements and blood test records together."]] },
  es: { showcase:[["Rendimiento con IA","Sigue tu progreso con orientación personalizada."],["Plan de entrenamiento","Organiza entrenamientos y alimentación en el calendario."],["Nutrición inteligente","Analiza comidas con inteligencia artificial."],["Entrenamiento diario","Consulta metas, intensidad y consejos para entrenar."]], membership:"Tu suscripción",cancelInfo:"Cancela cuando quieras. Normalmente mantienes el acceso hasta que termine el período pagado.",cancelApple:"En iPhone: Ajustes > tu nombre > Suscripciones > ASHLAI Coach > Cancelar suscripción.",cancelOther:"Gestiona o cancela desde el servicio de pago utilizado.", subtitle:"TU ENTRENADORA PERSONAL CON IA", headline:"Tu próximo paso empieza aquí.", intro:"Entrenamiento, nutrición y progreso en una experiencia personalizada.", benefits:"DESCUBRE ASHLAI", month:"al mes", renewal:"Suscripción mensual con renovación automática. Cancela cuando quieras.", agree:"Acepto los", terms:"Términos de Uso", and:"y la", privacy:"Política de Privacidad", buy:"Suscribirme a ASHLAI Coach", busy:"Procesando...", restore:"Restaurar compras", restoring:"Restaurando...", priceLoading:"Consultando precio en Apple...", priceUnavailable:"Precio no disponible. Comprueba tu conexión e inténtalo de nuevo.", cancelled:"Pago cancelado. No se realizó ningún cargo.", processing:"Tu suscripción se está confirmando.", retry:"Comprobar suscripción de nuevo", restored:"Compra restaurada. Verificando tu acceso.", restoreMissing:"No se encontró una suscripción activa para restaurar.", webPrice:"El precio y las condiciones aparecerán en el pago seguro de Stripe.", items:[["Tu plan de entrenamiento","Consulta tu calendario y entrenamientos personalizados."],["Nutrición inteligente","Registra comidas y hábitos alimentarios."],["Habla con ASHLAI","Orientación con IA siempre que la necesites."],["Tu progreso","Sigue tu rendimiento y evolución."],["Cuerpo y análisis","Organiza tus medidas corporales y análisis de sangre."]] },
} as const;
const showcaseImages = [
  {src:"/performance-ai/subscribe/ashlai-score.png"},
  {src:"/performance-ai/subscribe/ashlai-calendar.png"},
  {src:"/performance-ai/subscribe/ashlai-nutrition.png"},
  {src:"/performance-ai/subscribe/ashlai-day-details.png"},
];
