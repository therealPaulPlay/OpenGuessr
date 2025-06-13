import { computePosition, flip, shift, offset } from "@floating-ui/dom";

export function tooltip(node, { text, ...options }) {
    let tooltipElement;
    let visible = false;

    function createTooltip() {
        tooltipElement = document.createElement('div');
        tooltipElement.textContent = text;
        tooltipElement.setAttribute('popover', '');
        tooltipElement.setAttribute('role', 'tooltip');

        // Set initial scale for animation
        tooltipElement.style.transform = 'scale(0)';
        tooltipElement.style.opacity = '0%';
        tooltipElement.style.filter = 'blur(15px)';
        tooltipElement.style.transition = 'transform 150ms ease, opacity 150ms ease, filter 150ms ease';

        document.body.appendChild(tooltipElement);
    }

    function showTooltip() {
        if (!tooltipElement) createTooltip();
        visible = true;
        tooltipElement.showPopover();

        computePosition(node, tooltipElement, {
            placement: "top",
            middleware: [flip(), shift({ padding: 5 }), offset(15)],
        }).then(({ x, y }) => {
            Object.assign(tooltipElement.style, {
                left: `${x}px`,
                top: `${y}px`,
            });

            // Trigger scale animation
            requestAnimationFrame(() => {
                tooltipElement.style.transform = 'scale(1)';
                tooltipElement.style.opacity = '100%';
                tooltipElement.style.filter = 'blur(0px)';
            });
        });
    }

    function hideTooltip() {
        if (!tooltipElement) return;

        visible = false;
        tooltipElement.style.transform = 'scale(0)';
        tooltipElement.style.opacity = '0%';
        tooltipElement.style.filter = 'blur(15px)';

        // Hide popover after animation completes
        setTimeout(() => {
            tooltipElement?.hidePopover();
        }, 150); // Match transition duration
    }

    node.addEventListener('mouseenter', showTooltip);
    node.addEventListener('mouseleave', hideTooltip);

    return {
        destroy() {
            node.removeEventListener('mouseenter', showTooltip);
            node.removeEventListener('mouseleave', hideTooltip);
            tooltipElement?.remove();
        },
        update(newOptions) {
            if (tooltipElement && newOptions.text !== text) {
                tooltipElement.textContent = newOptions.text;
            }
        }
    };
}