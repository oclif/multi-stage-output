import {getLogger} from '@oclif/core/logger'
import {Box, Text, useStdout} from 'ink'
import React, {ErrorInfo} from 'react'
import wrapAnsi from 'wrap-ansi'

import {RequiredDesign, constructDesignParams} from '../design.js'
import {StageStatus, StageTracker} from '../stage-tracker.js'
import {Divider} from './divider.js'
import {Icon} from './icon.js'
import {SpinnerOrError, SpinnerOrErrorOrChildren} from './spinner.js'
import {Timer} from './timer.js'

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
  /**
   * Set to `true` to prevent this key-value pair or message from being collapsed when the window is too short. Defaults to false.
   */
  neverCollapse?: boolean
  /**
   * Set to `true` to only show this key-value pair or message at the very of the CI output. Defaults to false.
   */
  onlyShowAtEndInCI?: boolean
}

export type KeyValuePair<T extends Record<string, unknown>> = Info<T> & {
  /**
   * Label of the key-value pair.
   */
  label: string
  type: 'dynamic-key-value' | 'static-key-value'
}

export type SimpleMessage<T extends Record<string, unknown>> = Info<T> & {
  type: 'message'
}

export type InfoBlock<T extends Record<string, unknown>> = Array<KeyValuePair<T> | SimpleMessage<T>>
export type StageInfoBlock<T extends Record<string, unknown>> = Array<
  (KeyValuePair<T> & {stage: string}) | (SimpleMessage<T> & {stage: string})
>

export type FormattedKeyValue = {
  readonly color?: string
  readonly isBold?: boolean
  // eslint-disable-next-line react/no-unused-prop-types
  readonly label?: string
  // -- what's the difference between `string|undefined` and `string?`
  readonly value: string | undefined
  // eslint-disable-next-line react/no-unused-prop-types
  readonly stage?: string
  // eslint-disable-next-line react/no-unused-prop-types
  readonly type: 'dynamic-key-value' | 'static-key-value' | 'message'
  // eslint-disable-next-line react/no-unused-prop-types, react/boolean-prop-naming
  readonly neverCollapse?: boolean
}

export type StagesProps = {
  readonly compactionLevel?: number
  readonly design?: RequiredDesign
  readonly error?: Error | undefined
  readonly hasElapsedTime?: boolean
  readonly hasStageTime?: boolean
  readonly postStagesBlock?: FormattedKeyValue[]
  readonly preStagesBlock?: FormattedKeyValue[]
  readonly stageSpecificBlock?: FormattedKeyValue[]
  readonly stageTracker: StageTracker
  readonly timerUnit?: 'ms' | 's'
  readonly title?: string
}

function StaticKeyValue({color, isBold, label, value}: FormattedKeyValue): React.ReactNode {
  if (!value) return false
  return (
    <Box key={label} flexWrap="wrap">
      <Text bold={isBold}>{label}: </Text>
      <Text color={color}>{value}</Text>
    </Box>
  )
}

function SimpleMessage({color, isBold, value}: FormattedKeyValue): React.ReactNode {
  if (!value) return false
  return (
    <Text bold={isBold} color={color}>
      {value}
    </Text>
  )
}

function StageInfos({
  design,
  error,
  keyValuePairs,
  stage,
}: {
  design: RequiredDesign
  error?: Error
  keyValuePairs: FormattedKeyValue[]
  stage: string
}): React.ReactNode {
  return keyValuePairs
    .filter((kv) => kv.stage === stage)
    .map((kv) => {
      const key = `${kv.label}-${kv.value}`
      if (kv.type === 'message') {
        return (
          <Box key={key} flexDirection="row">
            <Icon icon={design.icons.info} />
            <SimpleMessage {...kv} />
          </Box>
        )
      }

      if (kv.type === 'dynamic-key-value') {
        return (
          <Box key={key} flexWrap="wrap">
            <Icon icon={design.icons.info} />
            <SpinnerOrErrorOrChildren
              error={error}
              label={`${kv.label}:`}
              labelPosition="left"
              type={design.spinners.info}
              design={design}
            >
              {kv.value && (
                <Text bold={kv.isBold} color={kv.color}>
                  {kv.value}
                </Text>
              )}
            </SpinnerOrErrorOrChildren>
          </Box>
        )
      }

      if (kv.type === 'static-key-value') {
        return (
          <Box key={key}>
            <Icon icon={design.icons.info} />
            <StaticKeyValue key={key} {...kv} />
          </Box>
        )
      }

      return false
    })
}

