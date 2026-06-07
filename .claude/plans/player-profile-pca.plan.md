# Plan: Player Profile PCA Scatter Plot

**Source PRD**: `.claude/prds/player-profile-pca.prd.md`
**Selected Milestone**: All 5 milestones (sequential dependencies)
**Complexity**: Medium

## Summary

Add an unsupervised PCA section to the frontend. A Jupyter notebook pipeline computes per-player-game features, runs PCA, and exports ~5000 stratified samples to CSV. A new D3 scatter plot component colors points by era, with hover tooltips and era toggle filters. Game Length (Section 7) is removed, and the PCA section becomes the new Section 05 (after Blunders). Remaining sections renumber. Report updated to match.

## Patterns to Mirror

| Category | Source | Pattern |
|---|---|---|
| D3 rendering | `BlunderHeatmap.jsx:19-127` | `useRef(null)` for svg/container, `useState(null)` for tooltip, `useEffect` with `draw()`, `ResizeObserver`, cleanup return |
| Tooltip | `BlunderHeatmap.jsx:186-199` | Fixed-position div with `event.clientX/Y`, dark bg + border |
| Period colors | `BlunderHeatmap.jsx:7` | `PERIOD_COLORS = ['#60a5fa', '#c084fc', '#fbbf24', '#34d399']` |
| Data loading | `dataLoader.js:83-89` | `fetchCSV(filename)` with try/catch, returns `[]` on failure |
| Section wrapper | `App.jsx:68-81` | `<Section id="..." number="Section XX" title="..." description="..." notes={[...]} discussion={'...'}><Component data={data.key} /></Section>` |
| Navbar sections | `Navbar.jsx:3-11` | `{ id, label }` objects in sections array |
| PCA features | `notebook 03 cell 5` | `player_stats` DataFrame already has: acpl, n_moves, blunder_rate, capture_pct, check_pct, elo |

## Files to Change

| File | Action | Why |
|---|---|---|
| `notebooks/03_elo_prediction_model.ipynb` | UPDATE | Add PCA pipeline cells after multivariate model, before export cell |
| `frontend/public/data/player_pca.csv` | CREATE | PCA output data (new) |
| `frontend/src/components/PlayerProfilePCA.jsx` | CREATE | D3 scatter plot component |
| `frontend/src/components/GameLength.jsx` | DELETE | Removing Game Length section |
| `frontend/src/App.jsx` | UPDATE | Remove GameLength import/section, add PlayerProfilePCA import/section, renumber |
| `frontend/src/data/dataLoader.js` | UPDATE | Remove `loadGameLengthData()`, add `loadPCAData()`, update `loadAllData()` |
| `frontend/src/components/Navbar.jsx` | UPDATE | Replace `game-length` with `pca-scatter` in sections array |
| `.gitignore` | UPDATE | Add `!data/player_pca.csv` to allowed data files |
| `main.tex` | UPDATE | Rewrite sections to reflect new order, add PCA section |

## Tasks

### Task 1: PCA pipeline in notebook 03

- **Action**: Add cells after the multivariate model section (after current cell 12) in notebook 03. The pipeline:
  1. Import sklearn PCA, StandardScaler
  2. Join `period` column from games CSV onto `player_stats` (filter to `df` which has 295,603 rows)
  3. Select 5 features: `acpl`, `blunder_rate`, `capture_pct`, `check_pct`, `n_moves`
  4. Drop NaN rows, standardize with `StandardScaler`
  5. Run PCA with 2 components, print explained variance ratio
  6. Stratified sample ~5000 rows (equal per period) from the PCA result
  7. Export CSV with columns: `pc1`, `pc2`, `period`, `elo`, `acpl`, `blunder_rate`, `capture_pct`, `check_pct`, `n_moves`
  8. Save to `frontend/public/data/player_pca.csv`
- **Mirror**: Follow existing notebook cell patterns (pandas, sklearn imports at top of cell)
- **Validate**: CSV has ~5000 rows, explained variance printed, columns match expected schema

### Task 2: PlayerProfilePCA component

