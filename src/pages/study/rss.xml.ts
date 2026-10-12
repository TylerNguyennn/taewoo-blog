import { getAllPosts, postPath, sortMDByDate } from "@/data/post";
import { siteConfig } from "@/site-config";
import { absoluteUrl } from "@/utils/path";
import rss from "@astrojs/rss";

// Study with me notes only.
export const GET = async () => {
	const posts = sortMDByDate(await getAllPosts("study"));

	return rss({
		title: `${siteConfig.title} · Study with me`,
		description:
			"System design, explained with everyday pictures. Each note comes with a hands-on lesson.",
		site: absoluteUrl("/", import.meta.env.SITE),
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.publishDate,
			link: postPath(post),
		})),
	});
};
