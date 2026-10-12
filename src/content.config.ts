import { defineCollection, type SchemaContext, z } from "astro:content";
import { glob } from "astro/loaders";

function removeDupsAndLowerCase(array: string[]) {
	if (!array.length) return array;
	const lowercaseItems = array.map((str) => str.toLowerCase());
	const distinctItems = new Set(lowercaseItems);
	return Array.from(distinctItems);
}

// Blog posts (personal experience) and "Study with me" (system design explainers) share one schema.
const postSchema = ({ image }: SchemaContext) =>
	z.object({
		coverImage: z
			.object({
				alt: z.string(),
				src: image(),
			})
			.optional(),
		description: z.string().min(10).max(160),
		draft: z.boolean().default(false),
		ogImage: z.string().optional(),
		publishDate: z
			.string()
			.or(z.date())
			.transform((val) => new Date(val)),
		tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
		title: z.string().max(120),
		updatedDate: z
			.string()
			.optional()
			.transform((str) => (str ? new Date(str) : undefined)),
	});

const page = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/page" }),
	schema: z.object({
		title: z.string().max(120),
		description: z.string().max(160).optional(),
	}),
});

const post = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/post" }),
	schema: postSchema,
});

const study = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/study" }),
	schema: postSchema,
});

export const collections = { post, study, page };
