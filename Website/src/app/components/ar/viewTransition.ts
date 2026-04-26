import { flushSync } from "react-dom";

interface ViewTransition {
  ready: Promise<void>;
  finished: Promise<void>;
  updateCallbackDone: Promise<void>;
}

export function startViewTransition(run: () => void) {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void | Promise<void>) => ViewTransition;
  };
  if (typeof doc.startViewTransition === "function") {
    // eslint-disable-next-line no-console
    console.log("[VT] start");
    const t = doc.startViewTransition(() => {
      flushSync(() => run());
      // eslint-disable-next-line no-console
      console.log("[VT] callback done — vt names on page:", Array.from(document.querySelectorAll<HTMLElement>("[data-vt-name]")).map((el) => el.dataset.vtName));
    });
    t.ready.then(
      // eslint-disable-next-line no-console
      () => console.log("[VT] ready"),
      // eslint-disable-next-line no-console
      (e) => console.warn("[VT] ready rejected:", e)
    );
    t.finished.then(
      // eslint-disable-next-line no-console
      () => console.log("[VT] finished")
    );
  } else {
    // eslint-disable-next-line no-console
    console.log("[VT] not supported, plain navigate");
    run();
  }
}

export const landmarkVT = (id: string) => `landmark-${id}`;
