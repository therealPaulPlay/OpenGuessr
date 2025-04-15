// Replace profane words with stars (*)
let profanityRegex = null;
export async function filterProfanity(text) {
    if (!profanityRegex) {
        try {
            const response = await fetch('/json/profanity-filter/profanity-list.json');
            const data = await response.json();
            const escaped = data.list.map(word => word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
            profanityRegex = new RegExp(`(${escaped.join('|')})`, 'gi'); // No word boundaries for no-space version
        } catch (error) {
            console.error('Error loading profanity list:', error);
            return text;
        }
    }

    try {
        const spaceIndexes = [];
        for (let i = 0; i < text.length; i++) if (text[i] === ' ') spaceIndexes.push(i);

        const textWithoutSpecialSpaces = text.replace(/[\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF\u200B-\u200D\u2060\u2800]/g, '');
        const textWithoutAnySpaces = textWithoutSpecialSpaces.replace(/ /g, '');
        const censoredTextNoSpaces = textWithoutAnySpaces.replace(profanityRegex, match => '*'.repeat(match.length));

        let result = '';
        let currentIndex = 0;

        for (let i = 0; i < text.length; i++) {
            if (spaceIndexes.includes(i)) result += ' ';
            else if (!/[\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF\u200B-\u200D\u2060\u2800]/.test(text[i])) {
                result += censoredTextNoSpaces[currentIndex];
                currentIndex++;
            }
        }

        return result;

    } catch (error) {
        console.error("Error checking for profanity:", error);
        return text;
    }
}