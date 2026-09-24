---
name: Manabi
description: A calm, practical workspace for independent Japanese and JLPT study.
colors:
  harbor-ink: "#1c456b"
  notebook-coral: "#e5593f"
  vermilion: "#e0231c"
  night-ink: "#05070a"
  night-raised: "#0a0e12"
  bone: "#dfe7e0"
  bone-dim: "#aab4ad"
  mist: "#f5f7f9"
  ink: "#1b3043"
  white: "#ffffff"
  mist-panel: "#eef2f6"
  pale-blue: "#e8eef5"
  muted-text: "#5d7082"
  border: "#dce4eb"
  focus-blue: "#6e9cc5"
  error-red: "#b93e37"
  study-link: "#315b85"
  study-tint: "#eef5fb"
typography:
  headline:
    fontFamily: "Arial, Noto Sans JP, Yu Gothic, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Arial, Noto Sans JP, Yu Gothic, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Arial, Noto Sans JP, Yu Gothic, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 800
    letterSpacing: "0.11em"
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.harbor-ink}"
    textColor: "{colors.white}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
    width: "100%"
  card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "24px"
  level-badge:
    backgroundColor: "{colors.pale-blue}"
    textColor: "{colors.study-link}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  navigation-link:
    backgroundColor: "{colors.white}"
    textColor: "{colors.harbor-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  practice-option:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
    height: "62px"
---

# Design System: Manabi

## Overview

**Creative North Star: “A Clear Study Desk in the Lantern Light”**

Manabi is a calm, practical workspace for Vietnamese-speaking independent learners studying Japanese and preparing for the JLPT. `/` is the approved visual reference for Manabi's expressive side: deep night ink, sage-white lettering, vermilion points of light, Japanese cinematic atmosphere, layered imagery, and deliberate transitions. Carry those qualities into learner pages as compact surfaces, precise contrast, restrained color, and purposeful motion.

Learner pages remain task-first. Pair a dark, quiet frame with light Mist and White reading surfaces so questions and explanations are immediately legible. Harbor Ink anchors actions and links; Notebook Coral and Vermilion are brief identity, active-navigation, or progress cues. Japanese study text receives a clear typographic step above Vietnamese guidance without becoming display type. Keep the landing page's full-screen Three.js scene and oversized wordmark on `/`; practice, lessons, and documents inherit its visual language, never its composition or effects.

**Key Characteristics:**
- Calm, clear, and practical.
- Dark night-ink framing against Mist and White task surfaces.
- Harbor Ink establishes action hierarchy; coral and vermilion stay small cues.
- Japanese examples receive room to breathe within Vietnamese-language guidance.
- Cinematic Japanese mood comes from atmosphere, image treatment, and transitions; learner controls stay familiar and quiet.

## Colors

The palette pairs deep blue with cool, soft neutrals, night ink, sage-white text, and a restrained warm accent. Learner screens use dark surfaces to frame a task and light surfaces to carry reading and interaction; do not force one theme across the whole viewport.

### Primary
- **Harbor Ink**: The main action and brand color. Use it for primary buttons, active learning navigation, and the Manabi wordmark.

### Secondary
- **Notebook Coral**: A warm study cue used sparingly for the wordmark mark, active navigation, and progress emphasis.
- **Vermilion**: The sharper Kage reference red. Use it for small current-state marks and points of light, not large buttons or answer surfaces.
- **Pale Blue**: A quiet selection and supporting surface for level labels, hints, and secondary emphasis.
- **Study Link Blue**: A readable link and metadata color for source references and lesson details.
- **Study Tint**: A pale blue surface for selected controls, hover states, and quiet learner notices.

