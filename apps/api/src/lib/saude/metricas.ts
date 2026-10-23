// Métricas que o médico acompanha ao longo do tempo. `faixa` é só uma referência visual no gráfico, não diagnóstico.
export type TipoMetrica = { chave: string; rotulo: string; unidade: string; duplo?: boolean; min: number; max: number; faixa?: [number, number] };

export const METRICAS: TipoMetrica[] = [
  { chave: "PESO", rotulo: "Peso", unidade: "kg", min: 1, max: 400 },
  { chave: "CINTURA", rotulo: "Circunferência da cintura", unidade: "cm", min: 20, max: 250 },
  { chave: "PA", rotulo: "Pressão arterial", unidade: "mmHg", duplo: true, min: 30, max: 300, faixa: [90, 130] },
  { chave: "FC", rotulo: "Frequência cardíaca", unidade: "bpm", min: 20, max: 250, faixa: [60, 100] },
  { chave: "SATURACAO", rotulo: "Saturação de O₂", unidade: "%", min: 50, max: 100, faixa: [95, 100] },
  { chave: "TEMPERATURA", rotulo: "Temperatura", unidade: "°C", min: 30, max: 45, faixa: [36, 37.5] },
  { chave: "GLICEMIA", rotulo: "Glicemia", unidade: "mg/dL", min: 10, max: 1000, faixa: [70, 99] },
  { chave: "HBA1C", rotulo: "Hemoglobina glicada", unidade: "%", min: 2, max: 20, faixa: [4, 5.6] },
  { chave: "LDL", rotulo: "Colesterol LDL", unidade: "mg/dL", min: 10, max: 600 },
  { chave: "SONO", rotulo: "Sono", unidade: "h/noite", min: 0, max: 24 },
];

export const metricaDe = (chave: string) => METRICAS.find((m) => m.chave === chave);
