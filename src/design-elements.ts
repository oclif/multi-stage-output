import {type SpinnerName} from 'cli-spinners'
import figures from 'figures'

export type Design = {
  icons?: {
    /**
     * Icon to display for a completed stage. Defaults to '✔'
     */
    completed?: string
    /**
     * Icon to display for the current stage in CI environments. Defaults to '▶'
     *
     * Non-CI environments will display the spinner instead.
     */
    current?: string
    /**
     * Icon to display for a failed stage. Defaults to '✘'
     */
    failed?: string
    /**
     * Icon to display for a pending stage. Defaults to '◼'
     */
    pending?: string
    /**
     * Icon to display for a skipped stage. Defaults to '◯'
     */
    skipped?: string
  }
  stageSpecific?: {
    /**
     * Icon to display for stage specific information. Defaults to '▸'
     *
     * Set to `false` to disable the icon.
     */
    icon?: string | false
    /**
     * Left margin for stage specific information. Defaults to 2
     */
    leftMargin?: number
  }
  title?: {
    /**
     * Character to use as a divider for the title. Defaults to '─'
     */
    dividerChar?: string
    /**
     * Color of the divider. Defaults to 'dim'
     */
    dividerColor?: string
    /**
     * Padding to add above and below the title. Defaults to 1
     */
    padding?: number
    /**
     * Color of the title. Defaults to 'white'
     */
    textColor?: string
    /**
     * Padding to add to the left and right of the title. Defaults to 1
     */
    textPadding?: number
    /**
     * Width of the title. Defaults to 50
     *
     * The `full` value will use the terminal width minus the title padding.
     */
    width?: number | 'full'
  }
  spinners?: {
    /**
     * Spinner to display for dynamic info blocks. Defaults to 'line' on Windows and 'arc' on other platforms
     */
    info?: SpinnerName
    /**
     * Spinner to display for stages. Defaults to 'line' on Windows and 'dots2' on other platforms
     */
    stage?: SpinnerName
  }
}

type RecursiveRequired<T> = Required<{
  [P in keyof T]: T[P] extends object | undefined ? RecursiveRequired<Required<T[P]>> : T[P]
}>

export type RequiredDesign = RecursiveRequired<Design>

export function constructDesignParams(design?: Design): RequiredDesign {
  return {
    icons: {
      completed: figures.tick,
      current: figures.play,
      failed: figures.cross,
      pending: figures.squareSmallFilled,
      skipped: figures.circle,
      ...design?.icons,
    },
    spinners: {
      info: process.platform === 'win32' ? 'line' : 'arc',
      stage: process.platform === 'win32' ? 'line' : 'dots2',
      ...design?.spinners,
    },
    stageSpecific: {
      icon: figures.triangleRightSmall,
      leftMargin: 2,
      ...design?.stageSpecific,
    },
    title: {
      dividerChar: '─',
      dividerColor: 'dim',
      padding: 1,
      textColor: 'white',
      textPadding: 1,
      width: 50,
      ...design?.title,
    },
  }
}