### Neutral
- **Mist**: The cool page canvas that separates the study workspace from the browser frame.
- **White**: The main surface for lesson panels, cards, and popovers.
- **Ink**: Primary text with a blue undertone.
- **Muted Text**: Supporting copy, descriptions, and metadata.
- **Mist Panel**: A low-contrast surface for secondary panels and quiet state backgrounds.
- **Border**: Fine outlines and dividers between sections and controls.
- **Focus Blue**: Keyboard focus ring and focused-control border.
- **Night Ink / Night Raised**: Deep charcoal-green surfaces for the compact brand frame, headings, and occasional dark section breaks.
- **Bone / Bone Dim**: Soft sage-white text on night surfaces. Keep body text at readable contrast and prefer Bone over pure white for large areas.

### Named Rules
**The Coral Cue Rule.** Keep Notebook Coral to small identity or progress cues. Use Harbor Ink for primary actions and study links.

**The Lantern Contrast Rule.** Let a dark Japanese-inspired frame lead into light work surfaces; keep answer text and explanations on the lighter surface.

## Typography

**Display Font:** Arial (with Noto Sans JP, Yu Gothic, and sans-serif fallbacks)
**Body Font:** Arial (with Noto Sans JP, Yu Gothic, and sans-serif fallbacks)
**Label Font:** The same family, in a compact uppercase treatment where the eyebrow style is used.

**Character:** A familiar sans-serif keeps instructions and controls direct. Japanese text uses the same system stack so examples sit naturally beside Vietnamese explanations. The landing's custom wordmark and display scale belong to `/`, not task UI.

### Hierarchy
- **Headline** (600, 28px; 32px at medium widths, tight line-height): Page headings and section titles.
- **Title** (600, 18px, snug line-height): Lesson and question titles.
- **Body** (400, 16px, 28px line-height): Instructions and explanations; keep long reading copy near 65–70ch.
- **Japanese study text** (500, 24px; about 26px at medium widths, 1.9 line-height): Give practice questions a distinct, readable block.
- **Label** (800, about 13px, 0.11em tracking, uppercase): Small eyebrow labels only; do not use this treatment for ordinary navigation.
- **Landing display**: The Kage-derived cinematic type scale is reserved for `/`; learner headings remain compact and predictable.

### Named Rules
**The Study-First Type Rule.** Set Japanese study text apart through size and spacing while keeping the surrounding Vietnamese explanation easy to find.

## Layout

Use a centered, single-column learning workspace on small screens. The practice page caps its main reading area at 896px, while materials and community pages use a wider 1200px content frame; the shared header can extend to 1420px. Keep mobile side padding near 20px and increase it to 32–40px at wider breakpoints. Let document forms stack on narrow screens, then place the upload and document list beside each other at large widths. Answer options remain one column on phones and become a two-column grid from the small breakpoint. Keep the landing's spacious section rhythm in shorter intervals: an 8px-based scale, 16px gaps inside task groups, 24px panel padding, and 32px between major learning sections. Separate sections with quiet rules, tone changes, and breathing room, not cinematic scroll choreography.

## Elevation & Depth

Depth is lightly layered. Dark framing surfaces set the Japanese night atmosphere; Mist page backgrounds and White panels carry study work. Images, when a surface needs them, use considered object positioning, a cool-dark grade with restrained warm highlights, and subtle edge or tonal blending so they sit within the environment. Keep image detail away from question copy. The practice question panel stays flat, while browsable community lessons deepen on hover. Use a restrained lift or border change without moving task content.

