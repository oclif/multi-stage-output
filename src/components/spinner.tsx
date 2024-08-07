import spinners, {type SpinnerName} from 'cli-spinners'
import {Box, Text} from 'ink'
import React, {useEffect, useState} from 'react'

import {icons} from '../design-elements.js'

export type UseSpinnerProps = {
  /**
   * Type of a spinner.
   * See [cli-spinners](https://github.com/sindresorhus/cli-spinners) for available spinners.
   *
   * @default dots
   */
  readonly type?: SpinnerName
}

export type UseSpinnerResult = {
  frame: string
}

export function useSpinner({type = 'dots'}: UseSpinnerProps): UseSpinnerResult {
  const [frame, setFrame] = useState(0)
  const spinner = spinners[type]

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((previousFrame) => {
        const isLastFrame = previousFrame === spinner.frames.length - 1
        return isLastFrame ? 0 : previousFrame + 1
      })
    }, spinner.interval)

    return (): void => {
      clearInterval(timer)
    }
  }, [spinner])

  return {
    frame: spinner.frames[frame] ?? '',
  }
}

export type SpinnerProps = UseSpinnerProps & {
  /**
   * Label to show near the spinner.
   */
  readonly label?: string
  readonly isBold?: boolean
  readonly labelPosition?: 'left' | 'right'
}

export function Spinner({isBold, label, labelPosition = 'right', type}: SpinnerProps): React.ReactElement {
  const {frame} = useSpinner({type})

  return (
    <Box>
      {label && labelPosition === 'left' && <Text>{label} </Text>}
      {isBold ? (
        <Text bold color="magenta">
          {frame}
        </Text>
      ) : (
        <Text color="magenta">{frame}</Text>
      )}
      {label && labelPosition === 'right' && <Text> {label}</Text>}
    </Box>
  )
}

export function SpinnerOrError({
  error,
  labelPosition = 'right',
  ...props
}: SpinnerProps & {readonly error?: Error}): React.ReactElement {
  if (error) {
    return (
      <Box>
        {props.label && labelPosition === 'left' && <Text>{props.label} </Text>}
        <Text color="red">{icons.failed}</Text>
        {props.label && labelPosition === 'right' && <Text> {props.label}</Text>}
      </Box>
    )
  }

  return <Spinner labelPosition={labelPosition} {...props} />
}

export function SpinnerOrErrorOrChildren({
  children,
  error,
  ...props
}: SpinnerProps & {
  readonly children?: React.ReactNode
  readonly error?: Error
}): React.ReactElement {
  if (children) {
    return (
      <Box>
        {props.label && props.labelPosition === 'left' && <Text>{props.label} </Text>}
        {children}
        {props.label && props.labelPosition === 'right' && <Text> {props.label}</Text>}
      </Box>
    )
  }

  return <SpinnerOrError error={error} {...props} />
}
