from __future__ import annotations

import math
import random
from collections.abc import Callable
from dataclasses import dataclass

import chess
from shiny import ui

PIECE_SYMBOLS = {
    "P": "♙",
    "N": "♘",
    "B": "♗",
    "R": "♖",
    "Q": "♕",
    "K": "♔",
    "p": "♟",
    "n": "♞",
    "b": "♝",
    "r": "♜",
    "q": "♛",
    "k": "♚",
}
PIECE_VALUES = {
    chess.PAWN: 1.0,
    chess.KNIGHT: 3.0,
    chess.BISHOP: 3.2,
    chess.ROOK: 5.0,
    chess.QUEEN: 9.0,
    chess.KING: 0.0,
}
CENTER_SQUARES = frozenset(
    chess.parse_square(square)
    for square in (
        "c3",
        "c4",
        "c5",
        "c6",
        "d3",
        "d4",
        "d5",
        "d6",
        "e3",
        "e4",
        "e5",
        "e6",
        "f3",
        "f4",
        "f5",
        "f6",
    )
)


@dataclass(frozen=True)
class PlayedLine:
    board: chess.Board
    last_move: chess.Move | None
    san_moves: tuple[str, ...]


def play_san_line(moves: tuple[str, ...], step: int) -> PlayedLine:
    """Return the board position after a prefix of a legal SAN move sequence."""
    board = chess.Board()
    played: list[str] = []
    last_move = None
    for san in moves[:step]:
        move = board.parse_san(san)
        played.append(board.san(move))
        board.push(move)
        last_move = move
    return PlayedLine(board=board, last_move=last_move, san_moves=tuple(played))


def board_ui(
    board: chess.Board,
    *,
    last_move: chess.Move | None = None,
    selected: int | None = None,
    legal_targets: frozenset[int] = frozenset(),
    input_prefix: str | None = None,
    id_resolver: Callable[[str], str] | None = None,
    disabled: bool = False,
) -> ui.Tag:
    """Render a White-oriented chess board, optionally with clickable squares."""
    last_squares = (
        {last_move.from_square, last_move.to_square} if last_move is not None else set()
    )
    squares = []
    for rank in range(7, -1, -1):
        for file_index in range(8):
            square = chess.square(file_index, rank)
            square_name = chess.square_name(square)
            piece = board.piece_at(square)
            classes = ["chess-square"]
            classes.append("light" if (rank + file_index) % 2 else "dark")
            if square in last_squares:
                classes.append("last-move")
            if square == selected:
                classes.append("selected")
            if square in legal_targets:
                classes.append("legal-target")
            if piece is not None:
                classes.append("white-piece" if piece.color else "black-piece")

            symbol = PIECE_SYMBOLS[piece.symbol()] if piece is not None else ""
            labels = []
            if file_index == 0:
                labels.append(ui.span(str(rank + 1), class_="rank-label"))
            if rank == 0:
                labels.append(
                    ui.span(chess.FILE_NAMES[file_index], class_="file-label")
                )

            if input_prefix is None:
                square_tag = ui.div(
                    *labels,
                    ui.span(symbol, class_="piece-symbol") if symbol else None,
                    class_=" ".join(classes),
                    aria_label=square_name,
                )
            else:
                input_id = f"{input_prefix}_{square_name}"
                if id_resolver is not None:
                    input_id = id_resolver(input_id)
                square_tag = ui.input_action_button(
                    input_id,
                    ui.TagList(
                        *labels,
                        ui.span(symbol, class_="piece-symbol") if symbol else None,
                    ),
                    class_=" ".join(classes),
                    aria_label=(
                        f"{square_name} "
                        f"{chess.piece_name(piece.piece_type) if piece else 'empty'}"
                    ),
                    disabled=disabled,
                )
            squares.append(square_tag)

    return ui.div(*squares, class_="chess-board", role="grid")