function Infos({
  design,
  error,
  keyValuePairs,
}: {
  design: RequiredDesign
  error?: Error
  keyValuePairs: FormattedKeyValue[]
}): React.ReactNode {
  return keyValuePairs.map((kv) => {
    const key = `${kv.label}-${kv.value}`
    if (kv.type === 'message') {
      return <SimpleMessage key={key} {...kv} />
    }

    if (kv.type === 'dynamic-key-value') {
      return (
        <Box key={key} flexWrap="wrap">
          <SpinnerOrErrorOrChildren
            error={error}
            label={`${kv.label}:`}
            labelPosition="left"
            type={design.spinners.info}
            design={design}
          >
            {kv.value && (
              <Text bold={kv.isBold} color={kv.color}>
                {kv.value}
              </Text>
            )}
          </SpinnerOrErrorOrChildren>
        </Box>
      )
    }

    if (kv.type === 'static-key-value') {
      return <StaticKeyValue key={key} {...kv} />
    }

    return false
  })
}

function CompactStage({
  design,
  direction = 'row',
  error,
  stage,
  stageSpecificBlock,
  stageTracker,
  status,
}: {
  readonly design: RequiredDesign
  readonly direction?: 'row' | 'column'
  readonly error?: Error
  readonly stage: string
  readonly stageSpecificBlock: FormattedKeyValue[] | undefined
  readonly stageTracker: StageTracker
  readonly status: string
}): React.ReactNode {
  if (status !== 'current') return false
  return (
    <Box flexDirection={direction}>
      <SpinnerOrError
        error={error}
        label={`[${stageTracker.indexOf(stage) + 1}/${stageTracker.size}] ${stage}`}
        type={design.spinners.stage}
        design={design}
      />
      {stageSpecificBlock && stageSpecificBlock.length > 0 && (
        <Box flexDirection="column">
          <StageInfos design={design} error={error} keyValuePairs={stageSpecificBlock} stage={stage} />
        </Box>
      )}
    </Box>
  )
}

function Stage({
  design,
  error,
  stage,
  status,
}: {
  readonly stage: string
  readonly status: StageStatus
  readonly design: RequiredDesign
  readonly error?: Error
}): React.ReactElement {
  return (
    <Box flexWrap="wrap">
      {(status === 'current' || status === 'failed') && (
        <SpinnerOrError error={error} label={stage} type={design.spinners.stage} design={design} />
      )}

      {status === 'skipped' && (
        <Icon icon={design.icons.skipped}>
          <Text color="dim">{stage} - Skipped</Text>
        </Icon>
      )}

      {status !== 'skipped' && status !== 'failed' && status !== 'current' && (
        <Icon icon={design.icons[status]}>
          <Text>{stage}</Text>
        </Icon>
      )}
    </Box>
  )
}

function StageEntries({
  compactionLevel,
  design,
  error,
  hasStageTime,
  stageSpecificBlock,
  stageTracker,
  timerUnit,
}: {
  readonly compactionLevel: number
  readonly stageTracker: StageTracker
  readonly design: RequiredDesign
  readonly error?: Error
  readonly hasStageTime: boolean
  readonly stageSpecificBlock: FormattedKeyValue[] | undefined
  readonly timerUnit: 'ms' | 's'
}): React.ReactNode {
  return (
    <>
      {/*
        Non-Compact view (compactionLevel === 0)
        ✔ Stage 1 0ms
          ▸ stage specific info
        ⣾ Stage 2 0ms
          ▸ stage specific info
        ◼ Stage 3 0ms
          ▸ stage specific info

        Semi-Compact view (compactionLevel < 6)
        ⣾ [1/3] Stage 1 0ms
          ▸ stage specific info

        Compact view (compactionLevel >= 6)
        ⣾ [1/3] Stage 1 ▸ stage specific info 0ms
      */}
      {[...stageTracker.entries()].map(([stage, status]) => (
        <Box key={stage} flexDirection="column">
          <Box flexWrap="wrap">
            {compactionLevel === 0 ? (
              <Stage stage={stage} status={status} design={design} error={error} />
            ) : (
              // Render the stage name, spinner, and stage specific info
              <CompactStage
                stage={stage}
                status={status}
                design={design}
                error={error}
                stageSpecificBlock={stageSpecificBlock}
                stageTracker={stageTracker}
                direction={compactionLevel >= 6 ? 'row' : 'column'}
              />
            )}

            {/*
              Render the stage timer for current, completed, and failed stages.
              If compactionLevel > 0, we need to render the timer but hide it if the stage is not current.
              This allows us to keep accurate time for all the stages while only displaying the current stage's time.
            */}
            {status !== 'pending' && status !== 'skipped' && hasStageTime && (
              <Box display={compactionLevel === 0 ? 'flex' : status === 'current' ? 'flex' : 'none'}>
                <Text> </Text>
                <Timer color="dim" isStopped={status === 'completed' || status === 'paused'} unit={timerUnit} />
              </Box>
            )}
          </Box>

          {/* Render the stage specific info for non-compact view */}
          {compactionLevel === 0 &&
            stageSpecificBlock &&
            stageSpecificBlock.length > 0 &&
            status !== 'pending' &&
            status !== 'skipped' && (
              <StageInfos design={design} error={error} keyValuePairs={stageSpecificBlock} stage={stage} />
            )}
        </Box>
      ))}
    </>
  )
}

