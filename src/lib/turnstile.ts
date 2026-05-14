export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = import.meta.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("Turnstile-Secret nicht gesetzt — Verifikation übersprungen");
    return true;
  }
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.append("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data: any = await res.json();
    return Boolean(data.success);
  } catch (e) {
    console.error("Turnstile verify error:", e);
    return false;
  }
}
