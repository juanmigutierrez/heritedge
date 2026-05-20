import { haptic } from "./shared";

interface CenteringArrowProps {
  onPress: () => void;
}

export function CenteringArrow({ onPress }: CenteringArrowProps) {
  return (
    <button
      onClick={() => { haptic(12); onPress(); }}
      aria-label="Re-centre view"
      title="Re-centre view"
      className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.4" />
        <line x1="9" y1="1" x2="9" y2="5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="9" y1="13" x2="9" y2="17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="1" y1="9" x2="5" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="13" y1="9" x2="17" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </button>
  );
}
