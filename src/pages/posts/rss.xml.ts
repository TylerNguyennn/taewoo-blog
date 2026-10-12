import { getAllPosts, postPath, sortMDByDate } from "@/data/post";
import { siteConfig } from "@/site-config";
import { absoluteUrl } from "@/utils/path";
import rss from "@astrojs/rss";

// Work stories only.
export const GET = async () => {
	const posts = sortMDByDate(await getAllPosts("post"));

	return rss({
		title: `${siteConfig.title} · Work stories`,
		description: siteConfig.description,
		site: absoluteUrl("/", import.meta.env.SITE),
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.publishDate,
			link: postPath(post),
		})),
	});
};
