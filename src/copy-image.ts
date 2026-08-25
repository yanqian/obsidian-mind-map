import { Notice } from 'obsidian';

export async function copyImageToClipboard(svg?: SVGElement): Promise<boolean> {
  if (!svg) {
    new Notice('Unable to copy screenshot: no mind map is rendered.');
    return false;
  }

  try {
    if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
      throw new Error('image clipboard support is unavailable');
    }

    const canvas = createCanvas(svg);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('canvas rendering is unavailable');

    const image = await loadSvgImage(svg);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await canvasToPng(canvas);
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    new Notice('Screenshot copied to the clipboard.');
    return true;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    new Notice(`Unable to copy screenshot: ${reason}.`);
    return false;
  }
}

function createCanvas(svg: SVGElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const viewBox = (svg as SVGSVGElement).viewBox?.baseVal;
  canvas.width = Math.max(1, Math.round(svg.clientWidth || viewBox?.width || 1));
  canvas.height = Math.max(1, Math.round(svg.clientHeight || viewBox?.height || 1));
  return canvas;
}

function loadSvgImage(svg: SVGElement): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const xml = new XMLSerializer().serializeToString(svg);
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('SVG image decoding failed'));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  });
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNG conversion failed'));
    }, 'image/png');
  });
}
