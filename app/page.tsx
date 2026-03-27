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
        href="/beachtennis"
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

      {/* CARD TEXTO */}
      <div
        style={{
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
borderRight: "3px solid #6d6d6d",
borderBottom: "3px solid #6d6d6d",
boxShadow: "inset -1px -1px 0 #00000020, inset 1px 1px 0 #ffffff",
          fontFamily: "Calibri, Arial, sans-serif",
          fontWeight: "normal",
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ color: "#ff3b30", textAlign: "center", marginTop: 0 }}>
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

        <p>As inscrições já estão abertas!</p>

        <hr style={{ opacity: 0.4, borderColor: "#808080" }} />

        <h3>Clínica de Beach Tennis</h3>
        <p>
          Participe de um treinamento exclusivo com o coach Rodrigo Batista, voltado para jogadores de todos os níveis.
        </p>

        <p>
          Durante a clínica, você terá acesso a equipamentos e orientação técnica para desenvolver:
        </p>

        <ul>
          <li>Fundamentos do jogo</li>
          <li>Posicionamento em quadra</li>
          <li>Técnicas de ataque e defesa</li>
          <li>Movimentação e tomada de decisão</li>
        </ul>

        <p>
          Uma excelente oportunidade para evoluir no esporte, ganhar confiança e chegar mais preparado para o torneio.
        </p>

        <hr style={{ opacity: 0.4, borderColor: "#808080" }} />

        <h3>Data e Horário</h3>
        <p>📅 16 de maio de 2026 (sábado)</p>
        <p>⏰ 09 AM às 6 PM</p>

        <hr style={{ opacity: 0.4, borderColor: "#808080" }} />

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

        <hr style={{ opacity: 0.4, borderColor: "#808080" }} />

        <h3>Kit do Participante</h3>
        <p>Todos os inscritos receberão:</p>
        <ul>
          <li>Camiseta oficial do evento</li>
        </ul>

        <hr style={{ opacity: 0.4, borderColor: "#808080" }} />

        <h3>Inscrição</h3>
        <p>Idade mínima: <strong>13 anos</strong></p>

        <hr style={{ opacity: 0.4, borderColor: "#808080" }} />

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