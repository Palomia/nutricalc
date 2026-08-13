import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Chemins d'assets relatifs : le build fonctionne servi depuis un sous-chemin.
  base: "./",
  plugins: [react(), tailwindcss()],
});
