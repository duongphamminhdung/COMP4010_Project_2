import { useState, useMemo } from 'react';
import ChessBoard from './ChessBoard';

const PIECE_OPTIONS = [
  { key: 'N', label: 'Knight', symbol: '♘' },
  { key: 'B', label: 'Bishop', symbol: '♗' },
  { key: 'R', label: 'Rook', symbol: '♖' },
  { key: 'Q', label: 'Queen', symbol: '♕' },
];

export default function PieceSquareMap({ data }) {
  const [selectedPiece, setSelectedPiece] = useState('N');

  const { preAi, modern, diff } = useMemo(() => {
    const pieceData = data.filter((d) => d.piece === selectedPiece);

    const preAi = pieceData.filter((d) => d.period === 'pre-ai').map((d) => ({
      square: d.square,
      count: d.count,
    }));

    const modern = pieceData.filter((d) => d.period === 'modern').map((d) => ({
      square: d.square,
      count: d.count,
    }));

    // Difference map: modern - pre-ai
    const diff = preAi.map((pre) => {
      const mod = modern.find((m) => m.square === pre.square);
      return {
        square: pre.square,
        count: mod ? mod.count - pre.count : 0,
      };
    });

    return { preAi, modern, diff };
  }, [data, selectedPiece]);

  return (
    <div>
      {/* Piece selector */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-text-muted text-sm mr-2">Piece:</span>
        {PIECE_OPTIONS.map((p) => (
          <button
            key={p.key}
            onClick={() => setSelectedPiece(p.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedPiece === p.key
                ? 'bg-primary text-dark'
                : 'bg-card text-text-secondary hover:bg-border'
            }`}
          >
            <span className="text-lg">{p.symbol}</span>
            {p.label}
          </button>
        ))}
      </div>

      {/* Three boards side by side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ChessBoard data={preAi} title="Pre-AI (2015-16)" colorScheme="green" />
        <ChessBoard data={modern} title="Modern (2024)" colorScheme="green" />
        <ChessBoard data={diff} title="Difference (Modern - Pre-AI)" colorScheme="diverging" />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-sm text-text-muted">
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded opacity-70" style={{ backgroundColor: '#81B64C' }} />
          <span>Higher frequency</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded opacity-20" style={{ backgroundColor: '#81B64C' }} />
          <span>Lower frequency</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded" style={{ backgroundColor: '#81B64C' }} />
          <span>Difference: More in Modern</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded" style={{ backgroundColor: '#e74c3c' }} />
          <span>Difference: Less in Modern</span>
        </div>
      </div>
    </div>
  );
}
