import {type SpinnerName} from 'cli-spinners'
import figures from 'figures'

export const icons = {
  completed: figures.tick,
  current: figures.play,
  failed: figures.cross,
  pending: figures.squareSmallFilled,
  skipped: figures.circle,
}

export const spinners: Record<string, SpinnerName> = {
  info: process.platform === 'win32' ? 'line' : 'arc',
  stage: process.platform === 'win32' ? 'line' : 'dots2',
}
