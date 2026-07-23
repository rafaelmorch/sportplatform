"use client";

import Link from "next/link";
import type React from "react";
import DocumentUploader from "@/components/performance/DocumentUploader";
import useDocumentUpload from "@/hooks/useDocumentUpload";

const INITIAL_MARKERS = [
  {
    group: "Performance",
    items: ["Ferritina", "Hemoglobina", "Hematócrito"],
  },
  {
    group: "Energia",
    items: ["Vitamina D", "Vitamina B12"],
  },
  {
    group: "Metabolismo",
    items: ["Glicose", "Hemoglobina glicada"],
  },
  {
    group: "Lipídios",
    items: ["HDL", "LDL", "Triglicerídeos", "Colesterol total"],
  },
  {
    group: "Outros indicadores",
    items: [
      "TSH",
      "T4 livre",
      "Testosterona total",
      "Creatinina",
    ],
  },
];

export default function PerformanceBloodPage() {
  const {
    file: bloodDocumentFile,
    error: bloodFileError,
    dragging: isDraggingBloodFile,
    setError: setBloodFileError,
    handleChange: handleBloodFileChange,
    handleDrop: handleBloodFileDrop,
    removeFile: handleRemoveBloodFile,
    setDragging: setIsDraggingBloodFile,
  } = useDocumentUpload();

  const analyzingBloodDocument = false;

  function handleAnalyzeBloodDocument(): void {
    setBloodFileError(
      "A análise automática do exame será conectada na próxima etapa."
    );
  }

  return (
    <main style={pageStyle}>
      <div style={pageGlowStyle} />

      <div style={containerStyle}>
        <header style={topBarStyle}>
          <Link
            href="/performance-ai"
            style={backLinkStyle}
          >
            <span aria-hidden="true">←</span>
            Performance AI
          </Link>

          <div style={sectionLabelStyle}>
            Health Intelligence
          </div>
        </header>

        <section style={heroStyle}>
          <div style={heroEyebrowStyle}>
            Exames de sangue
          </div>

          <h1 style={heroTitleStyle}>
            Transforme seus exames em informações úteis para sua performance.
          </h1>

          <p style={heroDescriptionStyle}>
            Envie um PDF ou uma foto do seu exame. A
            inteligência artificial identificará os principais
            marcadores para que você possa revisar e acompanhar
            sua evolução.
          </p>

          <div style={statusBadgeStyle}>
            <span style={statusDotStyle} />
            Estrutura inicial pronta
          </div>
        </section>

        <section style={uploadPanelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={panelEyebrowStyle}>
                Análise por IA
              </div>

              <h2 style={panelTitleStyle}>
                Enviar novo exame
              </h2>

              <p style={panelDescriptionStyle}>
                Na próxima etapa, esta área aceitará documentos
                em PDF e imagens da câmera ou galeria.
              </p>
            </div>

            <div style={documentIconStyle}>
              <span style={documentFoldStyle} />
              <span style={documentLineStyle} />
              <span
                style={{
                  ...documentLineStyle,
                  width: 22,
                  top: 35,
                }}
              />
              <span
                style={{
                  ...documentLineStyle,
                  width: 17,
                  top: 44,
                }}
              />
            </div>
          </div>

          <DocumentUploader
            file={bloodDocumentFile}
            error={bloodFileError}
            dragging={isDraggingBloodFile}
            analyzing={analyzingBloodDocument}
            onChange={handleBloodFileChange}
            onDrop={handleBloodFileDrop}
            onDragStateChange={setIsDraggingBloodFile}
            onRemove={handleRemoveBloodFile}
            onAnalyze={handleAnalyzeBloodDocument}
            uploadLabel="Leitura automática"
            uploadTitle="Envie seu exame de sangue"
            uploadDescription="Selecione um PDF ou uma imagem do exame laboratorial. No computador, você também pode arrastar o arquivo para esta área."
            selectButtonText="Selecionar exame"
            uploadFormatsText="PDF, JPG, PNG ou WEBP · máximo de 10 MB"
            readyMessage="Exame pronto para análise"
            analyzeButtonText="Analisar exame com IA"
            analyzingButtonText="Analisando exame..."
            nextStepMessage="Os marcadores sanguíneos serão identificados automaticamente."
            analyzingMessage="A leitura pode levar alguns segundos."
            styles={{
              area: bloodUploadAreaStyle,
              input: bloodHiddenInputStyle,
              selectButton: bloodSelectButtonStyle,
              uploadLabel: bloodUploadLabelStyle,
              uploadTitle: bloodUploadTitleStyle,
              uploadDescription: bloodUploadDescriptionStyle,
              uploadFormats: bloodUploadFormatsStyle,
              selectedFile: bloodSelectedFileStyle,
              selectedFileHeader: bloodSelectedFileHeaderStyle,
              selectedFileInfo: bloodSelectedFileInfoStyle,
              fileTypeBadge: bloodFileTypeBadgeStyle,
              fileTextArea: bloodFileTextAreaStyle,
              fileName: bloodFileNameStyle,
              fileMetadata: bloodFileMetadataStyle,
              removeFileButton: bloodRemoveFileButtonStyle,
              fileReady: bloodFileReadyStyle,
              analyzeButton: bloodAnalyzeButtonStyle,
              nextStepText: bloodNextStepTextStyle,
              error: bloodUploadErrorStyle,
            }}
          />
        </section>

        <section style={markersSectionStyle}>
          <div style={sectionHeadingRowStyle}>
            <div>
              <div style={panelEyebrowStyle}>
                Marcadores iniciais
              </div>

              <h2 style={panelTitleStyle}>
                O que será acompanhado
              </h2>
            </div>

            <div style={markerCountStyle}>
              16 indicadores
            </div>
          </div>

          <div style={markersGridStyle}>
            {INITIAL_MARKERS.map((category) => (
              <article
                key={category.group}
                style={markerCardStyle}
              >
                <h3 style={markerGroupStyle}>
                  {category.group}
                </h3>

                <div style={markerListStyle}>
                  {category.items.map((item) => (
                    <div
                      key={item}
                      style={markerItemStyle}
                    >
                      <span style={markerDotStyle} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={disclaimerStyle}>
          <div style={disclaimerTitleStyle}>
            Informação de saúde
          </div>

          <p style={disclaimerTextStyle}>
            A Performance AI organizará e explicará os dados
            enviados, mas não realizará diagnóstico médico. Os
            resultados devem ser avaliados por um profissional de
            saúde qualificado.
          </p>
        </section>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  overflow: "hidden",
  background: "#080808",
  color: "#f4f4f5",
  fontFamily:
    "Inter, Arial, Helvetica, sans-serif",
};

const pageGlowStyle: React.CSSProperties = {
  position: "absolute",
  top: -260,
  left: "50%",
  width: 720,
  height: 520,
  transform: "translateX(-50%)",
  borderRadius: "50%",
  background:
    "radial-gradient(circle, rgba(255,241,168,0.09) 0%, rgba(255,241,168,0) 70%)",
  pointerEvents: "none",
};

const containerStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(100%, 1120px)",
  margin: "0 auto",
  padding:
    "max(20px, env(safe-area-inset-top)) clamp(18px, 5vw, 52px) max(110px, env(safe-area-inset-bottom))",
  boxSizing: "border-box",
};

const topBarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 16,
  paddingBottom: 24,
  borderBottom: "1px solid rgba(255,255,255,0.09)",
};

const backLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 9,
  color: "#d4d4d8",
  fontSize: 13,
  fontWeight: 650,
  textDecoration: "none",
};

const sectionLabelStyle: React.CSSProperties = {
  color: "#6f6f78",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1.5,
  textTransform: "uppercase",
};

const heroStyle: React.CSSProperties = {
  padding: "clamp(48px, 9vw, 92px) 0 clamp(36px, 7vw, 68px)",
};

const heroEyebrowStyle: React.CSSProperties = {
  color: "#fff1a8",
  fontSize: 11,
  fontWeight: 750,
  letterSpacing: 1.8,
  textTransform: "uppercase",
};

const heroTitleStyle: React.CSSProperties = {
  maxWidth: 900,
  margin: "18px 0 0",
  color: "#fafafa",
  fontSize: "clamp(35px, 7vw, 70px)",
  lineHeight: 0.99,
  fontWeight: 800,
  letterSpacing: "-0.055em",
  overflowWrap: "anywhere",
};

const heroDescriptionStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: "27px 0 0",
  color: "#9898a1",
  fontSize: "clamp(15px, 2.3vw, 18px)",
  lineHeight: 1.72,
};

const statusBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 9,
  marginTop: 28,
  padding: "9px 12px",
  border: "1px solid rgba(255,241,168,0.22)",
  background: "rgba(255,241,168,0.04)",
  color: "#d8cf98",
  fontSize: 11,
  fontWeight: 650,
};

const statusDotStyle: React.CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: "50%",
  background: "#fff1a8",
  boxShadow: "0 0 14px rgba(255,241,168,0.45)",
};

const uploadPanelStyle: React.CSSProperties = {
  marginBottom: "clamp(24px, 5vw, 42px)",
  padding: "clamp(23px, 5vw, 40px)",
  border: "1px solid rgba(255,255,255,0.1)",
  background:
    "linear-gradient(145deg, rgba(24,24,27,0.92), rgba(12,12,13,0.98))",
  boxShadow: "0 20px 48px rgba(0,0,0,0.32)",
};

const panelHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 24,
};

const panelEyebrowStyle: React.CSSProperties = {
  color: "#fff1a8",
  fontSize: 10,
  fontWeight: 750,
  letterSpacing: 1.5,
  textTransform: "uppercase",
};

const panelTitleStyle: React.CSSProperties = {
  margin: "10px 0 0",
  color: "#f4f4f5",
  fontSize: "clamp(23px, 4vw, 32px)",
  lineHeight: 1.16,
  fontWeight: 750,
  letterSpacing: "-0.03em",
};

const panelDescriptionStyle: React.CSSProperties = {
  maxWidth: 620,
  margin: "12px 0 0",
  color: "#85858e",
  fontSize: 13,
  lineHeight: 1.68,
};

const documentIconStyle: React.CSSProperties = {
  position: "relative",
  width: 45,
  height: 57,
  border: "1px solid rgba(255,241,168,0.45)",
  flexShrink: 0,
};

const documentFoldStyle: React.CSSProperties = {
  position: "absolute",
  top: -1,
  right: -1,
  width: 15,
  height: 15,
  borderLeft: "1px solid rgba(255,241,168,0.45)",
  borderBottom: "1px solid rgba(255,241,168,0.45)",
};

const documentLineStyle: React.CSSProperties = {
  position: "absolute",
  top: 26,
  left: 10,
  width: 25,
  height: 1,
  background: "rgba(255,241,168,0.45)",
};

const dropZoneStyle: React.CSSProperties = {
  display: "flex",
  minHeight: 300,
  marginTop: 34,
  padding: 28,
  border: "1px dashed rgba(255,255,255,0.17)",
  background: "rgba(255,255,255,0.018)",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  boxSizing: "border-box",
};

const uploadCircleStyle: React.CSSProperties = {
  display: "flex",
  width: 56,
  height: 56,
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(255,241,168,0.36)",
  borderRadius: "50%",
  color: "#fff1a8",
  fontSize: 24,
};

const dropZoneTitleStyle: React.CSSProperties = {
  marginTop: 20,
  color: "#f4f4f5",
  fontSize: 17,
  fontWeight: 700,
};

const dropZoneDescriptionStyle: React.CSSProperties = {
  marginTop: 8,
  color: "#66666f",
  fontSize: 12,
};

const disabledButtonStyle: React.CSSProperties = {
  minHeight: 46,
  marginTop: 23,
  padding: "12px 18px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "#161616",
  color: "#606069",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 700,
  cursor: "not-allowed",
};

const bloodUploadAreaStyle: React.CSSProperties = {
  display: "flex",
  minHeight: 300,
  marginTop: 34,
  padding: "clamp(22px, 5vw, 34px)",
  border: "1px dashed rgba(255,255,255,0.17)",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  boxSizing: "border-box",
  transition:
    "border-color 160ms ease, background 160ms ease",
};

const bloodHiddenInputStyle: React.CSSProperties = {
  display: "none",
};

const bloodSelectButtonStyle: React.CSSProperties = {
  minHeight: 46,
  marginTop: 23,
  padding: "12px 20px",
  border: "1px solid rgba(255,241,168,0.42)",
  background: "#fff1a8",
  color: "#111111",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 750,
  cursor: "pointer",
};

const bloodUploadLabelStyle: React.CSSProperties = {
  color: "#fff1a8",
  fontSize: 10,
  fontWeight: 750,
  letterSpacing: 1.4,
  textTransform: "uppercase",
};

const bloodUploadTitleStyle: React.CSSProperties = {
  marginTop: 14,
  color: "#f4f4f5",
  fontSize: "clamp(20px, 4vw, 27px)",
  lineHeight: 1.2,
  fontWeight: 750,
  letterSpacing: "-0.025em",
};

const bloodUploadDescriptionStyle: React.CSSProperties = {
  maxWidth: 590,
  margin: "13px auto 0",
  color: "#85858e",
  fontSize: 13,
  lineHeight: 1.65,
};

const bloodUploadFormatsStyle: React.CSSProperties = {
  marginTop: 13,
  color: "#66666f",
  fontSize: 11,
};

const bloodSelectedFileStyle: React.CSSProperties = {
  width: "min(100%, 650px)",
  textAlign: "left",
};

const bloodSelectedFileHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 18,
};

const bloodSelectedFileInfoStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  minWidth: 0,
};

const bloodFileTypeBadgeStyle: React.CSSProperties = {
  display: "flex",
  width: 48,
  height: 48,
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(255,241,168,0.35)",
  color: "#fff1a8",
  fontSize: 11,
  fontWeight: 800,
  flexShrink: 0,
};

const bloodFileTextAreaStyle: React.CSSProperties = {
  minWidth: 0,
};

const bloodFileNameStyle: React.CSSProperties = {
  overflow: "hidden",
  color: "#f4f4f5",
  fontSize: 14,
  fontWeight: 700,
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const bloodFileMetadataStyle: React.CSSProperties = {
  marginTop: 6,
  color: "#707079",
  fontSize: 11,
};

const bloodRemoveFileButtonStyle: React.CSSProperties = {
  padding: 0,
  border: 0,
  background: "transparent",
  color: "#a1a1aa",
  fontFamily: "inherit",
  fontSize: 11,
  fontWeight: 700,
};

const bloodFileReadyStyle: React.CSSProperties = {
  marginTop: 28,
  color: "#fff1a8",
  fontSize: 11,
  fontWeight: 700,
};

const bloodAnalyzeButtonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 50,
  marginTop: 14,
  padding: "13px 20px",
  border: "1px solid #fff1a8",
  background: "#fff1a8",
  color: "#111111",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 800,
};

