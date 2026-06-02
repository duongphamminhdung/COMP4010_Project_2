"""
generate_frontend_data.py

Aggregates raw CSVs from notebook 01 into small frontend-ready files.
Run locally: python generate_frontend_data.py
Output goes to frontend/public/data/ alongside the raw CSVs.
"""

import pandas as pd
import json
import os
import sys

# --- Config ---
PERIOD_ORDER = ["pre-ai", "early-post-ai", "nnue-era", "modern"]
PERIOD_DISPLAY = {
    'pre-ai': 'Pre-AI',
    'early-post-ai': 'Early Post-AI',
    'nnue-era': 'NNUE Era',
    'modern': 'Modern',
}
ELO_ORDER = ['0-1000', '1000-1400', '1400-1800', '1800-2200', '2200-2600', '2600+']

# Resolve paths relative to this script's location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, '..', 'frontend', 'public', 'data')
DATA_DIR = os.path.normpath(DATA_DIR)


def load_raw_data():
    print(f"Loading from: {DATA_DIR}\n")
    games = pd.read_csv(os.path.join(DATA_DIR, "lichess_sampled_games.csv"))
    blunders = pd.read_csv(os.path.join(DATA_DIR, "lichess_sampled_blunders.csv"))
    piece_squares = pd.read_csv(os.path.join(DATA_DIR, "lichess_sampled_piece_squares.csv"))
    material_curve = pd.read_csv(os.path.join(DATA_DIR, "lichess_sampled_material_curve.csv"))

    print(f"Games: {len(games):,}")
    print(f"Moves (blunders): {len(blunders):,}")
    print(f"Piece squares: {len(piece_squares):,}")
    print(f"Material curve: {len(material_curve):,}")
    print(f"Periods: {games['period'].value_counts().to_dict()}")
    return games, blunders, piece_squares, material_curve


def build_tree(df_period, max_ply=10):
    root = {'san': 'root', 'children': []}
    for moves_str in df_period['first_10_moves'].dropna():
        moves = moves_str.split(',')
        node = root
        for move in moves[:max_ply]:
            child = next((c for c in node.get('children', []) if c['san'] == move), None)
            if not child:
                child = {'san': move, 'count': 0, 'children': []}
                node.setdefault('children', []).append(child)
            child['count'] += 1
            node = child

    def clean(n):
        if 'children' in n and len(n['children']) == 0:
            del n['children']
        elif 'children' in n:
            for c in n['children']:
                clean(c)
    clean(root)
    return root


def subtree_value(node):
    """Sum leaf counts of a subtree (for aggregating 'Other')."""
    if 'children' not in node or not node['children']:
        return node.get('count', 0)
    return sum(subtree_value(c) for c in node['children'])


def prune_tree(node, depth=0):
    """Prune tree to keep only top N moves per depth level.

    Depth 0-2: top 5 children (depths 1-3)
    Depth 3-4: top 3 + aggregate rest into "Other"
    Depth 5+:  top 2
    """
    children = node.get('children', [])
    if not children:
        return node

    if depth <= 2:
        limit, create_other = 5, False
    elif depth <= 4:
        limit, create_other = 3, True
    else:
        limit, create_other = 2, False

    sorted_children = sorted(children, key=lambda c: c.get('count', 0), reverse=True)
    kept = [prune_tree(c, depth + 1) for c in sorted_children[:limit]]

    if create_other and len(sorted_children) > limit:
        excluded = sorted_children[limit:]
        other_count = sum(subtree_value(c) for c in excluded)
        if other_count > 0:
            kept.append({'san': 'Other', 'count': other_count})

    result = {'san': node['san'], 'count': node.get('count', 0)}
    if kept:
        result['children'] = kept
    return result


def export_opening_trees(games):
    print("\n1. Opening tree JSON (pruned)...")
    for period in PERIOD_ORDER:
        df_p = games[games['period'] == period]
        tree = build_tree(df_p)

        # Count raw nodes before pruning
        def count_nodes(n):
            return 1 + sum(count_nodes(c) for c in n.get('children', []))
        raw_nodes = count_nodes(tree)

        tree = prune_tree(tree)
        pruned_nodes = count_nodes(tree)

        path = os.path.join(DATA_DIR, f'opening_tree_{period}.json')
        with open(path, 'w') as f:
            json.dump(tree, f)
        size_kb = os.path.getsize(path) / 1024
        n_top = len(tree.get('children', []))
        print(f"  {period}: {len(df_p):,} games, {raw_nodes:,} -> {pruned_nodes:,} nodes ({size_kb:.1f} KB)")


