import { defineMiddleware } from "astro:middleware";
import { getSessionEmail, SESSION_COOKIE } from "./lib/auth";

const PUBLIC_ADMIN_PATHS = [
  "/admin/login",
  "/admin/verify",
];

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;

  if (path.startsWith("/api/admin/")) {
    if (
      path === "/api/admin/login" ||
      path === "/api/admin/verify" ||
      path === "/api/admin/logout" ||
      path === "/api/admin/intercom-tags-list"
    ) {
      return next();
    }
    const token = context.cookies.get(SESSION_COOKIE)?.value;
    const email = await getSessionEmail(token);
    if (!email) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    context.locals.adminEmail = email;
    return next();
  }

  if (path.startsWith("/admin")) {
    if (PUBLIC_ADMIN_PATHS.some((p) => path === p)) {
      return next();
    }
    const token = context.cookies.get(SESSION_COOKIE)?.value;
    const email = await getSessionEmail(token);
    if (!email) {
      return context.redirect("/admin/login");
    }
    context.locals.adminEmail = email;
    return next();
  }

  return next();
});
