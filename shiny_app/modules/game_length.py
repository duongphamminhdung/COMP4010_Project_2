from __future__ import annotations

from collections.abc import Callable

import pandas as pd
import plotly.graph_objects as go
from shiny import Inputs, Outputs, Session, module, reactive, render, ui
from shinywidgets import output_widget, render_plotly

from shiny_app.data import DISPLAY_COLORS, PERIOD_DISPLAY, PERIOD_ORDER, AppData
from shiny_app.theme import COLORS, apply_plotly_theme, rgba
from shiny_app.ui_helpers import chart_shell, insight_box, metric_card, section_intro


def _weighted_median(ply: pd.Series, count: pd.Series) -> float:
    ordered = pd.DataFrame({"ply": ply, "count": count}).sort_values("ply")
    threshold = ordered["count"].sum() / 2
    return float(ordered.loc[ordered["count"].cumsum() >= threshold, "ply"].iloc[0])


@module.ui
def game_length_ui():
    return ui.TagList(
        section_intro(
            "05",
            "Game duration",
            "Did Games Become Shorter?",
            "Normalized game-length distributions reveal whether the shape shifted across eras.",
            [
                ("Read", "Each line is the percentage of games ending at that ply."),
                (
                    "Why",
                    "Normalization prevents sample-size differences from misleading us.",
                ),
                (
                    "Explore",
                    "Global era filters update both the curves and median cards.",
                ),
            ],
        ),
        chart_shell(
            ui.output_ui("medians"),
            output_widget("distribution", height="500px"),
        ),
        insight_box(
            "Games became slightly shorter, not fundamentally different.",
            "Median length falls from 65 ply before AI to 62 in the NNUE era, "
            "then settles at 63 in the modern sample. The curves still overlap heavily.",
        ),
    )


@module.server
def game_length_server(
    input: Inputs,
    output: Outputs,
    session: Session,
    data: AppData,
    selected_eras: Callable[[], tuple[str, ...]],
):
    @reactive.calc
    def normalized() -> tuple[pd.DataFrame, dict[str, tuple[float, int]]]:
        rows = data.game_length.copy()
        result = pd.DataFrame({"ply": rows["ply"]})
        summaries: dict[str, tuple[float, int]] = {}
        for period in selected_eras():
            label = PERIOD_DISPLAY[period]
            if label not in rows.columns:
                continue
            counts = pd.to_numeric(rows[label], errors="coerce").fillna(0)
            total = int(counts.sum())
            result[label] = counts / total * 100 if total else 0
            summaries[label] = (_weighted_median(rows["ply"], counts), total)
        return result[(result["ply"] >= 7) & (result["ply"] <= 178)], summaries

    @render.ui
    def medians():
        _, summaries = normalized()
        cards = [
            metric_card(
                label,
                f"{median / 2:.1f} moves",
                f"Median · {total:,} games",
                DISPLAY_COLORS[label],
            )
            for label, (median, total) in summaries.items()
        ]
        return ui.div(*cards, class_="metric-grid four")

    @render_plotly
    def distribution():
        rows, _ = normalized()
        fig = go.Figure()
        for period in PERIOD_ORDER:
            if period not in selected_eras():
                continue
            label = PERIOD_DISPLAY[period]
            if label not in rows:
                continue
            fig.add_trace(
                go.Scatter(
                    x=rows["ply"],
                    y=rows[label],
                    mode="lines",
                    name=label,
                    line={"color": DISPLAY_COLORS[label], "width": 2.6},
                    fill="tozeroy",
                    fillcolor=rgba(DISPLAY_COLORS[label], 0.04),
                    hovertemplate=f"<b>{label}</b><br>Ply %{{x}}<br>%{{y:.2f}}% of games<extra></extra>",
                )
            )
        fig.add_vline(
            x=80,
            line_dash="dot",
            line_color=COLORS["text_muted"],
            annotation_text="Move 40",
        )
        fig.add_vline(
            x=120,
            line_dash="dot",
            line_color=COLORS["text_muted"],
            annotation_text="Move 60",
        )
        apply_plotly_theme(fig, margin={"l": 52, "r": 18, "t": 28, "b": 48})
        fig.update_layout(
            xaxis={"title": "Ply (half-move)", "gridcolor": "#3d3b38"},
            yaxis={
                "title": "Games ending (%)",
                "ticksuffix": "%",
                "gridcolor": "#3d3b38",
            },
            legend={"orientation": "h", "y": 1.12},
            hovermode="x unified",
        )
        return fig
