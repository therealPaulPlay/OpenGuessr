import { computePosition, flip, shift, offset, arrow } from "@floating-ui/dom";

let openTooltipCount = 0;

export function tooltip(node, { text, delay = 500, ...options }) {
    let tooltipElement, arrowElement, visible = false, showTimeout;

    function createTooltip() {
        tooltipElement = document.createElement('div');
        tooltipElement.textContent = text;
        tooltipElement.setAttribute('popover', '');
        tooltipElement.setAttribute('role', 'tooltip');
        tooltipElement.style.position = 'relative';

        arrowElement = document.createElement('div');
        arrowElement.className = 'tooltip-arrow';
        tooltipElement.appendChild(arrowElement);

        Object.assign(tooltipElement.style, {
            transform: 'scale(0)',
            opacity: '0%',
            filter: 'blur(15px)',
            transition: 'transform 150ms ease, opacity 150ms ease, filter 150ms ease'
        });

        document.body.appendChild(tooltipElement);
    }

    function showTooltip() {
        if (!tooltipElement) createTooltip();
        visible = true;
        openTooltipCount++;
        tooltipElement.showPopover();

        computePosition(node, tooltipElement, {
            placement: "top",
            middleware: [offset(18), flip(), shift({ padding: 5 }), arrow({ element: arrowElement, padding: 4 })]
        }).then(({ x, y, placement, middlewareData }) => {
            Object.assign(tooltipElement.style, { left: `${x}px`, top: `${y}px` });

            const { x: arrowX, y: arrowY } = middlewareData.arrow;
            const side = placement.split('-')[0];

            Object.assign(arrowElement.style, { left: '', top: '', right: '', bottom: '' });

            if (side === 'top') Object.assign(arrowElement.style, { left: `${arrowX}px`, bottom: '-6px' });
            else if (side === 'bottom') Object.assign(arrowElement.style, { left: `${arrowX}px`, top: '-6px' });
            else if (side === 'left') Object.assign(arrowElement.style, { top: `${arrowY}px`, right: '-6px' });
            else if (side === 'right') Object.assign(arrowElement.style, { top: `${arrowY}px`, left: '-6px' });

            arrowElement.setAttribute('data-placement', side);

            requestAnimationFrame(() => {
                Object.assign(tooltipElement.style, {
                    transform: 'scale(1)',
                    opacity: '100%',
                    filter: 'blur(0px)'
                });
            });
        });
    }

    function showTooltipDelayed(e) {
        clearTimeout(showTimeout);
        if (e.pointerType == "touch") return;

        if (openTooltipCount > 0) showTooltip();
        else showTimeout = setTimeout(showTooltip, delay);
    }

    function hideTooltip(e) {
        clearTimeout(showTimeout);
        if (e.pointerType == "touch") return;

        if (!tooltipElement || !visible) return;
        visible = false;
        Object.assign(tooltipElement.style, {
            transform: 'scale(0)',
            opacity: '0%',
            filter: 'blur(15px)'
        });

        setTimeout(() => {
            tooltipElement?.hidePopover();
            openTooltipCount--;
        }, 150);
    }

    node.addEventListener('pointerenter', showTooltipDelayed);
    node.addEventListener('pointerleave', hideTooltip);

    return {
        destroy() {
            clearTimeout(showTimeout);
            node.removeEventListener('pointerenter', showTooltipDelayed);
            node.removeEventListener('pointerleave', hideTooltip);
            if (visible) openTooltipCount--;
            tooltipElement?.remove();
        },
        update(newProps) {
            if (tooltipElement && newProps.text !== text) tooltipElement.textContent = newProps.text;
        }
    };
}