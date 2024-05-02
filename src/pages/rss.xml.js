import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {

    const notes = await getCollection("notes", ({ data }) => {
        return data.draft !== true;
    });
    
    return rss({
        // `<title>` field in output xml
        title: "Gil Creque's Digital Garden",
        // `<description>` field in output xml
        description: 'Musings of a technologist and software engineer.',
        // Pull in your project "site" from the endpoint context
        // https://docs.astro.build/en/reference/api-reference/#contextsite
        site: "https://gil.dev",
        // Array of `<item>`s in output xml
        // See "Generating items" section for examples using content collections and glob imports
        items: notes.map((note) => ({
            title: note.data.title,
            pubDate: note.data.date,
            customData: note.data.customData,
            // Compute RSS link from post `slug`
            // This example assumes all posts are rendered as `/blog/[slug]` routes
            link: `/${note.slug}/`,
        })),
        // (optional) inject custom xml
        customData: `<language>en-us</language>`,
    });
}