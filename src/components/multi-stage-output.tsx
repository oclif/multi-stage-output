import {ux} from '@oclif/core/ux'
import {capitalCase} from 'change-case'
import {Box, Instance, Text, render} from 'ink'
import {env} from 'node:process'
import React from 'react'

import {icons, spinners} from '../design-elements.js'
import {StageTracker} from '../stage-tracker.js'
import {readableTime} from '../utils.js'
import {Divider} from './divider.js'
import {SpinnerOrError, SpinnerOrErrorOrChildren} from './spinner.js'
import {Timer} from './timer.js'

// Taken from https://github.com/sindresorhus/is-in-ci
const isInCi =
  env.CI !== '0' &&
  env.CI !== 'false' &&
  ('CI' in env || 'CONTINUOUS_INTEGRATION' in env || Object.keys(env).some((key) => key.startsWith('CI_')))

type Info<T extends Record<string, unknown>> = {
  /**
   * key-value: Display a key-value pair with a spinner.
   * static-key-value: Display a key-value pair without a spinner.
   * message: Display a message.
   */
  type: 'dynamic-key-value' | 'static-key-value' | 'message'
  /**
   * Color of the value.
   */
  color?: string
  /**
   * Get the value to display. Takes the data property on the MultiStageComponent as an argument.
   * Useful if you want to apply some logic (like rendering a link) to the data before displaying it.
   *
   * @param data The data property on the MultiStageComponent.
   * @returns {string | undefined}
   */
  get: (data?: T) => string | undefined
  /**
   * Whether the value should be bold.
   */
  bold?: boolean
}

type KeyValuePair<T extends Record<string, unknown>> = Info<T> & {
  /**
   * Label of the key-value pair.
   */
  label: string
  type: 'dynamic-key-value' | 'static-key-value'
}

type SimpleMessage<T extends Record<string, unknown>> = Info<T> & {
  type: 'message'
}

type InfoBlock<T extends Record<string, unknown>> = Array<KeyValuePair<T> | SimpleMessage<T>>
type StageInfoBlock<T extends Record<string, unknown>> = Array<
  (KeyValuePair<T> & {stage: string}) | (SimpleMessage<T> & {stage: string})
>

export type FormattedKeyValue = {
  readonly color?: string
  readonly isBold?: boolean
  // eslint-disable-next-line react/no-unused-prop-types
  readonly label?: string
  readonly value: string | undefined
  // eslint-disable-next-line react/no-unused-prop-types
  readonly stage?: string
  // eslint-disable-next-line react/no-unused-prop-types
  readonly type: 'dynamic-key-value' | 'static-key-value' | 'message'
}

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
  /**
   * Whether to override the CI detection and force the component to render as if it's in a CI environment.
   */
  readonly isInCiOverride?: boolean
}

type StagesProps = {
  readonly error?: Error | undefined
  readonly postStagesBlock?: FormattedKeyValue[]
  readonly preStagesBlock?: FormattedKeyValue[]
  readonly stageSpecificBlock?: FormattedKeyValue[]
  readonly title: string
  readonly hasElapsedTime?: boolean
  readonly hasStageTime?: boolean
  readonly timerUnit?: 'ms' | 's'
  readonly stageTracker: StageTracker
}

function StaticKeyValue({color, isBold, label, value}: FormattedKeyValue): React.ReactNode {
  if (!value) return
  return (
    <Box key={label}>
      <Text bold={isBold}>{label}: </Text>
      <Text color={color}>{value}</Text>
    </Box>
  )
}

function SimpleMessage({color, isBold, value}: FormattedKeyValue): React.ReactNode {
  if (!value) return
  return (
    <Text bold={isBold} color={color}>
      {value}
    </Text>
  )
}

function Infos({
  error,
  keyValuePairs,
  stage,
}: {
  keyValuePairs: FormattedKeyValue[]
  error?: Error
  stage?: string
}): React.ReactNode {
  return (
    keyValuePairs
      // If stage is provided, only show info for that stage
      // otherwise, show all infos that don't have a specified stage
      .filter((kv) => (stage ? kv.stage === stage : !kv.stage))
      .map((kv) => {
        const key = `${kv.label}-${kv.value}`
        if (kv.type === 'message') {
          return <SimpleMessage key={key} {...kv} />
        }

        if (kv.type === 'dynamic-key-value') {
          return (
            <SpinnerOrErrorOrChildren
              key={key}
              error={error}
              label={`${kv.label}:`}
              labelPosition="left"
              type={spinners.info}
            >
              {kv.value && (
                <Text bold={kv.isBold} color={kv.color}>
                  {kv.value}
                </Text>
              )}
            </SpinnerOrErrorOrChildren>
          )
        }

        if (kv.type === 'static-key-value') {
          return <StaticKeyValue key={key} {...kv} />
        }

        return null
      })
  )
}

