// Dados normativos do BRIEF2 (Gioia, Isquith, Guy & Kenworthy, PAR 2015) — normas americanas,
// sem adaptação brasileira (ver docs/testes/BRIEF2.md). Separado de seed.ts pelo volume.
//
// PROCEDÊNCIA E VERIFICAÇÃO (atualizado em 05/10/2026)
//   - As 9 escalas das Tabelas A.1-A.4 (Formulário de Pais, MENINOS, as 4 faixas etárias) foram
//     RECONFERIDAS célula a célula contra as páginas originais do manual, renderizadas a 400dpi
//     a partir de "Manuais/BRIEF 2 - Professional Manual -.pdf" (páginas físicas 1-4 = páginas
//     impressas 184-187). A transcrição anterior tinha erro sistemático de desalinhamento de
//     linha — ver docs/testes/BRIEF2.md, seção "Rodada de verificação".
//   - GEC: continua sendo só PONTOS-ÂNCORA (de 10 em 10 no bruto), e NÃO foi reconferido nesta
//     rodada. Serve para percentil aproximado; os cortes clínicos que importam (T>=65, T>=70)
//     estão completos no Apêndice E em docs/testes/BRIEF2.md.
//   - Índices (BRI/ERI/CRI): NÃO incluídos aqui (Tabelas A.5-A.8) — ver docs/testes/BRIEF2.md.
//   - Meninas (A.13-A.24), Professores (Apêndice B) e Autorrelato (Apêndice C): não transcritos.
//     CUIDADO: `escolherTabelaNormativa` cai para uma tabela de outro sexo quando não acha a do
//     sexo do paciente, então hoje uma paciente MENINA seria pontuada pela norma de MENINO sem
//     nada na tela denunciando isso. Por isso o teste segue com `isPlaceholder: true`.
import type { Prisma } from "@prisma/client";

export function parseColunaBRIEF2(coluna: string): Prisma.InputJsonValue[] {
  return coluna.split(",").map((par) => {
    const [raw, t, pct] = par.split(":");
    return {
      min: Number(raw),
      max: Number(raw),
      // A chave é `escoreT` (e não `tScore`) porque é a que o resto do catálogo usa e a que
      // ResultadoResumo.tsx procura para exibir — com `tScore` o escore T do BRIEF2 não aparecia
      // na tela, só o percentil.
      //
      // ">90" aparece no topo de algumas colunas de Shift: é teto impresso no manual, não um
      // número. Fica string, igual ao percentil ">99" — `Number(">90")` daria NaN, que o Prisma
      // grava como null no JSON.
      escoreT: t.startsWith(">") ? t : Number(t),
      percentil: pct,
    };
  });
}

export const BRIEF2_ESCALAS_PAIS_PROFESSORES = [
  "inhibit", "selfMonitor", "shift", "emotionalControl", "initiate",
  "workingMemory", "planOrganize", "taskMonitor", "organizationOfMaterials",
] as const;

export const BRIEF2_ESCALAS_AUTORRELATO = [
  "inhibit", "selfMonitor", "shift", "emotionalControl", "taskCompletion", "workingMemory", "planOrganize",
] as const;

// Amplitude do escore bruto de cada escala = nº de itens (1 ponto mínimo por item) até 3× o nº de
// itens. Usada como guarda estrutural na validação (scripts/validar-brief2.mjs): uma coluna que
// não começa e termina exatamente aqui denuncia linha faltando ou linha inventada — foi assim que
// as linhas espúrias de Self-Monitor e a linha 5 faltante de Task-Monitor foram achadas.
export const BRIEF2_AMPLITUDE_BRUTO_PAIS_PROFESSORES: Record<string, [number, number]> = {
  inhibit: [8, 24],
  selfMonitor: [4, 12],
  shift: [8, 24],
  emotionalControl: [8, 24],
  initiate: [5, 15],
  workingMemory: [8, 24],
  planOrganize: [8, 24],
  taskMonitor: [5, 15],
  organizationOfMaterials: [6, 18],
};

export interface Brief2FaixaEtaria {
  faixaMin: number;
  faixaMax: number;
  faixaLabel: string;
  sexo: "MASCULINO" | "FEMININO";
  escalas: Record<string, string>;
  gec: string;
}

// ============================== FORMULÁRIO DE PAIS (Apêndice A) ==============================

