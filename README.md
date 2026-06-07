# The Evolution of Human Chess Thought in the Age of AI

COMP4010 Data Visualization Project, VinUniversity

This project studies whether AlphaZero (2017), Stockfish NNUE (2020), and
widely available engine analysis changed human chess behavior. It uses 200,000
sampled Lichess games across four eras and six ELO brackets.

## Applications

- **React edition:** public GitHub Pages deployment at
  <https://duongphamminhdung.github.io/COMP4010_Project_2/>
- **Beyond the Engine:** locally runnable Python Shiny edition in
  `shiny_app/app.py`

Both editions present seven sections:

1. Opening Tree
2. Opening Revolution
3. Opening Simulator
4. Blunder Heatmap
5. Game Length Distribution
6. Piece-Square Maps
7. Interactive ELO Predictor

## Quick Start: Python Shiny

Run all commands from the repository root.

### Option A: Conda

Requirements: Conda or Miniconda.

```bash
conda env create -f environment.yml
conda activate beyond-the-engine
shiny run --reload shiny_app/app.py
```

### Option B: Python virtual environment

Requirements: Python 3.12.

```bash
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
shiny run --reload shiny_app/app.py
```

Open the URL printed by Shiny, normally <http://127.0.0.1:8000>.

The aggregated application data is included in the repository, so running the
dashboard does not require downloading the multi-gigabyte raw Lichess archive.

## Quick Start: React

Requirements: Node.js 22.12 or newer and npm.

```bash
cd frontend
npm ci
npm run dev
```

Vite prints the local development URL. Build the production site with:

```bash
npm run build
```

## Reproducibility

- `requirements.txt` pins the direct Python runtime and quality-tool versions.
- `environment.yml` pins Python 3.12 and the Conda-based environment.
- `frontend/package-lock.json` locks the complete JavaScript dependency tree.
- `pyproject.toml` centralizes Ruff, Black, and Pytest configuration.
- Small aggregated CSV and JSON artifacts required by both apps are stored in
  `frontend/public/data/`.
- Raw PGN, compressed archives, generated builds, and local environments are
  excluded through `.gitignore`.

Verify the Python application with:

```bash
python -m compileall -q shiny_app tests
ruff check shiny_app tests
black --check shiny_app tests
pytest -q
python -m pip check
```

Verify the React application with:

```bash
cd frontend
npm run build
```

## Repository Structure

```text
.
├── frontend/
│   ├── public/data/          # Tracked, frontend-ready CSV and JSON artifacts
│   ├── src/components/      # React visualization components
│   └── package-lock.json    # Locked JavaScript dependency tree
├── shiny_app/
│   ├── app.py               # Python Shiny entry point and shared navigation
│   ├── data.py              # Cached data loading and era metadata
│   ├── theme.py             # Shared semantic colors and Plotly styling
│   ├── chess_utils.py       # Board rendering, bot, and ELO analytics
│   ├── modules/             # One Shiny module per analytical section
│   └── www/styles.css       # Dark-only responsive visual system
├── notebooks/
│   ├── 01_dataset_preprocessing.ipynb
│   ├── 02_visualization.ipynb
│   └── generate_frontend_data.py
├── tests/                   # Data, chess, model, and visualization unit tests
├── main.tex                 # Project report and methodology documentation
├── environment.yml          # Reproducible Conda environment
├── requirements.txt         # Pinned Python dependencies
└── pyproject.toml           # Python quality-tool configuration
```

This separates application code, aggregated data, exploratory processing,
tests, and written documentation. The React and Shiny editions share the same
data artifacts rather than maintaining duplicate pipelines.

## Data Pipeline

1. Stream Lichess PGN archives and reject games without engine evaluations.
2. Sample games across four eras and six ELO brackets.
3. Parse accepted games with `python-chess`.
4. Calculate move quality, blunders, openings, game lengths, and destination
   square frequencies.
5. Export compact CSV and JSON artifacts to `frontend/public/data/`.
6. Load those artifacts in both the React and Python Shiny applications.

The large raw source files are intentionally not committed. To regenerate the
aggregated artifacts after obtaining the required raw data:

```bash
python notebooks/generate_frontend_data.py
```

## Development History

The repository uses focused, descriptive commits for features, design passes,
data-pipeline changes, report corrections, and review fixes. Examples include:

- `Add interactive ELO prediction section with ACPL regression model`
- `Move opening tree pruning from frontend to build-time`
- `Design polish: loading skeleton, active nav, hover states, visual texture`
- `Code review fixes: extract constants, fix tooltip leak, reduce bot depth`

Inspect the complete history with:

```bash
git log --oneline --decorate --graph
```

Contributors should keep future commits scoped to one logical change and use an
imperative summary that explains the user-visible or technical outcome.

## Documentation

- `main.tex` contains the research questions, visualization rationale,
  interaction design, ML methodology, findings, and limitations.
- `shiny_app/README.md` contains Shiny-specific operating notes.
- This README is the canonical setup and repository guide.

## Authors

COMP4010 Data Visualization, VinUniversity
