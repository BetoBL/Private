import cors from "cors";
import "dotenv/config";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { exigirAutenticacao } from "./middleware/auth";
import { anexosRouter } from "./routes/anexos.routes";
import { aplicacoesDeTesteRouter } from "./routes/aplicacoesDeTeste.routes";
import { authRouter } from "./routes/auth.routes";
import { clinicasRouter } from "./routes/clinicas.routes";
import { eventosAgendaRouter } from "./routes/eventosAgenda.routes";
import { laudosRouter } from "./routes/laudos.routes";
import { pacientesRouter } from "./routes/pacientes.routes";
import { painelDoDiaRouter } from "./routes/painelDoDia.routes";
import { perfisDeAtuacaoRouter } from "./routes/perfilDeAtuacao.routes";
import { profissionaisRouter } from "./routes/profissionais.routes";
import { sessoesRouter } from "./routes/sessoes.routes";
import { testesRouter } from "./routes/testes.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Público: login e cadastro inicial (clínica + primeiro profissional).
// POST /clinicas e POST /profissionais continuam abertos (fluxo de "criar minha conta");
// os demais métodos desses dois routers exigem login (ver clinicas.routes.ts / profissionais.routes.ts).
app.use("/auth", authRouter);
app.use("/testes", testesRouter);
app.use("/clinicas", clinicasRouter);
app.use("/profissionais", profissionaisRouter);

// Protegido: exige login para qualquer dado clínico/paciente.
app.use("/pacientes", exigirAutenticacao, pacientesRouter);
app.use("/sessoes", exigirAutenticacao, sessoesRouter);
app.use("/eventos-agenda", exigirAutenticacao, eventosAgendaRouter);
app.use("/aplicacoes-teste", exigirAutenticacao, aplicacoesDeTesteRouter);
app.use("/laudos", exigirAutenticacao, laudosRouter);
app.use("/perfil-atuacao", exigirAutenticacao, perfisDeAtuacaoRouter);
app.use("/painel-do-dia", exigirAutenticacao, painelDoDiaRouter);
app.use("/anexos", exigirAutenticacao, anexosRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT ?? 3333;
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
