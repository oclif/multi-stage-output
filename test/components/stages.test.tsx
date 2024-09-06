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

describe('Stages', () => {
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

  describe('compactionLevel', () => {
    function renderStages(compactionLevel: number): string {
      const stageTracker = new StageTracker(['step1', 'step2'])
      stageTracker.set('step1', 'current')

      const props = {
        compactionLevel,
        design,
        postStagesBlock: [{type: 'message', value: 'post-stage hello'}] as FormattedKeyValue[],
        preStagesBlock: [{type: 'message', value: 'pre-stage hello'}] as FormattedKeyValue[],
        stageSpecificBlock: [{stage: 'step1', type: 'message', value: 'stage-specific hello'}] as FormattedKeyValue[],
        stageTracker,
        title: 'Test',
      }
      const {frames, unmount} = render(<Stages {...props} />)
      unmount()
      return lastValidFrame(frames)
    }

    it('should render compactionLevel=1', async () => {
      const lastFrame = renderStages(1)
      expect(lastFrame).to.include('─ Test ─')
      expect(lastFrame).to.include('pre-stage hello')
      expect(lastFrame).to.include(`[1/2] Step1`)
      expect(lastFrame).to.not.include(`${design.icons.pending.figure} Step2`)
      expect(lastFrame).to.include('stage-specific hello')
      expect(lastFrame).to.include('post-stage hello')
      expect(lastFrame).to.include('Elapsed Time:')
    })

    it('should render compactionLevel=2', async () => {
      const lastFrame = renderStages(2)
      expect(lastFrame).to.include('─ Test ─')
      expect(lastFrame).to.include('pre-stage hello')
      expect(lastFrame).to.include(`[1/2] Step1`)
      expect(lastFrame).to.not.include(`${design.icons.pending.figure} Step2`)
      expect(lastFrame).to.include('stage-specific hello')
      expect(lastFrame).to.include('post-stage hello')
      expect(lastFrame).to.not.include('Elapsed Time:')
    })

    it('should render compactionLevel=3', async () => {
      const lastFrame = renderStages(3)
      expect(lastFrame).to.not.include('─ Test ─')
      expect(lastFrame).to.include('pre-stage hello')
      expect(lastFrame).to.include(`[1/2] Step1`)
      expect(lastFrame).to.not.include(`${design.icons.pending.figure} Step2`)
      expect(lastFrame).to.include('stage-specific hello')
      expect(lastFrame).to.include('post-stage hello')
      expect(lastFrame).to.not.include('Elapsed Time:')
    })

    it('should render compactionLevel=4', async () => {
      const lastFrame = renderStages(4)
      expect(lastFrame).to.not.include('─ Test ─')
      expect(lastFrame).to.not.include('pre-stage hello')
      expect(lastFrame).to.include(`[1/2] Step1`)
      expect(lastFrame).to.not.include(`${design.icons.pending.figure} Step2`)
      expect(lastFrame).to.include('stage-specific hello')
      expect(lastFrame).to.include('post-stage hello')
      expect(lastFrame).to.not.include('Elapsed Time:')
    })

    it('should render compactionLevel=5', async () => {
      const lastFrame = renderStages(5)
      expect(lastFrame).to.not.include('─ Test ─')
      expect(lastFrame).to.not.include('pre-stage hello')
      expect(lastFrame).to.include(`[1/2] Step1`)
      expect(lastFrame).to.not.include(`${design.icons.pending.figure} Step2`)
      expect(lastFrame).to.include('stage-specific hello')
      expect(lastFrame).to.not.include('post-stage hello')
      expect(lastFrame).to.not.include('Elapsed Time:')
    })

    it('should render compactionLevel=6', async () => {
      const lastFrame = renderStages(6)
      expect(lastFrame).to.not.include('─ Test ─')
      expect(lastFrame).to.not.include('pre-stage hello')
      expect(lastFrame).to.include(`[1/2] Step1`)
      expect(lastFrame).to.include('stage-specific hello 0ms')
      expect(lastFrame).to.not.include(`${design.icons.pending.figure} Step2`)
      expect(lastFrame).to.not.include('post-stage hello')
      expect(lastFrame).to.not.include('Elapsed Time:')
    })

    it('should render compactionLevel=7', async () => {
      const lastFrame = renderStages(7)
      expect(lastFrame).to.not.include('─ Test ─')
      expect(lastFrame).to.not.include('pre-stage hello')
      expect(lastFrame).to.include(`[1/2] Step1`)
      expect(lastFrame).to.not.include('stage-specific hello 0ms')
      expect(lastFrame).to.not.include(`${design.icons.pending.figure} Step2`)
      expect(lastFrame).to.not.include('post-stage hello')
      expect(lastFrame).to.not.include('Elapsed Time:')
    })
  })
})

