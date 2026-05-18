# The Evolution of Human Chess Thought in the Age of AI

COMP4010 Data Visualization Project — VinUniversity

An interactive data visualization study investigating how AI breakthroughs (AlphaZero 2017, Stockfish NNUE 2020) reshaped human chess playing patterns, using 200,000 Lichess games sampled across 4 time periods and 6 ELO brackets.

## Live Demo

[https://duongphamminhdung.github.io/COMP4010_Project_2/](https://duongphamminhdung.github.io/COMP4010_Project_2/)

## Visualizations

1. **Opening Tree** — Interactive D3 tree showing how opening repertoires shifted post-AI
2. **First Move Revolution** — e4's declining dominance as d4, c4, and Nf3 gain ground
3. **Material & Sacrifices** — Material decay curves and rising sacrifice rates across eras
4. **Blunder Heatmap** — ELO x period heatmap showing AI coaching tools reduced blunders
5. **Piece-Square Maps** — Chess board heatmaps comparing piece placement pre-AI vs modern
6. **Game Length Distribution** — The "comb pattern" at time control boundaries

## Project Structure

```
notebooks/
  01_dataset_preprocessing.ipynb  — Downloads Lichess PGN data, samples 200k games
  02_visualization.ipynb          — Exploratory visualizations (Plotly, Matplotlib, Seaborn)
frontend/                         — React app (Vite + Tailwind CSS + D3.js + Recharts)
```

## Data Pipeline

- **Source:** Lichess open database (standard rated games with eval annotations)
- **Sampling:** 200k games across 4 periods (pre-AI 2015-16, early post-AI 2018-19, NNUE era 2021-22, modern 2024) x 6 ELO brackets
- **Output:** 5 CSV files — games, moves, blunders, piece-square counts, material curves
- **Processing:** Two-phase approach — fast scan for eval-tagged games, then full python-chess parse

## Tech Stack

- **Frontend:** Vite, React, Tailwind CSS v3, D3.js, Recharts
- **Data:** Python, python-chess, pandas, Lichess PGN database
- **Visualization (notebooks):** Plotly, Matplotlib, Seaborn

## Running Locally

```bash
cd frontend
npm install
npm run dev
```

## Authors

COMP4010 Data Visualization — VinUniversity
