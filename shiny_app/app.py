from __future__ import annotations

import sys
from pathlib import Path

from shiny import App, Inputs, Outputs, Session, reactive, render, ui

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

SIDEBAR_CONTENT = {
    "overview": (
        "Project guide",
        "Start with the story",
        "Move through the sections from repertoire structure to the interactive rating signal.",
        "Each section gives this panel a focused role.",
        False,
    ),
    "tree": (
        "Section 01",
        "Read the tree",
        "The opening map combines all four snapshots so the structure stays readable.",
        "Hover from the center outward. Each ring adds one ply.",
        False,
    ),
    "trends": (
        "Section 02",
        "Choose the timeline",
        "Select the eras whose years should remain visible in the opening-popularity chart.",
        "Keep adjacent eras selected to see whether adoption was gradual.",
        True,
    ),
    "simulator": (
        "Section 03",
        "Opening lab",
        "Choose an opening in the main panel, then step through its defining moves.",
        "Pause on any move to connect the name with the board position.",
        False,
    ),
    "blunders": (
        "Section 04",
        "Compare accuracy",
        "Use eras here to control the heatmap columns and endpoint comparisons.",
        "Keep Pre-AI and Modern selected to reveal the full change cards.",
        True,
    ),
    "length": (
        "Section 05",
        "Compare duration",
        "Choose which era distributions and median cards appear together.",
        "Two or more curves make shape differences easier to judge.",
        True,
    ),
    "pieces": (
        "Section 06",
        "Spatial lens",
        "Select the eras available to the local piece-placement view.",
        "Use the same piece across eras to compare hotspot concentration.",
        True,
    ),
    "elo": (
        "Section 07",
        "Play the model",
        "Play White for at least 20 moves, then inspect the ACPL-based rating signal.",
        "This is a noisy analytical demo, not a true rating measurement.",
        False,
    ),
}


def contextual_sidebar(section: str, selected: tuple[str, ...]) -> ui.Tag:
    kicker, title, copy, tip, show_eras = SIDEBAR_CONTENT.get(
        section,
        SIDEBAR_CONTENT["overview"],
    )
    return ui.div(
        ui.div(kicker, class_="sidebar-kicker"),
        ui.h2(title),
        ui.p(copy, class_="sidebar-copy"),
        (
            ui.TagList(
                ui.div("Era comparison", class_="sidebar-control-label"),
                ui.input_checkbox_group(
                    "eras",
                    None,
                    choices={period: PERIOD_DISPLAY[period] for period in PERIOD_ORDER},
                    selected=list(selected),
                ),
            )
            if show_eras
            else None
        ),
        ui.div(
            ui.span("Tip"),
            ui.p(tip),
            class_="sidebar-tip",
        ),
        class_="section-sidebar-content",
    )


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
                    "The sidebar changes with each section, exposing only the controls "
                    "and guidance needed for that view. Hover charts for exact values."
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
                    ui.p(
                        "Play against the bot and inspect a single-game rating signal."
                    ),
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
    ui.nav_panel("Rating Signal", elo_predictor_ui("elo_predictor"), value="elo"),
    title=ui.div(
        ui.span("♞", class_="brand-mark"),
        ui.span("Beyond the Engine", class_="brand-name"),
        class_="brand",
    ),
    id="main_navigation",
    selected="overview",
    sidebar=ui.sidebar(
        ui.output_ui("section_sidebar"),
        width=275,
        open="desktop",
        class_="global-sidebar contextual-sidebar",
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

    @render.ui
    def section_sidebar():
        section = input.main_navigation() or "overview"
        with reactive.isolate():
            selected = last_valid_eras.get()
        return contextual_sidebar(section, selected)

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

    opening_tree_server("opening_tree", DATA)
    opening_trends_server("opening_trends", DATA, selected_eras)
    opening_simulator_server("opening_simulator")
    blunders_server("blunders", DATA, selected_eras)
    game_length_server("game_length", DATA, selected_eras)
    piece_squares_server("piece_squares", DATA, selected_eras)
    elo_predictor_server("elo_predictor", DATA)


app = App(app_ui, server, static_assets=WWW_DIR)
