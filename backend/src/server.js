import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 4000;

if (!process.env.JWT_SECRET) {
  console.error("ERROR: JWT_SECRET no esta configurado en el archivo .env. Configuralo antes de usar el sistema.");
}

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
