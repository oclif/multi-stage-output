function round(value: number, decimals = 2): string {
  const factor = 10 ** decimals
  return (Math.round(value * factor) / factor).toFixed(decimals)
}

export function msInMostReadableFormat(time: number, decimals = 2): string {
  // if time < 1000ms, return time in ms
  if (time < 1000) {
    return `${time}ms`
  }

  return secondsInMostReadableFormat(time, decimals)
}

export function secondsInMostReadableFormat(time: number, decimals = 2): string {
  if (time < 1000) {
    return '< 1s'
  }

  // if time < 60s, return time in seconds
  if (time < 60_000) {
    return `${round(time / 1000, decimals)}s`
  }

  // if time < 60m, return time in minutes and seconds
  if (time < 3_600_000) {
    const minutes = Math.floor(time / 60_000)
    const seconds = round((time % 60_000) / 1000, 0)
    return `${minutes}m ${seconds}s`
  }

  return time.toString()
}
