import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/articles" }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    category: z.enum([
      "abrechnung",
      "technik",
      "projekt",
      "vertrag",
      "ausbildung",
      "community",
    ]),
    status: z.enum(["complete", "partial", "todo"]),
    keywords: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
    last_updated: z.string(),
    faq_priority: z.number().min(1).max(99).default(50),
    tldr: z.string().optional(),
    escalate_to: z.string().optional(),
    escalate_tag: z.string().optional(),
  }),
});

export const collections = { articles };
