# Visualization Update Comments

## Coloring

The current dark "Midnight Observatory" theme fits the project well. It gives the chess-and-AI story a serious, analytical mood, and the era mapping is conceptually clear: blue for the pre-AI baseline, violet for the transition period, amber for the NNUE disruption, and green for the modern era.

The main improvement needed is contrast. Some chart colors are too close in brightness on the dark background, especially when the marks are thin, transparent, or overlapping. The interface can stay subtle, but the data marks should be brighter and easier to distinguish.

Recommended era palette:

```txt
Pre-AI:         #60a5fa
Early Post-AI: #c084fc
NNUE Era:      #fbbf24
Modern:        #34d399
```

This keeps the same visual identity while improving readability. For heatmaps, avoid relying only on a simple green-to-red scale. A dark teal to emerald to amber to red gradient works better because it changes both hue and brightness, making the values easier to read and more accessible.

Overall, the coloring is atmospheric and appropriate, but the charts need stronger luminance contrast than the surrounding UI. Let the page remain quiet and let the data stand out.

## Plots

The overall plot selection is strong because each chart supports a different part of the narrative. The project does not feel like a random dashboard; it has a clear progression from openings, to material choices, to mistakes, to piece placement, to game structure.

The opening tree is a good hero visualization because it immediately communicates branching chess choices and lets viewers explore how repertoires changed across eras. The pruning strategy is important here, because a full opening tree would become unreadable very quickly.

The Opening Revolution line chart has a useful story, but it needs the most care. If the yearly data is sparse or uneven, smooth lines can imply trends that are not really continuous. A stepped line chart, clearer dots, and filtering or annotating low-sample years would make the plot more honest and easier to read.

The material curve is meaningful, but four overlapping filled areas can become visually muddy because the era curves are close together. A stronger version would highlight Pre-AI versus Modern and keep the middle eras as faint reference lines. Another good option is a difference plot showing Modern minus Pre-AI, which would make small changes more visible.

The sacrifice chart should emphasize trajectory. Since there are only four era points, a connected dot plot may communicate the rise and fall more clearly than a bar chart.

The blunder heatmap is one of the clearest plots because the ELO by era matrix matches the question directly. Its impact would improve with a diverging color scale centered around the overall mean, plus clear labels or change indicators from Pre-AI to Modern.

The piece-square map is visually appropriate for chess because it uses the board itself as the chart. The current single-board approach is cleaner than showing too many boards at once. A highlighted hottest square and concise side KPIs can help viewers interpret the board quickly.

The game length distribution is a good final section because it reveals a behavioral pattern that feels specific to online chess. The "comb" pattern around time-control boundaries is interesting, but it may need a zoomed inset around ply 70-130 so the spikes are easier to see.

Overall, the plots are well matched to the project story. The main next step is not changing the whole visualization design, but sharpening readability: brighter colors, clearer encodings, less overlap, and more direct emphasis on the specific comparison each section wants the viewer to notice.
