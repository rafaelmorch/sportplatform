"use client";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "720px", marginBottom: "32px" }}>
        <img src="/logo-sports-platform.png" style={{ width: "100%" }} />
      </div>

      <div style={{ width: "100%", maxWidth: "720px", marginBottom: "24px" }}>
        <img src="/beachtennis.jpeg" style={{ width: "100%" }} />
      </div>

      <a href="/beachtennis-clinic" style={{ width: "100%", maxWidth: "720px", textDecoration: "none", marginBottom: "28px" }}>
        <div style={{ padding: "2px", borderRadius: "14px", background: "linear-gradient(135deg, #ff2d55, #ff9500, #ffd60a)" }}>
          <div style={{ padding: "18px 0", borderRadius: "12px", background: "black", color: "white", textAlign: "center", fontSize: "1.25rem", fontWeight: 700 }}>
            REGISTRE-SE AGORA
          </div>
        </div>
      </a>

      <div style={{
        maxWidth: "720px",
        width: "100%",
        background: "#f5f5f5",
        color: "#000",
        padding: "28px",
        borderRadius: "4px",
        lineHeight: "1.8",
        marginBottom: "28px",
        borderTop: "3px solid #ffffff",
        borderLeft: "3px solid #ffffff",
        borderRight: "3px solid #5a5a5a",
        borderBottom: "3px solid #5a5a5a",
        boxShadow: "inset -1px -1px 0 #00000030, inset 1px 1px 0 #ffffff",
        fontFamily: "Calibri, Arial, sans-serif",
        boxSizing: "border-box",
      }}>
        <h2 style={{ color: "#ff3b30", textAlign: "center", marginTop: 0 }}>
          Orlando vai tremer na areia!
        </h2>

        <p>
          Vem aí um evento de Beach Tennis que promete muita energia, evolução e uma experiência completa sob o sol da Flórida!
        </p>

        <p>
          Se você ama esporte, clima quente e aquela vibe boa de quadra, esse evento é pra você.
        </p>

        <ul>
          <li>Treinamentos dinâmicos</li>
          <li>Para todos os níveis</li>
          <li>Ambiente descontraído e focado em evolução</li>
          <li>Estrutura completa</li>
        </ul>

        <p>Durante a clínica, você terá:</p>

        <ul>
          <li>1 hora de experiência em quadra de beach tennis</li>
          <li>Funcional na areia como aquecimento</li>
          <li>Café da manhã com frutas</li>
          <li>Hidratação com sucos</li>
        </ul>

        <p>
          Além disso, o treinamento conta com orientação do coach Rodrigo Batista, trabalhando:
        </p>

        <ul>
          <li>Fundamentos do jogo</li>
          <li>Posicionamento em quadra</li>
          <li>Técnicas de ataque e defesa</li>
          <li>Movimentação e tomada de decisão</li>
        </ul>

        <p>
          Uma excelente oportunidade para evoluir no esporte, ganhar confiança e elevar seu nível dentro de quadra.
        </p>

        <p>As inscrições já estão abertas!</p>

        <hr style={{ opacity: 0.4 }} />

        <h3>Clínica de Beach Tennis</h3>
        <p>
          Participe de um treinamento exclusivo com o coach Rodrigo Batista, voltado para jogadores de todos os níveis.
        </p>

        <hr style={{ opacity: 0.4 }} />

        <h3>Data e Horário</h3>
        <p>📅 Clínica 1 — 26 de abril de 2026</p>
        <p>📅 Clínica 2 — 16 de maio de 2026</p>
        <p>⏰ 08 AM às 11 AM</p>

        <hr style={{ opacity: 0.4 }} />

        <h3>Local</h3>
        <p>📍 2020 S Dean Rd, Orlando, FL 32825</p>

        <iframe
          src="https://www.google.com/maps?q=2020+S+Dean+Rd,+Orlando,+FL+32825&output=embed"
          width="100%"
          height="300"
          style={{ border: 0, borderRadius: "12px" }}
        />

        <hr style={{ opacity: 0.4 }} />

        <h3>Contato</h3>
        <p>Rodrigo Batista (407) 844-1669</p>
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ color: "#ccc", marginBottom: "8px" }}>
          Patrocinador oficial:
        </div>
        <img src="/ip.PNG" style={{ maxWidth: "180px" }} />
      </div>
    </main>
  );
}

