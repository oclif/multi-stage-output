export function readableTime(time: number, granularity: 's' | 'ms', decimalPlaces = 2): string {
  // if time < 1000ms, return time in ms or < 1s
  if (time < 1000) {
    return granularity === 's' ? '< 1s' : `${time}ms`
  }

  const decimals = granularity === 'ms' ? decimalPlaces : 0
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

export function truncate(value: number, decimals = 2) {
  if (decimals) {
    const factor = 10 ** decimals
    return (Math.trunc(value * factor) / factor).toFixed(decimals)
  }

  return Math.floor(value).toString()
}
