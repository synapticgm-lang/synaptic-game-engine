export type QuietQuadrant =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'bottom-center';

const ANALYSIS_SIZE = 100;
const ANALYSIS_TIMEOUT_MS = 100;
const DEFAULT_QUADRANT: QuietQuadrant = 'bottom-center';

function scheduleOffMainTurn<T>(work: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = () => {
      try {
        resolve(work());
      } catch (error) {
        reject(error);
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(run, { timeout: 120 });
    } else {
      setTimeout(run, 0);
    }
  });
}

async function getCanvasSafeImage(imgElement: HTMLImageElement): Promise<HTMLImageElement> {
  const src = imgElement.currentSrc || imgElement.src;
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) return imgElement;

  try {
    const url = new URL(src, window.location.href);
    if (url.origin === window.location.origin) return imgElement;
  } catch {
    return imgElement;
  }

  // Preserve the visible image's permissive loading behavior. For analysis only, request a
  // separate anonymous-CORS copy; if the host disallows it this rejects and the UI falls back
  // to the Director-provided anchor without breaking the artwork itself.
  return new Promise((resolve, reject) => {
    const analysisImage = new Image();
    analysisImage.crossOrigin = 'anonymous';
    analysisImage.onload = () => resolve(analysisImage);
    analysisImage.onerror = () => reject(new Error('Remote image does not allow canvas analysis.'));
    analysisImage.src = src;
  });
}

/**
 * Finds the least visually detailed image quadrant for automatic comic-text placement.
 *
 * Analysis is deliberately deferred to an idle callback/next task and performed on a tiny
 * 100x100 canvas. The score combines neighboring-pixel luminance and RGB differences (a
 * lightweight edge-density approximation), avoiding a heavy CV dependency or a full-size
 * canvas readback. The lowest score represents the quietest sky/wall/shadow area.
 *
 * This can reject when a remote image lacks CORS permission and therefore taints the canvas;
 * callers should retain the Director's `text_anchor` as their fallback.
 */
async function analyzeQuietQuadrant(imgElement: HTMLImageElement): Promise<QuietQuadrant> {
  const canvasSafeImage = await getCanvasSafeImage(imgElement);
  return scheduleOffMainTurn(() => {
    if (!canvasSafeImage.complete || canvasSafeImage.naturalWidth === 0 || canvasSafeImage.naturalHeight === 0) {
      throw new Error('Image must be loaded before smart placement analysis.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = ANALYSIS_SIZE;
    canvas.height = ANALYSIS_SIZE;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas 2D context is unavailable.');

    ctx.drawImage(canvasSafeImage, 0, 0, ANALYSIS_SIZE, ANALYSIS_SIZE);
    const { data } = ctx.getImageData(0, 0, ANALYSIS_SIZE, ANALYSIS_SIZE);
    const half = ANALYSIS_SIZE / 2;

    const quadrants: Array<{
      name: QuietQuadrant;
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    }> = [
      { name: 'top-left', x0: 0, y0: 0, x1: half, y1: half },
      { name: 'top-right', x0: half, y0: 0, x1: ANALYSIS_SIZE, y1: half },
      { name: 'bottom-left', x0: 0, y0: half, x1: half, y1: ANALYSIS_SIZE },
      { name: 'bottom-right', x0: half, y0: half, x1: ANALYSIS_SIZE, y1: ANALYSIS_SIZE },
    ];

    const pixelOffset = (x: number, y: number) => (y * ANALYSIS_SIZE + x) * 4;
    const edgeDifference = (a: number, b: number) => {
      const luminanceA = data[a] * 0.2126 + data[a + 1] * 0.7152 + data[a + 2] * 0.0722;
      const luminanceB = data[b] * 0.2126 + data[b + 1] * 0.7152 + data[b + 2] * 0.0722;
      const rgbDelta =
        Math.abs(data[a] - data[b])
        + Math.abs(data[a + 1] - data[b + 1])
        + Math.abs(data[a + 2] - data[b + 2]);
      return Math.abs(luminanceA - luminanceB) + rgbDelta * 0.18;
    };

    let quietest: QuietQuadrant = 'top-left';
    let lowestScore = Number.POSITIVE_INFINITY;

    for (const quadrant of quadrants) {
      let detail = 0;
      let samples = 0;
      for (let y = quadrant.y0; y < quadrant.y1 - 1; y += 2) {
        for (let x = quadrant.x0; x < quadrant.x1 - 1; x += 2) {
          const current = pixelOffset(x, y);
          detail += edgeDifference(current, pixelOffset(x + 1, y));
          detail += edgeDifference(current, pixelOffset(x, y + 1));
          samples += 2;
        }
      }
      const normalizedScore = samples > 0 ? detail / samples : detail;
      if (normalizedScore < lowestScore) {
        lowestScore = normalizedScore;
        quietest = quadrant.name;
      }
    }

    return quietest;
  });
}

/**
 * Hard fail-safe wrapper: analysis, CORS image cloning, and idle scheduling together get at
 * most 100ms. Every error/timeout resolves to bottom-center instead of rejecting, so smart
 * placement can never hold image-loaded UI state or leave a panel spinner running.
 */
export async function findQuietQuadrant(imgElement: HTMLImageElement): Promise<QuietQuadrant> {
  const timeout = new Promise<QuietQuadrant>((resolve) => {
    setTimeout(() => resolve(DEFAULT_QUADRANT), ANALYSIS_TIMEOUT_MS);
  });

  return Promise.race([analyzeQuietQuadrant(imgElement), timeout])
    .catch(() => DEFAULT_QUADRANT);
}
