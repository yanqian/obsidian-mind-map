export function createSVG(containerEl: HTMLElement, lineHeight: string): SVGElement {
    removeExistingSVG(containerEl);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as unknown as SVGElement;
    svg.classList.add('mindmap-svg');
    svg.setAttr('style', 'height: 100%; width: 100%;');
    const container = containerEl;
    const style = document.createElement('style');
    const { color } = getComputedCss(containerEl);
    style.innerHTML = `.mindmap-svg div {
        color: ${color};
        line-height: ${lineHeight ?? '1em'};
    }`;
    svg.appendChild(style);
    container.appendChild(svg);
    return svg;
}

export function removeExistingSVG(containerEl: HTMLElement) {
    const existing = containerEl.querySelector('.mindmap-svg');
    if(existing) {
        existing.remove();
    }
}

export function getComputedCss(el: HTMLElement) {
    const computed = getComputedStyle(el);
    const color = computed.getPropertyValue('--text-normal');
    const font = `1em ${computed.getPropertyValue('--default-font')}`;
    return { color, font };
}
