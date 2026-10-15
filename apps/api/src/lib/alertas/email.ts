// Envio de e-mail pelo Resend (mesma escolha do Infinity). Sem RESEND_API_KEY não envia e diz que não enviou; nunca derruba a rota de quem chamou.
export async function enviarEmail(para: string, assunto: string, texto: string): Promise<boolean> {
  const chave = process.env.RESEND_API_KEY;
  if (!chave || !para) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_REMETENTE || "MentEssence <onboarding@resend.dev>", to: [para], subject: assunto, text: texto }),
    });
    if (!r.ok) console.error("[alerta] e-mail recusado:", r.status);
    return r.ok;
  } catch (e) { console.error("[alerta] falha ao enviar e-mail:", (e as Error).message); return false; }
}
