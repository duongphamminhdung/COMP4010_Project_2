import csv
import json
import os
from collections import defaultdict, Counter

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public', 'data')

PERIOD_ORDER = ['pre-ai', 'early-post-ai', 'nnue-era', 'modern']
PERIOD_LABELS = {
    'pre-ai': 'Pre-AI',
    'early-post-ai': 'Early Post-AI',
    'nnue-era': 'NNUE Era',
    'modern': 'Modern',
}

def read_csv(filename):
    with open(os.path.join(DATA_DIR, filename), 'r') as f:
        return list(csv.DictReader(f))

def write_csv(filename, rows, fieldnames=None):
    if not rows:
        print(f"  Skipping {filename}: no data")
        return
    if fieldnames is None:
        fieldnames = list(rows[0].keys())
    with open(os.path.join(DATA_DIR, filename), 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    print(f"  Wrote {filename} ({len(rows)} rows)")

# ============================================================
# Load data
# ============================================================
print("Loading games...")
games = read_csv('lichess_sampled_games.csv')
print(f"  {len(games):,} games")

print("Loading blunders...")
blunders = read_csv('lichess_sampled_blunders.csv')
print(f"  {len(blunders):,} blunders")

print("Loading material curve...")
material = read_csv('lichess_sampled_material_curve.csv')
print(f"  {len(material):,} rows")

print("Loading piece squares...")
psq = read_csv('lichess_sampled_piece_squares.csv')
print(f"  {len(psq):,} rows")

# ============================================================
# 1. First Move by Period
# ============================================================
print("\n--- First Move by Period ---")
fm_count = Counter()
period_total = Counter()
top_moves = ['e4', 'd4', 'c4', 'Nf3']

for g in games:
    p = g['period']
    fm = g.get('first_move', '')
    if fm:
        fm_count[(p, fm)] += 1
        period_total[p] += 1

rows = []
for p in PERIOD_ORDER:
    total = period_total.get(p, 1)
    row = {'period': PERIOD_LABELS[p]}
    for m in top_moves:
        row[m] = round(fm_count.get((p, m), 0) / total * 100, 1)
    other = sum(fm_count.get((p, m), 0) for m in fm_count if m not in top_moves and (m, p)[0] == m and fm_count.get((p, m), 0) > 0)
    # simpler: total - sum of top
    top_sum = sum(fm_count.get((p, m), 0) for m in top_moves)
    other = total - top_sum
    row['other'] = round(other / total * 100, 1)
    rows.append(row)

write_csv('first_move_by_period.csv', rows, ['period', 'e4', 'd4', 'c4', 'Nf3', 'other'])

# ============================================================
# 2. Opening Tree (hierarchical JSON per period)
# ============================================================
print("\n--- Opening Tree ---")

for period_key in PERIOD_ORDER:
    root = {'san': 'root', 'count': 0, 'children': {}}
    period_games = [g for g in games if g['period'] == period_key]
    root['count'] = len(period_games)

    for g in period_games:
        ms = g.get('first_10_moves', '')
        if not ms:
            continue
        moves = ms.split(',')
        node = root
        for move in moves[:8]:
            if move not in node['children']:
                node['children'][move] = {'san': move, 'count': 0, 'children': {}}
            node['children'][move]['count'] += 1
            node = node['children'][move]

    # Prune to top 8 children per node
    def prune(node, max_children=8):
        if not node.get('children'):
            return
        sorted_children = sorted(node['children'].values(), key=lambda x: x['count'], reverse=True)
        top = sorted_children[:max_children]
        other_count = sum(c['count'] for c in sorted_children[max_children:])
        if other_count > 0:
            top.append({'san': 'other', 'count': other_count})
        node['children'] = top
        for child in node['children']:
            prune(child, max_children)

    prune(root)

    with open(os.path.join(DATA_DIR, f'opening_tree_{period_key}.json'), 'w') as f:
        json.dump(root, f)
    print(f"  {period_key}: {len(period_games):,} games")

# ============================================================
# 3. Blunder Rate by ELO and Period
# ============================================================
print("\n--- Blunder Rate ---")

# Count blunders per game
blunders_per_game = Counter()
for b in blunders:
    blunders_per_game[(b.get('period', ''), b.get('game_idx', ''))] += 1

# Build ELO bracket from games for each game_idx
elo_brackets = {}
for i, g in enumerate(games):
    elo_brackets[i] = g.get('elo_bracket', '')

# Aggregate: ELO x period
blunder_elo_period = Counter()
game_elo_period = Counter()

for i, g in enumerate(games):
    p = g.get('period', '')
    elo = g.get('elo_bracket', '')
    game_elo_period[(elo, p)] += 1

for b in blunders:
    p = b.get('period', '')
    idx = int(b.get('game_idx', -1))
    elo = elo_brackets.get(idx, '')
    if elo and p:
        blunder_elo_period[(elo, p)] += 1

rows = []
for elo in ['0-1000', '1000-1400', '1400-1800', '1800-2200', '2200-2600', '2600+']:
    for p in PERIOD_ORDER:
        games_n = game_elo_period.get((elo, p), 0)
        blunders_n = blunder_elo_period.get((elo, p), 0)
        if games_n > 0:
            rows.append({
                'elo': elo,
                'period': PERIOD_LABELS[p],
                'value': round(blunders_n / games_n, 2),
            })

write_csv('blunder_rate.csv', rows, ['elo', 'period', 'value'])

# ============================================================
# 4. Sacrifice Rate
# ============================================================
print("\n--- Sacrifice Rate ---")
sac_sum = defaultdict(float)
sac_count = defaultdict(int)
for g in games:
    p = g.get('period', '')
    sc = float(g.get('sacrifice_count', 0) or 0)
    sac_sum[p] += sc
    sac_count[p] += 1

rows = []
for p in PERIOD_ORDER:
    if sac_count[p] > 0:
        rows.append({
            'period': PERIOD_LABELS[p],
            'avgSacrifices': round(sac_sum[p] / sac_count[p], 2),
        })
write_csv('sacrifice_rate.csv', rows, ['period', 'avgSacrifices'])

# ============================================================
# 5. Game Length Histogram
# ============================================================
print("\n--- Game Length ---")
bin_size = 4
gl_hist = defaultdict(lambda: defaultdict(int))

for g in games:
    p = g.get('period', '')
    gl = int(g.get('game_length', 0) or 0)
    binned = (gl // bin_size) * bin_size
    if binned <= 250:
        gl_hist[p][binned] += 1

all_bins = sorted(set(b for h in gl_hist.values() for b in h.keys()))
rows = []
for b in all_bins:
    row = {'ply': b}
    for p in PERIOD_ORDER:
        row[PERIOD_LABELS[p]] = gl_hist.get(p, {}).get(b, 0)
    rows.append(row)
write_csv('game_length.csv', rows, ['ply'] + [PERIOD_LABELS[p] for p in PERIOD_ORDER])

# ============================================================
# 6. Material Curve (just copy, already aggregated)
# ============================================================
print("\n--- Material Curve ---")
# Pivot: ply as rows, periods as columns
mat_by_period = defaultdict(dict)
for m in material:
    p = m.get('period', '')
    ply = int(m.get('ply', 0))
    wm = float(m.get('avg_white_material', 0))
    bm = float(m.get('avg_black_material', 0))
    mat_by_period[ply][f'{PERIOD_LABELS.get(p, p)}_white'] = round(wm, 1)
    mat_by_period[ply][f'{PERIOD_LABELS.get(p, p)}_black'] = round(bm, 1)

all_plies = sorted(mat_by_period.keys())
cols = []
for p in PERIOD_ORDER:
    cols.extend([f'{PERIOD_LABELS[p]}_white', f'{PERIOD_LABELS[p]}_black'])

rows = []
for ply in all_plies:
    row = {'ply': ply}
    for c in cols:
        row[c] = mat_by_period[ply].get(c, 0)
    rows.append(row)
write_csv('material_curve_agg.csv', rows, ['ply'] + cols)

# Also write simpler: total material per period per ply
simple_rows = []
for ply in all_plies:
    row = {'ply': ply}
    for p in PERIOD_ORDER:
        label = PERIOD_LABELS[p]
        wm = mat_by_period[ply].get(f'{label}_white', 0)
        bm = mat_by_period[ply].get(f'{label}_black', 0)
        row[label] = round(wm + bm, 1)
    simple_rows.append(row)
write_csv('material_total.csv', simple_rows, ['ply'] + [PERIOD_LABELS[p] for p in PERIOD_ORDER])

# ============================================================
# 7. Piece Squares (copy, already aggregated, map square names to indices)
# ============================================================
print("\n--- Piece Squares ---")
psq_rows = []
for ps in psq:
    sq_name = ps.get('square', '')
    if len(sq_name) >= 2:
        file_idx = ord(sq_name[0]) - ord('a')
        rank_idx = int(sq_name[1]) - 1
        sq_idx = rank_idx * 8 + file_idx
    else:
        sq_idx = 0
    psq_rows.append({
        'piece': ps.get('piece', '').upper()[0] if ps.get('piece') else '?',
        'square': sq_idx,
        'is_white': ps.get('is_white', ''),
        'period': ps.get('period', ''),
        'count': int(ps.get('count', 0) or 0),
    })
write_csv('piece_squares_agg.csv', psq_rows, ['piece', 'square', 'is_white', 'period', 'count'])

print("\n=== Done! ===")
for f in sorted(os.listdir(DATA_DIR)):
    path = os.path.join(DATA_DIR, f)
    size = os.path.getsize(path)
    if size < 1024*1024:
        print(f"  {f} ({size/1024:.0f} KB)")
    else:
        print(f"  {f} ({size/1024/1024:.1f} MB)")
