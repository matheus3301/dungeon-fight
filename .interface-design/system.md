# Guilda dos Improváveis

Domain: adventuring party, stone dungeon, communal treasure, dice target, torches, epic miss, tavern.
Natural color world: charcoal slate, old brass, torch amber, moss, parchment, dried wine, die colors.
Signature: the circular throwing target is the dominant surface; heroes stand around it and the boss sits at its far edge. Die selection and aim are part of the tabletop, not a metrics dashboard.
Defaults avoided: dashboard card grids → an open gaming table; decorative gradients → stone/wood pixel textures; full-page game canvas → accessible HTML controls and text around a vector board.

Intent: friends on separate computers choosing together and laughing at physical-skill attempts.
Hierarchy: board first, enemy/active player second, team and log secondary.
Palette: ink #141522, stone #20202e, raised stone #292938, parchment #e8e0cf, ash #aaa5a0, brass #d1b06e, embers #dc7945. Red/green/blue identify dice, always with text.
Depth: surface color shifts, with a fine brass rim only on target and active decisions.
Surfaces: warm near-black background, quiet raised panels. No SaaS gradients.
Typography: Georgia for expressive editorial headings, system sans for comfortable long reads; pixel images retain crisp edges. Titles 32–52px, body14px, labels11px. Local fonts only.
Spacing:4px base; control padding12/16; section gap24; table interior24. Buttons min44px high. Radius4px controls,8px panels.
Components: native buttons/input/select/dialog. Shared SectionTitle, Sprite, Die controls; readable focus rings, errors, disabled, waiting, network status. Reduced motion honored.

## Version 0.2 adventure scenes

The pixel world is the focal surface: village, crossroads and distinct room compositions. Combat keeps the world on the left and a compact target/timing console on the right at desktop widths; mobile stacks them. Party health and the journal remain secondary. World viewport has an explicit width of 100% and min-width 0 so aspect ratio plus minimum height cannot enlarge a clipped child.

WorldStage presents server snapshots; it never mutates game rules. Enemy introduction lasts 2.6 seconds with a skip button. Throw flight lasts 1.35 seconds and the attack/counterattack beat 2.05 seconds. Damage numbers and short run frames belong to the actors. Reduced motion removes movement, and gameplay also offers a throw without a hold gesture. Chat bubbles carry the real speaker identity; automatic leader/turn hints are separate from player messages.

Controls keep the existing brass/stone palette, 4px spacing base, native buttons and 44px minimum targets. Hold-to-release meter uses a brass precision band; the landing indicator is an approximate region, never a promised result. Map actors retain crisp 0x72 idle/run sprites; original SVG compositions use existing CC0 tiles. No proprietary Pokémon art is part of this system.