### Shadow Vocabulary
- **Control edge** (`0 1px 2px 0 rgb(0 0 0 / 0.05)`): Small resting shadow on outline buttons and text fields.
- **Card rest** (`0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`): Light separation on the shared Card primitive.
- **Browse hover** (`0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): Hover depth for community lesson links.

### Named Rules
**The Quiet Rest Rule.** Keep the practice surface close to the page; reserve stronger depth for items that invite browsing.

## Motion & Transitions

On `/`, preserve the authored motion language: slow environmental movement, restrained parallax, scene-aware fades, and chapter transitions that follow the scroll. These effects are part of the landing composition and stay on that route.

In learner workflows, motion confirms a local state change. Use brief 150–250ms color, border, and shadow transitions for selection, focus, feedback, and browsing hover. Reveal feedback in place; do not animate the learner through a cinematic sequence or delay the next action. Use spacing, fine rules, and subtle surface changes to mark transitions between learning sections. Respect reduced-motion preferences.

## Shapes

Buttons and fields use gently rounded corners (10px). Content panels use larger, soft corners (12–16px); badges and compact account labels use pill shapes. Fine borders carry most of the structure. Keep learning text blocks rectangular and spacious rather than enclosing each paragraph in its own card. Cinematic masks and scene framing are reserved for imagery, never answer controls.

## Components

### Buttons
- **Primary:** Harbor Ink fill, white text, medium weight, 36px default height, and 16px horizontal padding. Hover deepens the blue.
- **Outline:** White or transparent surface with a blue-gray border and a small resting shadow. Hover shifts to a pale blue surface.
- **Focus / disabled:** A visible 3px focus ring; disabled controls reduce opacity and stop pointer input.

### Chips
- **Level badge:** Pale Blue background, Study Link Blue text, compact padding, and a pill silhouette. Keep the JLPT level readable at a glance.

### Cards / Containers
- **Corner Style:** 16px on lesson and document panels.
- **Background:** White against Mist, with a fine border.
- **Shadow Strategy:** Flat practice panels; light shared-card shadow; deeper hover depth only for browsable community lessons.
- **Internal Padding:** 20–28px depending on screen width and content density.

### Inputs / Fields
- **Style:** Full-width field with a transparent or white fill, fine Border stroke, 10px corners, and compact vertical padding.
- **Focus:** Focus Blue border and a visible 3px ring.
- **Disabled / invalid:** Disabled fields lower opacity; invalid state uses the semantic error color and ring.

### Navigation
- **Style:** A compact Night Ink header with a fine divider and Bone text can frame the light study workspace. Keep navigation labels direct and familiar; use a fine underline or one small Coral/Vermilion marker for the current route. On narrow screens, let links wrap rather than compressing their labels.

The shared `ManabiBrand` component owns the linked wordmark and coral mark. Use its compact form in secondary route headers and its full form in the main learner header; an inverse treatment may sit on Night Ink. Use the `notebook-coral`, `study-link`, and `study-tint` theme utilities for brand emphasis, study links, and pale interactive selection surfaces instead of repeating color literals.

### Practice Options
- **Style:** Full-width answer controls with a minimum 62px height, 16px corners, and left-aligned Japanese answer text.
- **State:** Hover adds a pale surface and slightly stronger border. Selection gets a clear border and neutral fill. After submission, distinguish correct and incorrect choices with separate muted status colors and an explanation block.
- **Motion:** Keep state changes to roughly 150–250ms. Motion confirms selection, submission, or progress; it does not delay the next answer.

### Progress
- **Style:** A slim rounded track in a pale blue-gray with a Harbor Ink or Notebook Coral fill depending on the established screen treatment. Pair the bar with a readable progress label; do not rely on color alone.

## Do's and Don'ts

### Do:
- **Do** use Harbor Ink for primary actions and Notebook Coral for small brand or progress cues.
- **Do** use `/` as the visual north star for contrast, Japanese atmosphere, image grading, navigation detail, and section rhythm.
- **Do** keep Vietnamese guidance and Japanese study text visually connected and easy to distinguish.
- **Do** use clear borders and Mist-to-White contrast to define work areas.
- **Do** preserve honest visual differences between sample, draft, confirmed, and approved learning content.
- **Do** preserve the dark-frame/light-task contrast while keeping answers and explanations on calm, readable surfaces.
- **Do** keep motion brief, responsive, and tied to learner input.

### Don't:
- **Don't** spread Notebook Coral across large surfaces or use it as the default action color.
- **Don't** rely on color alone for answer correctness or content review state.
- **Don't** copy the landing page's full Three.js scene, oversized hero type, or cinematic scroll effects into learner flows.
- **Don't** place decorative images or overlays behind question text, answers, or explanations.
- **Don't** add shadows to every panel; use depth only where a control or browsing choice needs it.
