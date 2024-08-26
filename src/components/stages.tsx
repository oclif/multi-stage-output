import {capitalCase} from 'change-case'
import {Box, Text} from 'ink'
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

function CompactStageEntries({
  design,
  error,
  hasStageTime,
  stageSpecificBlock,
  stageTracker,
  timerUnit,
}: {
  readonly stageTracker: StageTracker
  readonly design: RequiredDesign
  readonly error?: Error
  readonly hasStageTime: boolean
  readonly stageSpecificBlock: FormattedKeyValue[] | undefined
  readonly timerUnit: 'ms' | 's'
}): React.ReactNode {
  if (!stageTracker.current) return false
  return (
    <Box flexDirection="row">
      <SpinnerOrError
        error={error}
        label={`[${stageTracker.indexOf(stageTracker.current) + 1}/${stageTracker.size}] ${capitalCase(stageTracker.current)}`}
        type={design.spinners.stage}
        failedIcon={design.icons.failed}
      />
      {stageSpecificBlock && stageSpecificBlock.length > 0 && (
        <Box flexDirection="column">
          <StageInfos design={design} error={error} keyValuePairs={stageSpecificBlock} stage={stageTracker.current} />
        </Box>
      )}

      {hasStageTime && (
        <Box>
          {/* We have to render the Timer for each stage in order to get correct time for each stage */}
          {[...stageTracker.entries()]
            .filter(([_, status]) => status !== 'pending' && status !== 'skipped')
            .map(([stage, status]) => (
              <Box key={stage} display={status === 'current' ? 'flex' : 'none'}>
                <Text> </Text>
                <Timer name={stage} color="dim" isStopped={status === 'completed'} unit={timerUnit} />
              </Box>
            ))}
        </Box>
      )}
    </Box>
  )
}

function NormalStageEntries({
  design,
  error,
  hasStageTime,
  stageSpecificBlock,
  stageTracker,
  timerUnit,
}: {
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

            {status !== 'pending' && status !== 'skipped' && hasStageTime && (
              <Box>
                <Text> </Text>
                <Timer name={stage} color="dim" isStopped={status === 'completed'} unit={timerUnit} />
              </Box>
            )}
          </Box>

          {stageSpecificBlock && stageSpecificBlock.length > 0 && status !== 'pending' && status !== 'skipped' && (
            <StageInfos design={design} error={error} keyValuePairs={stageSpecificBlock} stage={stage} />
          )}
        </Box>
      ))}
    </>
  )
}

export function Stages({
  compactionLevel = 0,
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
  return (
    <Box flexDirection="column" paddingTop={1} paddingBottom={1}>
      {compactionLevel < 3 && title && <Divider title={title} {...design.title} />}

      {preStagesBlock && preStagesBlock.length > 0 && (
        <Box flexDirection="column" marginLeft={1} paddingTop={1}>
          <Infos design={design} error={error} keyValuePairs={preStagesBlock} />
        </Box>
      )}

      <Box flexDirection="column" marginLeft={1} paddingTop={1}>
        {compactionLevel >= 1 ? (
          <CompactStageEntries
            design={design}
            error={error}
            hasStageTime={hasStageTime}
            stageSpecificBlock={stageSpecificBlock}
            stageTracker={stageTracker}
            timerUnit={timerUnit}
          />
        ) : (
          <NormalStageEntries
            design={design}
            error={error}
            hasStageTime={hasStageTime}
            stageSpecificBlock={stageSpecificBlock}
            stageTracker={stageTracker}
            timerUnit={timerUnit}
          />
        )}
      </Box>

      {postStagesBlock && postStagesBlock.length > 0 && (
        <Box flexDirection="column" marginLeft={1} paddingTop={1}>
          <Infos design={design} error={error} keyValuePairs={postStagesBlock} />
        </Box>
      )}

      {hasElapsedTime && (
        <Box marginLeft={1} display={compactionLevel < 2 ? 'flex' : 'none'}>
          <Text>Elapsed Time: </Text>
          <Timer name="elapsed" unit={timerUnit} />
        </Box>
      )}
    </Box>
  )
}
