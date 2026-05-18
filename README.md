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

## AI and Chess: A Brief History

AI in chess is often associated with Deep Blue defeating Kasparov in 1997, but that was a computational feat — raw brute force that humans couldn't learn from. The real shift in human chess thought came two decades later:

```
1997                                    2017              2020               2024
Deep Blue      (no public data)        AlphaZero       Stockfish NNUE     Maia / Leela
   |===============================////|==================|==================|===>
                                     ^                  ^                  ^
                              Humans start         AI evaluation     AI coaching
                              playing         accessible to       for all levels
                              differently        everyone
```

- **Deep Blue (1997):** Defeated Kasparov through minimax search and opening books. A closed system — its evaluations were not available for humans to study.
- **AlphaZero (2017):** Learned chess from scratch via self-play and neural networks. Played with creativity: fianchettos, exchange sacrifices, unconventional openings. This was the moment top players realized engines could teach new ideas, not just calculate faster.
- **Stockfish NNUE (2020):** Integrated neural network evaluation into the open-source engine everyone uses. Made AI-level analysis available for free to every player, not just Grandmasters.
- **Maia Chess / Leela (2023+):** AI models trained to play like humans at specific ELO levels, enabling personalized coaching.

Our data starts in 2015-2016 not because of availability, but because that is the true "before" picture — the last era of purely human chess before AlphaZero disrupted how players think about positions, openings, and sacrifices.

## Data Pipeline

- **Source:** Lichess open database (standard rated games with eval annotations)
- **Sampling:** 200k games across 4 periods (pre-AI 2015-16, early post-AI 2018-19, NNUE era 2021-22, modern 2023-25) x 6 ELO brackets
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