function filterInfos(infos: FormattedKeyValue[], compactionLevel: number, cutOff: number): FormattedKeyValue[] {
  return infos.filter((info) => {
    // return true to keep the info
    if (compactionLevel < cutOff || info.neverCollapse) {
      return true
    }

    return false
  })
}

/**
 * Determine the level of compaction required to render the stages component within the terminal height.
 *
 * Compaction levels:
 * 0 - hide nothing
 * 1 - only show one stage at a time, with stage specific info nested under the stage
 * 2 - hide the elapsed time
 * 3 - hide the title
 * 4 - hide the pre-stages block
 * 5 - hide the post-stages block
 * 6 - put the stage specific info directly next to the stage
 * 7 - hide the stage-specific block
 * 8 - reduce the padding between boxes
 * @returns the compaction level based on the number of lines that will be displayed
 */
export function determineCompactionLevel(
  {
    design = constructDesignParams(),
    hasElapsedTime,
    hasStageTime,
    postStagesBlock,
    preStagesBlock,
    stageSpecificBlock,
    stageTracker,
    title,
  }: StagesProps,
  rows: number,
  columns: number,
): {compactionLevel: number; totalHeight: number} {
  // We don't have access to the exact stage time, so we're taking a conservative estimate of
  // 10 characters + 1 character for the space between the stage and timer,
  // examples: 999ms (5), 59.99s (6), 59m 59.99s (10), 23h 59m (7)
  const estimatedTimeLength = 11

  const calculateWrappedHeight = (text: string): number => {
    const wrapped = wrapAnsi(text, columns, {hard: true, trim: false, wordWrap: true})
    return wrapped.split('\n').length
  }

  const calculateHeightOfBlock = (block: FormattedKeyValue[] | undefined): number => {
    if (!block) return 0
    return block.reduce((acc, info) => {
      if (info.type === 'message') {
        if (!info.value) return acc

        if (info.value.length > columns) {
          // if the message is longer than the terminal width, add the number of lines
          return acc + calculateWrappedHeight(info.value)
        }

        // if the message is multiline, add the number of lines
        return acc + info.value.split('\n').length
      }

      const {label = '', value} = info
      // if there's no value we still add 1 for the label
      if (!value) return acc + 1
      const totalLength = `${label}: ${value}`.length
      if (totalLength > columns) {
        // if the value is longer than the terminal width, add the number of lines
        return acc + calculateWrappedHeight(`${label}: ${value}`)
      }

      return acc + value.split('\n').length
    }, 0)
  }

  const calculateHeightOfStage = (stage: string): number => {
    const status = stageTracker.get(stage) ?? 'pending'
    const skipped = status === 'skipped' ? ' - Skipped' : ''
    const stageTimeLength = hasStageTime ? estimatedTimeLength : 0
    const parts = [
      ' '.repeat(design.icons[status].paddingLeft),
      design.icons[status].figure,
      ' '.repeat(design.icons[status].paddingRight),
      stage,
      skipped,
      '0'.repeat(stageTimeLength),
    ]

    return calculateWrappedHeight(parts.join(''))
  }

  const calculateWidthOfCompactStage = (stage: string): number => {
    const status = stageTracker.get(stage) ?? 'current'
    // We don't have access to the exact stage time, so we're taking a conservative estimate of
    // 7 characters + 1 character for the space between the stage and timer,
    // examples: 999ms (5), 59s (3), 59m 59s (7), 23h 59m (7)
    const stageTimeLength = hasStageTime ? 8 : 0

    const firstStageSpecificBlock = stageSpecificBlock?.find((block) => block.stage === stage)
    const firstStageSpecificBlockLength =
      firstStageSpecificBlock?.type === 'message'
        ? (firstStageSpecificBlock?.value?.length ?? 0)
        : (firstStageSpecificBlock?.label?.length ?? 0) + (firstStageSpecificBlock?.value?.length ?? 0) + 2

    const width =
      // 1 for the left margin
      1 +
      design.icons[status].paddingLeft +
      design.icons[status].figure.length +
      design.icons[status].paddingRight +
      `[${stageTracker.indexOf(stage) + 1}/${stageTracker.size}] ${stage}`.length +
      stageTimeLength +
      firstStageSpecificBlockLength

    return width
  }

  const stagesHeight = [...stageTracker.values()].reduce((acc, stage) => acc + calculateHeightOfStage(stage), 0)
  const preStagesBlockHeight = calculateHeightOfBlock(preStagesBlock)
  const postStagesBlockHeight = calculateHeightOfBlock(postStagesBlock)
  const stageSpecificBlockHeight = calculateHeightOfBlock(stageSpecificBlock)
  // 3 at minimum because: 1 for marginTop on entire component, 1 for marginBottom on entire component, 1 for paddingBottom on StageEntries
  const paddings = 3 + (preStagesBlock ? 1 : 0) + (postStagesBlock ? 1 : 0) + (title ? 1 : 0)
  const elapsedTimeHeight = hasElapsedTime
    ? calculateWrappedHeight(`Elapsed Time:${'0'.repeat(estimatedTimeLength)}`)
    : 0
  const titleHeight = title ? calculateWrappedHeight(title) : 0
  const totalHeight =
    stagesHeight +
    preStagesBlockHeight +
    postStagesBlockHeight +
    stageSpecificBlockHeight +
    elapsedTimeHeight +
    titleHeight +
    paddings +
    // add one for good measure - iTerm2 will flicker on every render if the height is exactly the same as the terminal height so it's better to be safe
    1

  let cLevel = 0

  const levels = [
    // 1: only current stages, with stage specific info nested under the stage
    (remainingHeight: number) => remainingHeight - stagesHeight + Math.max(stageTracker.current.length, 1),
    // 2: hide the elapsed time
    (remainingHeight: number) => remainingHeight - 1,
    // 3: hide the title (subtract 1 for title and 1 for paddingBottom)
    (remainingHeight: number) => remainingHeight - 2,
    // 4: hide the pre-stages block (subtract 1 for paddingBottom)
    (remainingHeight: number) => remainingHeight - preStagesBlockHeight - 1,
    // 5: hide the post-stages block
    (remainingHeight: number) => remainingHeight - postStagesBlockHeight,
    // 6: put the stage specific info directly next to the stage
    (remainingHeight: number) => remainingHeight - stageSpecificBlockHeight,
    // 7: hide the stage-specific block
    (remainingHeight: number) => remainingHeight - stageSpecificBlockHeight,
    // 8: reduce the padding between boxes
    (remainingHeight: number) => remainingHeight - 1,
  ]

  let remainingHeight = totalHeight
  while (cLevel < 8 && remainingHeight >= rows) {
    remainingHeight = levels[cLevel](remainingHeight)
    cLevel++
  }

  // It's possible that the collapsed stage might extend beyond the terminal width.
  // If so, we need to bump the compaction level up to 7 so that the stage specific info is hidden
  if (
    cLevel === 6 &&
    stageTracker.current.map((c) => calculateWidthOfCompactStage(c)).reduce((acc, width) => acc + width, 0) >= columns
  ) {
    cLevel = 7
  }

  return {
    compactionLevel: cLevel,
    totalHeight,
  }
}

