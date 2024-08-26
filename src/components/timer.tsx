import {Text} from 'ink'
import React from 'react'

import {readableTime} from '../utils.js'

// When the window is too short, then we show the stages in a single line and then show the entire output in the last render.
// In order to preserve the stage time for that last render, we need to cache the time for each stage.
const TIMER_CACHE = new Map<string, number>()

export function Timer({
  color,
  isStopped,
  name,
  unit,
}: {
  readonly color?: string
  readonly isStopped?: boolean
  readonly unit: 'ms' | 's'
  readonly name: string
}): React.ReactNode {
  const [time, setTime] = React.useState(0)
  const [previousDate, setPreviousDate] = React.useState(Date.now())

  React.useEffect(() => {
    if (isStopped) {
      setTime(time + (Date.now() - previousDate))
      setPreviousDate(Date.now())
      return () => {}
    }

    const intervalId = setInterval(
      () => {
        setTime(time + (Date.now() - previousDate))
        setPreviousDate(Date.now())
        TIMER_CACHE.set(name, time)
      },
      unit === 'ms' ? 1 : 1000,
    )

    return (): void => {
      clearInterval(intervalId)
    }
  }, [name, time, isStopped, previousDate, unit])

  return <Text color={color}>{readableTime(TIMER_CACHE.get(name) ?? time, unit)}</Text>
}
