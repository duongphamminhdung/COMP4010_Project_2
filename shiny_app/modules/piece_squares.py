from __future__ import annotations

from collections.abc import Callable

import pandas as pd
import plotly.graph_objects as go
from shiny import Inputs, Outputs, Session, module, reactive, render, ui
from shinywidgets import output_widget, render_plotly

from shiny_app.data import PERIOD_DISPLAY, PERIOD_ORDER, AppData
from shiny_app.theme import COLORS, apply_plotly_theme, rgba
from shiny_app.ui_helpers import chart_shell, insight_box, metric_card, section_intro

PIECES = {"N": "Knight", "B": "Bishop", "R": "Rook", "Q": "Queen"}
PIECE_SYMBOLS = {"N": "♞", "B": "♝", "R": "♜", "Q": "♛"}
FILES = list("abcdefgh")
RANKS = list(range(8, 0, -1))
HEAT_LOW = "#FED7AA"
HEAT_HIGH = "#EA580C"


def _interpolate_color(low: str, high: str, amount: float) -> str:
    amount = min(max(amount, 0), 1)
    low_rgb = [int(low[index : index + 2], 16) for index in (1, 3, 5)]
    high_rgb = [int(high[index : index + 2], 16) for index in (1, 3, 5)]
    mixed = [
        round(start + (end - start) * amount)
        for start, end in zip(low_rgb, high_rgb, strict=True)
    ]
    return f"#{mixed[0]:02X}{mixed[1]:02X}{mixed[2]:02X}"


@module.ui
def piece_squares_ui():
    return ui.TagList(
        section_intro(
            "06",
            "Spatial strategy",
            "Where Do Pieces Go Now?",
            "Destination-square bubbles place strategic habits directly on a chess board.",
            [
                (
                    "Read",
                    "Deeper orange squares mean a larger share of that piece's visits.",
                ),
                (
                    "Why",
                    "A board preserves spatial meaning that a bar chart would lose.",
                ),
                (
                    "Explore",
                    "Choose a piece and era; the section sidebar constrains the era list.",
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
                ui.div(
                    output_widget("board", height="560px"),
                    ui.div(
                        ui.span("Less"),
                        ui.span(class_="piece-heat-gradient"),
                        ui.span("More"),
                        class_="piece-heat-legend",
                    ),
                    class_="piece-board-panel",
                ),
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
        rows = rows.copy()
        rows["file"] = (
            rows["square"].str[0].map({file: i + 1 for i, file in enumerate(FILES)})
        )
        rows["rank"] = rows["square"].str[1:].astype(int)
        rows = rows.sort_values("pct", ascending=False)
        max_pct = max(float(rows["pct"].max()), 0.01)
        rows["heat"] = (rows["pct"] / max_pct) ** 0.7

        shapes = []
        row_lookup = rows.set_index("square")
        for rank in range(1, 9):
            for file_index in range(1, 9):
                light = (rank + file_index) % 2 == 1
                shapes.append(
                    {
                        "type": "rect",
                        "xref": "x",
                        "yref": "y",
                        "x0": file_index - 0.5,
                        "x1": file_index + 0.5,
                        "y0": rank - 0.5,
                        "y1": rank + 0.5,
                        "line": {"width": 0},
                        "fillcolor": (
                            COLORS["board_light"] if light else COLORS["board_dark"]
                        ),
                        "layer": "below",
                    }
                )
                square = f"{FILES[file_index - 1]}{rank}"
                if square in row_lookup.index:
                    heat = float(row_lookup.loc[square, "heat"])
                    heat_color = _interpolate_color(HEAT_LOW, HEAT_HIGH, heat)
                    shapes.append(
                        {
                            "type": "rect",
                            "xref": "x",
                            "yref": "y",
                            "x0": file_index - 0.5,
                            "x1": file_index + 0.5,
                            "y0": rank - 0.5,
                            "y1": rank + 0.5,
                            "line": {
                                "color": rgba("#7C2D12", 0.12 + heat * 0.22),
                                "width": 0.7,
                            },
                            "fillcolor": rgba(heat_color, 0.22 + heat * 0.72),
                            "layer": "below",
                        }
                    )

        top_label_rows = rows.head(8)
        fig = go.Figure()
        fig.add_trace(
            go.Scatter(
                x=rows["file"],
                y=rows["rank"],
                mode="markers",
                marker={
                    "size": 48,
                    "color": rgba(HEAT_HIGH, 0.002),
                    "line": {"width": 0},
                },
                customdata=rows[["square", "pct", "count"]],
                hovertemplate=(
                    "<b>%{customdata[0]}</b><br>"
                    f"{PIECES[input.piece()]} visits: %{{customdata[1]:.2f}}%<br>"
                    "Raw count: %{customdata[2]:,.0f}<extra></extra>"
                ),
                showlegend=False,
            )
        )
        fig.add_trace(
            go.Scatter(
                x=top_label_rows["file"],
                y=top_label_rows["rank"],
                mode="text",
                text=[
                    f"{PIECE_SYMBOLS[input.piece()]}<br>{pct:.1f}%"
                    for pct in top_label_rows["pct"]
                ],
                textfont={"family": "Georgia, serif", "size": 13, "color": "#FFF7ED"},
                hoverinfo="skip",
                showlegend=False,
            )
        )
        apply_plotly_theme(fig, margin={"l": 44, "r": 30, "t": 18, "b": 38})
        fig.update_layout(
            shapes=shapes,
            xaxis={
                "range": [0.5, 8.5],
                "tickmode": "array",
                "tickvals": list(range(1, 9)),
                "ticktext": FILES,
                "side": "bottom",
                "scaleanchor": "y",
                "showgrid": False,
                "zeroline": False,
                "title": "",
            },
            yaxis={
                "range": [0.5, 8.5],
                "tickmode": "array",
                "tickvals": list(range(1, 9)),
                "ticktext": list(range(1, 9)),
                "showgrid": False,
                "zeroline": False,
                "title": "",
            },
            plot_bgcolor=COLORS["card"],
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
                HEAT_HIGH,
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
