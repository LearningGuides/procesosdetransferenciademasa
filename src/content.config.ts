import { defineCollection } from 'astro:content';
import {z} from 'astro/zod'
import {glob} from "astro/loaders"

const lecciones = defineCollection({
loader: glob({
    base: "./src/content/lecciones",
    pattern: "**/*.{md,mdx}",
  }),
  schema: z.object({
    title: z.string(),
    lessonNumber: z.number(),
    description: z.string().optional(),
  }),
});

export const collections = {
  lecciones,
};