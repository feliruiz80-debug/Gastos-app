import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { loadSheets } from "./server/loadSheets";

function sheetsDevApi(): Plugin {
  return {
    name: "sheets-dev-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split("?")[0];
        if (path !== "/api/sheets") {
          next();
          return;
        }

        try {
          const data = await loadSheets();
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify(data));
        } catch (error) {
          const message = error instanceof Error ? error.message : "Error desconocido";
          res.statusCode = 502;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), sheetsDevApi()],
  server: {
    host: true,
    port: 5173,
  },
});
