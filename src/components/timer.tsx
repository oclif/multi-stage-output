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
    const [time, setTime] = React.useState(0);
    const startTime = React.useRef(Date.now());

  React.useEffect(() => {
    if (isStopped) {
        setTime(Date.now() - startTime.current);
        return () => {};
    }

    const intervalId = setInterval(() => {
        setTime(Date.now() - startTime.current);
    }, unit === 'ms' ? 1 : 1000);
    return () => { clearInterval(intervalId);};
  }, [isStopped, unit]);

  return <Text color={color}>{readableTime(time, unit)}</Text>
}
