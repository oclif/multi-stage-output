import {Text} from 'ink'
import React from 'react'

import {readableTime} from '../utils.js'

export function Timer({
  color,
  isStopped,
  unit,
}: {
  readonly color?: string
  readonly isStopped?: boolean
  readonly unit: 'ms' | 's'
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
      },
      unit === 'ms' ? 1 : 1000,
    )

    return (): void => {
      clearInterval(intervalId)
    }
  }, [time, isStopped, previousDate, unit])

  return <Text color={color}>{readableTime(time, unit)}</Text>
}
