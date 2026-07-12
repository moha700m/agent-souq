import { ImageResponse } from "next/og";

export const alt = "Agent Souq — Find your next AI teammate";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        background: "#f7f7f2",
        color: "#131710",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "18px", fontSize: 30, fontWeight: 700 }}>
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#244c3b",
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              background: "#e8c96a",
              transform: "rotate(45deg)",
            }}
          />
        </div>
        Agent Souq
      </div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 950 }}>
        <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: "-4px", lineHeight: 1 }}>
          Find the AI teammate for the work ahead.
        </div>
        <div style={{ marginTop: 28, fontSize: 28, color: "#626a61" }}>
          Curated agents. Clear outcomes. Practical workflows.
        </div>
      </div>
      <div style={{ display: "flex", gap: 18, fontSize: 18, color: "#244c3b" }}>
        <span>CODING</span><span>/</span><span>RESEARCH</span><span>/</span><span>GROWTH</span><span>/</span><span>AUTOMATION</span>
      </div>
    </div>,
    size,
  );
}
