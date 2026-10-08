import { ImageResponse } from "next/og";
import { Nevera } from "@/lib/icono";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<Nevera lado={512} />, size);
}
