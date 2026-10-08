import { ImageResponse } from "next/og";
import { Nevera } from "@/lib/icono";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<Nevera lado={180} />, size);
}
