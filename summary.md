# Project Summary - COMP4010 Project 2

## Project Title
"The Evolution of Human Chess Thought in the Age of AI"

## What It Is
COMP4010 Data Visualization project at VinUniversity. Investigates how AI breakthroughs (AlphaZero 2017, Stockfish NNUE 2020) reshaped human chess playing patterns using Lichess game data across 4 time periods and 6 ELO brackets.

## Repository
https://github.com/duongphamminhdung/COMP4010_Project_2
GitHub Pages: https://duongphamminhdung.github.io/COMP4010_Project_2/

## Current State

### Data Collected (re-run June 2026)
- pre-ai: 49,998 games
- early-post-ai: 49,998 games
- nnue-era: 49,998 games
- modern: 49,998 games
- Total: 199,992 games, evenly balanced across all 24 cells

### Notebooks
- `notebooks/01_dataset_preprocessing.ipynb` -- Two-phase approach: Phase 1 fast-scans PGN for '%eval' games, buckets by ELO/period. Phase 2 full python-chess parse of ~200k games. Outputs 5 CSVs to Google Drive.
- `notebooks/02_visualization.ipynb` -- Loads CSVs, creates in-notebook Plotly/Matplotlib visualizations.
- `notebooks/generate_frontend_data.py` -- Standalone script to aggregate raw CSVs into frontend-ready files. Run locally: `python notebooks/generate_frontend_data.py`. Outputs to `frontend/public/data/`.

### Frontend (`frontend/`)
- Vite + React + Tailwind CSS v3 + D3.js + Recharts
- Single-page scrollable dark theme (chess.com-inspired brown/green)
- Google Fonts: Cormorant Garamond (headings), DM Sans (body)
- Frosted glass cards with backdrop-blur
- Uses REAL DATA loaded from `public/data/`
- 8 sections: 7 visualization + 1 discussion, plus EraTimeline context cards
- Deployed to GitHub Pages via `gh-pages` branch

### Frontend Components
```
src/
  App.jsx               - Main layout, orchestrates all 8 sections + discussion
  main.jsx              - Entry point
  index.css             - Tailwind + chess.com brown/green theme globals
  data/
    mockData.js          - Fallback mock datasets
    dataLoader.js        - Fetches real CSV/JSON from public/data/, falls back to mock
  components/
    Navbar.jsx           - Fixed top nav, frosted glass on scroll, links to all 7 viz sections
    Hero.jsx             - Full viewport hero (100svh) with animated chess pieces
    EraTimeline.jsx      - 4 era context cards + breakpoint badges (AlphaZero 2017, NNUE 2020)
    Section.jsx          - Reusable wrapper: scroll-reveal + glass card + notes grid (array of {label, text})
    Footer.jsx           - Credits
    OpeningTree.jsx      - D3 sunburst partition chart (hero viz, period toggle, mini chessboard center)
    OpeningRevolution.jsx - Recharts LineChart (top 5 openings over time, ELO 1500+, connectNulls, ranking cards)
    OpeningSimulator.jsx - Interactive chess board (chess.js): 8 openings, play/pause/step, progress bar
    MaterialCurve.jsx    - Recharts LineChart (sacrifice rate across eras, ELO 1500+, connected dots)
    BlunderHeatmap.jsx   - D3 SVG heatmap (ELO x period) with change badges sidebar
    ChessBoard.jsx       - Reusable 8x8 board with heatmap. Exports BOARD_LIGHT, BOARD_DARK, HEATMAP_VIZ_HEIGHT, parseSquare()
    PieceSquareMap.jsx   - 3-column: heatmap + KPI sidebar + explanation text (piece selector)
    GameLength.jsx       - Dual line chart: full distribution + zoom panel (ply 70-130)
```

### Color Palette (chess.com-inspired brown/green)
```
Primary green:   #81B64C
Dark bg:         #1A1A1A
Surface:         #262626
Card:            #312E2B (warm brown, frosted glass)
Border:          #3D3B38
Text primary:    #EEEEEE
Text secondary:  #B0B0B0
Text muted:      #888888
Board light:     #EEEED2
Board dark:      #769656
Era colors:      Pre-AI #60a5fa, Early Post-AI #c084fc, NNUE Era #fbbf24, Modern #34d399
Opening colors:  Sicilian #f87171, French #60a5fa, Caro-Kann #fbbf24, QG #34d399, Italian #e2e8f0
```

## Frontend Data Files (in `frontend/public/data/`)

### Raw CSVs (from notebook 01)
- `lichess_sampled_games.csv` (~36MB, 200k rows)
- `lichess_sampled_moves.csv` (~631MB, millions of rows, covers game_idx 0-149999)
- `lichess_sampled_blunders.csv` (~50MB)
- `lichess_sampled_piece_squares.csv` (~84KB)
- `lichess_sampled_material_curve.csv` (~40KB)

