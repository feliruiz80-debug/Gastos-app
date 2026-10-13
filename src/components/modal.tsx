"use client";

import { useEffect, useRef, useState } from "react";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/body-lock";

type ModalProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function Modal({ title, onClose, children }: ModalProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const startX = useRef<number | null>(null);
  const active = useRef(false);
  const offsetRef = useRef(0);
  const [offsetY, setOffsetY] = useState(0);
  const [draggingUi, setDraggingUi] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const snapshot = lockBodyScroll();
    return () => {
      window.removeEventListener("keydown", onKey);
      unlockBodyScroll(snapshot);
    };
  }, [onClose]);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const canStart = (event: TouchEvent) => {
      const target = event.target as HTMLElement | null;
      const fromHandle = Boolean(target?.closest("[data-drag-handle]"));
      return fromHandle || sheet.scrollTop <= 0;
    };

    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 1 || !canStart(event)) return;
      startY.current = event.touches[0].clientY;
      startX.current = event.touches[0].clientX;
      active.current = true;
      setDraggingUi(true);
    };

    const onMove = (event: TouchEvent) => {
      if (!active.current || startY.current === null || startX.current === null) return;
      const y = event.touches[0].clientY;
      const x = event.touches[0].clientX;
      const dy = y - startY.current;
      const dx = x - startX.current;

      // Nunca deja mover el sheet de costado.
      if (Math.abs(dx) > 6 && Math.abs(dx) >= Math.abs(dy)) {
        event.preventDefault();
        return;
      }

      if (dy > 0) {
        event.preventDefault();
        offsetRef.current = dy;
        setOffsetY(dy);
      } else if (offsetRef.current !== 0) {
        offsetRef.current = 0;
        setOffsetY(0);
      }
    };

    const onEnd = () => {
      if (!active.current) return;
      active.current = false;
      setDraggingUi(false);
      const dy = offsetRef.current;
      offsetRef.current = 0;
      startY.current = null;
      startX.current = null;
      if (dy > 110) {
        setOffsetY(0);
        onClose();
        return;
      }
      setOffsetY(0);
    };

    sheet.addEventListener("touchstart", onStart, { passive: true });
    sheet.addEventListener("touchmove", onMove, { passive: false });
    sheet.addEventListener("touchend", onEnd);
    sheet.addEventListener("touchcancel", onEnd);
    return () => {
      sheet.removeEventListener("touchstart", onStart);
      sheet.removeEventListener("touchmove", onMove);
      sheet.removeEventListener("touchend", onEnd);
      sheet.removeEventListener("touchcancel", onEnd);
    };
  }, [onClose]);

  return (
    <div className="modal-root fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal-sheet glass max-h-[92vh] w-full overflow-y-auto overscroll-y-contain rounded-t-3xl p-5 sm:max-w-lg sm:rounded-3xl sm:p-6"
        style={{
          transform: offsetY > 0 ? `translate3d(0, ${offsetY}px, 0)` : undefined,
          transition: draggingUi ? "none" : "transform 220ms cubic-bezier(0.22, 1.2, 0.36, 1)",
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div data-drag-handle className="modal-handle mx-auto mb-4 sm:hidden" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