- **Action**: Create `frontend/src/components/PlayerProfilePCA.jsx` — D3 scatter plot
  - Layout: scatter plot (left, ~70%) + sidebar KPIs (right, ~30%), matching BlunderHeatmap flex layout
  - Scatter: D3 circles colored by period using `PERIOD_COLORS`, opacity 0.6, radius 4
  - Axes: PC1 (x-axis) and PC2 (y-axis) with axis labels showing explained variance %
  - Hover tooltip: show period, ELO, ACPL, blunder rate, capture %, check %, n_moves
  - Era toggle buttons (4 buttons, one per period) — clicking toggles visibility of that era's points
  - Sidebar: KPI cards showing explained variance % for PC1 and PC2, total variance captured
  - Mirror BlunderHeatmap D3 pattern: `useRef`, `useState(null)` tooltip, `useEffect` with `draw()`, `ResizeObserver`
- **Mirror**: `BlunderHeatmap.jsx` for D3 pattern, tooltip, layout
- **Validate**: `npm run build` passes, scatter renders with colored points

### Task 3: Remove Game Length section

- **Action**:
  - Delete `frontend/src/components/GameLength.jsx`
  - Remove `import GameLength` from `App.jsx` line 12
  - Remove `<Section id="game-length" ...>` block from `App.jsx` lines 158-171
  - Remove `loadGameLengthData()` from `dataLoader.js` (lines 110-121 and from `loadAllData`)
  - Remove `gameLength` from `loadAllData()` destructuring and return object
  - Remove `{ id: 'game-length', label: 'Game Length' }` from `Navbar.jsx` sections array
- **Validate**: `npm run build` passes with no references to GameLength or game-length

### Task 4: Insert PCA section and renumber

- **Action**:
  - Add `import PlayerProfilePCA from './components/PlayerProfilePCA';` in `App.jsx`
  - Add `import { loadPCAData } from './data/dataLoader';` (or use existing import)
  - Insert new section after Blunders (after Section 04 block):
    ```jsx
    <Section
      id="pca-scatter"
      number="Section 05"
      title="Player Profiles: Did AI Create a New Type of Player?"
      description="PCA scatter plot of behavioral features, colored by era."
      notes={[
        { label: 'Read', text: 'Each dot is one player-game. Clusters show similar playing styles.' },
        { label: 'Why', text: 'PCA reduces 5 behavioral metrics into 2 dimensions for visual comparison.' },
        { label: 'Explore', text: 'Toggle eras on/off to see where pre-AI and post-AI players cluster.' },
      ]}
      discussion={'TBD — fill after seeing actual PCA results'}
    >
      <PlayerProfilePCA data={data.playerPca} />
    </Section>
    ```
  - Renumber Piece Squares: Section 05 → Section 06
  - Renumber Guess ELO: Section 06 → Section 07
  - Add `{ id: 'pca-scatter', label: 'Player Profiles' }` to Navbar sections after `blunders`
  - Add `loadPCAData()` to dataLoader and `playerPca` to `loadAllData()` return
  - Add `!data/player_pca.csv` to `.gitignore` allowed files
- **Validate**: `npm run build` passes, all 7 sections render in correct order, navbar links work

### Task 5: Update report (main.tex)

- **Action**:
  - Update section numbering to match new order (PCA as Section 5, Piece Squares → 6, Guess ELO → 7)
  - Add new subsection for PCA: describe method (unsupervised, 5 features, StandardScaler + PCA), results (explained variance, scatter interpretation), and how it complements the supervised ELO prediction
  - Remove Game Length references from report
  - Update any cross-references between sections
- **Validate**: No references to old section numbers, PCA section present

## Validation

```bash
cd frontend && npm run build
# Verify player_pca.csv exists and has correct schema:
head -1 frontend/public/data/player_pca.csv
wc -l frontend/public/data/player_pca.csv
```

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| PCA shows no era separation | Medium | Frame honestly in report/discussion: "behavioral continuity" is still a valid ML finding |
| 5 features too few for ≥40% explained variance | Low | Add acpl_std, piece_diversity as additional features in notebook |
| Scatter too dense at 5k points | Low | Reduce opacity to 0.4, or sample down to 3k |
| Notebook 03 cell numbering shifted | Low | Re-run notebook after adding cells to verify execution order |

## Acceptance

- [ ] PCA pipeline produces `player_pca.csv` with ~5000 rows
- [ ] Scatter plot renders with era-colored points, hover tooltips, era toggles
- [ ] Game Length section fully removed
- [ ] All sections numbered correctly in App, Navbar, and report
- [ ] `npm run build` passes
- [ ] Report includes PCA method, results, and discussion
