const RESEND_ENDPOINT = "https://api.resend.com/emails";

const TIMEOUT_MS = 8000;

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

function apiKey(): string | undefined {
  return process.env.RESEND_API_KEY;
}

function sender(): string | undefined {
  return process.env.MAIL_FROM;
}

export function isMailerConfigured(): boolean {
  return Boolean(apiKey() && sender());
}

/**
 * Envoie un message via Resend. Sans `RESEND_API_KEY` / `MAIL_FROM`, le contenu
 * est écrit dans les logs serveur : pratique en développement, et l'appelant
 * n'a pas à distinguer les deux cas.
 */
export async function sendMail(mail: Mail): Promise<boolean> {
  const key = apiKey();
  const from = sender();

  if (!key || !from) {
    console.info(
      `[mailer] Aucun fournisseur configuré. Message pour ${mail.to} :\n${mail.subject}\n${mail.text}`,
    );
    return false;
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(`[mailer] Resend a répondu ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[mailer] Envoi impossible", error);
    return false;
  }
}
