# Player Profile Clustering (PCA)

## Problem
The project has one ML section (ELO Prediction, supervised regression). The rubric (criterion 2.10, 6%) requires ML "meaningfully embedded in the visual analytics workflow." A single supervised model is "present but shallow." We also cannot visually distinguish whether AI-era players behave differently from pre-AI players in a single multi-dimensional view — current sections show one metric at a time (blunders, piece placement, openings) but never a holistic player profile.

## Evidence
- Rubric criterion 2.10 (ML/analytics, 6%): "Forecasting, spatial, or predictive model meaningfully embedded"
- Rubric criterion 2.9 (Technical complexity, 5%): "Advanced techniques and a robust data pipeline"
- Rubric criterion 2.8 (Interactivity, 6%): "Rich, meaningful interaction (filtering, brushing)"
- Current project has 7 sections but only 1 uses ML; Game Length (Section 7) shows a structural artifact (time controls) with no analytical insight

## Users
- **Primary**: Professor evaluating rubric criteria 2.8, 2.9, 2.10
- **Secondary**: Visitors to the GitHub Pages site who want to see whether AI changed human play behavior holistically

## Hypothesis
We believe **PCA reduction of per-player-game behavioral features** will **reveal that AI-era players form distinct behavioral clusters from pre-AI players**, for **professor and site visitors evaluating the project's ML depth**. We'll know we're right when **the 2D scatter plot shows era-separated groupings, and the explained variance confirms the principal components capture meaningful structure**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| PCA explained variance (PC1+PC2) | ≥40% | sklearn PCA output |
| Era separation visible in scatter | Clusters shift along PC1 or PC2 by era | Visual inspection |
| ML criterion 2.10 score | "Excellent" or "Good" | Professor evaluation |

## Scope
**MVP** — Add a PCA scatter plot section after Blunders (Section 4), replacing Game Length. Pipeline: sample ~5000 player-game records, compute PCA on 5 features (ACPL, blunder_rate, capture_pct, check_pct, n_moves), export to CSV, render D3 scatter colored by era with hover tooltips and era toggle filters.

**Out of scope**
- t-SNE or UMAP (PCA is sufficient and interpretable; explained variance is reportable)
- Per-player longitudinal tracking (data is anonymized per-game)
- Backend serving (static CSV, same as all other sections)

## Delivery Milestones
| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | PCA pipeline in notebook 03 | `player_pca.csv` in frontend/public/data/ | in-progress | `.claude/plans/player-profile-pca.plan.md` |
| 2 | PlayerProfilePCA component | D3 scatter plot with era colors, hover, filters | pending | `.claude/plans/player-profile-pca.plan.md` |
| 3 | Remove Game Length section | Section 7 removed from App.jsx, dataLoader, navbar | pending | `.claude/plans/player-profile-pca.plan.md` |
| 4 | Insert PCA section after Blunders | Renumber sections 5→4, 6→5, etc. in App.jsx and navbar | pending | `.claude/plans/player-profile-pca.plan.md` |
| 5 | Update report (main.tex) | Rewrite sections 3, 5, 6, 7 to reflect new section order and PCA method | pending | `.claude/plans/player-profile-pca.plan.md` |

## Open Questions
- [ ] Will 5 features produce enough variance for visual separation? (If not, add acpl_std, piece_diversity, center_pct as additional features)
- [ ] Should we stratify the sample by era or sample uniformly? (Stratified gives equal visual weight per era)

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| PCA shows no era separation | Medium | High — undermines hypothesis | Frame honestly in report: "PCA confirms behavioral continuity, not discrete shift" is still a valid ML finding |
| 5 features too few for meaningful PCA | Low | Medium | Add up to 3 more features already computed in notebook 03 |
| Scatter plot too dense at 5k points | Low | Low | Use opacity, zoom, or reduce to 3k points |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*
