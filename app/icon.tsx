import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          background: "#6B2D8F",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "#F5C300",
            fontSize: 22,
            fontWeight: 700,
            fontFamily: "serif",
            lineHeight: 1,
          }}
        >
          4
        </span>
      </div>
    ),
    { ...size }
  );
}
