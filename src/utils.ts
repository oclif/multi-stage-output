function truncate(value: number, decimals = 2): string {
  const remainder = value % 1
  // truncate remainder to specified decimals
  const fractionalPart = remainder ? remainder.toString().split('.')[1].slice(0, decimals) : '0'.repeat(decimals)
  const wholeNumberPart = Math.floor(value).toString()
  return decimals ? `${wholeNumberPart}.${fractionalPart}` : wholeNumberPart
}

export function readableTime(time: number, granularity: 's' | 'ms', decimalPlaces = 2): string {
  if (granularity === 's' && time < 1000) {
    return '< 1s'
  }

  const decimals = granularity === 'ms' ? decimalPlaces : 0

  // if time < 1000ms, return time in ms
  if (time < 1000) {
    return `${time}ms`
  }

  // if time < 60s, return time in seconds
  if (time < 60_000) {
    return `${truncate(time / 1000, decimals)}s`
  }

  // if time < 60m, return time in minutes and seconds
  if (time < 3_600_000) {
    const minutes = Math.floor(time / 60_000)
    const seconds = truncate((time % 60_000) / 1000, decimals)
    return `${minutes}m ${seconds}s`
  }

  // if time >= 60m, return time in hours and minutes
  const hours = Math.floor(time / 3_600_000)
  const minutes = Math.floor((time % 3_600_000) / 60_000)
  return `${hours}h ${minutes}m`
}
