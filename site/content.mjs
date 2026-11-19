// Text and settings for the install page (index.html) and llms.txt.
// The templates are site/index.html and site/llms.md; build.mjs fills them in.

// ---------- search ----------
// Shown as the headline and snippet in search results.
export const TITLE = 'Copy as Markdown: Bookmarklet to Copy Selected Text as Markdown';
export const DESCRIPTION = 'Free bookmarklet: select text on any web page, click it, and get clean Markdown on your clipboard. Keeps headings, links, lists, tables and code. No extension needed.';
// The one address search engines should index (the github.io URL redirects here).
export const SITE_URL = 'https://copy-as-markdown.tuckbick.com/';
// Link-preview image: icons/clipboard.svg rendered as PNG, since most sites don't
// show SVG previews. Regenerate after changing the SVG (macOS):
//   sips -s format png -z 512 512 icons/clipboard.svg --out icons/clipboard-512.png
export const SHARE_IMAGE = SITE_URL + 'icons/clipboard-512.png';

export const REPO = 'https://github.com/tuckbick/copy-as-markdown';
// Raw files, so agents reading llms.txt get Markdown rather than GitHub's HTML view.
export const RAW = 'https://raw.githubusercontent.com/tuckbick/copy-as-markdown/main';

// Structured data: describes the page as a free web tool. No ratings or reviews,
// since there aren't any to report.
export function structuredData (version) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Copy as Markdown',
    description: DESCRIPTION,
    url: SITE_URL,
    image: SHARE_IMAGE,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    browserRequirements: 'A desktop web browser that supports bookmarklets',
    softwareVersion: version,
    license: 'https://opensource.org/licenses/MIT',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: { '@type': 'Person', name: 'Tucker Bickler', url: 'https://tuckbick.com' },
    sameAs: [REPO]
  };
}

// What the converter handles: listed on the install page and in llms.txt.
export const CONVERTS = [
  'Headings, bold, italic and strikethrough',
  'Links and images, with relative URLs turned into full ones',
  'Bulleted, numbered, nested and checkbox lists',
  'Tables, as GitHub-flavored Markdown tables',
  'Inline code and code blocks, keeping the language',
  'Block quotes and line breaks'
];

// ---------- icon ----------
// Browsers don't keep a favicon for javascript: bookmarks, so the bookmarklet's
// "icon" is the emoji at the start of its name. icons/clipboard.svg (the Twemoji 📋,
// CC-BY 4.0, see THIRD_PARTY_NOTICES.md) is the install page's own favicon. It's
// linked as a file rather than inlined: search engines only show favicons they can
// fetch from their own URL.
export const NAME = 'Copy as Markdown';
export const EMOJI = '📋';

// Name choices on the install page. The dragged bookmark takes the button's
// label as its name, so people can pick whatever they'll recognize. The first
// entry in each list is the default.
export const EMOJIS = ['📋', '📝', '✂️', '⬇️', '🔽', ''];
export const NAMES = [NAME, 'MD', 'Markdown', 'Copy as MD', 'Copy MD', 'Selection → MD', 'Markdownify', ''];
