import { useTranslation } from 'react-i18next'
import type { StateCode } from '../lib/types'

// Germany as a tile grid: one tile per state, roughly where it sits on the map.
const TILES: Array<{ code: StateCode; row: number; col: number }> = [
  { code: 'SH', row: 1, col: 3 },
  { code: 'HB', row: 2, col: 2 },
  { code: 'HH', row: 2, col: 3 },
  { code: 'MV', row: 2, col: 4 },
  { code: 'NI', row: 3, col: 2 },
  { code: 'ST', row: 3, col: 3 },
  { code: 'BB', row: 3, col: 4 },
  { code: 'BE', row: 3, col: 5 },
  { code: 'NW', row: 4, col: 1 },
  { code: 'HE', row: 4, col: 2 },
  { code: 'TH', row: 4, col: 3 },
  { code: 'SN', row: 4, col: 4 },
  { code: 'SL', row: 5, col: 1 },
  { code: 'RP', row: 5, col: 2 },
  { code: 'BW', row: 5, col: 3 },
  { code: 'BY', row: 5, col: 4 },
]

export function StateTileMap({ visited }: { visited: StateCode[] }) {
  const { t } = useTranslation()
  const seen = new Set(visited)
  const label = visited.length
    ? t('stats.mapLabel', { states: [...visited].sort().join(', ') })
    : t('stats.mapLabelNone')

  return (
    <div role="img" aria-label={label} className="grid grid-cols-5 grid-rows-[repeat(5,48px)] gap-1.5 font-mono text-xs font-bold">
      {TILES.map(({ code, row, col }) => (
        <span
          key={code}
          style={{ gridRow: row, gridColumn: col }}
          className={`flex items-center justify-center rounded-md ${seen.has(code) ? 'bg-ink text-paper' : 'bg-line-soft text-muted'}`}
        >
          {code}
        </span>
      ))}
    </div>
  )
}
