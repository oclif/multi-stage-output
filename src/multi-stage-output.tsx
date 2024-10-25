import {ux} from '@oclif/core/ux'
import {Instance, render} from 'ink'
import {env} from 'node:process'
import React from 'react'

import {
  FormattedKeyValue,
  InfoBlock,
  KeyValuePair,
  SimpleMessage,
  StageInfoBlock,
  Stages,
  StagesProps,
} from './components/stages.js'
import {Design, RequiredDesign, constructDesignParams} from './design.js'
import {StageStatus, StageTracker} from './stage-tracker.js'
import {readableTime} from './utils.js'

function isTruthy(value: string | undefined): boolean {
  return value !== '0' && value !== 'false'
}

/**
 * Determines whether the CI mode should be used.
 *
 * If the MSO_DISABLE_CI_MODE environment variable is set to a truthy value, CI mode will be disabled.
 *
 * If the CI environment variable is set, CI mode will be enabled.
 *
 * If the DEBUG environment variable is set, CI mode will be enabled.
 *
 * @returns {boolean} True if CI mode should be used, false otherwise.
 */
function shouldUseCIMode(): boolean {
  if (env.MSO_DISABLE_CI_MODE && isTruthy(env.MSO_DISABLE_CI_MODE)) return false
  // Inspired by https://github.com/sindresorhus/is-in-ci
  if (
    isTruthy(env.CI) &&
    ('CI' in env || 'CONTINUOUS_INTEGRATION' in env || Object.keys(env).some((key) => key.startsWith('CI_')))
  )
    return true
  if (env.DEBUG && isTruthy(env.DEBUG)) return true
  return false
}

const isInCi = shouldUseCIMode()

export type MultiStageOutputOptions<T extends Record<string, unknown>> = {
  /**
   * Stages to render.
   */
  readonly stages: readonly string[] | string[]
  /**
   * Title to display at the top of the stages component.
   */
  readonly title?: string
  /**
   * Information to display at the bottom of the stages component.
   */
  readonly postStagesBlock?: Array<KeyValuePair<T> | SimpleMessage<T>>
  /**
   * Information to display below the title but above the stages.
   */
  readonly preStagesBlock?: Array<KeyValuePair<T> | SimpleMessage<T>>
  /**
   * Whether to show the total elapsed time. Defaults to true
   */
  readonly showElapsedTime?: boolean
  /**
   * Whether to show the time spent on each stage. Defaults to true
   */
  readonly showStageTime?: boolean
  /**
   * Whether to show the title. Defaults to true
   */
  readonly showTitle?: boolean
  /**
   * Information to display for a specific stage. Each object must have a stage property set.
   */
  readonly stageSpecificBlock?: StageInfoBlock<T>
  /**
   * The unit to use for the timer. Defaults to 'ms'
   */
  readonly timerUnit?: 'ms' | 's'
  /**
   * Data to display in the stages component. This data will be passed to the get function in the info object.
   */
  readonly data?: Partial<T>
  /**
   * Design options to customize the output.
   */
  readonly design?: Design
  /**
   * Set to true when --json flag is passed to the command. This will prevent any output to the console. Defaults to false
   */
  readonly jsonEnabled: boolean
}

class CIMultiStageOutput<T extends Record<string, unknown>> {
  private readonly completedStages: Set<string> = new Set()
  private data?: Partial<T>
  private readonly design: RequiredDesign
  private readonly hasElapsedTime?: boolean
  private readonly hasStageTime?: boolean
  /**
   * Amount of time (in milliseconds) between heartbeat updates
   */
  private readonly heartbeat =
    Number.parseInt(env.OCLIF_CI_HEARTBEAT_FREQUENCY_MS ?? env.SF_CI_HEARTBEAT_FREQUENCY_MS ?? '300000', 10) ?? 300_000

  /**
   * Time of the last heartbeat
   */
  private lastHeartbeatTime: number

