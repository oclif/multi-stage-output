import {capitalCase} from 'change-case'
import {Box, Text} from 'ink'
import React from 'react'

import {icons, spinners} from '../design-elements.js'
import {StageTracker} from '../stage-tracker.js'
import {Divider} from './divider.js'
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

function Infos({
  error,
  keyValuePairs,
  stage,
}: {
  error?: Error
  keyValuePairs: FormattedKeyValue[]
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

        return false
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
    <Box flexDirection="column" paddingTop={1} paddingBottom={1}>
      <Divider title={title} />

      {preStagesBlock?.length && (
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

            {stageSpecificBlock?.length && status !== 'pending' && status !== 'skipped' && (
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
