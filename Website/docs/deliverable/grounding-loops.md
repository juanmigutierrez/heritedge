# Grounding Loops (one per task)

P2 leads, P5 reviews. Redraw diagrams in Figma; keep this file as the textual spec.

The grounding loop resolves **multimodal ambiguity** — not just out-of-scope questions. Every task must show at least three ambiguity sources and how the system resolves each.

## Task 1 — Conversational Heritage Guide

| Ambiguity source | Example | Resolution |
|---|---|---|
| **Referential** | User says "tell me more about this one" while no chip is selected | System asks "Did you mean Duomo, Galleria, or Palazzo?" as chips |
| **Temporal** | User asks "how did it look before?" with the timeline slider unset | System offers medieval / postwar as chips, explicitly referring to the slider |
| **Scope** | User asks about Brera or a non-Duomo topic | System acknowledges, states scope, suggests the closest in-scope topic |
| Low STT confidence | Web Speech returns confidence < 0.6 | Echo back transcript + "Is this what you said?" confirm button |

## Task 2 — AR Experience

| Ambiguity source | Example | Resolution |
|---|---|---|
| **Landmark ambiguity** | "Take me there" with multiple landmarks on screen | Highlight all landmarks, require tap |
| **Temporal** | "Show me how this looked before" in present-day view | Surface the period-switch dialog |
| **Unsupported command** | "Rotate 30 degrees" or other unhandled verb | Acknowledge, list supported commands as chips |
| Tracking failure | AR surface detection fails for > 5s | Fall back to `<model-viewer>` non-AR preview |

## Task 3 — Treasure Hunt

| Ambiguity source | Example | Resolution |
|---|---|---|
| **Referential** | Voice answer names an object not in current challenge | Confirm with photo of the target, ask to retry |
| **Vision confidence** | CV artifact recognition below threshold | Switch to multiple-choice fallback |
| **Voice confidence** | Noisy outdoor STT below threshold | Multiple-choice fallback + tap |
| Skip intent | "Skip" or "I don't know" | Reveal, award no points, continue |
