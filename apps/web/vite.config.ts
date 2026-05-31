import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // Vite busca .env en apps/web/ por defecto; apuntarlo a la raíz del monorepo.
  envDir: "../../",
  optimizeDeps: {
    // Fuerza a esbuild a pre-bundlear los workspace packages CJS
    // para que Vite pueda resolver sus named exports como ESM.
    include: ["@kallpasoft/validators", "@kallpasoft/shared"],
  },
});
