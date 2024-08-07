import {config, expect} from 'chai'
import {render} from 'ink-testing-library'
import React from 'react'

import {Timer} from '../../src/components/timer.js'

config.truncateThreshold = 0

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

describe('Timer', () => {
  it('renders a timer in milliseconds', async () => {
    const {lastFrame, unmount} = render(<Timer unit="ms" />)
    await sleep(100)
    unmount()
    // we can't reliably test the exact output, so we just check that it's not the initial value
    expect(lastFrame()).to.not.equal('0ms')
  })

  it('renders a timer in seconds', async () => {
    const {lastFrame, unmount} = render(<Timer unit="s" />)
    await sleep(100)
    unmount()
    // we can't reliably test the exact output, so we just check that it's not the initial value
    expect(lastFrame()).to.not.equal('0s')
  })
})
