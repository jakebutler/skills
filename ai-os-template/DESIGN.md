# Design System

## Intent

A warm, paper-like operations manual for focused desktop review, with enough structure
for scanning but no decorative dashboard chrome. The walkthrough is a product surface:
interaction exists to reveal system behavior, not to entertain.

## Theme

Light by default for an engineer reviewing architecture and routing decisions on a
large monitor in a normally lit workspace. Neutrals are lightly warmed; status colors
are muted and always paired with text or icons.

## Color

- Canvas: `oklch(0.976 0.007 82)`
- Surface: `oklch(0.992 0.004 82)`
- Strong ink: `oklch(0.245 0.012 65)`
- Muted ink: `oklch(0.48 0.015 65)`
- Rule: `oklch(0.875 0.014 75)`
- Action accent: `oklch(0.47 0.09 50)`
- Healthy: `oklch(0.48 0.075 142)`
- Limited: `oklch(0.58 0.095 78)`
- Unavailable: `oklch(0.48 0.095 25)`
- Information: `oklch(0.48 0.07 245)`

## Typography

Use the system sans stack for interface and prose. Use the system monospace stack for
model IDs, paths, and packets. Body copy is 15 to 16 pixels with a 1.55 line height and
a maximum reading width of 72 characters. Headings use weight and scale, not display
type.

## Layout

- Sticky table of contents on wide screens; compact horizontal section index on small
  screens.
- Main reading column capped near 960 pixels.
- Use tables for exact mappings, ordered flows for lifecycle, and disclosure controls
  for evidence or historical detail.
- Avoid wrapping every section in a card. Reserve contained surfaces for interactive
  controls, selected route output, and status messages.

## Components

- Segmented selectors for task type and complexity.
- Provider availability controls with explicit Available, Limited, and Unavailable
  labels.
- Route plan as an ordered sequence: orchestrate, implement, review, verify, report.
- Status ledger entries include phase, route, state, evidence path, and next action.
- Tables have sticky or visually distinct headers and horizontal overflow on narrow
  screens.

## Motion

Use 160 to 220 millisecond opacity and transform transitions for state changes. Honor
`prefers-reduced-motion`. No entrance choreography or decorative animation.

## Interaction states

Every control needs default, hover, focus-visible, selected, and disabled states. Route
recalculation announces its result through an `aria-live` region. Provider state and
fallback changes must be understandable without color.