def evaluate_board(board: chess.Board) -> float:
    """Evaluate a position in pawns from White's perspective."""
    if board.is_checkmate():
        return -10_000.0 if board.turn == chess.WHITE else 10_000.0
    if board.is_game_over():
        return 0.0

    score = 0.0
    for square, piece in board.piece_map().items():
        sign = 1.0 if piece.color == chess.WHITE else -1.0
        score += sign * PIECE_VALUES[piece.piece_type]
        file_distance = abs(chess.square_file(square) - 3.5)
        rank_distance = abs(chess.square_rank(square) - 3.5)
        center_bonus = max(0.0, 3.5 - (file_distance + rank_distance)) * 0.025
        score += sign * center_bonus
        if square in CENTER_SQUARES:
            score += sign * 0.04

    mobility = len(tuple(board.legal_moves))
    score += (mobility * 0.003) * (1 if board.turn == chess.WHITE else -1)
    return score


def best_white_evaluation(board: chess.Board) -> float:
    """Find White's best immediate evaluation from the current position."""
    evaluations = []
    for move in board.legal_moves:
        board.push(move)
        evaluations.append(evaluate_board(board))
        board.pop()
    return max(evaluations, default=evaluate_board(board))


def _minimax(
    board: chess.Board,
    depth: int,
    alpha: float,
    beta: float,
) -> float:
    if depth == 0 or board.is_game_over():
        return evaluate_board(board)

    if board.turn == chess.WHITE:
        value = -math.inf
        for move in board.legal_moves:
            board.push(move)
            value = max(value, _minimax(board, depth - 1, alpha, beta))
            board.pop()
            alpha = max(alpha, value)
            if beta <= alpha:
                break
        return value

    value = math.inf
    for move in board.legal_moves:
        board.push(move)
        value = min(value, _minimax(board, depth - 1, alpha, beta))
        board.pop()
        beta = min(beta, value)
        if beta <= alpha:
            break
    return value


def choose_bot_move(board: chess.Board, *, depth: int = 2) -> chess.Move | None:
    """Choose a strong but imperfect Black move from the top three candidates."""
    scored: list[tuple[float, chess.Move]] = []
    for move in board.legal_moves:
        board.push(move)
        score = _minimax(board, depth - 1, -math.inf, math.inf)
        board.pop()
        scored.append((score, move))
    if not scored:
        return None

    scored.sort(key=lambda item: item[0])
    candidates = scored[:3]
    weights = [math.exp(-index * 1.2) for index in range(len(candidates))]
    return random.choices([move for _, move in candidates], weights=weights, k=1)[0]


def game_result_text(board: chess.Board) -> str | None:
    if not board.is_game_over():
        return None
    if board.is_checkmate():
        return "You lost." if board.turn == chess.WHITE else "You won!"
    if board.is_stalemate():
        return "Stalemate - draw"
    if board.is_insufficient_material():
        return "Draw by insufficient material"
    return "Draw"


def probability_distribution(estimated_elo: float, model: dict) -> tuple[float, ...]:
    sigma = float(model.get("sigma", 300))
    centers = [float(center) for center in model["centers"]]
    weights = [
        math.exp(-0.5 * ((estimated_elo - center) / sigma) ** 2) for center in centers
    ]
    total = sum(weights)
    return tuple(weight / total for weight in weights)


def predict_elo(
    eval_drops: tuple[float, ...],
    model: dict,
    *,
    result: str | None = None,
    bot_elo: int = 1300,
) -> tuple[float, tuple[float, ...]]:
    """Predict an ELO value and bracket probabilities from average eval loss."""
    mean_drop = sum(eval_drops) / len(eval_drops) if eval_drops else 0.01
    acpl = max(mean_drop * float(model.get("eval_to_cp", 100)), 1.0)
    estimated = float(model["a"]) - float(model["b"]) * math.log(acpl)
    if result == "You won!":
        estimated = max(estimated, bot_elo + 100)
    elif result == "You lost.":
        estimated = min(estimated, bot_elo + 200)
    estimated = min(max(estimated, 400), 3000)
    return estimated, probability_distribution(estimated, model)
