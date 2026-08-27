# Validated Findings — Storyboarding and Layered Narrative Analogues

## Storyboarder.ai official public workflow

Source: **Storyboarder.ai — AI Storyboard Generator | From Script to Storyboard in Minutes**, accessed 2026-08-26, https://www.storyboarder.ai/

The public page documents a staged workflow: upload a script or describe a concept; derive a shot list; generate one storyboard image per shot; preserve recurring characters, locations, and objects; refine intermediate stages; optionally convert frames to video and an animatic. It also presents a 3D camera-angle tool that can orbit, pan, tilt, zoom, and reframe from an existing board without regenerating the whole shot.

**Technique shape for SynapticGM:** Treat accepted text as the source of a compact shot contract, not as a request for a whole page. A deterministic planner should select the eligible beat, shot role, roster, kit, place, camera family, and overlay-safe zone before art generation. Repair should be local: reframe, reprompt, or replace one panel while preserving accepted text and neighbouring panels. SynapticGM should borrow staged inspectability and local revision, not product claims of perfect visual locking.

**Cost and latency inference:** Shot-list construction and camera metadata are cheaper than image generation. Local panel replacement avoids re-spending on correct panels. Camera-reframing without image regeneration is only directly transferable if the hosted model or client compositor exposes a safe crop/reframe path; it must not be assumed from Storyboarder.ai's UX.

## Ren'Py official image-layer model

Source: **Ren'Py 8.5.4 Documentation — Displaying Images**, accessed 2026-08-26, https://www.renpy.org/doc/html/displaying_images.html

Ren'Py defines images and uses `show`, `scene`, and `hide` semantics to mutate screen state. An image name has a tag and optional attributes, such as a character plus place, time, or expression. Multiple ordered layers separate backgrounds/character sprites (`master`) from transient UI, screens, and overlays. The same display model supports static images, animations, colours, and other displayables. Transitions can be applied when scene state changes.

**Technique shape for SynapticGM:** Model low-cost comic presentation as deterministic state composition: a background or Memorable plate, zero or more approved character portraits/sprites keyed by stable entity IDs and equipment attributes, and separate ComicGrid/SpeechBubble/NarrativeText/ActionOverlay layers. Story text remains independent. Scene-state replacement prevents stale portraits from persisting after correction, and entity-tag semantics provide a natural cache key.

**Cost and latency inference:** Reusing cached backgrounds, portraits, and UI layers yields near-zero marginal image-model cost and immediate presentation. The main risk is state leakage: an old entity, weapon, wound, or place can remain visible unless a new accepted beat clears or replaces the relevant layer atomically.

## Confirmed implications

| Area | Documented public method | SynapticGM transfer | Guardrail |
|---|---|---|---|
| Beat-to-shot conversion | Script becomes a shot list before images | Compile accepted BeatSpec into a small deterministic shot contract | Planner cannot invent damage, roster, props, or outcomes |
| Local repair | Intermediate stages remain editable | Retry or repair one panel, not an entire turn or page | Preserve accepted text and capacity accounting |
| Camera exploration | Pan/tilt/zoom/reframe controls | Use bounded camera-family metadata and client crop only where technically supported | Do not assume hosted 3D-camera capability |
| Layered scene state | Backgrounds, tagged sprites, screens, and overlays are separate | Composite cached plates/portraits under existing lettering components | Clear stale layers on corrected or superseded beats |
| Attribute-based reuse | Image tags plus attributes select variants | Cache by entity ID, equipped kit, expression family, place ID, and lighting family | Art attributes never become story truth |
