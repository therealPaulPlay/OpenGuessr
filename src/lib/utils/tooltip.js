import { computePosition, flip, shift, offset, arrow } from "@floating-ui/dom";

export function tooltip(node, { text, ...options }) {
    let tooltipElement;
    let arrowElement;
    let visible = false;

    function createTooltip() {
        tooltipElement = document.createElement('div');
        tooltipElement.textContent = text;
        tooltipElement.setAttribute('popover', '');
        tooltipElement.setAttribute('role', 'tooltip');
        tooltipElement.style.position = 'relative'; // Important for arrow positioning

        // Create arrow element
        arrowElement = document.createElement('div');
        arrowElement.className = 'tooltip-arrow';
        tooltipElement.appendChild(arrowElement);

        // Set initial scale for animation
        tooltipElement.style.transform = 'scale(0)';
        tooltipElement.style.opacity = '0%';
        tooltipElement.style.filter = 'blur(15px)';
        tooltipElement.style.transition = 'transform 150ms ease, opacity 150ms ease, filter 150ms ease';

        document.body.appendChild(tooltipElement);
    }

    async function showTooltip() {
        if (!tooltipElement) createTooltip();
        visible = true;
        tooltipElement.showPopover();

        computePosition(node, tooltipElement, {
            placement: "top",
            middleware: [
                offset(18), // Reduced offset since arrow will extend out
                flip(),
                shift({ padding: 5 }),
                arrow({ element: arrowElement, padding: 4 })
            ],
        }).then(({ x, y, placement, middlewareData }) => {
            Object.assign(tooltipElement.style, {
                left: `${x}px`,
                top: `${y}px`,
            });

            // Position arrow relative to tooltip
            const { x: arrowX, y: arrowY } = middlewareData.arrow;
            const side = placement.split('-')[0];

            // Reset all arrow positioning
            Object.assign(arrowElement.style, {
                left: '',
                top: '',
                right: '',
                bottom: '',
            });

            // Position arrow based on placement
            switch (side) {
                case 'top':
                    arrowElement.style.left = `${arrowX}px`;
                    arrowElement.style.bottom = '-6px'; // Arrow extends below tooltip
                    break;
                case 'bottom':
                    arrowElement.style.left = `${arrowX}px`;
                    arrowElement.style.top = '-6px'; // Arrow extends above tooltip
                    break;
                case 'left':
                    arrowElement.style.top = `${arrowY}px`;
                    arrowElement.style.right = '-6px'; // Arrow extends right of tooltip
                    break;
                case 'right':
                    arrowElement.style.top = `${arrowY}px`;
                    arrowElement.style.left = '-6px'; // Arrow extends left of tooltip
                    break;
            }

            arrowElement.setAttribute('data-placement', side);

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

        setTimeout(() => {
            tooltipElement?.hidePopover();
        }, 150);
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
            if (tooltipElement && newOptions.text !== text) tooltipElement.textContent = newOptions.text;
        }
    };
}