def export_blunder_rate(games, blunders):
    print("\n2. Blunder rate...")
    bpg = blunders.groupby('game_idx').size().rename('blunder_count')
    games_bl = games.join(bpg)
    games_bl['blunder_count'] = games_bl['blunder_count'].fillna(0).astype(int)

    blunder_rows = []
    for period in PERIOD_ORDER:
        for bracket in ELO_ORDER:
            mask = (games_bl['period'] == period) & (games_bl['elo_bracket'] == bracket)
            subset = games_bl[mask]
            if len(subset) > 0:
                blunder_rows.append({
                    'elo': bracket,
                    'period': PERIOD_DISPLAY[period],
                    'value': round(subset['blunder_count'].mean(), 2),
                })
    pd.DataFrame(blunder_rows).to_csv(os.path.join(DATA_DIR, 'blunder_rate.csv'), index=False)
    print(f"  {len(blunder_rows)} cells")


def export_piece_squares(piece_squares):
    print("\n3. Piece squares...")
    PIECE_LETTER = {'knight': 'N', 'bishop': 'B', 'rook': 'R', 'queen': 'Q', 'king': 'K', 'pawn': 'P'}
    psq = piece_squares.copy()
    psq['piece'] = psq['piece'].map(PIECE_LETTER)
    psq_agg = psq.groupby(['piece', 'period', 'square'])['count'].sum().reset_index()
    psq_agg.to_csv(os.path.join(DATA_DIR, 'piece_squares_agg.csv'), index=False)
    print(f"  {len(psq_agg)} rows")


def export_game_length(games):
    print("\n4. Game length...")
    gl_rows = []
    for period in PERIOD_ORDER:
        df_p = games[games['period'] == period]
        counts = df_p['game_length'].value_counts()
        for ply, count in counts.items():
            gl_rows.append({'ply': int(ply), 'period': PERIOD_DISPLAY[period], 'count': int(count)})
    gl_df = pd.DataFrame(gl_rows)
    gl_wide = gl_df.pivot(index='ply', columns='period', values='count').fillna(0).astype(int).reset_index()
    gl_wide.to_csv(os.path.join(DATA_DIR, 'game_length.csv'), index=False)
    print(f"  {len(gl_wide)} ply values")


def export_first_move_by_period(games):
    print("\n5. First move by period...")
    rows = []
    for period in PERIOD_ORDER:
        df_p = games[games['period'] == period]
        total = len(df_p)
        fm_counts = df_p['first_move'].value_counts()
        row = {'period': PERIOD_DISPLAY[period]}
        for move in ['e4', 'd4', 'c4', 'Nf3']:
            row[move] = round(fm_counts.get(move, 0) / total * 100, 1)
        row['other'] = round(100 - sum(row[m] for m in ['e4', 'd4', 'c4', 'Nf3']), 1)
        rows.append(row)
    pd.DataFrame(rows).to_csv(os.path.join(DATA_DIR, 'first_move_by_period.csv'), index=False)
    print("  Done")


def export_opening_by_year_1500(games):
    """Opening popularity by year, ELO 1500+, cleaned names."""
    print("\n6. Opening by year (ELO 1500+)...")
    g = games[games['avg_elo'] >= 1500].copy()
    g['opening_base'] = g['opening_name'].str.split(':').str[0].str.split('|').str[0].str.strip()
    # Rename for clarity
    g['opening_base'] = g['opening_base'].replace({"Queen's Pawn Game": "1.d4 Openings"})

    top_openings = g['opening_base'].value_counts().head(8).index.tolist()
    rows = []
    for year in sorted(g['year'].unique()):
        gy = g[g['year'] == year]
        total = len(gy)
        for opening in top_openings:
            count = len(gy[gy['opening_base'] == opening])
            pct = round(count / total * 100, 2) if total > 0 else 0
            rows.append({'year': int(year), 'opening': opening, 'count': count, 'pct': pct})

    pd.DataFrame(rows).to_csv(os.path.join(DATA_DIR, 'opening_by_year_1500.csv'), index=False)
    print(f"  {len(rows)} rows, top: {top_openings[:5]}...")


