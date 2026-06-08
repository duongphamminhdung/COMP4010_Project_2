from __future__ import annotations

from dataclasses import dataclass

from shiny import Inputs, Outputs, Session, module, reactive, render, ui

from shiny_app.chess_utils import board_ui, play_san_line
from shiny_app.ui_helpers import chart_shell, insight_box, section_intro


@dataclass(frozen=True)
class Opening:
    name: str
    family: str
    character: str
    idea: str
    color: str
    moves: tuple[str, ...]


OPENINGS = (
    Opening(
        "Italian Game",
        "Open Game",
        "Classical development",
        "White builds fast central pressure with Bc4, c3, and d4.",
        "#34D399",
        ("e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4"),
    ),
    Opening(
        "Queen's Gambit",
        "Queen's Pawn",
        "Central tension",
        "White offers the c-pawn to pull Black away from the center.",
        "#60A5FA",
        ("d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3"),
    ),
    Opening(
        "London System",
        "Queen's Pawn",
        "System opening",
        "White develops the dark-square bishop early and builds a repeatable setup.",
        "#A3E635",
        ("d4", "Nf6", "Bf4", "e6", "e3", "d5", "Nf3", "Be7", "Bd3", "O-O", "Nbd2"),
    ),
    Opening(
        "Sicilian Defense",
        "Defense vs e4",
        "Asymmetric counterplay",
        "Black avoids symmetry and fights for queenside counterplay.",
        "#F87171",
        ("e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"),
    ),
    Opening(
        "French Defense",
        "Defense vs e4",
        "Pawn-chain battle",
        "Black challenges White's center and attacks the pawn chain later.",
        "#C084FC",
        ("e4", "e6", "d4", "d5", "Nc3", "Nf6", "e5", "Nfd7", "f4"),
    ),
    Opening(
        "Caro-Kann Defense",
        "Defense vs e4",
        "Solid structure",
        "Black gets a sturdy pawn structure and develops the light bishop early.",
        "#FBBF24",
        ("e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5", "Ng3", "Bg6"),
    ),
    Opening(
        "King's Indian Defense",
        "Defense vs d4",
        "Hypermodern attack",
        "Black lets White occupy the center, then attacks it with pieces and pawns.",
        "#38BDF8",
        ("d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O"),
    ),
    Opening(
        "Nimzo-Indian Defense",
        "Defense vs d4",
        "Piece pressure",
        "Black pins the knight and fights for control before the center clarifies.",
        "#E2E8F0",
        ("d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "e3", "O-O", "Bd3", "d5"),
    ),
)
OPENING_LOOKUP = {opening.name: opening for opening in OPENINGS}


@module.ui
def opening_simulator_ui():
    return ui.TagList(
        section_intro(
            "03",
            "Opening theory",
            "Opening Simulator",
            "Step through common openings and connect their names to concrete piece plans.",
            [
                ("Read", "Green squares identify the latest move."),
                ("Why", "The board turns abstract opening labels into spatial plans."),
                ("Explore", "Scrub, step, or auto-play eight contrasting systems."),
            ],
        ),
        chart_shell(
            ui.layout_columns(
                ui.output_ui("board"),
                ui.div(
                    ui.input_select(
                        "opening",
                        "Opening",
                        choices={opening.name: opening.name for opening in OPENINGS},
                        selected=OPENINGS[0].name,
                    ),
                    ui.output_ui("opening_details"),
                    ui.input_slider(
                        "step",
                        "Move progress",
                        min=0,
                        max=len(OPENINGS[0].moves),
                        value=0,
                        step=1,
                        ticks=False,
                    ),
                    ui.div(
                        ui.input_action_button(
                            "previous", "Previous", class_="control-button"
                        ),
                        ui.input_action_button(
                            "play", "Play", class_="control-button primary"
                        ),
                        ui.input_action_button("next", "Next", class_="control-button"),
                        ui.input_action_button(
                            "reset", "Reset", class_="control-button"
                        ),
                        class_="playback-controls",
                    ),
                    ui.output_ui("move_list"),
                    class_="simulator-panel",
                ),
                col_widths=(7, 5),
            ),
            class_="simulator-shell",
        ),
        insight_box(
            "An opening is a plan, not only a move order.",
            "System openings emphasize repeatable development, while sharp defenses "
            "create imbalances that reward deeper engine-assisted preparation.",
        ),
    )


@module.server
def opening_simulator_server(
    input: Inputs,
    output: Outputs,
    session: Session,
):
    playing = reactive.value(False)

    @reactive.calc
    def selected_opening() -> Opening:
        return OPENING_LOOKUP.get(input.opening(), OPENINGS[0])

    @reactive.effect
    @reactive.event(input.opening)
    def _reset_for_opening():
        opening = selected_opening()
        playing.set(False)
        ui.update_slider(
            "step",
            min=0,
            max=len(opening.moves),
            value=0,
            session=session,
        )

    @reactive.effect
    @reactive.event(input.previous)
    def _previous():
        playing.set(False)
        ui.update_slider("step", value=max(0, int(input.step()) - 1), session=session)

    @reactive.effect
    @reactive.event(input.next)
    def _next():
        opening = selected_opening()
        playing.set(False)
        ui.update_slider(
            "step",
            value=min(len(opening.moves), int(input.step()) + 1),
            session=session,
        )

    @reactive.effect
    @reactive.event(input.reset)
    def _reset():
        playing.set(False)
        ui.update_slider("step", value=0, session=session)

    @reactive.effect
    @reactive.event(input.play)
    def _toggle_play():
        opening = selected_opening()
        if int(input.step()) >= len(opening.moves):
            ui.update_slider("step", value=0, session=session)
        playing.set(not playing.get())

    @reactive.effect
    def _autoplay():
        if not playing.get():
            return
        reactive.invalidate_later(1.15, session=session)
        opening = selected_opening()
        step = int(input.step())
        if step >= len(opening.moves):
            playing.set(False)
            return
        ui.update_slider("step", value=step + 1, session=session)

    @render.ui
    def board():
        opening = selected_opening()
        position = play_san_line(opening.moves, int(input.step()))
        return ui.div(
            board_ui(position.board, last_move=position.last_move),
            class_="board-frame",
        )

    @render.ui
    def opening_details():
        opening = selected_opening()
        return ui.div(
            ui.div(
                ui.span(class_="opening-swatch", style=f"background:{opening.color}"),
                ui.span(opening.family, class_="opening-family"),
                class_="opening-meta",
            ),
            ui.h3(opening.character),
            ui.p(opening.idea),
            class_="opening-details",
        )

    @render.ui
    def move_list():
        opening = selected_opening()
        step = int(input.step())
        moves = []
        for index, san in enumerate(opening.moves):
            move_number = index // 2 + 1
            prefix = f"{move_number}." if index % 2 == 0 else f"{move_number}..."
            classes = ["move-chip"]
            if index < step:
                classes.append("played")
            if index == step - 1:
                classes.append("current")
            moves.append(ui.span(f"{prefix} {san}", class_=" ".join(classes)))
        return ui.div(
            ui.div(
                f"{step}/{len(opening.moves)} half-moves",
                class_="move-progress-label",
            ),
            ui.div(*moves, class_="move-list"),
        )
