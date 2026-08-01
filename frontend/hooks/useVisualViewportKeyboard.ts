import { useEffect, useState } from "react";

const KEYBOARD_COVERED_THRESHOLD_PX = 120;

/**
 * Detects when the on-screen keyboard is open via visualViewport resize.
 * Used to move the payment-details CTA inline so it stays above the keyboard.
 */
export function useVisualViewportKeyboard(): boolean {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) {
      return;
    }

    const onResize = () => {
      const covered = window.innerHeight - vv.height;
      setKeyboardOpen(covered > KEYBOARD_COVERED_THRESHOLD_PX);
    };

    onResize();
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  return keyboardOpen;
}
