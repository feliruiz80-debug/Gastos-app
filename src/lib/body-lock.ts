export type BodyLockSnapshot = {
  scrollY: number;
  htmlOverflow: string;
  body: {
    overflow: string;
    position: string;
    top: string;
    left: string;
    right: string;
    width: string;
    touchAction: string;
    overscrollBehaviorX: string;
  };
};

export function lockBodyScroll(): BodyLockSnapshot {
  const html = document.documentElement;
  const body = document.body;
  const scrollY = window.scrollY;
  const snapshot: BodyLockSnapshot = {
    scrollY,
    htmlOverflow: html.style.overflow,
    body: {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      touchAction: body.style.touchAction,
      overscrollBehaviorX: body.style.overscrollBehaviorX,
    },
  };

  html.style.overflow = "hidden";
  body.style.overflow = "hidden";
  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.touchAction = "pan-y";
  body.style.overscrollBehaviorX = "none";
  return snapshot;
}

export function unlockBodyScroll(snapshot: BodyLockSnapshot) {
  const html = document.documentElement;
  const body = document.body;
  html.style.overflow = snapshot.htmlOverflow;
  body.style.overflow = snapshot.body.overflow;
  body.style.position = snapshot.body.position;
  body.style.top = snapshot.body.top;
  body.style.left = snapshot.body.left;
  body.style.right = snapshot.body.right;
  body.style.width = snapshot.body.width;
  body.style.touchAction = snapshot.body.touchAction;
  body.style.overscrollBehaviorX = snapshot.body.overscrollBehaviorX;
  window.scrollTo(0, snapshot.scrollY);
}
