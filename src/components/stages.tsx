import {capitalCase} from 'change-case'
import {Box, Text, useStdout} from 'ink'
import React from 'react'

import {RequiredDesign, constructDesignParams} from '../design.js'
import {StageTracker} from '../stage-tracker.js'
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
    <Box key={label}>
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
          <Box key={key}>
            <Icon icon={design.icons.info} />
            <SpinnerOrErrorOrChildren
              error={error}
              label={`${kv.label}:`}
              labelPosition="left"
              type={design.spinners.info}
              failedIcon={design.icons.failed}
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
        <SpinnerOrErrorOrChildren
          key={key}
          error={error}
          label={`${kv.label}:`}
          labelPosition="left"
          type={design.spinners.info}
          failedIcon={design.icons.failed}
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

    return false
  })
}

function CompactStage({
  design,
  error,
  stage,
  stageSpecificBlock,
  stageTracker,
  status,
}: {
  readonly design: RequiredDesign
  readonly error?: Error
  readonly stage: string
  readonly stageSpecificBlock: FormattedKeyValue[] | undefined
  readonly stageTracker: StageTracker
  readonly status: string
}): React.ReactNode {
  if (status !== 'current') return false
  return (
    <Box flexDirection="row">
      <SpinnerOrError
        error={error}
        label={`[${stageTracker.indexOf(stage) + 1}/${stageTracker.size}] ${capitalCase(stage)}`}
        type={design.spinners.stage}
        failedIcon={design.icons.failed}
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
  readonly status: string
  readonly design: RequiredDesign
  readonly error?: Error
}): React.ReactElement {
  return (
    <Box>
      {(status === 'current' || status === 'failed') && (
        <SpinnerOrError
          error={error}
          label={capitalCase(stage)}
          type={design.spinners.stage}
          failedIcon={design.icons.failed}
        />
      )}

      {status === 'skipped' && (
        <Icon icon={design.icons.skipped}>
          <Text color="dim">{capitalCase(stage)} - Skipped</Text>
        </Icon>
      )}

      {status === 'completed' && (
        <Icon icon={design.icons.completed}>
          <Text>{capitalCase(stage)}</Text>
        </Icon>
      )}

      {status === 'pending' && (
        <Icon icon={design.icons.pending}>
          <Text>{capitalCase(stage)}</Text>
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
        Non-Compact view
        ✔ Stage 1 0ms
          ▸ stage specific info
        ⣾ Stage 2 0ms
          ▸ stage specific info
        ◼ Stage 3 0ms
          ▸ stage specific info

        Compact view
        ⣾ [1/3] Stage 1 ▸ stage specific info
      */}
      {[...stageTracker.entries()].map(([stage, status]) => (
        <Box key={stage} flexDirection="column">
          <Box>
            {compactionLevel < 6 ? (
              // Render the stage name and spinner
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
                <Timer color="dim" isStopped={status === 'completed'} unit={timerUnit} />
              </Box>
            )}
          </Box>

          {/* Render the stage specific info for non-compact view */}
          {compactionLevel < 6 &&
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
): number {
  // 3 at minimum because: 1 for paddingTop on entire component, 1 for paddingBottom on entire component, 1 for paddingTop on StageEntries
  const paddings = 3 + (preStagesBlock ? 1 : 0) + (postStagesBlock ? 1 : 0)

  const calculateHeightOfBlock = (block: FormattedKeyValue[] | undefined): number => {
    if (!block) return 0
    return block.reduce((acc, info) => {
      if (info.type === 'message') {
        if (!info.value) return acc

        if (info.value.length > columns) {
          // if the message is longer than the terminal width, add the number of lines
          return acc + Math.ceil(info.value.length / columns)
        }

        // if the message is multiline, add the number of lines
        return acc + info.value.split('\n').length
      }

      const {label = '', value} = info
      // if there's no value we still add 1 for the label
      if (!value) return acc + 1
      if (label.length + Number(': '.length) + value.length > columns) {
        // if the value is longer than the terminal width, add the number of lines
        return acc + Math.ceil(value.length / columns)
      }

      return acc + value.split('\n').length
    }, 1)
  }

  const calculateHeightOfStage = (stage: string): number => {
    const status = stageTracker.get(stage) ?? 'pending'
    const skipped = status === 'skipped' ? ' - Skipped' : ''
    // We don't have access to the exact stage time, so we're taking a conservative estimate of
    // 7 characters + 1 character for the space between the stage and timer,
    // examples: 999ms (5), 59s (3), 59m 59s (7), 23h 59m (7)
    const stageTimeLength = hasStageTime ? 8 : 0
    if (
      design.icons[status].paddingLeft +
        design.icons[status].figure.length +
        design.icons[status].paddingRight +
        stage.length +
        skipped.length +
        stageTimeLength >
      columns
    ) {
      return Math.ceil(stage.length / columns)
    }

    return 1
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

  const lines =
    stagesHeight +
    preStagesBlockHeight +
    postStagesBlockHeight +
    stageSpecificBlockHeight +
    (title ? 1 : 0) +
    (hasElapsedTime ? 1 : 0) +
    paddings +
    // add one for good measure
    1

  let cLevel = 0

  const levels = [
    // 1: only show one stage at a time, with stage specific info nested under the stage
    (remainingLines: number) => remainingLines - stagesHeight + 1,
    // 2: hide the elapsed time
    (remainingLines: number) => remainingLines - 1,
    // 3: hide the title
    (remainingLines: number) => remainingLines - 1,
    // 4: hide the pre-stages block
    (remainingLines: number) => remainingLines - preStagesBlockHeight,
    // 5: hide the post-stages block
    (remainingLines: number) => remainingLines - postStagesBlockHeight,
    // 6: put the stage specific info directly next to the stage
    (remainingLines: number) => remainingLines - stageSpecificBlockHeight,
    // 7: hide the stage-specific block
    (remainingLines: number) => remainingLines,
    // 8: reduce the padding between boxes
    (remainingLines: number) => remainingLines - 1,
  ]

  let remainingLines = lines
  while (cLevel < 8 && remainingLines >= rows) {
    remainingLines = levels[cLevel](remainingLines)
    cLevel++
  }

  // it's possible that the collapsed stage might extend beyond the terminal width, so we need to check for that
  // if so, we need to bump the compaction level up to 7 so that the stage specific info is hidden
  if (cLevel === 6 && stageTracker.current && calculateWidthOfCompactStage(stageTracker.current) >= columns) {
    cLevel = 7
  }

  // console.log({
  //   cLevel,
  //   lines,
  //   paddings,
  //   postStagesBlockHeight,
  //   preStagesBlockHeight,
  //   remainingLines,
  //   rows,
  //   stageSpecificBlockHeight,
  //   stagesHeight,
  // })
  return cLevel
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
      stdout.columns,
    ),
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
        stdout.columns,
      ),
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
          stdout.columns,
        ),
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
  const padding = actualLevelOfCompaction === 8 ? 0 : 1

  return (
    <Box flexDirection="column" paddingTop={padding} paddingBottom={padding}>
      {actualLevelOfCompaction < 3 && title && (
        <Divider title={title} {...design.title} terminalWidth={stdout.columns} />
      )}
      {preStages && preStages.length > 0 && (
        <Box flexDirection="column" marginLeft={1} paddingTop={padding}>
          <Infos design={design} error={error} keyValuePairs={preStages} />
        </Box>
      )}

      <Box flexDirection="column" marginLeft={1} paddingTop={padding}>
        <StageEntries
          compactionLevel={actualLevelOfCompaction}
          design={design}
          error={error}
          hasStageTime={hasStageTime}
          stageSpecificBlock={stageSpecific}
          stageTracker={stageTracker}
          timerUnit={timerUnit}
        />
      </Box>

      {postStages && postStages.length > 0 && (
        <Box flexDirection="column" marginLeft={1} paddingTop={padding}>
          <Infos design={design} error={error} keyValuePairs={postStages} />
        </Box>
      )}

      {hasElapsedTime && (
        <Box marginLeft={padding} display={actualLevelOfCompaction < 2 ? 'flex' : 'none'}>
          <Text>Elapsed Time: </Text>
          <Timer unit={timerUnit} />
        </Box>
      )}
    </Box>
  )
}
