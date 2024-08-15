import {ux} from '@oclif/core/ux'
import {capitalCase} from 'change-case'
import {Instance, render} from 'ink'
import {env} from 'node:process'
import React from 'react'

import {icons} from '../design-elements.js'
import {StageTracker} from '../stage-tracker.js'
import {readableTime} from '../utils.js'
import {
  FormattedKeyValue,
  InfoBlock,
  KeyValuePair,
  SimpleMessage,
  StageInfoBlock,
  Stages,
  StagesProps,
} from './stages.js'

// Taken from https://github.com/sindresorhus/is-in-ci
const isInCi =
  env.CI !== '0' &&
  env.CI !== 'false' &&
  ('CI' in env || 'CONTINUOUS_INTEGRATION' in env || Object.keys(env).some((key) => key.startsWith('CI_')))

type MultiStageOutputOptions<T extends Record<string, unknown>> = {
  /**
   * Stages to render.
   */
  readonly stages: readonly string[] | string[]
  /**
   * Title to display at the top of the stages component.
   */
  readonly title: string
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
   * Whether JSON output is enabled. Defaults to false.
   *
   * Pass in this.jsonEnabled() from the command class to determine if JSON output is enabled.
   */
  readonly jsonEnabled: boolean
}

class CIMultiStageOutput<T extends Record<string, unknown>> {
  private data?: Partial<T>
  private readonly hasElapsedTime?: boolean
  private readonly hasStageTime?: boolean
  private lastUpdateTime: number
  private readonly messageTimeout = Number.parseInt(env.SF_CI_MESSAGE_TIMEOUT ?? '5000', 10) ?? 5000

  private readonly postStagesBlock?: InfoBlock<T>
  private readonly preStagesBlock?: InfoBlock<T>
  private seenStages: Set<string> = new Set()
  private readonly stages: readonly string[] | string[]
  private readonly stageSpecificBlock?: StageInfoBlock<T>
  private startTime: number | undefined
  private startTimes: Map<string, number> = new Map()
  private readonly timerUnit: 'ms' | 's'
  private readonly title: string

  public constructor({
    data,
    postStagesBlock,
    preStagesBlock,
    showElapsedTime,
    showStageTime,
    stageSpecificBlock,
    stages,
    timerUnit,
    title,
  }: MultiStageOutputOptions<T>) {
    this.title = title
    this.stages = stages
    this.postStagesBlock = postStagesBlock
    this.preStagesBlock = preStagesBlock
    this.hasElapsedTime = showElapsedTime ?? true
    this.hasStageTime = showStageTime ?? true
    this.stageSpecificBlock = stageSpecificBlock
    this.timerUnit = timerUnit ?? 'ms'
    this.data = data
    this.lastUpdateTime = Date.now()

    ux.stdout(`───── ${this.title} ─────`)
    ux.stdout('Stages:')
    for (const stage of this.stages) {
      ux.stdout(`${this.stages.indexOf(stage) + 1}. ${capitalCase(stage)}`)
    }

    ux.stdout()

    if (this.hasElapsedTime) {
      this.startTime = Date.now()
    }
  }

  public stop(stageTracker: StageTracker): void {
    this.update(stageTracker)
    if (this.startTime) {
      const elapsedTime = Date.now() - this.startTime
      ux.stdout()
      const displayTime = readableTime(elapsedTime, this.timerUnit)
      ux.stdout(`Elapsed time: ${displayTime}`)
      ux.stdout()
    }

    this.printInfo(this.preStagesBlock)
    this.printInfo(this.postStagesBlock)
  }

  public update(stageTracker: StageTracker, data?: Partial<T>): void {
    this.data = {...this.data, ...data} as T

    for (const [stage, status] of stageTracker.entries()) {
      // no need to re-render completed, failed, or skipped stages
      if (this.seenStages.has(stage)) continue

      switch (status) {
        case 'pending': {
          // do nothing
          break
        }

        case 'current': {
          if (Date.now() - this.lastUpdateTime < this.messageTimeout) break
          this.lastUpdateTime = Date.now()
          if (!this.startTimes.has(stage)) this.startTimes.set(stage, Date.now())
          ux.stdout(`${icons.current} ${capitalCase(stage)}...`)
          this.printInfo(this.preStagesBlock, 3)
          this.printInfo(
            this.stageSpecificBlock?.filter((info) => info.stage === stage),
            3,
          )
          this.printInfo(this.postStagesBlock, 3)
          break
        }

        case 'failed':
        case 'skipped':
        case 'completed': {
          this.seenStages.add(stage)
          if (this.hasStageTime && status !== 'skipped') {
            const startTime = this.startTimes.get(stage)
            const elapsedTime = startTime ? Date.now() - startTime : 0
            const displayTime = readableTime(elapsedTime, this.timerUnit)
            ux.stdout(`${icons[status]} ${capitalCase(stage)} (${displayTime})`)
            this.printInfo(this.preStagesBlock, 3)
            this.printInfo(
              this.stageSpecificBlock?.filter((info) => info.stage === stage),
              3,
            )
            this.printInfo(this.postStagesBlock, 3)
          } else if (status === 'skipped') {
            ux.stdout(`${icons[status]} ${capitalCase(stage)} - Skipped`)
          } else {
            ux.stdout(`${icons[status]} ${capitalCase(stage)}`)
            this.printInfo(this.preStagesBlock, 3)
            this.printInfo(
              this.stageSpecificBlock?.filter((info) => info.stage === stage),
              3,
            )
            this.printInfo(this.postStagesBlock, 3)
          }

          break
        }

        default:
        // do nothing
      }
    }
  }

