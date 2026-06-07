from __future__ import annotations

from shiny import ui


def section_intro(
    number: str,
    eyebrow: str,
    title: str,
    description: str,
    notes: list[tuple[str, str]],
) -> ui.Tag:
    return ui.div(
        ui.div(
            ui.span(number, class_="section-number"),
            ui.span(eyebrow, class_="section-eyebrow"),
            class_="section-kicker",
        ),
        ui.h1(title, class_="section-title"),
        ui.p(description, class_="section-description"),
        ui.div(
            *[
                ui.div(
                    ui.span(label, class_="note-label"),
                    ui.p(text),
                    class_="note-card",
                )
                for label, text in notes
            ],
            class_="note-grid",
        ),
        class_="section-intro",
    )


def chart_shell(*children: ui.TagChild, class_: str = "") -> ui.Tag:
    return ui.div(*children, class_=f"chart-shell {class_}".strip())


def insight_box(title: str, text: str) -> ui.Tag:
    return ui.div(
        ui.div("Finding", class_="insight-label"),
        ui.h3(title),
        ui.p(text),
        class_="insight-box",
    )


def metric_card(label: str, value: str, detail: str = "", accent: str = "") -> ui.Tag:
    style = f"--metric-accent: {accent};" if accent else ""
    return ui.div(
        ui.div(label, class_="metric-label"),
        ui.div(value, class_="metric-value"),
        ui.div(detail, class_="metric-detail") if detail else None,
        class_="metric-card",
        style=style,
    )


def empty_state(message: str) -> ui.Tag:
    return ui.div(message, class_="empty-state")
