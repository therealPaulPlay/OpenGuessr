let profanityRegex = null;

export async function filterProfanity(text) {
    if (!profanityRegex) {
        try {
            const response = await fetch('/json/profanity-filter/profanity-list.json');
            const data = await response.json();
            const escaped = data.list.map(word => word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
            profanityRegex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
        } catch (error) {
            console.error('Error loading profanity list:', error);
            return text;
        }
    }

    try {
        const weirdWhitespace = /[\u00A0\u1680\u2001-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF\u200B-\u200D\u2060\u2800]/g;

        return text
            .replace(weirdWhitespace, '')
            .replace(profanityRegex, match => '*'.repeat(match.length));
    } catch (error) {
        console.error("Error checking for profanity:", error);
        return text;
    }
}