from __future__ import annotations

from collections.abc import Mapping

import plotly.graph_objects as go

COLORS = {
    "background": "#1A1A1A",
    "surface": "#262626",
    "card": "#312E2B",
    "border": "#3D3B38",
    "text": "#EEEEEE",
    "text_secondary": "#B0B0B0",
    "text_muted": "#888888",
    "accent": "#81B64C",
    "accent_hover": "#A3C95E",
    "board_light": "#EEEED2",
    "board_dark": "#769656",
    "positive": "#34D399",
    "warning": "#FBBF24",
    "negative": "#F87171",
}

ERA_COLORS = {
    "pre-ai": "#60A5FA",
    "early-post-ai": "#C084FC",
    "nnue-era": "#FBBF24",
    "modern": "#34D399",
}

OPENING_COLORS = {
    "Sicilian Defense": "#F87171",
    "French Defense": "#60A5FA",
    "Caro-Kann Defense": "#FBBF24",
    "Queen's Gambit": "#34D399",
    "Italian Game": "#E2E8F0",
}

FALLBACK_SERIES_COLORS = ("#C084FC", "#38BDF8", "#FB7185", "#A3E635")


def opening_color(name: str, index: int = 0) -> str:
    """Return a stable color for an opening across every filtered view."""
    return OPENING_COLORS.get(
        name, FALLBACK_SERIES_COLORS[index % len(FALLBACK_SERIES_COLORS)]
    )


def rgba(hex_color: str, alpha: float) -> str:
    """Convert a six-digit hex color to a Plotly-compatible rgba value."""
    value = hex_color.removeprefix("#")
    red, green, blue = (int(value[index : index + 2], 16) for index in (0, 2, 4))
    return f"rgba({red}, {green}, {blue}, {alpha})"


def apply_plotly_theme(
    figure: go.Figure,
    *,
    margin: Mapping[str, int] | None = None,
) -> go.Figure:
    """Apply the shared Beyond the Engine chart styling to a Plotly figure."""
    figure.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        margin=dict(margin or {"l": 52, "r": 22, "t": 30, "b": 48}),
        font={"family": "DM Sans, system-ui, sans-serif", "color": COLORS["text"]},
        hoverlabel={
            "bgcolor": COLORS["card"],
            "bordercolor": COLORS["border"],
            "font": {"family": "DM Sans, system-ui, sans-serif"},
        },
        legend={"font": {"color": COLORS["text_secondary"]}},
    )
    figure.update_xaxes(
        gridcolor=COLORS["border"],
        linecolor=COLORS["border"],
        tickcolor=COLORS["border"],
        zerolinecolor=COLORS["border"],
    )
    figure.update_yaxes(
        gridcolor=COLORS["border"],
        linecolor=COLORS["border"],
        tickcolor=COLORS["border"],
        zerolinecolor=COLORS["border"],
    )
    return figure
