# Repository Guide

## Project

Interactive chess data-visualization project using a React/Vite frontend,
Python data-generation scripts, Jupyter notebooks, and a LaTeX report.

## Commands

- Dev: `cd frontend && npm run dev`
- Lint: `cd frontend && npm run lint`
- Build: `cd frontend && npm run build`
- Deploy: `cd frontend && npm run deploy`
- Shiny: `conda run -n data-vis shiny run shiny_app/app.py`
- Python tests: `conda run -n data-vis pytest`
- Generate frontend data: `python notebooks/generate_frontend_data.py`

Verify frontend changes with both lint and build. Verify Shiny changes with
`compileall`, Ruff, Black, and Pytest in the Conda environment.

## Architecture

Data flows from the notebooks and raw Lichess CSVs through
`notebooks/generate_frontend_data.py` into `frontend/public/data/`.
The React entry point is `frontend/src/App.jsx`; data loading is centralized in
`frontend/src/data/dataLoader.js`.
The Python Shiny entry point is `shiny_app/app.py`; its analytical sections are
isolated in `shiny_app/modules/` and share cached data from `shiny_app/data.py`.

## Project Invariants

- Preserve the Vite GitHub Pages base path `/COMP4010_Project_2/`.
- Load public data through `import.meta.env.BASE_URL`.
- Opening-tree periods use `pre-ai`, `early-post-ai`, `nnue-era`, and `modern`.
- Most CSV display labels use `Pre-AI`, `Early Post-AI`, `NNUE Era`, and `Modern`.
- Keep section order and numbering synchronized across `App.jsx`, `Navbar.jsx`,
  and `main.tex`.
- Follow the existing D3 `useRef`, `useEffect`, `ResizeObserver`, and cleanup pattern.
- Do not commit generated `frontend/dist/`, dependencies, or large raw datasets.
