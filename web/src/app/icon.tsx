import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Favicon: the brand initial on the accent tile (type only, no hand-drawn artwork). */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#10b981",
          borderRadius: 14,
          color: "#0b0f14",
          fontSize: 44,
          fontWeight: 700,
        }}
      >
        B
      </div>
    ),
    size,
  );
}
