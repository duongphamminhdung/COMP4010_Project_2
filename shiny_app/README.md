# Beyond the Engine — Python Shiny Edition

This directory contains the locally runnable Python Shiny counterpart to the
React GitHub Pages website. It reuses the same aggregated artifacts from
`frontend/public/data/` and presents the same seven analytical sections.

## Run with the existing development environment

```bash
conda activate data-vis
shiny run --reload shiny_app/app.py
```

## Create a clean environment

```bash
conda env create -f environment.yml
conda activate beyond-the-engine
shiny run --reload shiny_app/app.py
```

Alternatively, install the pinned pip dependencies:

```bash
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
shiny run --reload shiny_app/app.py
```

Open the address printed by Shiny, normally `http://127.0.0.1:8000`.

## Quality checks

```bash
conda run -n data-vis python -m compileall shiny_app
conda run -n data-vis ruff check shiny_app tests
conda run -n data-vis black --check shiny_app tests
conda run -n data-vis pytest
```

The application uses cached process-level data loading and Shiny modules so a
filter change recomputes only the affected chart or summary.
