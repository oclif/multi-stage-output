import {config, expect} from 'chai'
import {render} from 'ink-testing-library'
import React from 'react'
import stripAnsi from 'strip-ansi'

import {FormattedKeyValue, Stages} from '../../src/components/stages.js'
import {StageTracker} from '../../src/stage-tracker.js'

config.truncateThreshold = 0

function lastValidFrame(frames: string[]): string {
  for (let i = frames.length - 1; i >= 0; i--) {
    if (frames[i] !== '\n') return stripAnsi(frames[i])
  }

  return ''
}

describe('Stages', () => {
  it('should render pending stages', async () => {
    const stageTracker = new StageTracker(['step1', 'step2'])
    const {frames, unmount} = render(<Stages stageTracker={stageTracker} title="Test" />)
    unmount()
    const lastFrame = lastValidFrame(frames)
    expect(lastFrame).to.include('─ Test ─')
    expect(lastFrame).to.include('◼ Step1')
    expect(lastFrame).to.include('◼ Step2')
    expect(lastFrame).to.include('Elapsed Time:')
  })

  it('should render completed stages', async () => {
    const stageTracker = new StageTracker(['step1', 'step2'])
    stageTracker.set('step1', 'completed')
    const {frames, unmount} = render(<Stages stageTracker={stageTracker} title="Test" />)
    unmount()
    const lastFrame = lastValidFrame(frames)
    expect(lastFrame).to.include('─ Test ─')
    expect(lastFrame).to.include('✔ Step1')
    expect(lastFrame).to.include('◼ Step2')
    expect(lastFrame).to.include('Elapsed Time:')
  })

  it('should render skipped stages', async () => {
    const stageTracker = new StageTracker(['step1', 'step2'])
    stageTracker.set('step1', 'skipped')
    stageTracker.set('step2', 'completed')
    const {frames, unmount} = render(<Stages stageTracker={stageTracker} title="Test" />)
    unmount()
    const lastFrame = lastValidFrame(frames)
    expect(lastFrame).to.include('─ Test ─')
    expect(lastFrame).to.include('◯ Step1 - Skipped')
    expect(lastFrame).to.include('✔ Step2')
    expect(lastFrame).to.include('Elapsed Time:')
  })

  it('should render failed stages', async () => {
    const stageTracker = new StageTracker(['step1', 'step2'])
    stageTracker.set('step1', 'failed')
    const {frames, unmount} = render(<Stages stageTracker={stageTracker} title="Test" error={new Error('oops')} />)
    unmount()
    const lastFrame = lastValidFrame(frames)
    expect(lastFrame).to.include('─ Test ─')
    expect(lastFrame).to.include('✘ Step1')
    expect(lastFrame).to.include('◼ Step2')
    expect(lastFrame).to.include('Elapsed Time:')
  })

  it('should disable elapsed time', async () => {
    const stageTracker = new StageTracker(['step1', 'step2'])
    const {frames, unmount} = render(<Stages stageTracker={stageTracker} title="Test" hasElapsedTime={false} />)
    unmount()
    const lastFrame = lastValidFrame(frames)
    expect(lastFrame).to.include('─ Test ─')
    expect(lastFrame).to.include('◼ Step1')
    expect(lastFrame).to.include('◼ Step2')
    expect(lastFrame).to.not.include('Elapsed Time:')
  })

  it('should enable stage time', async () => {
    const stageTracker = new StageTracker(['step1', 'step2'])
    stageTracker.set('step1', 'completed')
    const {frames, unmount} = render(<Stages hasStageTime stageTracker={stageTracker} title="Test" />)
    unmount()
    const lastFrame = lastValidFrame(frames)
    expect(lastFrame).to.include('─ Test ─')
    expect(lastFrame).to.include('✔ Step1 0ms')
    expect(lastFrame).to.include('◼ Step2\n')
    expect(lastFrame).to.include('Elapsed Time:')
  })

  it('should disable stage time', async () => {
    const stageTracker = new StageTracker(['step1', 'step2'])
    stageTracker.set('step1', 'completed')
    const {frames, unmount} = render(<Stages stageTracker={stageTracker} title="Test" hasStageTime={false} />)
    unmount()
    const lastFrame = lastValidFrame(frames)
    expect(lastFrame).to.include('─ Test ─')
    expect(lastFrame).to.include('✔ Step1\n')
    expect(lastFrame).to.include('◼ Step2\n')
    expect(lastFrame).to.include('Elapsed Time:')
  })

  it('should show pre-stage info block', async () => {
    const stageTracker = new StageTracker(['step1', 'step2'])

    const preStagesBlock: FormattedKeyValue[] = [
      {
        type: 'message',
        value: 'this is a message',
      },
      {
        label: 'Static',
        type: 'static-key-value',
        value: 'this is a static key:value pair',
      },
      {
        label: 'Dynamic',
        type: 'dynamic-key-value',
        value: 'this is a dynamic key:value pair',
      },
    ]

    const {frames, unmount} = render(
      <Stages stageTracker={stageTracker} title="Test" preStagesBlock={preStagesBlock} />,
    )
    unmount()
    const lastFrame = lastValidFrame(frames)
    expect(lastFrame).to.include(` this is a message
 Static: this is a static key:value pair
 Dynamic: this is a dynamic key:value pair

 ◼ Step1
`)
  })

  it('should show post-stage info block', async () => {
    const stageTracker = new StageTracker(['step1', 'step2'])

    const postStagesBlock: FormattedKeyValue[] = [
      {
        type: 'message',
        value: 'this is a message',
      },
      {
        label: 'Static',
        type: 'static-key-value',
        value: 'this is a static key:value pair',
      },
      {
        label: 'Dynamic',
        type: 'dynamic-key-value',
        value: 'this is a dynamic key:value pair',
      },
    ]

    const {frames, unmount} = render(
      <Stages stageTracker={stageTracker} title="Test" postStagesBlock={postStagesBlock} />,
    )
    unmount()
    const lastFrame = lastValidFrame(frames)
    expect(lastFrame).to.include(` ◼ Step2

 this is a message
 Static: this is a static key:value pair
 Dynamic: this is a dynamic key:value pair`)
  })

  it('should show stage specific info block', async () => {
    const stageTracker = new StageTracker(['step1', 'step2'])
    stageTracker.set('step1', 'completed')
    const stageSpecificBlock: FormattedKeyValue[] = [
      {
        stage: 'step1',
        type: 'message',
        value: 'this is a message',
      },
      {
        label: 'Static',
        stage: 'step1',
        type: 'static-key-value',
        value: 'this is a static key:value pair',
      },
      {
        label: 'Dynamic',
        stage: 'step1',
        type: 'dynamic-key-value',
        value: 'this is a dynamic key:value pair',
      },
    ]

    const {frames, unmount} = render(
      <Stages stageTracker={stageTracker} title="Test" stageSpecificBlock={stageSpecificBlock} />,
    )
    unmount()
    const lastFrame = lastValidFrame(frames)
    expect(lastFrame).to.include(` ✔ Step1 0ms
      this is a message
      Static: this is a static key:value pair
      Dynamic: this is a dynamic key:value pair`)
  })
})