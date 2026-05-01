export default function Loading() {
  return (
    <div
      style={{
        background: "#ffffff",
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <img
        src="/loading.gif"
        alt="Loading..."
        style={{ width: 80, height: 80 }}
      />
    </div>
  );
}