  /**
   * Map of the last time a specific piece of info was updated. This is used for throttling messages
   */
  private readonly lastUpdateByInfo = new Map<string, number>()

  private readonly postStagesBlock?: InfoBlock<T>
  private readonly preStagesBlock?: InfoBlock<T>
  private readonly seenStrings: Set<string> = new Set()
  private readonly stages: readonly string[] | string[]
  private readonly stageSpecificBlock?: StageInfoBlock<T>
  private readonly startTime: number | undefined
  private readonly startTimes: Map<string, number> = new Map()

  /**
   * Amount of time (in milliseconds) between throttled updates
   */
  private readonly throttle =
    Number.parseInt(env.OCLIF_CI_UPDATE_FREQUENCY_MS ?? env.SF_CI_UPDATE_FREQUENCY_MS ?? '5000', 10) ?? 5000

  private readonly timerUnit: 'ms' | 's'
  /**
   * Map of intervals used to trigger heartbeat updates
   */
  private readonly updateIntervals = new Map<string, NodeJS.Timeout>()

  public constructor({
    data,
    design,
    postStagesBlock,
    preStagesBlock,
    showElapsedTime,
    showStageTime,
    stageSpecificBlock,
    stages,
    timerUnit,
    title,
  }: MultiStageOutputOptions<T>) {
    this.design = constructDesignParams(design)
    this.stages = stages
    this.postStagesBlock = postStagesBlock
    this.preStagesBlock = preStagesBlock
    this.hasElapsedTime = showElapsedTime ?? true
    this.hasStageTime = showStageTime ?? true
    this.stageSpecificBlock = stageSpecificBlock
    this.timerUnit = timerUnit ?? 'ms'
    this.data = data
    this.lastHeartbeatTime = Date.now()

    if (title) ux.stdout(`───── ${title} ─────`)
    ux.stdout('Stages:')
    for (const stage of this.stages) {
      ux.stdout(`${this.stages.indexOf(stage) + 1}. ${stage}`)
    }

    ux.stdout()

    if (this.hasElapsedTime) {
      this.startTime = Date.now()
    }
  }

  public stop(stageTracker: StageTracker): void {
    this.update(stageTracker)
    ux.stdout()
    this.maybePrintInfo(this.preStagesBlock, 0, true)
    this.maybePrintInfo(this.postStagesBlock, 0, true)
    if (this.startTime) {
      const elapsedTime = Date.now() - this.startTime
      ux.stdout()
      const displayTime = readableTime(elapsedTime, this.timerUnit)
      ux.stdout(`Elapsed time: ${displayTime}`)
    }

    for (const interval of this.updateIntervals.values()) {
      clearInterval(interval)
    }
  }

