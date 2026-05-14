import type { APIRoute } from "astro";
import { isEmailAllowed } from "../../../lib/auth";
import { createMagicLink, sendMagicLinkEmail } from "../../../lib/magic-link";
import { rateLimit } from "../../../lib/rate-limit";

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress, redirect }) => {
  const limited = await rateLimit({
    key: `admin-login:${clientAddress}`,
    max: 5,
    window: 600,
  });
  if (limited) return redirect("/admin/login?denied=1");

  const formData = await request.formData().catch(() => null);
  const email = String(formData?.get("email") ?? "").trim().toLowerCase();

  // Stille Antwort, um keine Allow-List zu enumerieren
  if (!email || !email.includes("@")) {
    return redirect("/admin/login?sent=1");
  }

  if (isEmailAllowed(email)) {
    try {
      const token = await createMagicLink(email);
      await sendMagicLinkEmail(email, token);
    } catch (e) {
      console.error("Magic link send error:", e);
    }
  }

  return redirect("/admin/login?sent=1");
};
