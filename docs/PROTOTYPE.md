# Paperbacks — first playable prototype

## Architecture

Start as a browser game, then package the same renderer with Electron once the interaction loop is worth shipping. Keep the simulation independent from the UI so the customer-search rules can be tested and tuned without tying them to React.

- `src/game/types.ts`: plain domain types for books, customers, and the shop state.
- `src/game/catalog.ts`: sample content and authored starting inventory.
- `src/game/simulation.ts`: pure state transitions for stocking, customer searches, opening, and day changes.
- `src/ui/App.tsx`: event wiring and scene composition; later replace the CSS scene with a canvas/SVG scene without rewriting game rules.
- `src/ui/styles.css`: graybox-inspired visual language and responsive layout.

For the next phase, keep one authoritative `GameState` and advance it through explicit actions. Use stable IDs for content and save a versioned JSON snapshot through a small persistence adapter (`localStorage` for browser prototype, Electron filesystem save adapter later). Avoid adding a backend or ECS until simulation complexity demands it. For hand-painted assets, use a manifest keyed by semantic asset IDs and keep dimensions/anchor points consistent; the sprite renderer can swap an image for each current geometric placeholder.

## First playable loop

1. Drag books between the shelf and floor pile; double-click a book to inspect its cover, title, author, and genre.
2. Open the store. Up to three readers arrive with incomplete clues.
3. Select a reader, then click a shelf book to have them examine it. Matching books sell; misses reveal genre-adjacent thinking.
4. Close the shop and use the till for a shelf upgrade. End the day to start again.

The prototype is deliberately forgiving: there is no loss state, and inventory is replenished as the initial catalog for repeated interaction. Search currently responds to the player choosing a shelf position rather than autonomous time-based movement; this makes the core inference legible while the arrangement mechanic is evaluated.

## Asset log

Graybox inventory to hand-paint and scan, with geometric or CSS stand-ins until then:

| Asset ID | Description | State |
|---|---|---|
| `book.spine` | Colored spine, title glyphs, small publisher mark | CSS graybox |
| `book.cover` | Front cover block with title/author placement | CSS graybox |
| `furniture.shelf` | Shelf boards, uprights, feet | CSS graybox |
| `furniture.counter` | Checkout counter and register | CSS graybox |
| `prop.register` | Register body, display, drawer | CSS graybox |
| `architecture.wall` | Paper wall, trim, small wall sign | CSS graybox |
| `architecture.floor` | Floor line and plank seams | CSS graybox |
| `architecture.window` | Window crossbars, sill, painted light | CSS graybox |
| `character.heads` | Four head/hair silhouettes | CSS graybox |
| `character.bodies` | Four body silhouettes/clothing shapes | CSS graybox |
| `character.idle` | Customer standing and browsing | CSS graybox |
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
