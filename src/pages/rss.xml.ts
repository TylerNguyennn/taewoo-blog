import { getAllWriting, postPath } from "@/data/post";
import { siteConfig } from "@/site-config";
import { absoluteUrl } from "@/utils/path";
import rss from "@astrojs/rss";

export const GET = async () => {
	// Everything: work stories and study notes. /posts/rss.xml and /study/rss.xml carry one kind each.
	const posts = await getAllWriting();

	return rss({
		title: siteConfig.title,
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
