from __future__ import annotations

from collections.abc import Callable

import plotly.graph_objects as go
from shiny import Inputs, Outputs, Session, module, reactive, ui
from shinywidgets import output_widget, render_plotly

from shiny_app.data import PERIOD_DISPLAY, PERIOD_ORDER, AppData
from shiny_app.theme import apply_plotly_theme
from shiny_app.ui_helpers import chart_shell, insight_box, section_intro

ROOT_COLORS = {
    "e4":   "#81b64c",
    "d4":   "#60a5fa",
    "Nf3":  "#c084fc",
    "c4":   "#fbbf24",
    "Other": "#64748b",
}


def _flatten_tree(root: dict, max_depth: int = 7) -> dict[str, list]:
    labels: list[str] = []
    parents: list[str] = []
    ids: list[str] = []
    values: list[float] = []
    colors: list[str] = []
    paths: list[str] = []

    def visit(
        node: dict,
        parent_id: str,
        path: list[str],
        root_move: str,
        depth: int,
    ) -> None:
        if depth > max_depth:
            return
        label = str(node.get("san", "root"))
        node_path = path + ([] if label == "root" else [label])
        node_id = " / ".join(node_path) if node_path else "root"
        children = node.get("children", [])
        value = node.get("count", 0)
        if label == "root":
            value = sum(float(child.get("count", 0)) for child in children)

        current_root = root_move
        if depth == 1:
            current_root = label

        labels.append("Start" if label == "root" else label)
        parents.append(parent_id)
        ids.append(node_id)
        values.append(float(value))
        colors.append(ROOT_COLORS.get(current_root, "#94a3b8"))
        paths.append(" ".join(node_path) if node_path else "Starting position")

        for child in children:
            visit(child, node_id, node_path, current_root, depth + 1)

    visit(root, "", [], "", 0)
    return {
        "labels": labels,
        "parents": parents,
        "ids": ids,
        "values": values,
        "colors": colors,
        "paths": paths,
    }


@module.ui
def opening_tree_ui():
    return ui.TagList(
        section_intro(
            "01",
            "Opening structure",
            "The Opening Tree",
            "A branching map of popular move sequences across the four AI eras.",
            [
                ("Read", "Each ring is one move deeper into the opening."),
                ("Why", "Wider arcs represent lines chosen by more players."),
                ("Explore", "Change eras and hover over a branch to inspect its path."),
            ],
        ),
        chart_shell(
            ui.div(
                ui.input_select(
                    "period",
                    "Era",
                    choices={period: PERIOD_DISPLAY[period] for period in PERIOD_ORDER},
                    selected="pre-ai",
                ),
                ui.p(
                    "The available choices follow the global era selection.",
                    class_="control-hint",
                ),
                class_="chart-controls compact",
            ),
            output_widget("tree", height="640px"),
        ),
        insight_box(
            "Opening structure stayed stable; depth became more concentrated.",
            "The first-move split changes less than the deeper branches. Later eras "
            "show faster convergence onto a smaller set of engine-approved continuations.",
        ),
    )


@module.server
def opening_tree_server(
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
            choices = {"pre-ai": PERIOD_DISPLAY["pre-ai"]}
        selected = input.period()
        if selected not in choices:
            selected = next(iter(choices))
        ui.update_select("period", choices=choices, selected=selected, session=session)

    @render_plotly
    def tree():
        period = input.period() or "pre-ai"
        tree_data = data.opening_trees.get(period, data.opening_trees["pre-ai"])
        flat = _flatten_tree(tree_data)

        fig = go.Figure(
            go.Sunburst(
                ids=flat["ids"],
                labels=flat["labels"],
                parents=flat["parents"],
                values=flat["values"],
                branchvalues="total",
                marker={
                    "colors": flat["colors"],
                    "line": {"color": "#1a1a1a", "width": 1},
                },
                customdata=flat["paths"],
                hovertemplate=(
                    "<b>%{customdata}</b><br>"
                    "Games through this move: %{value:,.0f}<br>"
                    "Share of parent: %{percentParent:.1%}<extra></extra>"
                ),
                maxdepth=7,
                insidetextorientation="radial",
            )
        )
        apply_plotly_theme(fig, margin={"l": 8, "r": 8, "t": 24, "b": 8})
        fig.update_layout(
            uniformtext={"minsize": 10, "mode": "hide"},
        )
        return fig
