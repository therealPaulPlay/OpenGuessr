// Check if an element is clickable. This is neat for keyboard shortcuts that should only work if that element could be clicked.
export function isElementClickable(element) {
    if (!element || element.offsetParent === null || getComputedStyle(element).visibility == "hidden" || getComputedStyle(element).pointerEvents == "none") {
        return false;
    }

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const topElement = document.elementFromPoint(centerX, centerY);

    // If element itself has pointer-events: auto, it overrides any parent's pointer-events: none, so we can skip
    if (!getComputedStyle(element).pointerEvents === 'auto') {
        // Check if any parent has pointer-events: none that would block clicks
        let el = element.parentElement;
        while (el) {
            const pointerEvents = getComputedStyle(el).pointerEvents;
            if (pointerEvents === 'none') return false;
            else if (pointerEvents === 'auto') break; // Found a parent with 'auto', so we can abort checking elements further up
            el = el.parentElement; // Go up one element
        }
    }

    return topElement === element || element.contains(topElement);
}