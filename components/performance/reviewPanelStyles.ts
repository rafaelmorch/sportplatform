import type { AiReviewPanelStyles } from "./AiReviewPanel";

export const reviewPanelStyles: AiReviewPanelStyles = {
  panel: {
    width: "100%",
    minWidth: 0,
    marginTop: 20,
    padding: "clamp(22px, 4vw, 32px)",
    border: "1px solid rgba(255,255,255,0.18)",
    background:
      "linear-gradient(145deg, rgba(27,27,30,0.98) 0%, rgba(15,15,17,0.99) 100%)",
    boxShadow:
      "0 18px 42px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.05)",
    boxSizing: "border-box",
  },

  eyebrow: {
    marginBottom: 10,
    color: "#85858e",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 18,
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    color: "#ffffff",
    fontSize: "clamp(19px, 3vw, 25px)",
    fontWeight: 700,
    letterSpacing: -0.5,
  },

  description: {
    maxWidth: 620,
    margin: "10px 0 0",
    color: "#96969f",
    fontSize: 12,
    lineHeight: 1.7,
  },

  status: {
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.045)",
    color: "#d4d4d8",
    padding: "8px 11px",
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  metrics: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 160px), 1fr))",
    gap: 1,
    marginTop: 26,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.1)",
  },

  metric: {
    display: "grid",
    gap: 8,
    minHeight: 92,
    padding: 16,
    background: "#121214",
    boxSizing: "border-box",
  },

  metricLabel: {
    color: "#74747c",
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },

  metricValue: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 700,
    overflowWrap: "anywhere",
  },

  textSection: {
    marginTop: 22,
    paddingTop: 20,
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },

  sectionLabel: {
    marginBottom: 10,
    color: "#8f8f98",
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },

  bodyText: {
    margin: 0,
    color: "#d0d0d4",
    fontSize: 12,
    lineHeight: 1.75,
  },

  list: {
    display: "grid",
    gap: 10,
  },

  listItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    color: "#d0d0d4",
    fontSize: 12,
    lineHeight: 1.7,
  },

  bullet: {
    width: 5,
    height: 5,
    marginTop: 8,
    flexShrink: 0,
    background: "#a1a1aa",
  },

  attentionSection: {
    marginTop: 22,
    padding: 18,
    border: "1px solid rgba(245,158,11,0.24)",
    background: "rgba(245,158,11,0.055)",
  },

  attentionLabel: {
    marginBottom: 10,
    color: "#fbbf24",
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },

  attentionBullet: {
    width: 5,
    height: 5,
    marginTop: 8,
    flexShrink: 0,
    background: "#fbbf24",
  },

  disclaimer: {
    margin: "20px 0 0",
    color: "#686871",
    fontSize: 10,
    lineHeight: 1.65,
  },

  confirmButton: {
    width: "100%",
    marginTop: 22,
    padding: "14px 18px",
    border: 0,
    background: "#ffffff",
    color: "#09090b",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
};
