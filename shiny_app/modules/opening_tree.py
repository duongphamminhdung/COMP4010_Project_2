from __future__ import annotations

from collections.abc import Iterable

import plotly.graph_objects as go
from shiny import Inputs, Outputs, Session, module, render, ui
from shinywidgets import output_widget, render_plotly

from shiny_app.data import AppData
from shiny_app.theme import COLORS, apply_plotly_theme
from shiny_app.ui_helpers import chart_shell, insight_box, metric_card, section_intro

ROOT_COLORS = {
    "e4":   "#81b64c",
    "d4":   "#60a5fa",
    "Nf3":  "#c084fc",
    "c4":   "#fbbf24",
    "Other": "#64748b",
}
INNER_RADIUS = 1.45
RING_WIDTH = 1.0


def _mix_color(color: str, target: str, weight: float) -> str:
    source_rgb = [int(color[index : index + 2], 16) for index in (1, 3, 5)]
    target_rgb = [int(target[index : index + 2], 16) for index in (1, 3, 5)]
    mixed = [
        round(source + (destination - source) * weight)
        for source, destination in zip(source_rgb, target_rgb, strict=True)
    ]
    return f"#{mixed[0]:02X}{mixed[1]:02X}{mixed[2]:02X}"


def _branch_color(root_move: str, depth: int) -> str:
    base = ROOT_COLORS.get(root_move, "#9CA3AF")
    if root_move == "Other":
        return _mix_color(base, COLORS["background"], min(0.08 * depth, 0.45))
    shade = min(0.065 * max(depth - 1, 0), 0.42)
    return _mix_color(base, COLORS["background"], shade)


def _merge_trees(roots: Iterable[dict]) -> dict:
    merged: dict = {"san": "root", "count": 0.0, "children": []}

    def merge_node(target: dict, source: dict) -> None:
        target["count"] = float(target.get("count", 0)) + float(source.get("count", 0))
        existing = {
            str(child.get("san", "")): child for child in target.get("children", [])
        }
        for source_child in source.get("children", []):
            san = str(source_child.get("san", "Other"))
            target_child = existing.get(san)
            if target_child is None:
                target_child = {"san": san, "count": 0.0, "children": []}
                target.setdefault("children", []).append(target_child)
                existing[san] = target_child
            merge_node(target_child, source_child)
        target["children"].sort(
            key=lambda child: float(child.get("count", 0)),
            reverse=True,
        )

    for root in roots:
        merge_node(merged, root)
    merged["count"] = sum(
        float(child.get("count", 0)) for child in merged.get("children", [])
    )
    return merged


def _flatten_tree(root: dict, max_depth: int = 7) -> dict[str, list]:
    labels: list[str] = []
    parents: list[str] = []
    ids: list[str] = []
    values: list[float] = []
    colors: list[str] = []
    paths: list[str] = []
    depths: list[int] = []

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
        value = float(node.get("count", 0))
        if label == "root":
            value = sum(float(child.get("count", 0)) for child in children)

        current_root = label if depth == 1 else root_move
        labels.append("Start" if label == "root" else label)
        parents.append(parent_id)
        ids.append(node_id)
        values.append(value)
        colors.append(_branch_color(current_root, depth))
        paths.append(" ".join(node_path) if node_path else "Starting position")
        depths.append(depth)

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
        "depths": depths,
    }


def _partition_tree(root: dict, max_depth: int = 7) -> dict[str, list]:
    result = {
        "theta": [],
        "width": [],
        "base": [],
        "radius": [],
        "colors": [],
        "customdata": [],
        "label_theta": [],
        "label_radius": [],
        "label_text": [],
    }
    total = sum(float(child.get("count", 0)) for child in root.get("children", []))

    def visit(
        node: dict,
        start: float,
        end: float,
        path: list[str],
        root_move: str,
        depth: int,
        parent_total: float,
    ) -> None:
        if depth > max_depth:
            return
        label = str(node.get("san", "Other"))
        value = float(node.get("count", 0))
        node_path = [*path, label]
        current_root = label if depth == 1 else root_move
        span = end - start
        midpoint = start + span / 2
        parent_share = value / parent_total * 100 if parent_total else 0
        total_share = value / total * 100 if total else 0

        result["theta"].append(midpoint)
        result["width"].append(max(span - 0.2, 0.08))
        result["base"].append(INNER_RADIUS + (depth - 1) * RING_WIDTH)
        result["radius"].append(RING_WIDTH * 0.94)
        result["colors"].append(_branch_color(current_root, depth))
        result["customdata"].append(
            [
                " ".join(node_path),
                value,
                parent_share,
                total_share,
                depth,
            ]
        )

        label_threshold = 9 if depth <= 2 else 13 + depth * 1.6
        if label != "Other" and span >= label_threshold:
            result["label_theta"].append(midpoint)
            result["label_radius"].append(INNER_RADIUS + (depth - 0.5) * RING_WIDTH)
            result["label_text"].append(label)

        children = node.get("children", [])
        child_total = sum(float(child.get("count", 0)) for child in children)
        cursor = start
        for child in children:
            child_value = float(child.get("count", 0))
            child_span = span * child_value / child_total if child_total else 0
            visit(
                child,
                cursor,
                cursor + child_span,
                node_path,
                current_root,
                depth + 1,
                child_total,
            )
            cursor += child_span

    cursor = 0.0
    for child in root.get("children", []):
        child_value = float(child.get("count", 0))
        span = 360 * child_value / total if total else 0
        visit(child, cursor, cursor + span, [], "", 1, total)
        cursor += span
    return result


