import { useCallback } from "react";

// Aviso discreto de "salvo" (toast). Módulo simples, sem Context, para que o cliente da API
// (fora do React) também possa disparar avisos.

type Ouvinte = (texto: string) => void;

const ouvintes = new Set<Ouvinte>();
let contador = 0;

export function inscreverAvisos(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

export function avisar(texto: string) {
  contador += 1;
  ouvintes.forEach((o) => o(texto));
}

// Aviso genérico para gravações que a tela não anunciou por conta própria: espera um instante
// (a tela mostra o aviso específico logo depois que a resposta chega) e só fala se ninguém falou.
export function avisarSeSemAviso(texto: string) {
  const antes = contador;
  setTimeout(() => {
    if (contador === antes) avisar(texto);
  }, 250);
}

// Substitui `useState<string | null>(null)` das telas que mostravam uma faixa verde de sucesso:
// mesma assinatura [mensagem, setMensagem], mas o texto vira um aviso discreto em vez de ocupar a
// página. `mensagem` fica sempre null, então a faixa antiga nunca aparece.
export function useAviso(): [string | null, (texto: string | null) => void] {
  const definir = useCallback((texto: string | null) => {
    if (texto) avisar(texto);
  }, []);
  return [null, definir];
}
