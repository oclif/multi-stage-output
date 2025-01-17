import {type SpinnerName} from 'cli-spinners'
import figures from 'figures'

import {IconProps} from './components/icon.js'

export type Design = {
  icons?: {
    /**
     * Icon to display for a completed stage. Defaults to green '✔'
     */
    completed?: IconProps
    /**
     * Icon to display for the current stage in CI environments. Defaults to '▶'
     *
     * Non-CI environments will display the spinner instead.
     */
    current?: IconProps
    /**
     * Icon to display for a failed stage. Defaults to red '✘'
     */
    failed?: IconProps
    /**
     * Icon to display for a pending stage. Defaults to dim '◼'
     */
    pending?: IconProps
    /**
     * Icon to display for a skipped stage. Defaults to dim '◯'
     */
    skipped?: IconProps
    /**
     * Icon to display for stage specific information. Defaults to '▸'
     */
    info?: IconProps
    /**
     * Icon to display for a aborted stage. Defaults to red '◼'
     */
    aborted?: IconProps
    /**
     * Icon to display for a paused stage. Defaults to magenta '●'
     */
    paused?: IconProps
    /**
     * Icon to display for an async stage. Defaults to magenta '▶'
     */
    async?: IconProps
    /**
     * Icon to display for a warning. Defaults to yellow '⚠'
     */
    warning?: IconProps
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
     * Color of the title
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
     * Spinner to display for dynamic info blocks. Defaults to 'line' on Windows and 'dots11' on other platforms
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
      aborted: {
        color: 'red',
        figure: figures.squareSmallFilled,
        paddingLeft: 0,
        paddingRight: 0,
        ...design?.icons?.current,
      },
      async: {
        color: 'magenta',
        figure: figures.play,
        paddingLeft: 0,
        paddingRight: 0,
        ...design?.icons?.current,
      },
      completed: {
        color: 'green',
        figure: figures.tick,
        paddingLeft: 0,
        paddingRight: 0,
        ...design?.icons?.completed,
      },
      current: {
        color: 'yellow',
        figure: figures.play,
        paddingLeft: 0,
        paddingRight: 0,
        ...design?.icons?.current,
      },
      failed: {
        color: 'red',
        figure: figures.cross,
        paddingLeft: 0,
        paddingRight: 0,
        ...design?.icons?.failed,
      },
      info: {
        color: false,
        figure: figures.triangleRightSmall,
        paddingLeft: 2,
        paddingRight: 1,
        ...design?.icons?.info,
      },
      paused: {
        color: 'magenta',
        figure: figures.bullet,
        paddingLeft: 0,
        paddingRight: 1,
        ...design?.icons?.current,
      },
      pending: {
        color: 'dim',
        figure: figures.squareSmallFilled,
        paddingLeft: 0,
        paddingRight: 0,
        ...design?.icons?.pending,
      },
      skipped: {
        color: 'dim',
        figure: figures.circle,
        paddingLeft: 0,
        paddingRight: 1,
        ...design?.icons?.skipped,
      },
      warning: {
        color: 'yellow',
        figure: figures.warning,
        paddingLeft: 0,
        paddingRight: 0,
        ...design?.icons?.warning,
      },
    },
    spinners: {
      info: process.platform === 'win32' ? 'line' : 'dots11',
      stage: process.platform === 'win32' ? 'line' : 'dots2',
      ...design?.spinners,
    },
    title: {
      dividerChar: '─',
      dividerColor: 'dim',
      padding: 1,
      textColor: 'reset',
      textPadding: 1,
      width: 50,
      ...design?.title,
    },
  }
}