  // eslint-disable-next-line complexity
  public update(stageTracker: StageTracker, data?: Partial<T>): void {
    this.data = {...this.data, ...data} as T

    for (const [stage, status] of stageTracker.entries()) {
      // no need to re-render completed, failed, or skipped stages
      if (this.completedStages.has(stage)) continue

      switch (status) {
        case 'pending': {
          // do nothing
          break
        }

        case 'current': {
          if (!this.startTimes.has(stage)) this.startTimes.set(stage, Date.now())
          const stageInfos = this.stageSpecificBlock?.filter((info) => info.stage === stage)
          const iconAndStage = `${this.design.icons.current.figure} ${stage}…`
          if (Date.now() - this.lastHeartbeatTime < this.heartbeat) {
            // only print if it hasn't been seen before
            this.maybeStdout(iconAndStage)
            this.maybePrintInfo(this.preStagesBlock, 3)
            this.maybePrintInfo(stageInfos, 3)
            this.maybePrintInfo(this.postStagesBlock, 3)
          } else {
            // force a reprint if it's been too long
            this.lastHeartbeatTime = Date.now()
            if (stageInfos?.length) {
              // only reprint the stage infos if it has them
              this.maybePrintInfo(stageInfos, 3, true)
            } else {
              // only reprint the stage
              this.maybeStdout(iconAndStage, 0, true)
            }
          }

          if (!this.updateIntervals.has(stage)) {
            // set interval to update the stage message - this is used for long running stages in CI environments that timeout after a certain period without output
            this.updateIntervals.set(
              stage,
              setInterval(() => {
                this.update(stageTracker)
              }, this.heartbeat),
            )
          }

          break
        }

        case 'failed':
        case 'skipped':
        case 'paused':
        case 'aborted':
        case 'async':
        case 'warning':
        case 'completed': {
          // clear the heartbeat interval since it's no longer needed
          const interval = this.updateIntervals.get(stage)
          if (interval) {
            clearInterval(interval)
            this.updateIntervals.delete(stage)
          }

          // clear all throttled messages since the stage is done
          for (const key of this.lastUpdateByInfo.keys()) {
            this.lastUpdateByInfo.delete(key)
          }

          const stageInfos = this.stageSpecificBlock?.filter((info) => info.stage === stage)
          this.completedStages.add(stage)
          if (this.hasStageTime && status !== 'skipped') {
            const startTime = this.startTimes.get(stage)
            const elapsedTime = startTime ? Date.now() - startTime : 0
            const displayTime = readableTime(elapsedTime, this.timerUnit)
            this.maybeStdout(`${this.design.icons[status].figure} ${stage} (${displayTime})`)
            this.maybePrintInfo(this.preStagesBlock, 3)
            this.maybePrintInfo(stageInfos, 3)
            this.maybePrintInfo(this.postStagesBlock, 3)
          } else if (status === 'skipped') {
            this.maybeStdout(`${this.design.icons[status].figure} ${stage} - Skipped`)
          } else {
            this.maybeStdout(`${this.design.icons[status].figure} ${stage}`)
            this.maybePrintInfo(this.preStagesBlock, 3)
            this.maybePrintInfo(stageInfos, 3)
            this.maybePrintInfo(this.postStagesBlock, 3)
          }

          break
        }

        default:
        // do nothing
      }
    }
  }

  private maybePrintInfo(infoBlock: InfoBlock<T> | StageInfoBlock<T> | undefined, indent = 0, force = false): void {
    if (infoBlock?.length) {
      for (const info of infoBlock) {
        if (info.onlyShowAtEndInCI && !force) continue

        const formattedData = info.get ? info.get(this.data as T) : undefined
        if (!formattedData) continue
        const key = info.type === 'message' ? formattedData : info.label
        const str = info.type === 'message' ? formattedData : `${info.label}: ${formattedData}`

        const lastUpdateTime = this.lastUpdateByInfo.get(key)
        // Skip if the info has been printed before the throttle time
        if (lastUpdateTime && Date.now() - lastUpdateTime < this.throttle && !force) continue

        const didPrint = this.maybeStdout(str, indent, force)
        if (didPrint) this.lastUpdateByInfo.set(key, Date.now())
      }
    }
  }

  private maybeStdout(str: string, indent = 0, force = false): boolean {
    const spaces = ' '.repeat(indent)
    if (!force && this.seenStrings.has(str)) return false
    ux.stdout(`${spaces}${str}`)
    this.seenStrings.add(str)
    return true
  }
}

class MultiStageOutputBase<T extends Record<string, unknown>> implements Disposable {
  protected readonly ciInstance: CIMultiStageOutput<T> | undefined
  protected data?: Partial<T>
  protected readonly design: RequiredDesign
  protected readonly hasElapsedTime?: boolean
  protected readonly hasStageTime?: boolean
  protected readonly inkInstance: Instance | undefined
  protected readonly postStagesBlock?: InfoBlock<T>
  protected readonly preStagesBlock?: InfoBlock<T>
  protected readonly stages: readonly string[] | string[]
  protected readonly stageSpecificBlock?: StageInfoBlock<T>
  protected readonly stageTracker: StageTracker
  protected stopped = false
  protected readonly timerUnit?: 'ms' | 's'
  protected readonly title?: string

