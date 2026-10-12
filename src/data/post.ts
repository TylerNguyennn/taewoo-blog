import { type CollectionEntry, getCollection } from "astro:content";
import { siteConfig } from "@/site-config";

/** A blog post (personal experience) or a "Study with me" post (system design explainer). */
export type Section = "post" | "study";
export type PostEntry = CollectionEntry<Section>;

/** Fetch all posts of one section (blog posts by default). Drafts are excluded in production builds. */
export async function getAllPosts(section: Section = "post"): Promise<PostEntry[]> {
	return await getCollection(section, ({ data }: PostEntry) => {
		return import.meta.env.PROD ? !data.draft : true;
	});
}

/** Date used for sorting — `updatedDate` if `siteConfig.sortPostsByUpdatedDate`, else `publishDate`. */
export function getPostSortDate(post: PostEntry): Date {
	return siteConfig.sortPostsByUpdatedDate && post.data.updatedDate !== undefined
		? new Date(post.data.updatedDate)
		: new Date(post.data.publishDate);
}

/** Sort by `getPostSortDate`, newest first. Mutates input. */
export function sortMDByDate(posts: PostEntry[]): PostEntry[] {
	return posts.sort((a, b) => {
		const aDate = getPostSortDate(a).valueOf();
		const bDate = getPostSortDate(b).valueOf();
		return bDate - aDate;
	});
}

/** Every tag across the given posts, including duplicates. */
export function getAllTags(posts: PostEntry[]): string[] {
	return posts.flatMap((post) => post.data.tags);
}

/** Unique tags across the given posts, sorted alphabetically. */
export function getUniqueTags(posts: PostEntry[]): string[] {
	return [...new Set(getAllTags(posts))].sort((a, b) => a.localeCompare(b));
}

/** Unique tags with their post counts, sorted by count (desc) then tag (asc). */
export function getUniqueTagsWithCount(posts: PostEntry[]): [string, number][] {
	const counts = getAllTags(posts).reduce((map, tag) => {
		map.set(tag, (map.get(tag) ?? 0) + 1);
		return map;
	}, new Map<string, number>());
	return [...counts.entries()].sort(([aTag, aCount], [bTag, bCount]) =>
		bCount === aCount ? aTag.localeCompare(bTag) : bCount - aCount,
	);
}

/** Posts that carry the given tag (order preserved from the input). */
export function getPostsByTag(posts: PostEntry[], tag: string): PostEntry[] {
	return posts.filter((post) => post.data.tags.includes(tag));
}

/** Where an entry lives: /posts/<id>/ or /study/<id>/. */
export function postPath(post: PostEntry): string {
	return `/${post.collection === "study" ? "study" : "posts"}/${post.id}/`;
}

/** Its generated social image: /og-image/<id>.png or /og-image/study/<id>.png. */
export function postOgImage(post: PostEntry): string {
	return `/og-image/${post.collection === "study" ? "study/" : ""}${post.id}.png`;
}

/** Work stories and study notes together, newest first: the full "Writing" list. */
export async function getAllWriting(): Promise<PostEntry[]> {
	return sortMDByDate([...(await getAllPosts("post")), ...(await getAllPosts("study"))]);
}

/** "work" for a blog post, "study" for a Study with me note: used by the writing filter. */
export function postKind(post: PostEntry): "work" | "study" {
	return post.collection === "study" ? "study" : "work";
}

/** Study notes in the order they were written: note 1 is the oldest. */
export async function getStudyNotesInOrder(): Promise<PostEntry[]> {
	return sortMDByDate(await getAllPosts("study")).reverse();
}
