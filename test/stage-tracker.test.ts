import {config, expect} from 'chai'

import {StageTracker} from '../src/stage-tracker.js'

config.truncateThreshold = 0

describe('StageTracker', () => {
  it('should initialize all stages as pending', () => {
    const tracker = new StageTracker(['one', 'two', 'three'])
    expect([...tracker.values()]).to.deep.equal(['pending', 'pending', 'pending'])
  })

  it('should keep track of the current stage', () => {
    const tracker = new StageTracker(['one', 'two', 'three'])
    tracker.refresh('two')
    expect(tracker.current).to.deep.equal(['two'])
  })

  it("should set the current stage to error when there's an error", () => {
    const tracker = new StageTracker(['one', 'two', 'three'])
    tracker.refresh('two', {finalStatus: 'failed'})
    expect(tracker.get('two')).to.equal('failed')
  })

  it('should set the current stage to completed when stopping', () => {
    const tracker = new StageTracker(['one', 'two', 'three'])
    tracker.refresh('two', {finalStatus: 'completed'})
    expect(tracker.get('two')).to.equal('completed')
  })

  it('should mark bypassed steps as completed', () => {
    const tracker = new StageTracker(['one', 'two', 'three'])
    tracker.refresh('three', {bypassStatus: 'completed'})
    expect(tracker.get('two')).to.equal('completed')
  })

  it('should mark bypassed steps as skipped', () => {
    const tracker = new StageTracker(['one', 'two', 'three'])
    tracker.refresh('three', {bypassStatus: 'skipped'})
    expect(tracker.get('two')).to.equal('skipped')
  })

  it('should mark previous current step as completed', () => {
    const tracker = new StageTracker(['one', 'two', 'three'])
    tracker.refresh('one')
    tracker.refresh('two')
    expect(tracker.get('one')).to.equal('completed')
    expect(tracker.get('two')).to.equal('current')
  })
})
