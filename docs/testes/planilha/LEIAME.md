# Motor de planilha (testes replicados pela planilha da psicóloga)

Para os testes "simples" do menu da planilha o sistema executa as próprias fórmulas da aba (avaliador em
`apps/api/src/lib/planilha/avaliador.ts`, o mesmo validado contra WAIS-III, WISC-IV e WASI) em vez de um módulo escrito à mão.

## Como adicionar um teste
1. Extrair a aba: `node scripts/extrair-abas-xlsm.mjs "<planilha>.xlsm" <saida-fora-do-repo>.json "<aba>" "CADASTRO"` (e as abas de norma).
2. Mapear: `node scripts/mapear-aba.mjs <saida>.json "<aba>"` mostra textos fixos e células com fórmula por linha.
3. Escrever `docs/testes/planilha/specs/<SIGLA>.spec.json`: aba, `contexto` (células preenchidas pelo sistema: data de aplicação,
   nascimento, escolaridade, sexo, nome), `entradas` (células de digitação), `opcoes` (ex.: tabela normativa; o valor enviado é o
   índice), `saidas` (células lidas) e `tabelas` (layout da tela). Defeitos da planilha: `correcoes: [{celula, formula}]`.
4. Construir + fumaça: `npx --prefix apps/api tsx scripts/construir-teste-planilha.ts "<planilha>.xlsm" docs/testes/planilha/specs/<SIGLA>.spec.json --smoke 200`
   (gera `docs/testes/planilha/<SIGLA>.json`; só leva fórmulas, constantes referenciadas e as colunas de norma lidas — nunca dados de paciente).
5. Banco: `npx tsx prisma/atualizar-wechsler.ts` (simulação) e `--aplicar` (cria/atualiza; não apaga lançamentos). O seed também carrega esses arquivos.
6. A tela é genérica (`TestePlanilha.tsx`), montada a partir do layout gravado no catálogo.

## Cuidados
- O resultado é o da planilha, inclusive defeitos dela: registre cada defeito achado em `docs/testes/planilha/DEFEITOS.md` (para a Leticia) e
  corrija com `correcoes` quando o certo for óbvio.
- Validação real: comparar com os protocolos preenchidos que a Leticia enviar.
