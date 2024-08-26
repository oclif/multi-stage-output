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

function Compact({
  design,
  error,
  stage,
  stageSpecificBlock,
  stageTracker,
  status,
}: {
  readonly stage: string
  readonly status: string
  readonly stageTracker: StageTracker
  readonly design: RequiredDesign
  readonly error?: Error
  readonly stageSpecificBlock: FormattedKeyValue[] | undefined
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

function NoCompact({
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
      {[...stageTracker.entries()].map(([stage, status]) => (
        <Box key={stage} flexDirection="column">
          <Box>
            {compactionLevel === 0 ? (
              <NoCompact stage={stage} status={status} design={design} error={error} />
            ) : (
              <Compact
                stage={stage}
                status={status}
                design={design}
                error={error}
                stageSpecificBlock={stageSpecificBlock}
                stageTracker={stageTracker}
              />
            )}

            {status !== 'pending' && status !== 'skipped' && hasStageTime && (
              <Box display={compactionLevel === 0 ? 'flex' : status === 'current' ? 'flex' : 'none'}>
                <Text> </Text>
                <Timer color="dim" isStopped={status === 'completed'} unit={timerUnit} />
              </Box>
            )}
          </Box>

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

function filterInfos(infos: FormattedKeyValue[], compactionLevel: number): FormattedKeyValue[] {
  return infos.filter((info) => {
    // return true to keep the info
    if (compactionLevel < 4 || info.neverCollapse) {
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
 * 1 - only show one stage at a time
 * 2 - hide the elapsed time
 * 3 - hide the title
 * 4 - hide the pre-stages block
 * 5 - hide the post-stages block
 * 6 - hide the stage-specific block
 * 7 - reduce the padding between boxes
 * @returns the compaction level based on the number of lines that will be displayed
 */
export function determineCompactionLevel(
  {hasElapsedTime = true, postStagesBlock, preStagesBlock, stageSpecificBlock, stageTracker, title}: StagesProps,
  rows: number,
): number {
  const lines =
    stageTracker.size +
    (preStagesBlock?.length ?? 0) +
    (postStagesBlock?.length ?? 0) +
    (stageSpecificBlock?.length ?? 0) +
    (title ? 1 : 0) +
    (hasElapsedTime ? 1 : 0) +
    // add 4 for the top and bottom margins
    4

  let cLevel = 0

  const levels = [
    // stages => 1
    (remainingLines: number) => remainingLines - stageTracker.size + 1,
    // elapsed time => 2
    (remainingLines: number) => remainingLines - 1,
    // title => 3
    (remainingLines: number) => remainingLines - 1,
    // pre-stages block => 4
    (remainingLines: number) => remainingLines - (preStagesBlock ? preStagesBlock.length : 0),
    // post-stages block => 5
    (remainingLines: number) => remainingLines - (postStagesBlock ? postStagesBlock.length : 0),
    // stage-specific block => 6
    (remainingLines: number) => remainingLines - (stageSpecificBlock ? stageSpecificBlock.length : 0),
    // padding => 7
    (remainingLines: number) => remainingLines - 1,
  ]

  let remainingLines = lines
  while (cLevel < 7 && remainingLines >= rows) {
    remainingLines = levels[cLevel](remainingLines)
    cLevel++
  }

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
        postStagesBlock,
        preStagesBlock,
        stageTracker,
        title,
      },
      stdout.rows - 1,
    ),
  )

  React.useEffect(() => {
    setLevelOfCompaction(
      determineCompactionLevel(
        {
          hasElapsedTime,
          postStagesBlock,
          preStagesBlock,
          stageTracker,
          title,
        },
        stdout.rows - 1,
      ),
    )
  }, [stdout.rows, compactionLevel, hasElapsedTime, postStagesBlock, preStagesBlock, stageTracker, title])

  React.useEffect(() => {
    const handler = () => {
      setLevelOfCompaction(
        determineCompactionLevel(
          {
            hasElapsedTime,
            postStagesBlock,
            preStagesBlock,
            stageTracker,
            title,
          },
          stdout.rows - 1,
        ),
      )
    }

    stdout.on('resize', handler)

    return () => {
      stdout.removeListener('resize', handler)
    }
  })

  const actualLevelOfCompaction = compactionLevel ?? levelOfCompaction
  const preStages = filterInfos(preStagesBlock ?? [], actualLevelOfCompaction)
  const postStages = filterInfos(postStagesBlock ?? [], actualLevelOfCompaction)
  const stageSpecific = filterInfos(stageSpecificBlock ?? [], actualLevelOfCompaction)
  const padding = actualLevelOfCompaction < 7 ? 1 : 0
  return (
    <Box flexDirection="column" paddingTop={padding} paddingBottom={padding}>
      {actualLevelOfCompaction < 3 && title && <Divider title={title} {...design.title} />}

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
