export function formatDateTime(datetimeStr) {
    const now = new Date();
    const date = new Date(datetimeStr);
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffDays === 0) {
        return "Today";
    } else if (diffDays === 1) {
        return "Yesterday";
    } else if (diffDays <= 7) {
        return "A few days ago";
    } else if (diffWeeks === 1) {
        return "A week ago";
    } else if (diffWeeks <= 4) {
        return "A few weeks ago";
    } else if (diffMonths === 1) {
        return "A month ago";
    } else if (diffMonths <= 12) {
        return "A few months ago";
    } else if (diffYears === 1) {
        return "A year ago";
    } else {
        return diffYears + " years ago";
    }
}