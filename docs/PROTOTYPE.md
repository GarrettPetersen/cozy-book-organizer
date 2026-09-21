# Paperbacks — first playable prototype

## Architecture

Start as a browser game, then package the same renderer with Electron or Tauri once the interaction loop is worth shipping. Keep the simulation independent from the renderer so customer-search rules can be tested and tuned without tying them to Phaser.

- `src/game/types.ts`: plain domain types for books, customers, and shop state.
- `src/game/catalog.ts`: sample content and authored starting inventory.
- `src/game/simulation.ts`: pure state transitions for stocking, customer searches, opening, and day changes.
- `src/scenes/BookstoreScene.ts`: Phaser scene composition, Matter rigid bodies, packed shelf rows, unified mouse/touch input, and cover inspection.
- `src/main.ts`: renderer, physics, and responsive scaling configuration.
- `src/ui/styles.css`: canvas host sizing only; scene visuals belong in Phaser so every platform uses one coordinate system.

The scene uses a fixed 1000 × 650 game world and scales it to the browser. This keeps physics deterministic and gives future scanned ink assets stable anchor points. Mobile landscape is the primary phone layout; portrait preserves the full room with letterboxing. Matter bodies drive loose books. Shelved books keep a canonical order and persistent gaps, while a damped shelf simulation gives each spine an angle and angular velocity. Stable books can stand unsupported; end books can slide their bottoms outward and lean back onto a neighbor. Adding support changes their equilibrium so they settle upright again. Rotated-corner bounds keep every book above its shelf board.

For the next phase, keep one authoritative `GameState` and advance it through explicit actions. Use stable IDs for content and save a versioned JSON snapshot through a small persistence adapter (`localStorage` for browser prototype, Electron filesystem save adapter later). Avoid adding a backend or ECS until simulation complexity demands it. For hand-painted assets, use a manifest keyed by semantic asset IDs and keep dimensions/anchor points consistent; the sprite renderer can swap an image for each current geometric placeholder.

## Current interaction slice

1. Loose books fall, collide, rotate, and settle into a pile as Matter rigid bodies.
2. Drag a book onto a shelf row to insert it among the packed spines; drag it out again to restore gravity and rigid-body physics.
3. Double-click or double-tap any book to inspect its front cover, then click the cover close mark or white backdrop to return.

The pure customer-search and day-state transitions remain in `src/game/simulation.ts`, but the rebuilt scene does not yet connect them to characters. The next gameplay layer should let NPC systems request scene actions through a small adapter instead of putting search logic inside the Phaser scene.

## Asset log

Graybox inventory to hand-paint and scan, with geometric or CSS stand-ins until then:

| Asset ID | Description | State |
|---|---|---|
| `book.spine` | Colored spine and title glyphs | Phaser graybox |
| `book.cover` | Front cover block and title placement | Phaser graybox |
| `furniture.shelf` | Shelf boards, uprights, feet | Phaser graybox |
| `furniture.counter` | Checkout counter and register | Phaser graybox |
| `prop.register` | Register body, display, drawer | Phaser graybox |
| `architecture.wall` | Paper wall and room outline | Phaser graybox |
| `architecture.floor` | Floor line | Phaser graybox |
| `character.heads` | Clerk and customer head silhouettes | Phaser graybox |
| `character.bodies` | Clerk and customer body silhouettes | Phaser graybox |
| `character.idle` | Customer standing pose | Phaser graybox |
| `character.walk` | Customer moving between shelf and door | Not built |
| `character.examine` | Customer holding/reading a book | Not built |
| `character.checkout` | Cashier scanning a book | Not built |
| `architecture.staircase` | Staircase to upper floor | Not built |
| `prop.coffee_bar` | Coffee counter, cups, kettle | Not built |
| `prop.reading_area` | Chair, lamp, side table | Not built |
| `character.cat` | Cat loaf, sit, stretch | Not built |
| `line.ink` | Scanned straight ink strokes for shelves and trim | Not built |
| `ui.thought_bubble` | Thought bubble with clue icon/text | CSS graybox |

## Naming notes (early scan, not legal clearance)

A quick Steam search shows several crowded, descriptive names and close category neighbors: *Bookshop Simulator*, *Shelf by Shelf: Bookstore Simulator*, and *Tiny Bookshop*. Avoid names built only from “tiny/cozy/bookshop/simulator” because they are hard to distinguish in search. Working directions: **Paperbacks** (memorable but broad/common word), **Shelf Life** (strong organizing double meaning, likely crowded across media), **The Little Secondhand** (distinctive mood, long), **Found Between the Pages** (warm but generic), or **A Place for Every Book** (clear organizing hook). Keep “Paperbacks” as the prototype label, not a locked title. Search Steam, storefronts, domains, and relevant trademark databases before committing. Steam’s current Content Survey describes generative-AI disclosure around AI-created content shipped for players (including art, sound, narrative, or localization) and live-generated content; it says efficiency tooling is not the focus. Grayboxing itself does not guarantee a particular survey response, so retain an accurate record of any AI-assisted player-facing content and answer from the shipped build. [Steamworks Content Survey](https://partner.steamgames.com/doc/gettingstarted/contentsurvey).

## Community approach

For r/CozyGamers, recent self-promotion threads state one self-promotion comment per week and developer posts no more than once every 30 days, with cozy-only content. Check current rules before each post. Lead with a useful, visual devlog question (for example: “Which shelf arrangement would you guess from these three covers?”), share a short clip of organizing/search inference, and respond to feedback. Avoid treating the subreddit as an ad channel; use its weekly thread and make occasional standalone posts about a concrete design problem.
