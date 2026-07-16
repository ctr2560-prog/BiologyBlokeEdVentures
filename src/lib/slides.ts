/*
 * Lesson slide decks are pasted as Canva or Google Slides share links and
 * rendered in-app via iframe. This normalises whatever form of link the admin
 * pastes into the correct embeddable URL (or null when unrecognised).
 */

export function toSlidesEmbedUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;

  // Canva: https://www.canva.com/design/{id}/{token}/view[?...] or /edit
  const canva = url.match(/^https:\/\/(?:www\.)?canva\.com\/design\/([\w-]+)\/([\w-]+)\/(?:view|edit|watch)/);
  if (canva) {
    return `https://www.canva.com/design/${canva[1]}/${canva[2]}/view?embed`;
  }

  // Google Slides: https://docs.google.com/presentation/d/{id}/(edit|pub|embed|view)...
  const gslides = url.match(/^https:\/\/docs\.google\.com\/presentation\/d\/(?:e\/)?([\w-]+)/);
  if (gslides) {
    const isPublished = url.includes("/d/e/");
    return isPublished
      ? `https://docs.google.com/presentation/d/e/${gslides[1]}/embed?start=false&loop=false`
      : `https://docs.google.com/presentation/d/${gslides[1]}/embed?start=false&loop=false`;
  }

  return null;
}

export function isValidSlidesUrl(raw: string): boolean {
  return toSlidesEmbedUrl(raw) !== null;
}
