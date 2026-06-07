from __future__ import annotations

from dataclasses import dataclass

import chess
from shiny import Inputs, Outputs, Session, module, reactive, render, ui

from shiny_app.chess_utils import (
    CENTER_SQUARES,
    best_white_evaluation,
    board_ui,
    choose_bot_move,
    evaluate_board,
    game_result_text,
    predict_elo,
)
from shiny_app.data import AppData
from shiny_app.theme import COLORS
from shiny_app.ui_helpers import chart_shell, insight_box, section_intro

BOT_ELO = 1300
MIN_MOVES = 20


@dataclass(frozen=True)
class GameState:
    fen: str
    status: str = "waiting"
    selected: int | None = None
    legal_targets: tuple[int, ...] = ()
    last_move: chess.Move | None = None
    eval_drops: tuple[float, ...] = ()
    captures: int = 0
    checks: int = 0
    move_count: int = 0
    piece_types: tuple[int, ...] = ()
    center_moves: int = 0
    result: str | None = None


def initial_state(*, playing: bool = False) -> GameState:
    return GameState(
        fen=chess.STARTING_FEN,
        status="playing" if playing else "waiting",
    )


def feature_summary(state: GameState) -> dict[str, float]:
    moves = max(state.move_count, 1)
    mean_drop = sum(state.eval_drops) / moves
    return {
        "accuracy": max(0.0, 1.0 - mean_drop / 2),
        "blunder_rate": sum(drop > 2 for drop in state.eval_drops) / moves,
        "capture_pct": state.captures / moves,
        "check_pct": state.checks / moves,
        "piece_diversity": len(state.piece_types) / 6,
        "center_pct": state.center_moves / moves,
    }


@module.ui
def elo_predictor_ui():
    return ui.TagList(
        section_intro(
            "07",
            "Rating-signal analytics",
            "How Strong Did This Game Look?",
            "Play White against a lightweight chess bot and turn one game's move quality into a rough rating signal.",
            [
                (
                    "Play",
                    f"Choose a piece, then a highlighted square. The bot is about {BOT_ELO} ELO.",
                ),
                (
                    "Model",
                    "Average evaluation loss feeds a noisy ACPL regression demo.",
                ),
                (
                    "Explore",
                    f"After {MIN_MOVES} White moves, reveal an illustrative bracket signal.",
                ),
            ],
        ),
        chart_shell(
            ui.layout_columns(
                ui.output_ui("board"),
                ui.div(
                    ui.output_ui("status"),
                    ui.output_ui("live_stats"),
                    ui.output_ui("prediction_controls"),
                    ui.output_ui("prediction"),
                    class_="elo-sidebar",
                ),
                col_widths=(7, 5),
            ),
            class_="elo-shell",
        ),
        insight_box(
            "This is not a real rating claim.",
            "The model shows the population-level ACPL pattern, but a short game against a "
            "lightweight bot is too noisy to measure a player's true rating.",
        ),
    )


