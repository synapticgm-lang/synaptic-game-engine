import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_SCALE = 0.75;
const MAX_SCALE = 2.25;
const WHEEL_ZOOM_SENSITIVITY = 0.0015;
const STEP = 0.2;

function clampScale(value: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

/**
 * Pinch-to-zoom (touch) + Ctrl/Cmd+scroll-wheel zoom (desktop/trackpad) for the comic panel
 * viewport. No external gesture library — both interactions are cheap to hand-roll and this
 * keeps the bundle lean.
 *
 * Native (non-passive) listeners are required here: React attaches `onWheel`/`onTouchMove`
 * JSX handlers as passive by default, so `event.preventDefault()` inside them is a silent
 * no-op — the page would still scroll/zoom natively underneath. Attaching via
 * `addEventListener(..., { passive: false })` in an effect is what actually lets us intercept
 * the gesture.
 *
 * Plain (non-Ctrl) wheel/scroll and single-finger touch are deliberately left alone so normal
 * page scrolling through a long comic session is never hijacked.
 */
export function useZoomGesture() {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef(1);
  // Gesture listeners are bound once (see effect below) and read the *current* scale via this
  // ref rather than the `scale` state directly, which would otherwise be captured stale from
  // whatever it was when the effect first ran.
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  const zoomIn = useCallback(() => setScale((s) => clampScale(s + STEP)), []);
  const zoomOut = useCallback(() => setScale((s) => clampScale(s - STEP)), []);
  const reset = useCallback(() => setScale(1), []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Trackpad pinch gestures arrive as `wheel` events with `ctrlKey: true` in every major
      // browser; explicit Ctrl/Cmd+scroll is the desktop-mouse equivalent. Plain scroll passes
      // through untouched so reading a long session still works normally.
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setScale((s) => clampScale(s - e.deltaY * WHEEL_ZOOM_SENSITIVITY));
    };

    const distance = (touches: TouchList) => {
      const [a, b] = [touches[0], touches[1]];
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      pinchStartDistanceRef.current = distance(e.touches);
      pinchStartScaleRef.current = scaleRef.current;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || pinchStartDistanceRef.current == null) return;
      e.preventDefault();
      const ratio = distance(e.touches) / pinchStartDistanceRef.current;
      setScale(clampScale(pinchStartScaleRef.current * ratio));
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchStartDistanceRef.current = null;
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    el.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
    // `scale` is read via `scaleRef` at gesture-start time, not captured in these closures —
    // re-binding listeners on every scale change would only add churn.
  }, []);

  return { scale, containerRef, zoomIn, zoomOut, reset, isZoomed: scale !== 1 };
}
