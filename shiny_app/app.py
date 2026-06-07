from __future__ import annotations

import sys
from pathlib import Path

from shiny import App, Inputs, Outputs, Session, reactive, ui

APP_DIR = Path(__file__).resolve().parent
REPO_ROOT = APP_DIR.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from shiny_app.data import PERIOD_DISPLAY, PERIOD_ORDER, load_app_data  # noqa: E402
from shiny_app.modules.blunders import blunders_server, blunders_ui  # noqa: E402
from shiny_app.modules.elo_predictor import (  # noqa: E402
    elo_predictor_server,
    elo_predictor_ui,
)
from shiny_app.modules.game_length import (  # noqa: E402
    game_length_server,
    game_length_ui,
)
from shiny_app.modules.opening_simulator import (  # noqa: E402
    opening_simulator_server,
    opening_simulator_ui,
)
from shiny_app.modules.opening_tree import (  # noqa: E402
    opening_tree_server,
    opening_tree_ui,
)
from shiny_app.modules.opening_trends import (  # noqa: E402
    opening_trends_server,
    opening_trends_ui,
)
from shiny_app.modules.piece_squares import (  # noqa: E402
    piece_squares_server,
    piece_squares_ui,
)

WWW_DIR = APP_DIR / "www"
DATA = load_app_data()


def overview_ui() -> ui.Tag:
    era_cards = [
        (
            "2015-16",
            "Pre-AI",
            "The last baseline before neural chess changed public preparation.",
            "pre-ai",
        ),
        (
            "2018-19",
            "Early Post-AI",
            "AlphaZero ideas begin circulating through elite and online play.",
            "early-post-ai",
        ),
        (
            "2021-22",
            "NNUE Era",
            "Neural evaluation enters the open-source engine used by everyone.",
            "nnue-era",
        ),
        (
            "2023-25",
            "Modern",
            "Engine analysis, streaming, and personalized coaching converge.",
            "modern",
        ),
    ]
    return ui.div(
        ui.tags.section(
            ui.div(
                ui.div("COMP4010 · Interactive visual analytics", class_="hero-kicker"),
                ui.h1(
                    "Beyond the Engine",
                    ui.span("Human Play in the AI Era"),
                ),
                ui.p(
                    "Did widely available chess AI change how humans open games, "
                    "make mistakes, place pieces, and convert move quality into skill?"
                ),
                ui.div(
                    ui.div(ui.strong("200K"), ui.span("Lichess games")),
                    ui.div(ui.strong("4"), ui.span("AI eras")),
                    ui.div(ui.strong("7"), ui.span("interactive views")),
                    ui.div(ui.strong("1"), ui.span("predictive model")),
                    class_="hero-stats",
                ),
                class_="hero-copy",
            ),
            ui.div(
                ui.div("♞", class_="hero-knight"),
                ui.div(
                    ui.span("Research question"),
                    ui.p("What changed when engines became teachers?"),
                    class_="hero-question",
                ),
                class_="hero-visual",
                aria_hidden="true",
            ),
            class_="hero",
        ),
        ui.tags.section(
            ui.div(
                ui.span("Study design", class_="section-eyebrow"),
                ui.h2("Four snapshots of changing chess culture"),
                ui.p(
                    "The same semantic color follows each era through every linked chart."
                ),
                class_="overview-heading",
            ),
            ui.div(
                *[
                    ui.div(
                        ui.span(years, class_="era-years"),
                        ui.h3(label),
                        ui.p(description),
                        class_=f"era-card {period}",
                    )
                    for years, label, description, period in era_cards
                ],
                class_="era-grid",
            ),
            class_="overview-section",
        ),
        ui.tags.section(
            ui.div(
                ui.h2("How to explore"),
                ui.p(
                    "Use the sidebar to filter eras across linked views, then use each "
                    "section's controls for a focused comparison. Hover charts for exact values."
                ),
                class_="overview-heading",
            ),
            ui.div(
                ui.div(
                    ui.span("01", class_="journey-number"),
                    ui.h3("See the repertoire"),
                    ui.p("Move from branching openings to long-term popularity."),
                    class_="journey-card",
                ),
                ui.div(
                    ui.span("02", class_="journey-number"),
                    ui.h3("Measure behavior"),
                    ui.p("Compare blunders, game duration, and spatial preferences."),
                    class_="journey-card",
                ),
                ui.div(
                    ui.span("03", class_="journey-number"),
                    ui.h3("Become the data"),
                    ui.p("Play against the bot and generate your own prediction."),
                    class_="journey-card",
                ),
                class_="journey-grid",
            ),
            class_="overview-section",
        ),
        class_="page-content overview-page",
    )


