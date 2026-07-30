import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <svg
      width="32"
      height="32"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line x1="4" y1="16" x2="10" y2="4" stroke="#30363d" strokeWidth="1.5" />
      <line x1="10" y1="4" x2="16" y2="16" stroke="#30363d" strokeWidth="1.5" />
      <line x1="4" y1="16" x2="16" y2="16" stroke="#30363d" strokeWidth="1.5" />
      <circle
        cx="10"
        cy="4"
        r="2.5"
        fill="#0d1117"
        stroke="#58a6ff"
        strokeWidth="1.5"
      />
      <circle
        cx="4"
        cy="16"
        r="2.5"
        fill="#0d1117"
        stroke="#58a6ff"
        strokeWidth="1.5"
      />
      <circle
        cx="16"
        cy="16"
        r="2.5"
        fill="#0d1117"
        stroke="#58a6ff"
        strokeWidth="1.5"
      />
    </svg>,
    size,
  );
}