### Aggregated files (from generate_frontend_data.py)
- `opening_tree_{period}.json` (x4) - hierarchical sunburst data
- `opening_by_year_1500.csv` - top 5 openings by year, ELO 1500+ (categorized by sub-name)
- `material_total.csv` - material curve by ply (wide format, all ELO)
- `material_by_year_1500.csv` - material curve by ply and year, ELO 1500+ (missing 2024)
- `sacrifice_rate_1500.csv` - avg sacrifices per era, ELO 1500+
- `blunder_rate.csv` - blunder rate by ELO x period (all ELO)
- `piece_squares_agg.csv` - piece-square counts for heatmaps
- `game_length.csv` - game length by ply (wide format, per era)
- `game_length_total.csv` - game length single distribution (all eras combined)
- `first_move_by_period.csv` - e4/d4/c4/Nf3 percentages by period

## Section Layout (App.jsx order)

1. **Opening Tree** (Section 01) - Sunburst with period toggle. `data.openingTree`
2. **Opening Revolution** (Section 02) - Line chart, top 5 openings over time. `data.openingByYear`
3. **Opening Simulator** (Section 03) - Interactive board, no data props
4. **Material and Sacrifices** (Section 04) - Sacrifice rate line chart. `data.sacrifice`
5. **Blunder Heatmap** (Section 05) - ELO x period heatmap. `data.blunderRate`
6. **Piece-Square Maps** (Section 06) - Board heatmap + KPI sidebar. `data.pieceSquares`
7. **Game Length** (Section 07) - Distribution line chart + zoom. `data.gameLength`
8. **Discussion** (Section 08) - Static insight cards, no data

## Key Decisions
- Opening Revolution (Section 02): Shows 5 openings over time (not by era). Openings categorized by sub-name: Queen's Gambit = QGD + QGA + QGR combined, London System matched from sub-variations
- Opening Simulator (Section 03): 8 preset openings (Italian, QG, London, Sicilian, French, Caro-Kann, KID, Nimzo-Indian) with auto-play and step controls
- Material and Sacrifices (Section 04): Only shows sacrifice rate across eras (no material curve). ELO 1500+ only
- Game Length (Section 07): Handles both wide and narrow format. Single distribution (all eras combined). Dual chart with zoom panel
- Piece-Square Maps (Section 06): Single board per piece (all eras, both colors) with KPI sidebar instead of 3-board comparison
- Blunder Heatmap (Section 05): Responsive layout with change badges in aside panel
- Opening Tree (Section 01): Pruned: top 5 at root, top 3 + "Other" at depth 4-5, top 2 at depth 6+
- EraTimeline between Hero and first section contextualizes the 4 eras with breakpoint badges

## Known Issues
- `lichess_sampled_moves.csv` only covers game_idx 0-149999 (first 150k games). Modern period games (game_idx 150k+) have no move-level data. Re-running notebook 01 Phase 2 would fix this.
- `material_by_year_1500.csv` is missing year 2024 for the same reason
- GitHub Pages deployment sometimes requires `npx gh-pages -d dist --add` if the branch shows "nothing to commit"

## Design Improvements (June 2026)

### Pass 1 (commit 8689204)
- Replaced blank loading state with animated spinner + text
- Added IntersectionObserver-based active section indicator in Navbar with animated green underline
- Added mobile menu smooth transition (max-height animation instead of instant show/hide)
- Added `btn-press` class (active:scale 0.97) to all buttons across 7 components
- Added `card-hover` class (translateY -1px + tinted shadow + green border hint) to all cards
- Added grain/noise overlay via CSS pseudo-element for texture
- Added section dividers (gradient line with green accent)
- Added ambient glow between sections (radial gradient pseudo-element)
- Added proper glass card with inner border highlight + inset shadow for edge refraction
- Added `tabular-nums` to data values in BlunderHeatmap, PieceSquareMap, OpeningRevolution
- Added `text-balance` (text-wrap: balance) to headings
- Fixed OpeningTree D3 labels font from Inter to DM Sans
- Added skip-to-content link for keyboard users
- Added og:title, og:description, og:type, twitter:card meta tags
- Added back-to-top button in Footer
- Updated discussion cards with `card-hover` and slightly more padding

### Pass 2 (commit 4049375)
- Added focus-visible ring (2px green outline) on all interactive elements for keyboard accessibility
- Fixed Hero Math.random() anti-pattern with deterministic seeded pseudo-random positions
- Increased hero visual depth: stronger radial glow, more visible background pieces, secondary ambient glow
- Added thin scroll progress bar (2px green, fixed at top)
- Wrapped main content in `<main>` landmark element
- Differentiated card treatments: tinted breakpoint cards, green-bordered explanation panel, green-tinted blunder insight box
- Added named z-index scale in Tailwind config (grain/40, progress/60, nav/50, tooltip/30, overlay/20)
- Lowered grain overlay z-index from 9999 to 40

## Deployment
```bash
cd frontend
npm run build
cp dist/index.html dist/404.html
npx gh-pages -d dist        # or: npx gh-pages -d dist --add
```