export const BRIEF2_PAIS_NORMAS: Brief2FaixaEtaria[] = [
  {
    // Tabela A.1 (escalas, verificada) + A.9 (GEC, âncoras, NÃO verificada)
    faixaMin: 5, faixaMax: 7, faixaLabel: "Meninos, 5-7 anos", sexo: "MASCULINO",
    escalas: {
      inhibit: "24:79:>99,23:77:99,22:75:99,21:72:99,20:69:96,19:66:94,18:63:90,17:61:88,16:58:85,15:55:77,14:52:67,13:50:55,12:47:45,11:44:34,10:41:27,9:38:19,8:36:10",
      selfMonitor: "12:78:>99,11:74:98,10:68:96,9:63:95,8:58:90,7:53:71,6:48:50,5:43:37,4:38:23",
      shift: "24:89:>99,23:86:>99,22:82:>99,21:79:99,20:76:99,19:73:98,18:70:95,17:67:93,16:64:91,15:61:87,14:58:85,13:55:77,12:52:68,11:49:60,10:45:47,9:42:34,8:39:21",
      emotionalControl: "24:82:>99,23:79:99,22:77:99,21:74:98,20:71:97,19:69:95,18:66:94,17:64:91,16:61:89,15:59:86,14:56:75,13:53:66,12:51:62,11:48:55,10:46:49,9:43:43,8:40:32",
      initiate: "15:79:>99,14:75:>99,13:71:99,12:67:98,11:63:97,10:59:93,9:55:81,8:50:71,7:46:55,6:42:47,5:38:27",
      // bruto 17 (T 63) e 18 (T 64) destoam da reta: é o que o manual imprime, conferido duas
      // vezes (metade esquerda e metade direita da mesma página). Não "corrigir" para 61/64.
      workingMemory: "24:80:>99,23:77:>99,22:74:>99,21:72:>99,20:69:99,19:66:96,18:64:93,17:63:92,16:59:88,15:55:80,14:52:76,13:50:66,12:49:51,11:45:43,10:43:35,9:40:22,8:37:14",
      planOrganize: "24:79:>99,23:76:>99,22:73:99,21:71:99,20:68:99,19:66:99,18:63:97,17:60:93,16:58:89,15:55:83,14:52:75,13:50:66,12:47:60,11:45:49,10:42:43,9:39:28,8:37:14",
      taskMonitor: "15:73:>99,14:69:98,13:66:97,12:62:96,11:58:90,10:54:80,9:50:62,8:46:45,7:44:37,6:39:25,5:35:14",
      organizationOfMaterials: "18:76:>99,17:73:99,16:70:99,15:67:99,14:63:97,13:60:95,12:57:88,11:54:79,10:50:69,9:47:59,8:45:43,7:42:33,6:38:19",
    },
    gec: "180:90:>99,170:86:>99,160:82:99,150:77:99,140:72:99,130:68:95,120:63:86,110:58:80,100:54:70,90:49:55,80:44:34,70:40:19,60:35:1",
  },
  {
    // Tabela A.2 (escalas, verificada) + A.10 (GEC, âncoras, NÃO verificada)
    faixaMin: 8, faixaMax: 10, faixaLabel: "Meninos, 8-10 anos", sexo: "MASCULINO",
    escalas: {
      inhibit: "24:79:>99,23:77:>99,22:75:99,21:72:96,20:69:94,19:66:93,18:64:91,17:61:88,16:59:84,15:56:79,14:53:71,13:51:63,12:48:53,11:45:43,10:43:35,9:40:24,8:38:12",
      selfMonitor: "12:78:>99,11:74:97,10:68:97,9:63:90,8:58:87,7:54:75,6:49:60,5:44:45,4:39:25",
      shift: "24:>90:>99,23:88:>99,22:85:>99,21:82:99,20:79:99,19:76:98,18:72:97,17:69:97,16:66:94,15:62:90,14:59:85,13:56:77,12:52:69,11:49:62,10:46:51,9:43:36,8:39:20",
      emotionalControl: "24:84:>99,23:81:>99,22:78:>99,21:76:97,20:73:96,19:70:96,18:67:93,17:65:93,16:62:88,15:59:84,14:57:79,13:54:74,12:51:67,11:48:60,10:46:52,9:43:38,8:40:26",
      initiate: "15:79:>99,14:75:>99,13:71:99,12:67:96,11:63:90,10:59:87,9:55:71,8:50:61,7:46:47,6:42:36,5:38:23",
      workingMemory: "24:80:>99,23:77:>99,22:74:99,21:72:97,20:69:94,19:66:90,18:64:86,17:63:84,16:59:78,15:55:74,14:52:68,13:50:57,12:49:51,11:45:44,10:43:36,9:41:31,8:38:18",
      planOrganize: "24:79:>99,23:76:>99,22:73:99,21:71:98,20:68:96,19:66:94,18:63:88,17:60:86,16:58:82,15:55:73,14:52:66,13:50:57,12:47:50,11:45:40,10:42:32,9:39:21,8:37:12",
      taskMonitor: "15:73:>99,14:69:97,13:66:94,12:62:91,11:58:84,10:54:75,9:50:56,8:46:47,7:44:36,6:39:19,5:35:10",
      organizationOfMaterials: "18:76:>99,17:73:98,16:70:97,15:67:93,14:63:90,13:60:86,12:57:82,11:54:74,10:50:63,9:47:53,8:45:37,7:42:25,6:38:17",
    },
    gec: "180:90:>99,170:86:>99,160:82:99,150:77:98,140:72:95,130:68:91,120:63:83,110:58:77,100:54:65,90:49:52,80:44:34,70:40:17,60:36:1",
  },
  {
    // Tabela A.3 (escalas, verificada) + A.11 (GEC, âncoras, NÃO verificada)
    faixaMin: 11, faixaMax: 13, faixaLabel: "Meninos, 11-13 anos", sexo: "MASCULINO",
    escalas: {
      inhibit: "24:87:>99,23:84:>99,22:81:>99,21:78:98,20:75:97,19:72:97,18:69:97,17:66:94,16:63:93,15:60:87,14:57:81,13:54:71,12:51:61,11:48:57,10:45:45,9:42:35,8:39:14",
      selfMonitor: "12:78:>99,11:74:99,10:69:97,9:63:94,8:59:87,7:54:71,6:49:61,5:44:46,4:39:22",
      shift: "24:>90:>99,23:88:>99,22:85:>99,21:82:>99,20:79:99,19:76:98,18:72:96,17:69:95,16:66:93,15:62:88,14:59:82,13:56:78,12:53:76,11:50:65,10:47:54,9:44:42,8:41:31",
      emotionalControl: "24:84:>99,23:82:99,22:80:99,21:76:97,20:74:96,19:72:95,18:68:94,17:66:94,16:64:92,15:60:86,14:58:81,13:55:80,12:53:76,11:49:72,10:47:57,9:45:50,8:41:35",
      initiate: "15:79:>99,14:75:99,13:71:98,12:67:97,11:63:94,10:59:88,9:55:79,8:50:63,7:47:54,6:43:41,5:39:25",
      workingMemory: "24:85:>99,23:82:>99,22:77:99,21:76:99,20:72:97,19:71:96,18:67:95,17:65:94,16:61:92,15:59:85,14:56:78,13:53:72,12:51:63,11:48:52,10:45:47,9:42:33,8:39:21",
      planOrganize: "24:80:>99,23:77:>99,22:74:99,21:72:97,20:69:96,19:67:94,18:64:92,17:61:89,16:59:86,15:56:76,14:53:66,13:50:61,12:48:53,11:45:42,10:43:35,9:40:27,8:38:16",
      taskMonitor: "15:73:>99,14:69:99,13:66:96,12:62:95,11:58:89,10:54:82,9:50:62,8:46:44,7:44:37,6:40:27,5:36:17",
      organizationOfMaterials: "18:76:>99,17:73:99,16:70:97,15:67:94,14:63:90,13:60:86,12:57:83,11:54:68,10:51:62,9:48:54,8:45:44,7:42:32,6:39:23",
    },
    gec: "180:90:>99,170:86:>99,160:83:99,150:77:98,140:73:96,130:68:94,120:63:87,110:58:80,100:54:69,90:49:57,80:44:35,70:40:19,60:37:5",
  },
  {
    // Tabela A.4 (escalas, verificada) + A.12 (GEC, âncoras, NÃO verificada)
    faixaMin: 14, faixaMax: 18, faixaLabel: "Meninos, 14-18 anos", sexo: "MASCULINO",
    escalas: {
      inhibit: "24:88:>99,23:85:>99,22:82:99,21:79:99,20:76:99,19:73:97,18:70:94,17:67:94,16:64:92,15:61:87,14:58:83,13:55:78,12:52:74,11:49:64,10:46:56,9:43:42,8:40:23",
      selfMonitor: "12:78:>99,11:74:99,10:69:97,9:63:93,8:59:84,7:54:70,6:49:57,5:44:46,4:39:28",
      shift: "24:>90:>99,23:88:>99,22:85:>99,21:82:>99,20:79:99,19:76:98,18:72:96,17:69:95,16:66:94,15:63:91,14:60:86,13:57:79,12:54:73,11:50:69,10:47:58,9:44:48,8:41:31",
      emotionalControl: "24:84:>99,23:82:>99,22:80:99,21:76:98,20:74:96,19:72:96,18:68:94,17:66:94,16:64:90,15:60:84,14:58:80,13:55:75,12:53:71,11:49:65,10:47:58,9:45:48,8:41:33",
      initiate: "15:79:>99,14:75:>99,13:71:97,12:67:93,11:63:90,10:59:85,9:55:71,8:51:63,7:47:52,6:43:44,5:40:29",
      workingMemory: "24:85:>99,23:82:>99,22:77:99,21:76:98,20:72:98,19:71:96,18:67:94,17:65:92,16:61:88,15:59:81,14:56:74,13:53:69,12:51:64,11:48:58,10:46:50,9:43:41,8:40:29",
      planOrganize: "24:80:>99,23:77:99,22:74:98,21:72:95,20:69:92,19:67:90,18:64:88,17:61:84,16:59:75,15:56:70,14:53:61,13:50:55,12:48:49,11:45:42,10:43:35,9:40:29,8:38:19",
      taskMonitor: "15:73:>99,14:69:96,13:66:94,12:62:90,11:59:86,10:56:77,9:52:62,8:49:51,7:45:44,6:42:36,5:38:26",
      organizationOfMaterials: "18:76:>99,17:73:98,16:70:95,15:67:93,14:63:90,13:60:86,12:58:82,11:55:72,10:52:65,9:49:58,8:46:49,7:43:38,6:40:27",
    },
    gec: "180:90:>99,170:87:>99,160:82:99,150:77:98,140:72:97,130:69:96,120:63:85,110:58:79,100:54:69,90:49:56,80:45:42,70:40:36,60:38:6",
  },
];