  private printInfo(infoBlock: InfoBlock<T> | StageInfoBlock<T> | undefined, indent = 0): void {
    const spaces = ' '.repeat(indent)
    if (infoBlock?.length) {
      for (const info of infoBlock) {
        const formattedData = info.get ? info.get(this.data as T) : undefined
        if (!formattedData) continue
        if (info.type === 'message') {
          ux.stdout(`${spaces}${formattedData}`)
        } else {
          ux.stdout(`${spaces}${info.label}: ${formattedData}`)
        }
      }
    }
  }
}

export class MultiStageOutput<T extends Record<string, unknown>> implements Disposable {
  private ciInstance: CIMultiStageOutput<T> | undefined
  private data?: Partial<T>
  private readonly hasElapsedTime?: boolean
  private readonly hasStageTime?: boolean
  private inkInstance: Instance | undefined

  private readonly postStagesBlock?: InfoBlock<T>
  private readonly preStagesBlock?: InfoBlock<T>
  private readonly stages: readonly string[] | string[]
  private readonly stageSpecificBlock?: StageInfoBlock<T>
  private stageTracker: StageTracker
  private stopped = false
  private readonly timerUnit?: 'ms' | 's'
  private readonly title: string

  public constructor({
    data,
    jsonEnabled,
    postStagesBlock,
    preStagesBlock,
    showElapsedTime,
    showStageTime,
    stageSpecificBlock,
    stages,
    timerUnit,
    title,
  }: MultiStageOutputOptions<T>) {
    this.data = data
    this.stages = stages
    this.title = title
    this.postStagesBlock = postStagesBlock
    this.preStagesBlock = preStagesBlock
    this.hasElapsedTime = showElapsedTime ?? true
    this.hasStageTime = showStageTime ?? true
    this.timerUnit = timerUnit ?? 'ms'
    this.stageTracker = new StageTracker(stages)
    this.stageSpecificBlock = stageSpecificBlock

    if (jsonEnabled) return

    if (isInCi) {
      this.ciInstance = new CIMultiStageOutput({
        data,
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

  public goto(stage: string, data?: Partial<T>): void {
    if (this.stopped) return

    // ignore non-existent stages
    if (!this.stages.includes(stage)) return

    // prevent going to a previous stage
    if (this.stages.indexOf(stage) < this.stages.indexOf(this.stageTracker.current ?? this.stages[0])) return

    this.update(stage, data)
  }

  public next(data?: Partial<T>): void {
    if (this.stopped) return

    const nextStageIndex = this.stages.indexOf(this.stageTracker.current ?? this.stages[0]) + 1
    if (nextStageIndex < this.stages.length) {
      this.update(this.stages[nextStageIndex], data)
    }
  }

  public stop(error?: Error): void {
    if (this.stopped) return
    this.stopped = true

    this.stageTracker.refresh(this.stageTracker.current ?? this.stages[0], {hasError: Boolean(error), isStopping: true})

    if (isInCi) {
      this.ciInstance?.stop(this.stageTracker)
      return
    }

    const stagesInput = {...this.generateStagesInput(), ...(error ? {error} : {})}

    this.inkInstance?.rerender(<Stages {...stagesInput} />)
    this.inkInstance?.unmount()
  }

  public [Symbol.dispose](): void {
    this.inkInstance?.unmount()
  }

  public updateData(data: Partial<T>): void {
    if (this.stopped) return
    this.data = {...this.data, ...data} as T

    this.update(this.stageTracker.current ?? this.stages[0], data)
  }

  private formatKeyValuePairs(infoBlock: InfoBlock<T> | StageInfoBlock<T> | undefined): FormattedKeyValue[] {
    return (
      infoBlock?.map((info) => {
        const formattedData = info.get ? info.get(this.data as T) : undefined
        return {
          color: info.color,
          isBold: info.bold,
          type: info.type,
          value: formattedData,
          ...(info.type === 'message' ? {} : {label: info.label}),
          ...('stage' in info ? {stage: info.stage} : {}),
        }
      }) ?? []
    )
  }

  /** shared method to populate everything needed for Stages cmp */
  private generateStagesInput(): StagesProps {
    return {
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

  private update(stage: string, data?: Partial<T>): void {
    this.data = {...this.data, ...data} as Partial<T>

    this.stageTracker.refresh(stage)

    if (isInCi) {
      this.ciInstance?.update(this.stageTracker, this.data)
    } else {
      this.inkInstance?.rerender(<Stages {...this.generateStagesInput()} />)
    }
  }
}
