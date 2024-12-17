// Replace profane words with stars (*) and return the result
let profanityRegex = null;

export async function filterProfanity(text) {
    if (!profanityRegex) {
        try {
            const response = await fetch('/json/profanity-filter/profanity-list.json');
            const data = await response.json();
            const escaped = data.list.map(word =>
                word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
            );
            profanityRegex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
        } catch (error) {
            console.error('Error loading profanity list:', error);
            return text;
        }
    }

    return text.replace(profanityRegex, match => '*'.repeat(match.length));
}