describe('determineCompactionLevel', () => {
  type InfoBlockOptions = {
    count: number
    type: 'message' | 'static-key-value' | 'dynamic-key-value'
    width: number
  }

  function makeBlock(opts: InfoBlockOptions, stage?: string) {
    return Array.from({length: opts.count}, (_, i) => ({
      type: opts.type,
      value: i.toString().repeat(opts.width),
      ...(stage ? {stage} : {}),
      ...(opts.type === 'message' ? {} : {label: 'label'}),
    })) as FormattedKeyValue[]
  }

  function makeInputs(opts: {
    hasElapsedTime?: boolean
    hasStageTime?: boolean
    title?: string
    preStagesBlock?: InfoBlockOptions
    postStagesBlock?: InfoBlockOptions
    stageSpecificBlock?: InfoBlockOptions
    stageCount: number
    stageNameLength: number
  }) {
    const stages = Array.from({length: opts.stageCount}, (_, i) => i.toString().repeat(opts.stageNameLength))
    const stageTracker = new StageTracker(stages)

    const inputs = {
      design,
      stageTracker,
      ...(opts.hasElapsedTime ? {hasElapsedTime: opts.hasElapsedTime} : {}),
      ...(opts.hasStageTime ? {hasStageTime: opts.hasStageTime} : {}),
      ...(opts.title ? {title: opts.title} : {}),
      ...(opts.preStagesBlock ? {preStagesBlock: makeBlock(opts.preStagesBlock)} : {}),
      ...(opts.postStagesBlock ? {postStagesBlock: makeBlock(opts.postStagesBlock)} : {}),
      ...(opts.stageSpecificBlock ? {stageSpecificBlock: makeBlock(opts.stageSpecificBlock, stages[0])} : {}),
    }

    return inputs
  }

  describe('stages', () => {
    // total height will be 9 (5 stages + 3 padding + 1 extra)
    const inputs = makeInputs({
      stageCount: 5,
      stageNameLength: 1,
    })

    it('returns 0 if total height is less than the window height', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 10, 100)
      expect(totalHeight).to.equal(9)
      expect(compactionLevel).to.equal(0)
    })

    it('returns 1 if collapsing stages is sufficient', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 9, 100)
      expect(totalHeight).to.equal(9)
      expect(compactionLevel).to.equal(1)
    })
  })

  describe('stages + elapsed time', () => {
    // total height will be 9 (4 stages + 1 elapsed time + 3 padding + 1 extra)
    const inputs = makeInputs({
      hasElapsedTime: true,
      stageCount: 4,
      stageNameLength: 1,
    })

    it('returns 0 if total height is less than the window height', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 10, 100)
      expect(totalHeight).to.equal(9)
      expect(compactionLevel).to.equal(0)
    })

    it('returns 1 if collapsing stages is sufficient', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 8, 100)
      expect(totalHeight).to.equal(9)
      expect(compactionLevel).to.equal(1)
    })

    it('returns 2 if collapsing stages and elapsed time is sufficient', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 6, 100)
      expect(totalHeight).to.equal(9)
      expect(compactionLevel).to.equal(2)
    })
  })

  describe('stages + elapsed time + title', () => {
    // total height will be 9 (2 stages + 1 elapsed time + 1 title + 4 padding + 1 extra)
    const inputs = makeInputs({
      hasElapsedTime: true,
      stageCount: 2,
      stageNameLength: 1,
      title: 'title',
    })

    it('returns 0 if total height is less than the window height', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 10, 100)
      expect(totalHeight).to.equal(9)
      expect(compactionLevel).to.equal(0)
    })

    it('returns 1 if collapsing stages is sufficient', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 9, 100)
      expect(totalHeight).to.equal(9)
      expect(compactionLevel).to.equal(1)
    })

    it('returns 2 if collapsing stages and elapsed time is sufficient', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 8, 100)
      expect(totalHeight).to.equal(9)
      expect(compactionLevel).to.equal(2)
    })

    it('returns 3 if collapsing stages, elapsed time, and title is sufficient', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 7, 100)
      expect(totalHeight).to.equal(9)
      expect(compactionLevel).to.equal(3)
    })
  })

  describe('stages + elapsed time + title + pre-stages block', () => {
    // total height will be 18 (5 stages + 5 pre-stage infos + 1 elapsed time + 1 title + 5 padding + 1 extra)
    const inputs = makeInputs({
      hasElapsedTime: true,
      preStagesBlock: {count: 5, type: 'message', width: 1},
      stageCount: 5,
      stageNameLength: 1,
      title: 'title',
    })

    it('returns 0 if total height is less than the window height', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 20, 100)
      expect(totalHeight).to.equal(18)
      expect(compactionLevel).to.equal(0)
    })

    it('returns 1 if collapsing stages is sufficient', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 18, 100)
      expect(totalHeight).to.equal(18)
      expect(compactionLevel).to.equal(1)
    })

    it('returns 2 if collapsing stages and elapsed time is sufficient', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 14, 100)
      expect(totalHeight).to.equal(18)
      expect(compactionLevel).to.equal(2)
    })

    it('returns 3 if collapsing stages, elapsed time, and title is sufficient', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 13, 100)
      expect(totalHeight).to.equal(18)
      expect(compactionLevel).to.equal(3)
    })

    it('returns 4 if collapsing stages, elapsed time, title, and pre-stages is sufficient', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 11, 100)
      expect(totalHeight).to.equal(18)
      expect(compactionLevel).to.equal(4)
    })
  })

  describe('stages + elapsed time + title + pre-stages block + post-stages block', () => {
    // total height will be 24 (5 stages + 5 pre-stage infos + 5 post-stage infos + 1 elapsed time + 1 title + 6 padding + 1 extra)
    const inputs = makeInputs({
      hasElapsedTime: true,
      postStagesBlock: {count: 5, type: 'message', width: 1},
      preStagesBlock: {count: 5, type: 'message', width: 1},
      stageCount: 5,
      stageNameLength: 1,
      title: 'title',
    })

    it('returns 0 if total height is less than the window height', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 25, 100)
      expect(totalHeight).to.equal(24)
      expect(compactionLevel).to.equal(0)
    })

    it('returns 1 if collapsing stages is sufficient', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 23, 100)
      expect(totalHeight).to.equal(24)
      expect(compactionLevel).to.equal(1)
    })

    it('returns 2 if collapsing stages and elapsed time is sufficient', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 20, 100)
      expect(totalHeight).to.equal(24)
      expect(compactionLevel).to.equal(2)
    })

    it('returns 3 if collapsing stages, elapsed time, and title is sufficient', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 19, 100)
      expect(totalHeight).to.equal(24)
      expect(compactionLevel).to.equal(3)
    })

    it('returns 4 if collapsing stages, elapsed time, title, and pre-stages is sufficient', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 17, 100)
      expect(totalHeight).to.equal(24)
      expect(compactionLevel).to.equal(4)
    })

    it('returns 5 if collapsing stages, elapsed time, title, pre-stages, and post-stages is sufficient', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 11, 100)
      expect(totalHeight).to.equal(24)
      expect(compactionLevel).to.equal(5)
    })
  })

  describe('stages + elapsed time + title + pre-stages block + post-stages block + stage-specific block', () => {
    // total height will be 29 (5 stages + 5 pre-stage infos + 5 post-stage infos + 5 stage-specific infos + 1 elapsed time + 1 title + 6 padding + 1 extra)
    const inputs = makeInputs({
      hasElapsedTime: true,
      postStagesBlock: {count: 5, type: 'message', width: 1},
      preStagesBlock: {count: 5, type: 'message', width: 1},
      stageCount: 5,
      stageNameLength: 1,
      stageSpecificBlock: {count: 5, type: 'message', width: 20},
      title: 'title',
    })

    it('returns 0 if total height is less than the window height', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 30, 100)
      expect(totalHeight).to.equal(29)
      expect(compactionLevel).to.equal(0)
    })

    it('returns 1 if collapsing stages is sufficient', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 28, 100)
      expect(totalHeight).to.equal(29)
      expect(compactionLevel).to.equal(1)
    })

    it('returns 2 if collapsing stages and elapsed time is sufficient', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 25, 100)
      expect(totalHeight).to.equal(29)
      expect(compactionLevel).to.equal(2)
    })

    it('returns 3 if collapsing stages, elapsed time, and title is sufficient', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 24, 100)
      expect(totalHeight).to.equal(29)
      expect(compactionLevel).to.equal(3)
    })

    it('returns 4 if collapsing stages, elapsed time, title, and pre-stages is sufficient', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 22, 100)
      expect(totalHeight).to.equal(29)
      expect(compactionLevel).to.equal(4)
    })

    it('returns 5 if collapsing stages, elapsed time, title, pre-stages, and post-stages is sufficient', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 16, 100)
      expect(totalHeight).to.equal(29)
      expect(compactionLevel).to.equal(5)
    })

    it('returns 6 if collapsing stages, elapsed time, title, pre-stages, post-stages, and stage-specific is sufficient', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 11, 100)
      expect(totalHeight).to.equal(29)
      expect(compactionLevel).to.equal(6)
    })

    it('returns 7 if it needs to hide all stage-specific blocks', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 6, 100)
      expect(totalHeight).to.equal(29)
      expect(compactionLevel).to.equal(7)
    })

    it('returns 7 if window is too narrow to show all stage-specific blocks', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 6, 10)
      // height is taller here since lines are being wrapped to accommodate the narrow window
      expect(totalHeight).to.equal(36)
      expect(compactionLevel).to.equal(7)
    })

    it('returns 8 if it needs to reduce padding', () => {
      const {compactionLevel, totalHeight} = determineCompactionLevel(inputs, 1, 100)
      expect(totalHeight).to.equal(29)
      expect(compactionLevel).to.equal(8)
    })
  })
})