def _starting_board() -> ui.Tag:
    pieces = (
        "♜♞♝♛♚♝♞♜" "♟♟♟♟♟♟♟♟" "                                " "♙♙♙♙♙♙♙♙" "♖♘♗♕♔♗♘♖"
    )
    return ui.div(
        *[
            ui.span(
                piece if piece != " " else "",
                class_=(
                    f"tree-board-square {'light' if (index // 8 + index % 8) % 2 == 0 else 'dark'} "
                    f"{'white-piece' if piece in '♙♖♘♗♕♔' else 'black-piece'}"
                ),
            )
            for index, piece in enumerate(pieces)
        ],
        class_="tree-center-board",
        aria_label="Starting chess position",
    )


@module.ui
def opening_tree_ui():
    legend = [
        ui.div(
            ui.span(class_="tree-legend-swatch", style=f"background:{color}"),
            ui.span(f"1. {move}"),
            class_="tree-legend-item",
        )
        for move, color in ROOT_COLORS.items()
    ]
    return ui.TagList(
        section_intro(
            "01",
            "Opening structure",
            "The Opening Tree",
            "One collective map of the repertoire across all 200,000 sampled games.",
            [
                ("Read", "Each ring moves one ply deeper from the starting board."),
                ("Why", "Arc width shows how much traffic continues through a line."),
                ("Explore", "Hover a branch to reveal its full move path and share."),
            ],
        ),
        chart_shell(
            ui.output_ui("summary"),
            ui.div(
                output_widget("tree", height="720px"),
                _starting_board(),
                class_="opening-tree-stage",
            ),
            ui.div(*legend, class_="tree-legend"),
            ui.p(
                "The map combines all four snapshots. Use Opening Revolution for the "
                "year-by-year era comparison.",
                class_="tree-caption",
            ),
            class_="opening-tree-shell",
        ),
        insight_box(
            "A few first moves organize most of the repertoire.",
            "The broad e4 and d4 families dominate the center of the map, while deeper "
            "rings fragment into increasingly specific continuations.",
        ),
    )


@module.server
def opening_tree_server(
    input: Inputs,
    output: Outputs,
    session: Session,
    data: AppData,
):
    merged_tree = _merge_trees(data.opening_trees.values())
    partition = _partition_tree(merged_tree)
    total_games = int(merged_tree["count"])

    @render.ui
    def summary():
        first_moves = merged_tree.get("children", [])
        top = first_moves[0] if first_moves else {"san": "—", "count": 0}
        top_share = float(top.get("count", 0)) / total_games * 100 if total_games else 0
        return ui.div(
            metric_card(
                "Games mapped",
                f"{total_games:,}",
                "All four study snapshots",
                COLORS["accent"],
            ),
            metric_card(
                "Largest family",
                f"1. {top.get('san', '—')}",
                f"{top_share:.1f}% of sampled games",
                ROOT_COLORS.get(str(top.get("san")), COLORS["accent"]),
            ),
            metric_card(
                "Visible depth",
                "7 ply",
                "Hover for complete paths",
                "#C084FC",
            ),
            class_="metric-grid tree-summary",
        )

    @render_plotly
    def tree():
        fig = go.Figure(
            go.Barpolar(
                r=partition["radius"],
                base=partition["base"],
                theta=partition["theta"],
                width=partition["width"],
                marker={
                    "color": partition["colors"],
                    "line": {"color": COLORS["background"], "width": 1.2},
                },
                customdata=partition["customdata"],
                hovertemplate=(
                    "<b>%{customdata[0]}</b><br>"
                    "Games through this move: %{customdata[1]:,.0f}<br>"
                    "Share of parent: %{customdata[2]:.1f}%<br>"
                    "Share of all games: %{customdata[3]:.1f}%<extra></extra>"
                ),
                opacity=0.98,
                showlegend=False,
            )
        )
        fig.add_trace(
            go.Scatterpolar(
                r=partition["label_radius"],
                theta=partition["label_theta"],
                mode="text",
                text=partition["label_text"],
                textfont={
                    "family": "DM Sans, system-ui, sans-serif",
                    "size": 11,
                    "color": "#FFFFFF",
                },
                hoverinfo="skip",
                showlegend=False,
            )
        )
        apply_plotly_theme(fig, margin={"l": 12, "r": 12, "t": 12, "b": 12})
        fig.update_layout(
            polar={
                "bgcolor": "rgba(0,0,0,0)",
                "radialaxis": {
                    "visible": False,
                    "range": [0, INNER_RADIUS + 7 * RING_WIDTH + 0.05],
                },
                "angularaxis": {
                    "visible": False,
                    "rotation": 90,
                    "direction": "clockwise",
                },
            },
            hoverlabel={"align": "left"},
        )
        return fig
