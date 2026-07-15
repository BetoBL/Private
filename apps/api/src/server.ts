import cors from "cors";
import "dotenv/config";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { clinicasRouter } from "./routes/clinicas.routes";
import { pacientesRouter } from "./routes/pacientes.routes";
import { profissionaisRouter } from "./routes/profissionais.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/clinicas", clinicasRouter);
app.use("/profissionais", profissionaisRouter);
app.use("/pacientes", pacientesRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT ?? 3333;
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
