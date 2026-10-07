// PÁGINA TEMPORÁRIA DE PRÉVIA (somente em desenvolvimento): cria um paciente e uma sessão com os dados
// do paciente de exemplo da planilha e abre o componente real do WAIS-III. Removida após a revisão visual.
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TesteWaisIII } from "../components/TesteWaisIII";
import { TesteWiscIV } from "../components/TesteWiscIV";
import { api, type Teste } from "../lib/api";

const BRUTOS: Record<string, string> = {
  completarFiguras: "14", vocabulario: "37", codigos: "27", semelhancas: "16", cubos: "24", aritmetica: "9",
  raciocinioMatricial: "13", digitos: "13", informacao: "13", arranjoFiguras: "10", compreensao: "16",
  procurarSimbolos: "34", sequenciaNumerosLetras: "6",
};

const BRUTOS_WISC: Record<string, string> = { sm: "14", vc: "22", co: "14", cb: "30", cn: "14", rm: "15", dg: "12", snl: "14", cd: "38", ps: "26", cf: "20", ar: "20", rp: "15", in: "12", ca: "40", cusb: "40", diod: "9", dioi: "7", caa: "80", cae: "70", udiod: "6", udioi: "4" };

export function PreviewWais3() {
  const [params] = useSearchParams();
  const wisc = params.get("teste") === "wisc";
  const [ctx, setCtx] = useState<{ teste: Teste; sessaoId: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [escores, setEscores] = useState<Record<string, string>>(wisc ? BRUTOS_WISC : params.get("vazio") ? {} : params.get("aba") === "processo" ? { ...BRUTOS, digitosSpamDireta: "7", digitosSpamInversa: "5", digitosPontosDireta: "8", digitosPontosInversa: "6" } : BRUTOS);

  useEffect(() => {
    (async () => {
      const prof = await api.login("dev@mentessence.local", "dev12345");
      const paciente = await api.createPaciente({ profissionalId: prof.id, nome: `Prévia ${Date.now()}`, dataNascimento: wisc ? "2018-03-10" : "1991-08-27", sexo: "MASCULINO" });
      const sessao = await api.createSessao({ pacienteId: paciente.id, dataHora: "2026-07-28T12:00:00.000Z" });
      const testes = await api.listTestes();
      setCtx({ teste: testes.find((t) => t.sigla === (wisc ? "WISC-IV" : "WAIS-III"))!, sessaoId: sessao.id });
    })().catch((e) => setErro(String(e)));
  }, []);

  if (erro) return <pre className="p-6 text-ember">{erro}</pre>;
  if (!ctx) return <p className="p-6">Preparando prévia…</p>;
  if (wisc) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <TesteWiscIV teste={ctx.teste} sessaoId={ctx.sessaoId} testeId={ctx.teste.id} escoresBrutos={escores} onEscoresChange={setEscores} onSalvar={async () => {}} abaInicial={(params.get("aba") as never) ?? undefined} />
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-5xl p-6">
      <TesteWaisIII
        teste={ctx.teste}
        sessaoId={ctx.sessaoId}
        testeId={ctx.teste.id}
        escoresBrutos={escores}
        onEscoresChange={setEscores}
        onSalvar={async () => {}}
        abaInicial={(params.get("aba") as never) ?? undefined}
      />
    </div>
  );
}
