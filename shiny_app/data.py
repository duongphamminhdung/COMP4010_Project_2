from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import pandas as pd

from shiny_app.theme import ERA_COLORS

APP_DIR = Path(__file__).resolve().parent
REPO_ROOT = APP_DIR.parent
DATA_DIR = REPO_ROOT / "frontend" / "public" / "data"

PERIOD_ORDER = ["pre-ai", "early-post-ai", "nnue-era", "modern"]
PERIOD_DISPLAY = {
    "pre-ai": "Pre-AI",
    "early-post-ai": "Early Post-AI",
    "nnue-era": "NNUE Era",
    "modern": "Modern",
}
DISPLAY_TO_KEY = {label: key for key, label in PERIOD_DISPLAY.items()}
PERIOD_COLORS = ERA_COLORS
DISPLAY_COLORS = {PERIOD_DISPLAY[key]: PERIOD_COLORS[key] for key in PERIOD_ORDER}
ERA_YEAR_RANGES = {
    "pre-ai": range(2013, 2017),
    "early-post-ai": range(2017, 2020),
    "nnue-era": range(2020, 2023),
    "modern": range(2023, 2026),
}
ELO_BRACKETS = [
    "0-1000",
    "1000-1400",
    "1400-1800",
    "1800-2200",
    "2200-2600",
    "2600+",
]


@dataclass(frozen=True)
class AppData:
    blunders: pd.DataFrame
    game_length: pd.DataFrame
    piece_squares: pd.DataFrame
    opening_by_year: pd.DataFrame
    first_moves: pd.DataFrame
    opening_trees: dict[str, dict]
    elo_model: dict


def _read_csv(filename: str) -> pd.DataFrame:
    path = DATA_DIR / filename
    if not path.exists():
        raise FileNotFoundError(
            f"Required Shiny data file is missing: {path}. "
            "Run notebooks/generate_frontend_data.py or restore the tracked artifact."
        )
    return pd.read_csv(path)


def _read_json(filename: str) -> dict:
    path = DATA_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Required Shiny data file is missing: {path}.")
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


@lru_cache(maxsize=1)
def load_app_data() -> AppData:
    """Load small frontend artifacts once for every Shiny worker process."""
    trees = {
        period: _read_json(f"opening_tree_{period}.json") for period in PERIOD_ORDER
    }

    blunders = _read_csv("blunder_rate.csv")
    game_length = _read_csv("game_length.csv")
    piece_squares = _read_csv("piece_squares_agg.csv")
    opening_by_year = _read_csv("opening_by_year_1500.csv")
    first_moves = _read_csv("first_move_by_period.csv")

    blunders["value"] = pd.to_numeric(blunders["value"], errors="coerce")
    game_length["ply"] = pd.to_numeric(game_length["ply"], errors="coerce")
    piece_squares["count"] = pd.to_numeric(piece_squares["count"], errors="coerce")
    opening_by_year["year"] = pd.to_numeric(opening_by_year["year"], errors="coerce")
    opening_by_year["pct"] = pd.to_numeric(opening_by_year["pct"], errors="coerce")

    return AppData(
        blunders=blunders,
        game_length=game_length,
        piece_squares=piece_squares,
        opening_by_year=opening_by_year,
        first_moves=first_moves,
        opening_trees=trees,
        elo_model=_read_json("elo_model.json"),
    )


def selected_years(periods: tuple[str, ...] | list[str]) -> set[int]:
    years: set[int] = set()
    for period in periods:
        years.update(ERA_YEAR_RANGES.get(period, ()))
    return years