def export_sacrifice_by_year_1500(games):
    """Sacrifice rate by year, ELO 1500+."""
    print("\n7. Sacrifice by year (ELO 1500+)...")
    g = games[games['avg_elo'] >= 1500]
    rows = []
    for year in sorted(g['year'].unique()):
        gy = g[g['year'] == year]
        rows.append({
            'year': int(year),
            'avgSacrifices': round(gy['sacrifice_count'].mean(), 2),
            'gameCount': len(gy),
        })
    pd.DataFrame(rows).to_csv(os.path.join(DATA_DIR, 'sacrifice_by_year_1500.csv'), index=False)
    print(f"  {len(rows)} rows")


def export_material_by_year_1500(games):
    """Material curve by year and ply, ELO 1500+. Aggregated from moves CSV."""
    print("\n8. Material by year (ELO 1500+)...")
    g = games[games['avg_elo'] >= 1500].copy()
    g['game_idx'] = g.index
    idx_to_year = g.set_index('game_idx')['year'].to_dict()
    valid_idx = set(idx_to_year.keys())

    moves_path = os.path.join(DATA_DIR, 'lichess_sampled_moves.csv')
    agg = {}

    chunk_iter = pd.read_csv(
        moves_path,
        chunksize=500_000,
        usecols=['game_idx', 'ply', 'white_material', 'black_material'],
    )
    for i, chunk in enumerate(chunk_iter):
        mask = chunk['game_idx'].isin(valid_idx)
        chunk = chunk[mask]
        if len(chunk) == 0:
            continue
        chunk['year'] = chunk['game_idx'].map(idx_to_year)
        grouped = chunk.groupby(['year', 'ply']).agg(
            white_sum=('white_material', 'sum'),
            black_sum=('black_material', 'sum'),
            cnt=('white_material', 'count'),
        )
        for (yr, ply), row in grouped.iterrows():
            key = (int(yr), int(ply))
            if key not in agg:
                agg[key] = {'white_sum': 0, 'black_sum': 0, 'cnt': 0}
            agg[key]['white_sum'] += row['white_sum']
            agg[key]['black_sum'] += row['black_sum']
            agg[key]['cnt'] += row['cnt']
        print(f"  Chunk {i+1} processed...")

    mat_rows = []
    for (yr, ply), v in sorted(agg.items()):
        if v['cnt'] > 0:
            mat_rows.append({
                'year': yr,
                'ply': ply,
                'avg_total_material': round((v['white_sum'] + v['black_sum']) / v['cnt'], 2),
                'game_count': int(v['cnt']),
            })

    pd.DataFrame(mat_rows).to_csv(os.path.join(DATA_DIR, 'material_by_year_1500.csv'), index=False)
    print(f"  {len(mat_rows)} rows")


def main():
    games, blunders, piece_squares, material_curve = load_raw_data()

    # Era-based exports (sections 1, 4, 5, 6)
    export_opening_trees(games)
    export_blunder_rate(games, blunders)
    export_piece_squares(piece_squares)
    export_game_length(games)
    export_first_move_by_period(games)

    # Year-based exports, ELO 1500+ (sections 2, 3)
    export_opening_by_year_1500(games)
    export_sacrifice_by_year_1500(games)
    export_material_by_year_1500(games)

    print("\n=== Export summary ===")
    for f in sorted(os.listdir(DATA_DIR)):
        if f.startswith('.'):
            continue
        path = os.path.join(DATA_DIR, f)
        size = os.path.getsize(path)
        if size > 1024 * 1024:
            print(f"  {f} ({size / 1024**2:.1f} MB)")
        elif size > 1024:
            print(f"  {f} ({size / 1024:.1f} KB)")
        else:
            print(f"  {f} ({size} B)")

    print("\nAll exports done!")


if __name__ == '__main__':
    main()
