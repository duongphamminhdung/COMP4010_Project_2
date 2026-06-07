from __future__ import annotations

from collections.abc import Callable

import pandas as pd
import plotly.graph_objects as go
from shiny import Inputs, Outputs, Session, module, reactive, render, ui
from shinywidgets import output_widget, render_plotly

from shiny_app.data import (
    ELO_BRACKETS,
    PERIOD_DISPLAY,
    PERIOD_ORDER,
    AppData,
)
from shiny_app.theme import COLORS, apply_plotly_theme
from shiny_app.ui_helpers import chart_shell, insight_box, metric_card, section_intro


@module.ui
def blunders_ui():
    return ui.TagList(
        section_intro(
            "04",
            "Move quality",
            "Did AI Make Us Blunder Less?",
            "Blunders per game across six rating groups and the four AI eras.",
            [
                ("Read", "Rows are ELO brackets; columns are eras."),
                (
                    "Why",
                    "The grid makes cross-era and cross-skill comparisons immediate.",
                ),
                ("Explore", "Use the section era filter or focus on one rating group."),
            ],
        ),
        chart_shell(
            ui.div(
                ui.input_select(
                    "elo",
                    "Rating focus",
                    choices={
                        "all": "All ELO brackets",
                        **{elo: elo for elo in ELO_BRACKETS},
                    },
                    selected="all",
                ),
                class_="chart-controls compact",
            ),
            output_widget("heatmap", height="500px"),
            ui.output_ui("change_cards"),
        ),
        insight_box(
            "Blunders declined across every skill level.",
            "The largest relative improvements appear in the middle rating brackets, "
            "where players can understand engine feedback but still make frequent tactical errors.",
        ),
    )


@module.server
def blunders_server(
    input: Inputs,
    output: Outputs,
    session: Session,
    data: AppData,
    selected_eras: Callable[[], tuple[str, ...]],
):
    @reactive.calc
    def filtered() -> pd.DataFrame:
        labels = [PERIOD_DISPLAY[period] for period in selected_eras()]
        rows = data.blunders[data.blunders["period"].isin(labels)].copy()
        if input.elo() and input.elo() != "all":
            rows = rows[rows["elo"] == input.elo()]
        return rows

    @render_plotly
    def heatmap():
        rows = filtered()
        period_labels = [
            PERIOD_DISPLAY[period]
            for period in PERIOD_ORDER
            if period in selected_eras()
        ]
        elo_labels = (
            [input.elo()] if input.elo() and input.elo() != "all" else ELO_BRACKETS
        )
        pivot = rows.pivot(index="elo", columns="period", values="value").reindex(
            index=elo_labels, columns=period_labels
        )

        fig = go.Figure(
            go.Heatmap(
                z=pivot.values,
                x=pivot.columns,
                y=pivot.index,
                colorscale=[
                    [0.0, "#10b981"],
                    [0.5, "#334155"],
                    [0.72, "#fbbf24"],
                    [1.0, "#ef4444"],
                ],
                text=pivot.values,
                texttemplate="%{text:.2f}",
                textfont={"size": 15},
                colorbar={"title": "Blunders/game"},
                hovertemplate="<b>%{y}</b><br>%{x}<br>%{z:.2f} blunders/game<extra></extra>",
            )
        )
        apply_plotly_theme(fig, margin={"l": 86, "r": 30, "t": 24, "b": 46})
        fig.update_layout(
            xaxis={"side": "top"},
            yaxis={"autorange": "reversed"},
        )
        return fig

    @render.ui
    def change_cards():
        if not {"pre-ai", "modern"}.issubset(set(selected_eras())):
            return ui.p(
                "Select both Pre-AI and Modern to display endpoint changes.",
                class_="control-hint",
            )
        rows = data.blunders
        cards = []
        focus = [input.elo()] if input.elo() != "all" else ELO_BRACKETS
        for elo in focus:
            pre = rows[(rows["elo"] == elo) & (rows["period"] == "Pre-AI")]
            modern = rows[(rows["elo"] == elo) & (rows["period"] == "Modern")]
            if pre.empty or modern.empty:
                continue
            pre_value = float(pre.iloc[0]["value"])
            modern_value = float(modern.iloc[0]["value"])
            change = (modern_value - pre_value) / pre_value * 100
            cards.append(
                metric_card(
                    elo,
                    f"{change:.1f}%",
                    "Pre-AI → Modern",
                    COLORS["positive"] if change < 0 else COLORS["negative"],
                )
            )
        return ui.div(*cards, class_="metric-grid six")
