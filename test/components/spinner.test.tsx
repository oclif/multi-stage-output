import {config, expect} from 'chai'
import cliSpinners from 'cli-spinners'
import {Text} from 'ink'
import {render} from 'ink-testing-library'
import React from 'react'
import stripAnsi from 'strip-ansi'

import {Spinner, SpinnerOrError, SpinnerOrErrorOrChildren} from '../../src/components/spinner.js'

config.truncateThreshold = 0

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

const SPINNER = 'line'
const WAIT_TIME = cliSpinners[SPINNER].interval * cliSpinners[SPINNER].frames.length

function allFramesFound(frames: string[], label?: string, labelPosition?: 'left' | 'right'): boolean {
  const expectedFrames = label
    ? cliSpinners[SPINNER].frames.map((frame) => (labelPosition === 'left' ? `${label} ${frame}` : `${frame} ${label}`))
    : cliSpinners[SPINNER].frames
  const stripped = frames.map((frame) => stripAnsi(frame))
  return expectedFrames.every((expectedFrame) => stripped.some((frame) => frame.includes(expectedFrame)))
}

const failedIcon = {
  color: 'red',
  figure: 'x',
  paddingLeft: 0,
  paddingRight: 0,
}

describe('Spinner', () => {
  it('renders a spinner', async () => {
    const {frames, unmount} = render(<Spinner type={SPINNER} />)
    await sleep(WAIT_TIME)
    unmount()
    expect(allFramesFound(frames)).to.be.true
  })

  it('renders a spinner with a label (left)', async () => {
    const {frames, unmount} = render(<Spinner label="Loading" type={SPINNER} labelPosition="left" />)
    await sleep(WAIT_TIME)
    unmount()
    expect(allFramesFound(frames, 'Loading', 'left')).to.be.true
  })

  it('renders a spinner with a label (right)', async () => {
    const {frames, unmount} = render(<Spinner label="Loading" type={SPINNER} labelPosition="right" />)
    await sleep(WAIT_TIME)
    unmount()
    expect(allFramesFound(frames, 'Loading', 'right')).to.be.true
  })
})

describe('SpinnerOrError', () => {
  it('renders a spinner', async () => {
    const {frames, unmount} = render(
      <SpinnerOrError failedIcon={failedIcon} label="Loading" type={SPINNER} labelPosition="right" />,
    )
    await sleep(WAIT_TIME)
    unmount()
    expect(allFramesFound(frames, 'Loading', 'right')).to.be.true
  })

  it('renders an error', async () => {
    const {frames, unmount} = render(
      <SpinnerOrError
        failedIcon={failedIcon}
        label="Loading"
        type={SPINNER}
        labelPosition="right"
        error={new Error('Oops')}
      />,
    )
    unmount()
    const lastValidFrame = frames.at(-1) === '\n' ? frames.at(-2) : frames.at(-1)
    expect(stripAnsi(lastValidFrame ?? '')).to.equal('x Loading')
  })
})

describe('SpinnerOrErrorOrChildren', async () => {
  it('renders a spinner', () => {
    const {frames, unmount} = render(
      <SpinnerOrErrorOrChildren failedIcon={failedIcon} label="Loading" type={SPINNER} labelPosition="right" />,
    )
    unmount()
    const lastValidFrame = frames.at(-1) === '\n' ? frames.at(-2) : frames.at(-1)
    expect(stripAnsi(lastValidFrame ?? '')).to.equal('- Loading')
  })

  it('renders an error', async () => {
    const {frames, unmount} = render(
      <SpinnerOrErrorOrChildren
        failedIcon={failedIcon}
        label="Loading"
        type={SPINNER}
        labelPosition="right"
        error={new Error('Oops')}
      />,
    )
    unmount()
    const lastValidFrame = frames.at(-1) === '\n' ? frames.at(-2) : frames.at(-1)
    expect(stripAnsi(lastValidFrame ?? '')).to.equal(`x Loading`)
  })

  it('renders children', async () => {
    const {frames, unmount} = render(
      <SpinnerOrErrorOrChildren failedIcon={failedIcon} label="Loading" type={SPINNER} labelPosition="left">
        <Text>Children</Text>
      </SpinnerOrErrorOrChildren>,
    )
    unmount()
    const lastValidFrame = frames.at(-1) === '\n' ? frames.at(-2) : frames.at(-1)
    expect(stripAnsi(lastValidFrame ?? '')).to.equal('Loading Children')
  })
})
