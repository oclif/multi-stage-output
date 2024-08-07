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
    expect(tracker.current).to.equal('two')
  })

  it("should set the current stage to error when there's an error", () => {
    const tracker = new StageTracker(['one', 'two', 'three'])
    tracker.refresh('two', {hasError: true})
    expect(tracker.get('two')).to.equal('failed')
  })

  it('should set the current stage to completed when stopping', () => {
    const tracker = new StageTracker(['one', 'two', 'three'])
    tracker.refresh('two', {isStopping: true})
    expect(tracker.get('two')).to.equal('completed')
  })
})