const bloodNextStepTextStyle: React.CSSProperties = {
  marginTop: 11,
  color: "#707079",
  fontSize: 11,
  lineHeight: 1.5,
  textAlign: "center",
};

const bloodUploadErrorStyle: React.CSSProperties = {
  marginTop: 12,
  padding: "11px 13px",
  border: "1px solid rgba(248,113,113,0.22)",
  background: "rgba(127,29,29,0.16)",
  color: "#fca5a5",
  fontSize: 12,
  lineHeight: 1.5,
};
const markersSectionStyle: React.CSSProperties = {
  marginBottom: "clamp(24px, 5vw, 42px)",
  padding: "clamp(23px, 5vw, 40px)",
  border: "1px solid rgba(255,255,255,0.09)",
  background: "#0e0e0f",
};

const sectionHeadingRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: 18,
};

const markerCountStyle: React.CSSProperties = {
  padding: "8px 11px",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#85858e",
  fontSize: 10,
  fontWeight: 650,
  textTransform: "uppercase",
};

const markersGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
  gap: 1,
  marginTop: 30,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.08)",
};

const markerCardStyle: React.CSSProperties = {
  minWidth: 0,
  padding: 22,
  background: "#111112",
};

const markerGroupStyle: React.CSSProperties = {
  margin: 0,
  color: "#d9d9dd",
  fontSize: 13,
  fontWeight: 750,
};

const markerListStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
  marginTop: 19,
};

const markerItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  minWidth: 0,
  color: "#85858e",
  fontSize: 12,
  lineHeight: 1.45,
};

const markerDotStyle: React.CSSProperties = {
  width: 4,
  height: 4,
  borderRadius: "50%",
  background: "#fff1a8",
  flexShrink: 0,
};

const disclaimerStyle: React.CSSProperties = {
  padding: "22px 24px",
  borderLeft: "2px solid rgba(255,241,168,0.65)",
  background: "rgba(255,255,255,0.025)",
};

const disclaimerTitleStyle: React.CSSProperties = {
  color: "#d9d9dd",
  fontSize: 12,
  fontWeight: 750,
};

const disclaimerTextStyle: React.CSSProperties = {
  maxWidth: 820,
  margin: "9px 0 0",
  color: "#777780",
  fontSize: 12,
  lineHeight: 1.7,
};