export function Stages({
  error,
  hasElapsedTime = true,
  hasStageTime = true,
  postStagesBlock,
  preStagesBlock,
  stageSpecificBlock,
  stageTracker,
  timerUnit = 'ms',
  title,
}: StagesProps): React.ReactNode {
  return (
    <Box flexDirection="column" paddingTop={1}>
      <Divider title={title} />

      {preStagesBlock && preStagesBlock.length > 0 && (
        <Box flexDirection="column" marginLeft={1} paddingTop={1}>
          <Infos error={error} keyValuePairs={preStagesBlock} />
        </Box>
      )}

      <Box flexDirection="column" marginLeft={1} paddingTop={1}>
        {[...stageTracker.entries()].map(([stage, status]) => (
          <Box key={stage} flexDirection="column">
            <Box>
              {(status === 'current' || status === 'failed') && (
                <SpinnerOrError error={error} label={capitalCase(stage)} type={spinners.stage} />
              )}

              {status === 'skipped' && (
                <Text color="dim">
                  {icons.skipped} {capitalCase(stage)} - Skipped
                </Text>
              )}

              {status === 'completed' && (
                <Box>
                  <Text color="green">{icons.completed}</Text>
                  <Text>{capitalCase(stage)}</Text>
                </Box>
              )}

              {status === 'pending' && (
                <Text color="dim">
                  {icons.pending} {capitalCase(stage)}
                </Text>
              )}
              {status !== 'pending' && status !== 'skipped' && hasStageTime && (
                <Box>
                  <Text> </Text>
                  <Timer color="dim" isStopped={status === 'completed'} unit={timerUnit} />
                </Box>
              )}
            </Box>

            {stageSpecificBlock && stageSpecificBlock.length > 0 && status !== 'pending' && status !== 'skipped' && (
              <Box flexDirection="column" marginLeft={5}>
                <Infos error={error} keyValuePairs={stageSpecificBlock} stage={stage} />
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {postStagesBlock && postStagesBlock.length > 0 && (
        <Box flexDirection="column" marginLeft={1} paddingTop={1}>
          <Infos error={error} keyValuePairs={postStagesBlock} />
        </Box>
      )}

      {hasElapsedTime && (
        <Box marginLeft={1} paddingTop={1}>
          <Text>Elapsed Time: </Text>
          <Timer unit={timerUnit} />
        </Box>
      )}
    </Box>
  )
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
    ux.stdout('Steps:')
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

  private readonly isInCi: boolean
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
    isInCiOverride,
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
    this.isInCi = isInCiOverride ?? isInCi

    if (jsonEnabled) return

    if (this.isInCi) {
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
      this.inkInstance = render(
        <Stages
          hasElapsedTime={this.hasElapsedTime}
          hasStageTime={this.hasStageTime}
          postStagesBlock={this.formatKeyValuePairs(this.postStagesBlock)}
          preStagesBlock={this.formatKeyValuePairs(this.preStagesBlock)}
          stageSpecificBlock={this.formatKeyValuePairs(this.stageSpecificBlock)}
          stageTracker={this.stageTracker}
          timerUnit={this.timerUnit}
          title={this.title}
        />,
      )
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

    if (this.isInCi) {
      this.ciInstance?.stop(this.stageTracker)
      return
    }

    if (error) {
      this.inkInstance?.rerender(
        <Stages
          error={error}
          hasElapsedTime={this.hasElapsedTime}
          hasStageTime={this.hasStageTime}
          postStagesBlock={this.formatKeyValuePairs(this.postStagesBlock)}
          preStagesBlock={this.formatKeyValuePairs(this.preStagesBlock)}
          stageSpecificBlock={this.formatKeyValuePairs(this.stageSpecificBlock)}
          stageTracker={this.stageTracker}
          timerUnit={this.timerUnit}
          title={this.title}
        />,
      )
    } else {
      this.inkInstance?.rerender(
        <Stages
          hasElapsedTime={this.hasElapsedTime}
          hasStageTime={this.hasStageTime}
          postStagesBlock={this.formatKeyValuePairs(this.postStagesBlock)}
          preStagesBlock={this.formatKeyValuePairs(this.preStagesBlock)}
          stageSpecificBlock={this.formatKeyValuePairs(this.stageSpecificBlock)}
          stageTracker={this.stageTracker}
          timerUnit={this.timerUnit}
          title={this.title}
        />,
      )
    }

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

  private update(stage: string, data?: Partial<T>): void {
    this.data = {...this.data, ...data} as Partial<T>

    this.stageTracker.refresh(stage)

    if (this.isInCi) {
      this.ciInstance?.update(this.stageTracker, this.data)
    } else {
      this.inkInstance?.rerender(
        <Stages
          hasElapsedTime={this.hasElapsedTime}
          hasStageTime={this.hasStageTime}
          postStagesBlock={this.formatKeyValuePairs(this.postStagesBlock)}
          preStagesBlock={this.formatKeyValuePairs(this.preStagesBlock)}
          stageSpecificBlock={this.formatKeyValuePairs(this.stageSpecificBlock)}
          stageTracker={this.stageTracker}
          timerUnit={this.timerUnit}
          title={this.title}
        />,
      )
    }
  }
}
