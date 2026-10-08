import { useRef, useState } from "react";

// Envio de imagem para o cadastro (logotipo, marca-d'água, assinatura): lê o arquivo, reduz no navegador e devolve um data URL.
// PNG continua PNG (mantém a transparência, importante para assinatura e marca-d'água); o resto vira JPEG.
interface Props {
  rotulo: string;
  valor: string | null;
  onChange: (dataUrl: string) => void; // "" = remover
  ajuda?: string;
  maxLado?: number;
  desabilitado?: boolean;
}

function reduzir(arquivo: File, maxLado: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("O arquivo não é uma imagem válida."));
      img.onload = () => {
        const f = Math.min(1, maxLado / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * f);
        canvas.height = Math.round(img.height * f);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Navegador sem suporte a imagens."));
        const png = arquivo.type === "image/png";
        if (!png) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(png ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.9));
      };
      img.src = String(leitor.result);
    };
    leitor.readAsDataURL(arquivo);
  });
}

export function UploadImagem({ rotulo, valor, onChange, ajuda, maxLado = 900, desabilitado = false }: Props) {
  const entrada = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function escolher(arquivo: File | undefined) {
    setErro(null);
    if (!arquivo) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(arquivo.type)) return setErro("Use uma imagem PNG, JPEG ou WebP.");
    try {
      onChange(await reduzir(arquivo, maxLado));
    } catch (e) {
      setErro((e as Error).message);
    }
    if (entrada.current) entrada.current.value = "";
  }

  return (
    <div className="text-sm">
      <span className="mb-1 block font-semibold text-ink/70">{rotulo}</span>
      <div className="flex items-center gap-3">
        <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-mist" style={{ background: "repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 50% / 12px 12px" }}>
          {valor ? <img src={valor} alt={rotulo} className="max-h-full max-w-full object-contain" /> : <span className="px-2 text-center text-xs text-ink/40">sem imagem</span>}
        </div>
        {!desabilitado && (
          <div className="flex flex-col items-start gap-1">
            <input ref={entrada} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => escolher(e.target.files?.[0])} />
            <button type="button" className="rounded-lg border border-sage-deep px-3 py-1.5 text-xs font-semibold text-sage-deep" onClick={() => entrada.current?.click()}>
              {valor ? "Trocar imagem" : "Enviar imagem"}
            </button>
            {valor && <button type="button" className="text-xs font-semibold text-ink/50 hover:text-ember" onClick={() => onChange("")}>remover</button>}
          </div>
        )}
      </div>
      {ajuda && <p className="mt-1 text-xs text-ink/50">{ajuda}</p>}
      {erro && <p className="mt-1 text-xs text-ember">{erro}</p>}
    </div>
  );
}
