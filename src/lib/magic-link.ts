import { kv } from "@vercel/kv";
import { Resend } from "resend";

const MAGIC_TTL_SECONDS = 15 * 60;

export async function createMagicLink(email: string): Promise<string> {
  const token = crypto.randomUUID();
  await kv.set(
    `magic:${token}`,
    { email: email.toLowerCase(), createdAt: Date.now() },
    { ex: MAGIC_TTL_SECONDS },
  );
  return token;
}

export async function consumeMagicToken(token: string): Promise<string | null> {
  try {
    const data = (await kv.get(`magic:${token}`)) as { email: string } | null;
    if (!data) return null;
    await kv.del(`magic:${token}`);
    return data.email;
  } catch {
    return null;
  }
}

export async function sendMagicLinkEmail(email: string, token: string) {
  const apiKey = import.meta.env.RESEND_API_KEY;
  const from = import.meta.env.RESEND_FROM_EMAIL ?? "noreply@help.salesagent.at";
  const site = import.meta.env.PUBLIC_SITE_URL ?? "https://help.salesagent.at";

  if (!apiKey) {
    console.warn("RESEND_API_KEY nicht gesetzt — Magic-Link wird in der Console geloggt.");
    console.log(`MAGIC LINK: ${site}/admin/verify?token=${token}`);
    return;
  }

  const resend = new Resend(apiKey);
  const link = `${site}/admin/verify?token=${token}`;

  await resend.emails.send({
    from: `SalesDrive Help <${from}>`,
    to: email,
    subject: "Dein Admin-Login für den Hilfebereich",
    text: `Hi,

klick hier, um dich einzuloggen:
${link}

Der Link ist 15 Minuten gültig.

Wenn du das nicht warst, ignoriere diese Email.

— SalesDrive`,
    html: `<!doctype html>
<html lang="de"><body style="font-family: system-ui, -apple-system, sans-serif; background:#050505; color:#F5F1E8; padding:32px;">
  <div style="max-width:480px; margin:0 auto;">
    <h1 style="font-size:22px; font-weight:600; letter-spacing:-0.03em; color:#E5D0A5;">Admin-Login</h1>
    <p style="color:#B8B0A0; font-size:15px; line-height:1.6;">Klick auf den Button, um dich beim SalesAgent-Hilfebereich einzuloggen.</p>
    <p style="margin:24px 0;">
      <a href="${link}" style="display:inline-block; background:#BFA37C; color:#050505; padding:12px 24px; border-radius:10px; text-decoration:none; font-weight:500;">Einloggen</a>
    </p>
    <p style="color:#6B6358; font-size:12px;">Der Link ist 15 Minuten gültig.<br/>Wenn du das nicht warst, ignoriere diese Email.</p>
    <p style="color:#3D3933; font-size:11px; margin-top:32px;">— SalesDrive</p>
  </div>
</body></html>`,
  });
}
