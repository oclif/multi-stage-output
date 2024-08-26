import {config, expect} from 'chai'
import {render} from 'ink-testing-library'
import React from 'react'
import stripAnsi from 'strip-ansi'

import {FormattedKeyValue, Stages, determineCompactionLevel} from '../../src/components/stages.js'
import {constructDesignParams} from '../../src/design.js'
import {StageTracker} from '../../src/stage-tracker.js'

config.truncateThreshold = 0

function lastValidFrame(frames: string[]): string {
  for (let i = frames.length - 1; i >= 0; i--) {
    if (frames[i] !== '\n') return stripAnsi(frames[i])
  }

  return ''
}

describe('Stages', () => {
  const design = constructDesignParams({
    icons: {
      completed: {
        figure: 'c',
        paddingRight: 1,
      },
      pending: {
        figure: 'p',
        paddingRight: 1,
      },
    },
  })

  it('should render pending stages', async () => {
    const stageTracker = new StageTracker(['step1', 'step2'])
    const {frames, unmount} = render(<Stages design={design} stageTracker={stageTracker} title="Test" />)
    unmount()
    const lastFrame = lastValidFrame(frames)
    expect(lastFrame).to.include('─ Test ─')
    expect(lastFrame).to.include(`${design.icons.pending.figure} Step1`)
    expect(lastFrame).to.include(`${design.icons.pending.figure} Step2`)
    expect(lastFrame).to.include('Elapsed Time:')
  })

  it('should render completed stages', async () => {
    const stageTracker = new StageTracker(['step1', 'step2'])
    stageTracker.set('step1', 'completed')
    const {frames, unmount} = render(<Stages design={design} stageTracker={stageTracker} title="Test" />)
    unmount()
    const lastFrame = lastValidFrame(frames)
    expect(lastFrame).to.include('─ Test ─')
    expect(lastFrame).to.include(`${design.icons.completed.figure} Step1`)
    expect(lastFrame).to.include(`${design.icons.pending.figure} Step2`)
    expect(lastFrame).to.include('Elapsed Time:')
  })

  it('should render skipped stages', async () => {
    const stageTracker = new StageTracker(['step1', 'step2'])
    stageTracker.set('step1', 'skipped')
    stageTracker.set('step2', 'completed')
    const {frames, unmount} = render(<Stages design={design} stageTracker={stageTracker} title="Test" />)
    unmount()
    const lastFrame = lastValidFrame(frames)
    expect(lastFrame).to.include('─ Test ─')
    expect(lastFrame).to.include(`${design.icons.skipped.figure} Step1 - Skipped`)
    expect(lastFrame).to.include(`${design.icons.completed.figure} Step2`)
    expect(lastFrame).to.include('Elapsed Time:')
  })

  it('should render failed stages', async () => {
    const stageTracker = new StageTracker(['step1', 'step2'])
    stageTracker.set('step1', 'failed')
    const {frames, unmount} = render(
      <Stages design={design} stageTracker={stageTracker} title="Test" error={new Error('oops')} />,
    )
    unmount()
    const lastFrame = lastValidFrame(frames)
    expect(lastFrame).to.include('─ Test ─')
    expect(lastFrame).to.include(`${design.icons.failed.figure} Step1`)
    expect(lastFrame).to.include(`${design.icons.pending.figure} Step2`)
    expect(lastFrame).to.include('Elapsed Time:')
  })

  it('should disable elapsed time', async () => {
    const stageTracker = new StageTracker(['step1', 'step2'])
    const {frames, unmount} = render(
      <Stages design={design} stageTracker={stageTracker} title="Test" hasElapsedTime={false} />,
    )
    unmount()
    const lastFrame = lastValidFrame(frames)
    expect(lastFrame).to.include('─ Test ─')
    expect(lastFrame).to.include(`${design.icons.pending.figure} Step1`)
    expect(lastFrame).to.include(`${design.icons.pending.figure} Step2`)
    expect(lastFrame).to.not.include('Elapsed Time:')
  })

  it('should enable stage time', async () => {
    const stageTracker = new StageTracker(['step1', 'step2'])
    stageTracker.set('step1', 'completed')
    const {frames, unmount} = render(<Stages hasStageTime design={design} stageTracker={stageTracker} title="Test" />)
    unmount()
    const lastFrame = lastValidFrame(frames)
    expect(lastFrame).to.include('─ Test ─')
    expect(lastFrame).to.include(`${design.icons.completed.figure} Step1 0ms`)
    expect(lastFrame).to.include(`${design.icons.pending.figure} Step2\n`)
    expect(lastFrame).to.include('Elapsed Time:')
  })

  it('should disable stage time', async () => {
    const stageTracker = new StageTracker(['step1', 'step2'])
    stageTracker.set('step1', 'completed')
    const {frames, unmount} = render(
      <Stages design={design} stageTracker={stageTracker} title="Test" hasStageTime={false} />,
    )
    unmount()
    const lastFrame = lastValidFrame(frames)
    expect(lastFrame).to.include('─ Test ─')
    expect(lastFrame).to.include(`${design.icons.completed.figure} Step1\n`)
    expect(lastFrame).to.include(`${design.icons.pending.figure} Step2\n`)
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
      <Stages design={design} stageTracker={stageTracker} title="Test" preStagesBlock={preStagesBlock} />,
    )
    unmount()
    const lastFrame = lastValidFrame(frames)
    expect(lastFrame).to.include(` this is a message
 Static: this is a static key:value pair
 Dynamic: this is a dynamic key:value pair

 ${design.icons.pending.figure} Step1
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
      <Stages design={design} stageTracker={stageTracker} title="Test" postStagesBlock={postStagesBlock} />,
    )
    unmount()
    const lastFrame = lastValidFrame(frames)
    expect(lastFrame).to.include(` ${design.icons.pending.figure} Step2

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
      <Stages design={design} stageTracker={stageTracker} title="Test" stageSpecificBlock={stageSpecificBlock} />,
    )
    unmount()
    const lastFrame = lastValidFrame(frames)
    expect(lastFrame).to.include(` ${design.icons.completed.figure} Step1 0ms
   ${design.icons.info.figure} this is a message
   ${design.icons.info.figure} Static: this is a static key:value pair
   ${design.icons.info.figure} Dynamic: this is a dynamic key:value pair`)
  })
})