@module.server
def elo_predictor_server(
    input: Inputs,
    output: Outputs,
    session: Session,
    data: AppData,
):
    game = reactive.value(initial_state())
    prediction_value = reactive.value(None)

    def set_selection(state: GameState, board: chess.Board, square: int) -> None:
        targets = tuple(
            move.to_square for move in board.legal_moves if move.from_square == square
        )
        game.set(
            GameState(
                **{
                    **state.__dict__,
                    "selected": square,
                    "legal_targets": targets,
                }
            )
        )

    def handle_square(square_name: str) -> None:
        state = game.get()
        if state.status != "playing":
            return

        board = chess.Board(state.fen)
        if board.turn != chess.WHITE:
            return
        square = chess.parse_square(square_name)
        piece = board.piece_at(square)

        if state.selected is None:
            if piece is not None and piece.color == chess.WHITE:
                set_selection(state, board, square)
            return

        if (
            piece is not None
            and piece.color == chess.WHITE
            and square != state.selected
        ):
            set_selection(state, board, square)
            return

        candidates = [
            move
            for move in board.legal_moves
            if move.from_square == state.selected and move.to_square == square
        ]
        if not candidates:
            game.set(
                GameState(
                    **{
                        **state.__dict__,
                        "selected": None,
                        "legal_targets": (),
                    }
                )
            )
            return

        move = next(
            (
                candidate
                for candidate in candidates
                if candidate.promotion == chess.QUEEN
            ),
            candidates[0],
        )
        moving_piece = board.piece_at(move.from_square)
        best_evaluation = best_white_evaluation(board)
        was_capture = board.is_capture(move)
        board.push(move)
        evaluation_drop = max(0.0, best_evaluation - evaluate_board(board))
        gave_check = board.is_check()
        piece_types = set(state.piece_types)
        if moving_piece is not None:
            piece_types.add(moving_piece.piece_type)

        next_state = GameState(
            fen=board.fen(),
            status="playing",
            selected=None,
            legal_targets=(),
            last_move=move,
            eval_drops=(*state.eval_drops, evaluation_drop),
            captures=state.captures + int(was_capture),
            checks=state.checks + int(gave_check),
            move_count=state.move_count + 1,
            piece_types=tuple(sorted(piece_types)),
            center_moves=state.center_moves + int(move.to_square in CENTER_SQUARES),
        )
        result = game_result_text(board)
        if result is not None:
            game.set(
                GameState(**{**next_state.__dict__, "status": "done", "result": result})
            )
            prediction_value.set(None)
            return

        bot_move = choose_bot_move(board)
        if bot_move is not None:
            board.push(bot_move)
        result = game_result_text(board)
        game.set(
            GameState(
                **{
                    **next_state.__dict__,
                    "fen": board.fen(),
                    "last_move": bot_move or move,
                    "status": "done" if result is not None else "playing",
                    "result": result,
                }
            )
        )
        prediction_value.set(None)

    def register_square(square_name: str) -> None:
        event = getattr(input, f"sq_{square_name}")

        @reactive.effect
        @reactive.event(event)
        def _square_click() -> None:
            handle_square(square_name)

    for board_square in chess.SQUARE_NAMES:
        register_square(board_square)

    @reactive.effect
    @reactive.event(input.start)
    def _start_game():
        game.set(initial_state(playing=True))
        prediction_value.set(None)

    @reactive.effect
    @reactive.event(input.predict)
    def _predict():
        state = game.get()
        if state.move_count < MIN_MOVES:
            return
        prediction_value.set(
            predict_elo(state.eval_drops, data.elo_model, result=state.result)
        )

    @render.ui
    def board():
        state = game.get()
        position = chess.Board(state.fen)
        return ui.div(
            board_ui(
                position,
                last_move=state.last_move,
                selected=state.selected,
                legal_targets=frozenset(state.legal_targets),
                input_prefix="sq",
                id_resolver=session.ns,
                disabled=state.status != "playing",
            ),
            class_="board-frame interactive-board",
        )

    @render.ui
    def status():
        state = game.get()
        if state.status == "waiting":
            return ui.div(
                ui.h3("Ready for a game?"),
                ui.p(
                    "You play White. Click Start, then select a piece and one of its "
                    "highlighted legal destinations."
                ),
                ui.input_action_button(
                    session.ns("start"),
                    "Start Game",
                    class_="control-button primary wide",
                ),
                class_="game-status",
            )
        if state.status == "done":
            return ui.div(
                ui.div(state.result or "Game over", class_="game-result"),
                ui.input_action_button(
                    session.ns("start"),
                    "Play Again",
                    class_="control-button wide",
                ),
                class_="game-status",
            )
        return ui.div(
            ui.span("Your turn", class_="status-dot-label"),
            ui.span(f"Bot strength: ~{BOT_ELO}", class_="status-bot"),
            class_="game-status compact",
        )

    @render.ui
    def live_stats():
        state = game.get()
        features = feature_summary(state)
        return ui.div(
            ui.h3("Live stats"),
            ui.div(
                ui.span("White moves"),
                ui.strong(f"{state.move_count} / {MIN_MOVES}"),
                class_="stat-row",
            ),
            ui.div(
                ui.span("Estimated accuracy"),
                ui.strong(f"{features['accuracy'] * 100:.0f}%"),
                class_="stat-row",
            ),
            ui.div(
                ui.span("Blunder rate"),
                ui.strong(f"{features['blunder_rate'] * 100:.0f}%"),
                class_="stat-row",
            ),
            ui.div(
                ui.span("Piece diversity"),
                ui.strong(f"{features['piece_diversity'] * 100:.0f}%"),
                class_="stat-row",
            ),
            ui.div(
                ui.span("Center moves"),
                ui.strong(f"{features['center_pct'] * 100:.0f}%"),
                class_="stat-row",
            ),
            class_="live-stats",
        )

    @render.ui
    def prediction_controls():
        state = game.get()
        remaining = max(0, MIN_MOVES - state.move_count)
        if state.move_count < MIN_MOVES:
            return ui.p(
                f"Play {remaining} more White move{'s' if remaining != 1 else ''} "
                "to unlock the rating-signal demo.",
                class_="prediction-hint",
            )
        return ui.input_action_button(
            session.ns("predict"),
            "Update Signal" if prediction_value.get() else "Estimate Rating Signal",
            class_="control-button primary wide",
        )

    @render.ui
    def prediction():
        value = prediction_value.get()
        if value is None:
            return None
        estimated, probabilities = value
        classes = data.elo_model["classes"]
        best_index = max(range(len(probabilities)), key=probabilities.__getitem__)
        bars = []
        for index, (label, probability) in enumerate(
            zip(classes, probabilities, strict=True)
        ):
            bars.append(
                ui.div(
                    ui.span(label, class_="probability-label"),
                    ui.div(
                        ui.div(
                            class_="probability-fill",
                            style=(
                                f"width:{max(probability * 100, 2):.1f}%;"
                                f"background:{COLORS['accent']};"
                                f"opacity:{1 if index == best_index else 0.35}"
                            ),
                        ),
                        class_="probability-track",
                    ),
                    ui.span(f"{probability * 100:.0f}%", class_="probability-value"),
                    class_="probability-row",
                )
            )
        return ui.div(
            ui.div("Single-game rating signal", class_="prediction-kicker"),
            ui.div(f"{classes[best_index]}", class_="prediction-bracket"),
            ui.p(
                f"Model score {estimated:.0f} · "
                f"{probabilities[best_index] * 100:.0f}% of the illustrative signal"
            ),
            ui.div(*bars, class_="probability-list"),
            ui.p(
                "Treat this as a visualization of ACPL, not as your actual chess rating.",
                class_="prediction-disclaimer",
            ),
            class_="prediction-card",
        )
