import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nevera",
    short_name: "Nevera",
    description: "Lo que se acabó en casa",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAF9",
    theme_color: "#FAFAF9",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
