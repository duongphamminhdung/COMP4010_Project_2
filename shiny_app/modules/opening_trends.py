from __future__ import annotations

import math
from collections.abc import Callable

import pandas as pd
import plotly.graph_objects as go
from shiny import Inputs, Outputs, Session, module, reactive, render, ui
from shinywidgets import output_widget, render_plotly

from shiny_app.data import AppData, selected_years
from shiny_app.theme import COLORS, apply_plotly_theme, opening_color
from shiny_app.ui_helpers import chart_shell, insight_box, metric_card, section_intro


def _nice_popularity_ceiling(value: float) -> float:
    return max(5.0, math.ceil((value + 1) / 5) * 5)


@module.ui
def opening_trends_ui():
    return ui.TagList(
        section_intro(
            "02",
            "Opening popularity",
            "The Opening Revolution",
            "Named opening systems rise and fall around AlphaZero and Stockfish NNUE.",
            [
                ("Read", "Higher lines represent a larger share of games."),
                ("Why", "Slopes reveal gradual adoption rather than one sudden break."),
                ("Explore", "Global era filters change the visible years and ranking."),
            ],
        ),
        chart_shell(
            output_widget("trend", height="520px"),
            ui.output_ui("ranking"),
        ),
        insight_box(
            "The revolution was gradual, not abrupt.",
            "The Sicilian remains dominant, while classical systems such as the Italian "
            "and Queen's Gambit shift incrementally around the AI milestones.",
        ),
    )


@module.server
def opening_trends_server(
    input: Inputs,
    output: Outputs,
    session: Session,
    data: AppData,
    selected_eras: Callable[[], tuple[str, ...]],
):
    y_max = _nice_popularity_ceiling(float(data.opening_by_year["pct"].max()))

    @reactive.calc
    def filtered() -> pd.DataFrame:
        years = selected_years(selected_eras())
        if not years:
            return data.opening_by_year.iloc[0:0].copy()
        return data.opening_by_year[data.opening_by_year["year"].isin(years)].copy()

    @render_plotly
    def trend():
        rows = filtered()
        fig = go.Figure()
        if rows.empty:
            fig.add_annotation(
                text="Select at least one era to view opening trends.",
                showarrow=False,
                font={"color": COLORS["text_secondary"], "size": 16},
            )
        else:
            openings = (
                rows.groupby("opening", as_index=False)["pct"]
                .mean()
                .sort_values("pct", ascending=False)["opening"]
                .head(8)
                .tolist()
            )
            for index, opening in enumerate(openings):
                subset = rows[rows["opening"] == opening].sort_values("year")
                color = opening_color(opening, index)
                fig.add_trace(
                    go.Scatter(
                        x=subset["year"],
                        y=subset["pct"],
                        mode="lines+markers",
                        name=opening,
                        line={"width": 3, "color": color},
                        marker={
                            "size": 7,
                            "color": color,
                            "line": {"color": COLORS["background"], "width": 1.5},
                        },
                        hovertemplate=(
                            f"<b>{opening}</b><br>"
                            "Year %{x}<br>%{y:.2f}% of games<extra></extra>"
                        ),
                    )
                )

            fig.add_vline(
                x=2017,
                line_dash="dash",
                line_color="#e2e8f0",
                annotation_text="AlphaZero",
                annotation_position="top left",
            )
            fig.add_vline(
                x=2020,
                line_dash="dash",
                line_color="#fbbf24",
                annotation_text="NNUE",
                annotation_position="top right",
            )

        apply_plotly_theme(fig, margin={"l": 48, "r": 18, "t": 34, "b": 48})
        fig.update_layout(
            xaxis={"title": "Year", "dtick": 1, "gridcolor": "#3d3b38"},
            yaxis={
                "title": "Popularity (%)",
                "ticksuffix": "%",
                "gridcolor": "#3d3b38",
                "range": [0, y_max],
            },
            legend={"orientation": "h", "y": 1.14, "x": 0},
            hovermode="x unified",
        )
        return fig

    @render.ui
    def ranking():
        rows = filtered()
        if rows.empty:
            return None
        latest = int(rows["year"].max())
        earliest = int(rows["year"].min())
        latest_rows = rows[rows["year"] == latest].sort_values("pct", ascending=False)
        cards = []
        for index, (_, row) in enumerate(latest_rows.head(5).iterrows()):
            baseline = rows[
                (rows["opening"] == row["opening"]) & (rows["year"] == earliest)
            ]
            change = float(row["pct"]) - (
                float(baseline.iloc[0]["pct"])
                if not baseline.empty
                else float(row["pct"])
            )
            cards.append(
                metric_card(
                    f"#{index + 1} in {latest}",
                    str(row["opening"]),
                    f"{row['pct']:.2f}% · {change:+.2f} points since {earliest}",
                    opening_color(str(row["opening"]), index),
                )
            )
        return ui.div(*cards, class_="metric-grid five")
