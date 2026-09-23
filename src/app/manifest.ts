import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AcutePOS",
    short_name: "AcutePOS",
    description: "AcutePOS Reporting System.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#09090B",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/adaptive-icon.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
