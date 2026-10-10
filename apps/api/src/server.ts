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
import { fiscalRouter } from "./routes/fiscal.routes";
import { notasRouter } from "./routes/notas.routes";
import { atendimentoPublicoRouter } from "./routes/atendimentoPublico.routes";
import { gravacoesRouter } from "./routes/gravacoes.routes";
import { manutencaoDeGravacoes } from "./lib/video/gravacao";
import { eventosAgendaRouter } from "./routes/eventosAgenda.routes";
import { laudosRouter } from "./routes/laudos.routes";
import { modelosLaudoRouter } from "./routes/modelosLaudo.routes";
import { sincronizarModelosDoSistema } from "./lib/laudo/modelos";
import { prisma } from "./lib/prisma";
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
app.use("/modelos-laudo", express.json({ limit: "15mb" })); // laudo em Word enviado em base64
app.use(express.json({ limit: "4mb" })); // cadastros com logotipo/assinatura em data URL

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Público: login e cadastro inicial (clínica + primeiro profissional).
// POST /clinicas e POST /profissionais continuam abertos (fluxo de "criar minha conta");
// os demais métodos desses dois routers exigem login (ver clinicas.routes.ts / profissionais.routes.ts).
app.use("/auth", authRouter);
// entrada do paciente na videochamada: sem login, protegida pelo segredo do link (ver atendimentoPublico.routes.ts)
app.use("/atendimento-publico", atendimentoPublicoRouter);
app.use("/testes", testesRouter);
app.use("/clinicas", clinicasRouter);
app.use("/profissionais", profissionaisRouter);

// Protegido: exige login para qualquer dado clínico/paciente.
app.use("/pacientes", exigirAutenticacao, pacientesRouter);
app.use("/sessoes", exigirAutenticacao, sessoesRouter);
app.use("/eventos-agenda", exigirAutenticacao, eventosAgendaRouter);
app.use("/aplicacoes-teste", exigirAutenticacao, aplicacoesDeTesteRouter);
app.use("/laudos", exigirAutenticacao, laudosRouter);
app.use("/modelos-laudo", exigirAutenticacao, modelosLaudoRouter);
app.use("/perfil-atuacao", exigirAutenticacao, perfisDeAtuacaoRouter);
app.use("/painel-do-dia", exigirAutenticacao, painelDoDiaRouter);
app.use("/anexos", exigirAutenticacao, anexosRouter);
app.use("/tipos-atendimento", exigirAutenticacao, tiposAtendimentoRouter);
app.use("/atendimentos", exigirAutenticacao, atendimentosRouter);
app.use("/convenios", exigirAutenticacao, conveniosRouter);
app.use("/financeiro", exigirAutenticacao, financeiroRouter);
app.use("/fiscal", exigirAutenticacao, fiscalRouter);
app.use("/notas", exigirAutenticacao, notasRouter);
app.use("/gravacoes", exigirAutenticacao, gravacoesRouter);
app.use("/salas-virtuais", exigirAutenticacao, salasVirtuaisRouter);
app.use("/normativas-customizadas", exigirAutenticacao, normativasCustomizadasRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT ?? 3333;
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
  // os modelos do sistema (somente leitura) acompanham a versão do código
  // gravações: fecha as abandonadas e apaga o áudio vencido (agora e a cada 10 minutos)
  const manter = () => manutencaoDeGravacoes().then((r) => { if (r.fechadas || r.apagadas) console.log(`Gravações: ${r.fechadas} fechada(s), ${r.apagadas} áudio(s) vencido(s) apagado(s).`); }).catch((e) => console.error("Manutenção de gravações:", e instanceof Error ? e.message : e));
  manter();
  setInterval(manter, 10 * 60_000).unref();
  sincronizarModelosDoSistema(prisma).then((n) => console.log(`Modelos de laudo do sistema sincronizados: ${n}`)).catch((e) => console.error("Falha ao sincronizar os modelos de laudo:", e));
});
