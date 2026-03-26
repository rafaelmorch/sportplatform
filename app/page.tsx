"use client";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px",
      }}
    >
      {/* Logo */}
      <div style={{ width: "100%", maxWidth: "720px", marginBottom: "32px" }}>
        <img src="/logo-sports-platform.png" style={{ width: "100%" }} />
      </div>

      {/* Flyer */}
      <div style={{ width: "100%", maxWidth: "720px", marginBottom: "24px" }}>
        <img src="/beachtennis.jpeg" style={{ width: "100%" }} />
      </div>

      {/* Botão */}
      <a
        href="https://www.sportsplatform.app/beachtennis"
        style={{
          width: "100%",
          maxWidth: "720px",
          textDecoration: "none",
          marginBottom: "28px",
        }}
      >
        <div
          style={{
            padding: "2px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #ff2d55, #ff9500, #ffd60a)",
          }}
        >
          <div
            style={{
              padding: "18px 0",
              borderRadius: "12px",
              background: "black",
              color: "white",
              textAlign: "center",
              fontSize: "1.25rem",
              fontWeight: 700,
            }}
          >
            REGISTRE-SE AGORA
          </div>
        </div>
      </a>

      {/* CARD 3D */}
      <div
        style={{
          maxWidth: "720px",
          width: "100%",
          background: "linear-gradient(145deg, #0f172a, #020617)",
          color: "#e5e7eb",
          padding: "28px",
          borderRadius: "20px",
          lineHeight: "1.8",
          marginBottom: "28px",
          boxShadow: `
            0 25px 50px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(255,255,255,0.05)
          `,
          border: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(6px)",
        }}
      >
        <h2 style={{ color: "#ff3b30", textAlign: "center" }}>
          Orlando vai tremer na areia!
        </h2>

        <p>
          Vem aí um torneio de Beach Tennis que promete muita energia, competição e diversão sob o sol da Flórida!
        </p>

        <p>
          Se você ama esporte, clima tropical e aquela vibe boa de competição saudável, esse evento é pra você.
        </p>

        <ul>
          <li>Jogos dinâmicos</li>
          <li>Categorias para todos os níveis</li>
          <li>Ambiente descontraído e competitivo</li>
          <li>Premiação especial</li>
          <li>Estrutura completa</li>
        </ul>

        <p>
          Chame seu parceiro(a), prepare a raquete e venha mostrar seu talento nas quadras de areia de Orlando!
        </p>

        <p><strong>As inscrições já estão abertas!</strong></p>

        <hr style={{ opacity: 0.2 }} />

        <h3>Data e Horário</h3>
        <p>📅 16 de maio de 2026 (sábado)</p>
        <p>⏰ 09 AM às 6 PM</p>

        <hr style={{ opacity: 0.2 }} />

        <h3>Local</h3>
        <p>📍 2020 S Dean Rd, Orlando, FL 32825</p>

        <div style={{ marginTop: "16px" }}>
          <iframe
            src="https://www.google.com/maps?q=2020+S+Dean+Rd,+Orlando,+FL+32825&output=embed"
            width="100%"
            height="300"
            style={{ border: 0, borderRadius: "12px" }}
          ></iframe>
        </div>

        <hr style={{ opacity: 0.2 }} />

        <h3>Kit do Participante</h3>
        <p>Todos os inscritos receberão:</p>
        <ul>
          <li>Camiseta oficial do evento</li>
        </ul>

        <hr style={{ opacity: 0.2 }} />

        <h3>Inscrição</h3>
        <p>Idade mínima: <strong>13 anos</strong></p>

        <hr style={{ opacity: 0.2 }} />

        <h3>Contato e Suporte</h3>
        <p>📞 Rodrigo Batista (407) 844-1669</p>
      </div>

      {/* Patrocinador */}
      <div style={{ textAlign: "center" }}>
        <div style={{ color: "#ccc", marginBottom: "8px" }}>
          Patrocinador oficial:
        </div>
        <img src="/ip.PNG" style={{ maxWidth: "180px" }} />
      </div>
    </main>
  );
}