describe('determineCompactionLevel', () => {
  it('should return 0 if the number of stages < the window size', () => {
    const stages = Array.from({length: 5}, (_, i) => i.toString())
    const stageTracker = new StageTracker(stages)
    expect(
      determineCompactionLevel(
        {
          hasElapsedTime: true,
          postStagesBlock: [],
          preStagesBlock: [],
          stageSpecificBlock: [],
          stageTracker,
          title: 'Test',
        },
        20,
      ),
    ).to.equal(0)
  })

  it('should return 1 if the number of stages = the window size', () => {
    const stages = Array.from({length: 20}, (_, i) => i.toString())
    const stageTracker = new StageTracker(stages)
    expect(
      determineCompactionLevel(
        {
          hasElapsedTime: true,
          postStagesBlock: [],
          preStagesBlock: [],
          stageSpecificBlock: [],
          stageTracker,
          title: 'Test',
        },
        20,
      ),
    ).to.equal(1)
  })

  it('should return 1 if the number of stages > the window size', () => {
    const stages = Array.from({length: 23}, (_, i) => i.toString())
    const stageTracker = new StageTracker(stages)
    expect(
      determineCompactionLevel(
        {
          hasElapsedTime: true,
          postStagesBlock: [],
          preStagesBlock: [],
          stageSpecificBlock: [],
          stageTracker,
          title: 'Test',
        },
        20,
      ),
    ).to.equal(1)
  })

  it('should return 2 if the number of stages + the elapsed time > the window size', () => {
    const stages = Array.from({length: 20}, (_, i) => i.toString())
    const infos = Array.from({length: 13}, () => ({
      type: 'message',
      value: 'hello',
    })) as FormattedKeyValue[]
    const stageTracker = new StageTracker(stages)

    // 20 stages + 13 info blocks + 1 title + 1 elapsed time + 4 margin = 39 total lines
    // remove 19 lines since it will only render one a time and you get 20
    // remove 1 line for the elapsed time and you get 19, which is less than the window size
    // so the compaction level should be 2
    expect(
      determineCompactionLevel(
        {
          hasElapsedTime: true,
          postStagesBlock: infos,
          preStagesBlock: [],
          stageSpecificBlock: [],
          stageTracker,
          title: 'Test',
        },
        20,
      ),
    ).to.equal(2)
  })

  it('should return 3 if the number of stages + the elapsed time + title > the window size', () => {
    const stages = Array.from({length: 20}, (_, i) => i.toString())
    const infos = Array.from({length: 14}, () => ({
      type: 'message',
      value: 'hello',
    })) as FormattedKeyValue[]
    const stageTracker = new StageTracker(stages)

    // 20 stages + 14 info blocks + 1 title + 1 elapsed time + 4 margin = 40 total lines
    // remove 19 lines since it will only render one a time and you get 21
    // remove 1 line for the elapsed time and you get 20,
    // remove 1 line for the title and you get 19, which is less than the window size
    // so the compaction level should be 3
    expect(
      determineCompactionLevel(
        {
          hasElapsedTime: true,
          postStagesBlock: infos,
          preStagesBlock: [],
          stageSpecificBlock: [],
          stageTracker,
          title: 'Test',
        },
        20,
      ),
    ).to.equal(3)
  })

  it('should return 4 if the number of stages + the elapsed time + title + pre-stages block > the window size', () => {
    const stages = Array.from({length: 20}, (_, i) => i.toString())
    const infos = Array.from({length: 15}, () => ({
      type: 'message',
      value: 'hello',
    })) as FormattedKeyValue[]
    const stageTracker = new StageTracker(stages)

    // 20 stages + 15 info blocks + 1 title + 1 elapsed time + 4 margin = 41 total lines
    // remove 19 lines since it will only render one a time and you get 22
    // remove 1 line for the elapsed time and you get 21,
    // remove 1 line for the title and you get 20
    // remove the pre-stages block and you get 5, which is less than the window size
    // so the compaction level should be 4
    expect(
      determineCompactionLevel(
        {
          hasElapsedTime: true,
          postStagesBlock: [],
          preStagesBlock: infos,
          stageSpecificBlock: [],
          stageTracker,
          title: 'Test',
        },
        20,
      ),
    ).to.equal(4)
  })

  it('should return 5 if the number of stages + the elapsed time + title + pre-stages block + post-stages block > the window size', () => {
    const stages = Array.from({length: 20}, (_, i) => i.toString())
    const postStagesBlock = Array.from({length: 15}, () => ({
      type: 'message',
      value: 'hello',
    })) as FormattedKeyValue[]
    const preStagesBlock = Array.from({length: 1}, () => ({
      type: 'message',
      value: 'hello',
    })) as FormattedKeyValue[]
    const stageTracker = new StageTracker(stages)

    // 20 stages + 16 info blocks + 1 title + 1 elapsed time + 4 margin = 42 total lines
    // remove 19 lines since it will only render one a time and you get 23
    // remove 1 line for the elapsed time and you get 22,
    // remove 1 line for the title and you get 21
    // remove the pre-stages block and you get 20
    // remove the post-stages block and you get 5, which is less than the window size
    // so the compaction level should be 5
    expect(
      determineCompactionLevel(
        {
          hasElapsedTime: true,
          postStagesBlock,
          preStagesBlock,
          stageSpecificBlock: [],
          stageTracker,
          title: 'Test',
        },
        20,
      ),
    ).to.equal(5)
  })

  it('should return 6 if the number of stages + the elapsed time + title + pre-stages block + post-stages block + stage specific block > the window size', () => {
    const stages = Array.from({length: 20}, (_, i) => i.toString())
    const postStagesBlock = Array.from({length: 1}, () => ({
      type: 'message',
      value: 'hello',
    })) as FormattedKeyValue[]
    const preStagesBlock = Array.from({length: 1}, () => ({
      type: 'message',
      value: 'hello',
    })) as FormattedKeyValue[]
    const stageSpecificBlock = Array.from({length: 15}, () => ({
      type: 'message',
      value: 'hello',
    })) as FormattedKeyValue[]
    const stageTracker = new StageTracker(stages)

    // 20 stages + 17 info blocks + 1 title + 1 elapsed time + 4 margin = 43 total lines
    // remove 19 lines since it will only render one a time and you get 24
    // remove 1 line for the elapsed time and you get 23,
    // remove 1 line for the title and you get 22
    // remove the pre-stages block and you get 21
    // remove the post-stages block and you get 20
    // remove the stage specific block and you get 5, which is less than the window size
    // so the compaction level should be 6
    expect(
      determineCompactionLevel(
        {
          hasElapsedTime: true,
          postStagesBlock,
          preStagesBlock,
          stageSpecificBlock,
          stageTracker,
          title: 'Test',
        },
        20,
      ),
    ).to.equal(6)
  })
})
