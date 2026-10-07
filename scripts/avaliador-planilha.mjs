// O avaliador de fórmulas agora vive em apps/api/src/lib/planilha/avaliador.ts (usado também pela API em produção).
// Este arquivo só reexporta; rode os scripts com tsx (npx --prefix apps/api tsx scripts/<script>).
export * from "../apps/api/src/lib/planilha/avaliador";