  public constructor(
    {
      data,
      design,
      jsonEnabled = false,
      postStagesBlock,
      preStagesBlock,
      showElapsedTime,
      showStageTime,
      stageSpecificBlock,
      stages,
      timerUnit,
      title,
    }: MultiStageOutputOptions<T>,
    allowParallelTasks?: boolean,
  ) {
    this.data = data
    this.design = constructDesignParams(design)
    this.stages = stages
    this.title = title
    this.postStagesBlock = postStagesBlock
    this.preStagesBlock = preStagesBlock
    this.hasElapsedTime = showElapsedTime ?? true
    this.hasStageTime = showStageTime ?? true
    this.timerUnit = timerUnit ?? 'ms'
    this.stageTracker = new StageTracker(stages, {allowParallelTasks})
    this.stageSpecificBlock = stageSpecificBlock

    if (jsonEnabled) return

    if (isInCi) {
      this.ciInstance = new CIMultiStageOutput({
        data,
        design,
        jsonEnabled,
        postStagesBlock,
        preStagesBlock,
        showElapsedTime,
        showStageTime,
        stageSpecificBlock,
        stages,
        timerUnit,
        title,
      })
    } else {
      this.inkInstance = render(<Stages {...this.generateStagesInput()} />)
    }
  }

  /**
   * Stop multi-stage output from running with a failed status.
   */
  public error(): void {
    this.stop('failed')
  }

  protected formatKeyValuePairs(infoBlock: InfoBlock<T> | StageInfoBlock<T> | undefined): FormattedKeyValue[] {
    return (
      infoBlock?.map((info) => {
        const formattedData = info.get ? info.get(this.data as T) : undefined
        return {
          color: info.color,
          isBold: info.bold,
          neverCollapse: info.neverCollapse,
          type: info.type,
          value: formattedData,
          ...(info.type === 'message' ? {} : {label: info.label}),
          ...('stage' in info ? {stage: info.stage} : {}),
        }
      }) ?? []
    )
  }

  /** shared method to populate everything needed for Stages cmp */
  protected generateStagesInput(opts?: {compactionLevel?: number}): StagesProps {
    const {compactionLevel} = opts ?? {}
    return {
      compactionLevel,
      design: this.design,
      hasElapsedTime: this.hasElapsedTime,
      hasStageTime: this.hasStageTime,
      postStagesBlock: this.formatKeyValuePairs(this.postStagesBlock),
      preStagesBlock: this.formatKeyValuePairs(this.preStagesBlock),
      stageSpecificBlock: this.formatKeyValuePairs(this.stageSpecificBlock),
      stageTracker: this.stageTracker,
      timerUnit: this.timerUnit,
      title: this.title,
    }
  }

  protected rerender(): void {
    if (isInCi) {
      this.ciInstance?.update(this.stageTracker, this.data)
    } else {
      this.inkInstance?.rerender(<Stages {...this.generateStagesInput()} />)
    }
  }

  /**
   * Stop multi-stage output from running.
   *
   * The stage currently running will be changed to the provided `finalStatus`.
   *
   * @param finalStatus - The status to set the current stage to.
   * @returns void
   */
  public stop(finalStatus: StageStatus = 'completed'): void {
    if (this.stopped) return
    this.stopped = true

    this.stageTracker.stop(this.stageTracker.current[0] ?? this.stages[0], finalStatus)

    if (isInCi) {
      this.ciInstance?.stop(this.stageTracker)
      return
    }

    // The underlying components expect an Error, although they don't currently use anything on the error - they check if it exists.
    // Instead of refactoring the components to take a boolean, we pass in a placeholder Error,
    // which, gives us the flexibility in the future to pass in an actual Error if we want
    const error = finalStatus === 'failed' ? new Error('Error') : undefined

    const stagesInput = {...this.generateStagesInput({compactionLevel: 0}), ...(error ? {error} : {})}

    this.inkInstance?.rerender(<Stages {...stagesInput} compactionLevel={0} />)
    this.inkInstance?.unmount()
  }

