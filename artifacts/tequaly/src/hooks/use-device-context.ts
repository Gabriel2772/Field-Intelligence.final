import * as React from "react";

export type ViewportClass =
  | "compact"
  | "mobile"
  | "tablet"
  | "desktop"
  | "wide";
export type PointerType = "coarse" | "fine";
export type DisplayMode = "browser" | "standalone";
export type Orientation = "portrait" | "landscape";

export interface DeviceContext {
  viewportClass: ViewportClass;
  pointerType: PointerType;
  displayMode: DisplayMode;
  orientation: Orientation;
  width: number;
  height: number;
}

function readDeviceContext(): DeviceContext {
  const width = window.visualViewport?.width ?? window.innerWidth;
  const height = window.visualViewport?.height ?? window.innerHeight;
  const viewportClass: ViewportClass =
    width < 380 ? "compact" :
    width < 640 ? "mobile" :
    width < 1024 ? "tablet" :
    width < 1600 ? "desktop" : "wide";

  return {
    viewportClass,
    pointerType: window.matchMedia("(pointer: coarse)").matches ? "coarse" : "fine",
    displayMode: window.matchMedia("(display-mode: standalone)").matches ? "standalone" : "browser",
    orientation: width > height ? "landscape" : "portrait",
    width,
    height,
  };
}

const initial: DeviceContext = {
  viewportClass: "desktop",
  pointerType: "fine",
  displayMode: "browser",
  orientation: "landscape",
  width: 1280,
  height: 720,
};

export function useDeviceContext(): DeviceContext {
  const [context, setContext] = React.useState<DeviceContext>(initial);

  React.useEffect(() => {
    let frame = 0;
    const update = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => setContext(readDeviceContext()));
    };

    update();
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("orientationchange", update, { passive: true });
    window.visualViewport?.addEventListener("resize", update, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  return context;
}
