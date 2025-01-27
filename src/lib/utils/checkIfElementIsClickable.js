// Check if an element is clickable. This is neat for keyboard shortcuts that should only work if that element could be clicked.

export function isElementClickable(element) {
    if (!element || element.offsetParent === null || getComputedStyle(element).visibility == "hidden" || getComputedStyle(element).pointerEvents == "none") {
        return false;
    }

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const topElement = document.elementFromPoint(centerX, centerY);

    // Check if the element or any of its closer parents have pointer-events set to 'auto'
    let el = element;
    let closestPointerEventsNoneParent = null;
    while (el) {
        if (getComputedStyle(el).pointerEvents === 'none') {
            closestPointerEventsNoneParent = el;
        } else if (getComputedStyle(el).pointerEvents === 'auto') {
            closestPointerEventsNoneParent = null;
        }
        el = el.parentElement;
    }

    // If there's a closer parent with pointer-events: none, the element is not clickable
    if (closestPointerEventsNoneParent) {
        return false;
    }

    return topElement === element || element.contains(topElement);
}