  public [Symbol.dispose](): void {
    this.inkInstance?.unmount()
  }

  /**
   * Updates the data of the component.
   *
   * @param data - The partial data object to update the component's data with.
   * @returns void
   */
  public updateData(data: Partial<T>): void {
    if (this.stopped) return
    this.data = {...this.data, ...data} as T

    this.rerender()
  }
}

export class MultiStageOutput<T extends Record<string, unknown>> extends MultiStageOutputBase<T> {
  public constructor(options: MultiStageOutputOptions<T>) {
    super(options)
  }

  /**
   * Go to a stage, marking any stages in between the current stage and the provided stage as completed.
   *
   * If the stage does not exist or is before the current stage, nothing will happen.
   *
   * If the stage is the same as the current stage, the data will be updated.
   *
   * @param stage Stage to go to
   * @param data - Optional data to pass to the next stage.
   * @returns void
   */
  public goto(stage: string, data?: Partial<T>): void {
    if (this.stopped) return

    // ignore non-existent stages
    if (!this.stages.includes(stage)) return

    // prevent going to a previous stage
    if (this.stages.indexOf(stage) < this.stages.indexOf(this.stageTracker.current[0] ?? this.stages[0])) return

    this.update(stage, 'completed', data)
  }

  /**
   * Moves to the next stage of the process.
   *
   * @param data - Optional data to pass to the next stage.
   * @returns void
   */
  public next(data?: Partial<T>): void {
    if (this.stopped) return

    const nextStageIndex = this.stages.indexOf(this.stageTracker.current[0] ?? this.stages[0]) + 1
    if (nextStageIndex < this.stages.length) {
      this.update(this.stages[nextStageIndex], 'completed', data)
    }
  }

  /**
   * Go to a stage, marking any stages in between the current stage and the provided stage as skipped.
   *
   * If the stage does not exist or is before the current stage, nothing will happen.
   *
   * If the stage is the same as the current stage, the data will be updated.
   *
   * @param stage Stage to go to
   * @param data - Optional data to pass to the next stage.
   * @returns void
   */
  public skipTo(stage: string, data?: Partial<T>): void {
    if (this.stopped) return

    // ignore non-existent stages
    if (!this.stages.includes(stage)) return

    // prevent going to a previous stage
    if (this.stages.indexOf(stage) < this.stages.indexOf(this.stageTracker.current[0] ?? this.stages[0])) return

    this.update(stage, 'skipped', data)
  }

  private update(stage: string, bypassStatus: StageStatus, data?: Partial<T>): void {
    this.data = {...this.data, ...data} as Partial<T>

    this.stageTracker.refresh(stage, {bypassStatus})

    this.rerender()
  }
}

export class ParallelMultiStageOutput<T extends Record<string, unknown>> extends MultiStageOutputBase<T> {
  public constructor(options: MultiStageOutputOptions<T>) {
    super(options, true)
  }

  public pauseStage(stage: string, data?: Partial<T>): void {
    this.update(stage, 'paused', data)
  }

  public resumeStage(stage: string, data?: Partial<T>): void {
    this.update(stage, 'current', data)
  }

  public startStage(stage: string, data?: Partial<T>): void {
    this.update(stage, 'current', data)
  }

  public stopStage(stage: string, data?: Partial<T>): void {
    this.update(stage, 'completed', data)
  }

  public updateStage(stage: string, status: StageStatus, data?: Partial<T>): void {
    this.update(stage, status, data)
  }

  private update(stage: string, status: StageStatus, data?: Partial<T>): void {
    if (this.stopped) return
    if (!this.stages.includes(stage)) return
    if (this.stageTracker.get(stage) === 'completed') return

    this.data = {...this.data, ...data} as T

    this.stageTracker.update(stage, status)

    this.rerender()
  }
}
