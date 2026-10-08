import compression from "compression";
import cors from "cors";
import "dotenv/config";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { exigirAutenticacao } from "./middleware/auth";
import { anexosRouter } from "./routes/anexos.routes";
import { aplicacoesDeTesteRouter } from "./routes/aplicacoesDeTeste.routes";
import { atendimentosRouter } from "./routes/atendimentos.routes";
import { authRouter } from "./routes/auth.routes";
import { clinicasRouter } from "./routes/clinicas.routes";
import { conveniosRouter } from "./routes/convenios.routes";
import { financeiroRouter } from "./routes/financeiro.routes";
import { eventosAgendaRouter } from "./routes/eventosAgenda.routes";
import { laudosRouter } from "./routes/laudos.routes";
import { normativasCustomizadasRouter } from "./routes/normativasCustomizadas.routes";
import { pacientesRouter } from "./routes/pacientes.routes";
import { painelDoDiaRouter } from "./routes/painelDoDia.routes";
import { perfisDeAtuacaoRouter } from "./routes/perfilDeAtuacao.routes";
import { profissionaisRouter } from "./routes/profissionais.routes";
import { salasVirtuaisRouter } from "./routes/salasVirtuais.routes";
import { sessoesRouter } from "./routes/sessoes.routes";
import { testesRouter } from "./routes/testes.routes";
import { tiposAtendimentoRouter } from "./routes/tiposAtendimento";

const app = express();

app.use(cors());
app.use(compression()); // listas de testes e resultados são grandes (motor de planilha)
app.use(express.json({ limit: "4mb" })); // cadastros com logotipo/assinatura em data URL

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
app.use("/tipos-atendimento", exigirAutenticacao, tiposAtendimentoRouter);
app.use("/atendimentos", exigirAutenticacao, atendimentosRouter);
app.use("/convenios", exigirAutenticacao, conveniosRouter);
app.use("/financeiro", exigirAutenticacao, financeiroRouter);
app.use("/salas-virtuais", exigirAutenticacao, salasVirtuaisRouter);
app.use("/normativas-customizadas", exigirAutenticacao, normativasCustomizadasRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT ?? 3333;
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