class ErrorBoundary extends React.Component<{
  children: React.ReactNode
  getFallbackText?: () => string
}> {
  public state = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return {hasError: true}
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    getLogger('multi-stage-output').debug(error)
    getLogger('multi-stage-output').debug(info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.getFallbackText) {
        return <Text>{this.props.getFallbackText()}</Text>
      }

      return false
    }

    return this.props.children
  }
}

export function Stages({
  compactionLevel,
  design = constructDesignParams(),
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
  const {stdout} = useStdout()
  const [levelOfCompaction, setLevelOfCompaction] = React.useState<number>(
    determineCompactionLevel(
      {
        hasElapsedTime,
        hasStageTime,
        postStagesBlock,
        preStagesBlock,
        stageSpecificBlock,
        stageTracker,
        title,
      },
      stdout.rows - 1,
      stdout.columns - 1,
    ).compactionLevel,
  )

  React.useEffect(() => {
    setLevelOfCompaction(
      determineCompactionLevel(
        {
          hasElapsedTime,
          hasStageTime,
          postStagesBlock,
          preStagesBlock,
          stageSpecificBlock,
          stageTracker,
          title,
        },
        stdout.rows - 1,
        stdout.columns - 1,
      ).compactionLevel,
    )
  }, [
    compactionLevel,
    hasElapsedTime,
    hasStageTime,
    postStagesBlock,
    preStagesBlock,
    stageSpecificBlock,
    stageTracker,
    stdout.columns,
    stdout.rows,
    title,
  ])

  React.useEffect(() => {
    const handler = () => {
      setLevelOfCompaction(
        determineCompactionLevel(
          {
            hasElapsedTime,
            hasStageTime,
            postStagesBlock,
            preStagesBlock,
            stageSpecificBlock,
            stageTracker,
            title,
          },
          stdout.rows - 1,
          stdout.columns - 1,
        ).compactionLevel,
      )
    }

    stdout.on('resize', handler)

    return () => {
      stdout.removeListener('resize', handler)
    }
  })

  // if compactionLevel is provided, use that instead of the calculated level
  const actualLevelOfCompaction = compactionLevel ?? levelOfCompaction
  // filter out the info blocks based on the compaction level
  const preStages = filterInfos(preStagesBlock ?? [], actualLevelOfCompaction, 4)
  const postStages = filterInfos(postStagesBlock ?? [], actualLevelOfCompaction, 5)
  const stageSpecific = filterInfos(stageSpecificBlock ?? [], actualLevelOfCompaction, 7)
  // Reduce padding if the compaction level is 8
  const padding = actualLevelOfCompaction >= 8 ? 0 : 1

  return (
    <Box flexDirection="column" marginTop={padding} marginBottom={padding}>
      {actualLevelOfCompaction < 3 && title && (
        <Box paddingBottom={padding}>
          <ErrorBoundary getFallbackText={() => title}>
            <Divider title={title} {...design.title} terminalWidth={stdout.columns} />
          </ErrorBoundary>
        </Box>
      )}

      {preStages && preStages.length > 0 && (
        <Box flexDirection="column" marginLeft={1} paddingBottom={padding}>
          <ErrorBoundary
            getFallbackText={() => preStages.map((s) => (s.label ? `${s.label}: ${s.value}` : s.value)).join('\n')}
          >
            <Infos design={design} error={error} keyValuePairs={preStages} />
          </ErrorBoundary>
        </Box>
      )}

      <Box flexDirection="column" marginLeft={1} paddingBottom={padding}>
        <ErrorBoundary getFallbackText={() => stageTracker.current[0] ?? 'unknown'}>
          <StageEntries
            compactionLevel={actualLevelOfCompaction}
            design={design}
            error={error}
            hasStageTime={hasStageTime}
            stageSpecificBlock={stageSpecific}
            stageTracker={stageTracker}
            timerUnit={timerUnit}
          />
        </ErrorBoundary>
      </Box>

      {postStages && postStages.length > 0 && (
        <Box flexDirection="column" marginLeft={1}>
          <ErrorBoundary
            getFallbackText={() => postStages.map((s) => (s.label ? `${s.label}: ${s.value}` : s.value)).join('\n')}
          >
            <Infos design={design} error={error} keyValuePairs={postStages} />
          </ErrorBoundary>
        </Box>
      )}

      {hasElapsedTime && (
        <Box marginLeft={1} display={actualLevelOfCompaction < 2 ? 'flex' : 'none'} flexWrap="wrap">
          <ErrorBoundary>
            <Text>Elapsed Time: </Text>
            <Timer unit={timerUnit} />
          </ErrorBoundary>
        </Box>
      )}
    </Box>
  )
}
