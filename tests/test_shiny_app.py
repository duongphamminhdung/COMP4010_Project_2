from __future__ import annotations

import math

import chess

from shiny_app.chess_utils import (
    choose_bot_move,
    play_san_line,
    predict_elo,
    probability_distribution,
)
from shiny_app.data import PERIOD_ORDER, load_app_data
from shiny_app.modules.elo_predictor import feature_summary, initial_state
from shiny_app.modules.game_length import _weighted_median
from shiny_app.modules.opening_simulator import OPENINGS
from shiny_app.modules.opening_tree import _flatten_tree
from shiny_app.theme import OPENING_COLORS, opening_color


def test_required_data_loads_with_expected_shape() -> None:
    data = load_app_data()

    assert len(data.blunders) == 24
    assert set(data.game_length.columns) >= {
        "ply",
        "Pre-AI",
        "Early Post-AI",
        "NNUE Era",
        "Modern",
    }
    assert set(data.opening_trees) == set(PERIOD_ORDER)
    assert data.opening_by_year[["year", "opening", "pct"]].isna().sum().sum() == 0
    assert data.elo_model["type"] == "acpl_regression"


def test_game_length_medians_match_reported_results() -> None:
    data = load_app_data()

    assert _weighted_median(data.game_length["ply"], data.game_length["Pre-AI"]) == 65
    assert _weighted_median(data.game_length["ply"], data.game_length["NNUE Era"]) == 62
    assert _weighted_median(data.game_length["ply"], data.game_length["Modern"]) == 63


def test_opening_tree_flattening_creates_unique_paths() -> None:
    data = load_app_data()
    flattened = _flatten_tree(data.opening_trees["modern"])

    assert flattened["ids"][0] == "root"
    assert len(flattened["ids"]) == len(set(flattened["ids"]))
    assert len(flattened["ids"]) == len(flattened["values"])


def test_opening_colors_are_stable() -> None:
    for name, expected in OPENING_COLORS.items():
        assert opening_color(name, 4) == expected

    assert opening_color("Unknown Opening", 0) == opening_color("Unknown Opening", 4)


def test_every_opening_preset_is_legal() -> None:
    for opening in OPENINGS:
        line = play_san_line(opening.moves, len(opening.moves))
        assert len(line.san_moves) == len(opening.moves)
        assert line.last_move is not None
        assert line.board.is_valid()


def test_bot_returns_a_legal_move() -> None:
    board = chess.Board()
    board.push_san("e4")
    legal_moves = set(board.legal_moves)

    assert choose_bot_move(board, depth=1) in legal_moves


def test_prediction_is_normalized_and_bounded() -> None:
    model = load_app_data().elo_model
    estimate, probabilities = predict_elo((0.4, 0.7, 0.2), model)

    assert 400 <= estimate <= 3000
    assert len(probabilities) == len(model["classes"])
    assert math.isclose(sum(probabilities), 1.0)
    assert all(0 <= probability <= 1 for probability in probabilities)
    assert math.isclose(sum(probability_distribution(1600, model)), 1.0)


def test_initial_game_features_are_well_defined() -> None:
    features = feature_summary(initial_state())

    assert features["accuracy"] == 1.0
    assert features["blunder_rate"] == 0
    assert features["piece_diversity"] == 0
