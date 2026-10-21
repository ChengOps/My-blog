import { ImageResponse } from "next/og";
import { siteConfig } from "../../site.config";

export const alt = "Hush · Code, AI & books";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: "70px 80px", background: "#fafaf8", color: "#242620" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24 }}><span>{siteConfig.name}.</span><span style={{ color: "#63665c" }}>A PERSONAL FIELD NOTE</span></div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 80, fontSize: 76, lineHeight: 1.15, letterSpacing: -3 }}><span>Stay curious.</span><span style={{ color: "#3155cd" }}>Keep building.</span></div>
      <div style={{ fontSize: 22, color: "#63665c", marginTop: "auto", display: "flex", paddingTop: 22, borderTop: "1px solid #dddfd6" }}>CODE / AI / BOOKS</div>
    </div>, size,
  );
}