app_ui = ui.page_navbar(
    ui.nav_panel("Overview", overview_ui(), value="overview"),
    ui.nav_panel("Opening Tree", opening_tree_ui("opening_tree"), value="tree"),
    ui.nav_panel(
        "Opening Revolution",
        opening_trends_ui("opening_trends"),
        value="trends",
    ),
    ui.nav_panel(
        "Opening Simulator",
        opening_simulator_ui("opening_simulator"),
        value="simulator",
    ),
    ui.nav_panel("Blunders", blunders_ui("blunders"), value="blunders"),
    ui.nav_panel("Game Length", game_length_ui("game_length"), value="length"),
    ui.nav_panel(
        "Piece Squares",
        piece_squares_ui("piece_squares"),
        value="pieces",
    ),
    ui.nav_panel("Guess ELO", elo_predictor_ui("elo_predictor"), value="elo"),
    title=ui.div(
        ui.span("♞", class_="brand-mark"),
        ui.span("Beyond the Engine", class_="brand-name"),
        class_="brand",
    ),
    id="main_navigation",
    selected="overview",
    sidebar=ui.sidebar(
        ui.div("Linked filter", class_="sidebar-kicker"),
        ui.h2("Compare eras"),
        ui.p(
            "This selection updates every historical chart while preserving each "
            "section's local controls.",
            class_="sidebar-copy",
        ),
        ui.input_checkbox_group(
            "eras",
            None,
            choices={period: PERIOD_DISPLAY[period] for period in PERIOD_ORDER},
            selected=PERIOD_ORDER,
        ),
        ui.div(
            ui.span("Tip"),
            ui.p("Keep at least two eras selected when looking for change."),
            class_="sidebar-tip",
        ),
        width=275,
        open="desktop",
        class_="global-sidebar",
    ),
    header=ui.head_content(
        ui.tags.meta(name="viewport", content="width=device-width, initial-scale=1"),
        ui.tags.meta(name="color-scheme", content="dark"),
        ui.tags.meta(name="theme-color", content="#1A1A1A"),
        ui.tags.link(
            rel="preconnect",
            href="https://fonts.googleapis.com",
        ),
        ui.tags.link(
            rel="stylesheet",
            href=(
                "https://fonts.googleapis.com/css2?"
                "family=Cormorant+Garamond:wght@500;600;700&"
                "family=DM+Sans:wght@400;500;600;700&display=swap"
            ),
        ),
        ui.include_css(WWW_DIR / "styles.css"),
    ),
    footer=ui.div(
        ui.span("Beyond the Engine"),
        ui.span("COMP4010 Data Visualization · VinUniversity"),
        class_="site-footer",
    ),
    navbar_options=ui.navbar_options(
        position="fixed-top",
        bg="#1A1A1A",
        theme="dark",
        underline=False,
        collapsible=True,
    ),
    window_title="Beyond the Engine · Human Play in the AI Era",
    fillable=False,
)


def server(input: Inputs, output: Outputs, session: Session) -> None:
    last_valid_eras = reactive.value(tuple(PERIOD_ORDER))

    @reactive.effect
    def _keep_era_selection_valid() -> None:
        selected = tuple(input.eras() or ())
        if selected:
            last_valid_eras.set(selected)
            return
        ui.update_checkbox_group(
            "eras",
            selected=list(last_valid_eras.get()),
            session=session,
        )

    @reactive.calc
    def selected_eras() -> tuple[str, ...]:
        selected = tuple(input.eras() or ())
        return selected or last_valid_eras.get()

    opening_tree_server("opening_tree", DATA, selected_eras)
    opening_trends_server("opening_trends", DATA, selected_eras)
    opening_simulator_server("opening_simulator")
    blunders_server("blunders", DATA, selected_eras)
    game_length_server("game_length", DATA, selected_eras)
    piece_squares_server("piece_squares", DATA, selected_eras)
    elo_predictor_server("elo_predictor", DATA)


app = App(app_ui, server, static_assets=WWW_DIR)
