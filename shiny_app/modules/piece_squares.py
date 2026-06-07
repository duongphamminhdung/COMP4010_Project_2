from __future__ import annotations

from collections.abc import Callable

import pandas as pd
import plotly.graph_objects as go
from shiny import Inputs, Outputs, Session, module, reactive, render, ui
from shinywidgets import output_widget, render_plotly

from shiny_app.data import PERIOD_DISPLAY, PERIOD_ORDER, AppData
from shiny_app.theme import COLORS, apply_plotly_theme
from shiny_app.ui_helpers import chart_shell, insight_box, metric_card, section_intro

PIECES = {"N": "Knight", "B": "Bishop", "R": "Rook", "Q": "Queen"}
FILES = list("abcdefgh")
RANKS = list(range(8, 0, -1))


@module.ui
def piece_squares_ui():
    return ui.TagList(
        section_intro(
            "06",
            "Spatial strategy",
            "Where Do Pieces Go Now?",
            "Destination-square heatmaps place strategic habits directly on the chess board.",
            [
                (
                    "Read",
                    "Brighter squares mean a larger share of that piece's visits.",
                ),
                (
                    "Why",
                    "A board preserves spatial meaning that a bar chart would lose.",
                ),
                (
                    "Explore",
                    "Choose a piece and era; global filters constrain the era list.",
                ),
            ],
        ),
        chart_shell(
            ui.div(
                ui.input_radio_buttons(
                    "piece",
                    "Piece",
                    choices=PIECES,
                    selected="N",
                    inline=True,
                ),
                ui.input_select(
                    "period",
                    "Era",
                    choices={period: PERIOD_DISPLAY[period] for period in PERIOD_ORDER},
                    selected="modern",
                ),
                class_="chart-controls",
            ),
            ui.layout_columns(
                output_widget("board", height="560px"),
                ui.output_ui("stats"),
                col_widths=(8, 4),
            ),
        ),
        insight_box(
            "Board geometry dominates era effects.",
            "Knights and bishops continue to favor the same natural outposts and diagonals. "
            "The more credible era comparison is concentration, not a wholesale relocation of pieces.",
        ),
    )


@module.server
def piece_squares_server(
    input: Inputs,
    output: Outputs,
    session: Session,
    data: AppData,
    selected_eras: Callable[[], tuple[str, ...]],
):
    @reactive.effect
    def _sync_period_choices():
        eras = selected_eras()
        choices = {
            period: PERIOD_DISPLAY[period] for period in PERIOD_ORDER if period in eras
        }
        if not choices:
            choices = {"modern": "Modern"}
        selected = input.period()
        if selected not in choices:
            selected = next(reversed(choices))
        ui.update_select("period", choices=choices, selected=selected, session=session)

    @reactive.calc
    def board_rows() -> pd.DataFrame:
        rows = data.piece_squares
        filtered = rows[
            (rows["piece"] == input.piece()) & (rows["period"] == input.period())
        ].copy()
        total = filtered["count"].sum()
        filtered["pct"] = filtered["count"] / total * 100 if total else 0
        return filtered

    @render_plotly
    def board():
        rows = board_rows()
        lookup = dict(zip(rows["square"], rows["pct"], strict=False))
        z = [
            [float(lookup.get(f"{file}{rank}", 0)) for file in FILES] for rank in RANKS
        ]
        text = [[f"{file}{rank}" for file in FILES] for rank in RANKS]
        fig = go.Figure(
            go.Heatmap(
                z=z,
                x=FILES,
                y=RANKS,
                text=text,
                colorscale=[
                    [0, "#262626"],
                    [0.2, "#365314"],
                    [0.55, "#65a30d"],
                    [1, "#bef264"],
                ],
                colorbar={"title": "% visits"},
                hovertemplate="<b>%{text}</b><br>%{z:.2f}% of visits<extra></extra>",
            )
        )
        apply_plotly_theme(fig, margin={"l": 44, "r": 30, "t": 18, "b": 38})
        fig.update_layout(
            xaxis={"side": "bottom", "scaleanchor": "y", "gridcolor": "#3d3b38"},
            yaxis={"gridcolor": "#3d3b38"},
        )
        return fig

    @render.ui
    def stats():
        rows = board_rows().sort_values("pct", ascending=False)
        if rows.empty:
            return ui.p("No data for this selection.", class_="empty-state")
        center = {
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
        }
        center_pct = rows.loc[rows["square"].isin(center), "pct"].sum()
        hotspot_pct = rows.head(8)["pct"].sum()
        top = rows.iloc[0]
        cards = [
            metric_card(
                "Top square",
                str(top["square"]),
                f"{top['pct']:.1f}% of visits",
                COLORS["accent"],
            ),
            metric_card(
                "Center share",
                f"{center_pct:.1f}%",
                "16 central squares",
                COLORS["warning"],
            ),
            metric_card(
                "Hotspot share",
                f"{hotspot_pct:.1f}%",
                "Top 8 destination squares",
                "#60A5FA",
            ),
        ]
        top_three = ", ".join(
            f"{row.square} ({row.pct:.1f}%)" for row in rows.head(3).itertuples()
        )
        return ui.div(
            ui.div(*cards, class_="metric-stack"),
            ui.div(
                ui.h3(f"{PIECES[input.piece()]} pattern"),
                ui.p(f"Top destinations: {top_three}."),
                ui.p(
                    "Switch eras to test whether the hotspots move or simply become more concentrated."
                ),
                class_="explanation-card",
            ),
        )
