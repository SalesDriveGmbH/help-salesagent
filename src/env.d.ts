/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    adminEmail?: string;
  }
}

interface ImportMetaEnv {
  readonly ANTHROPIC_API_KEY: string;
  readonly INTERCOM_ACCESS_TOKEN: string;
  readonly INTERCOM_ADMIN_ID: string;
  readonly PUBLIC_TURNSTILE_SITE_KEY: string;
  readonly TURNSTILE_SECRET_KEY: string;
  readonly KV_REST_API_URL: string;
  readonly KV_REST_API_TOKEN: string;
  readonly ADMIN_ALLOWED_EMAILS: string;
  readonly SESSION_SECRET: string;
  readonly RESEND_API_KEY: string;
  readonly RESEND_FROM_EMAIL: string;
  readonly GITHUB_TOKEN: string;
  readonly GITHUB_REPO_OWNER: string;
  readonly GITHUB_REPO_NAME: string;
  readonly PUBLIC_SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
