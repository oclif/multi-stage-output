import {expect} from 'chai'

import {readableTime} from '../src/utils.js'

describe('readableTime', () => {
  describe('milliseconds', () => {
    it('returns the correct value for 0', () => {
      expect(readableTime(0, 'ms')).to.equal('0ms')
    })

    it('returns the correct value for 1', () => {
      expect(readableTime(1, 'ms')).to.equal('1ms')
    })

    it('returns the correct value for 999', () => {
      expect(readableTime(999, 'ms')).to.equal('999ms')
    })

    it('returns the correct value for 1000', () => {
      expect(readableTime(1000, 'ms')).to.equal('1.00s')
    })

    it('returns the correct value for 59_999', () => {
      expect(readableTime(59_999, 'ms')).to.equal('59.99s')
    })

    it('returns the correct value for 60_000', () => {
      expect(readableTime(60_000, 'ms')).to.equal('1m 0.00s')
    })

    it('returns the correct value for 3_599_999', () => {
      expect(readableTime(3_599_990, 'ms')).to.equal('59m 59.99s')
    })

    it('returns the correct value for 3_600_000', () => {
      expect(readableTime(3_600_000, 'ms')).to.equal('1h 0m')
    })
  })

  describe('seconds', () => {
    it('returns the correct value for 0', () => {
      expect(readableTime(0, 's')).to.equal('< 1s')
    })

    it('returns the correct value for 1', () => {
      expect(readableTime(1, 's')).to.equal('< 1s')
    })

    it('returns the correct value for 999', () => {
      expect(readableTime(999, 's')).to.equal('< 1s')
    })

    it('returns the correct value for 1000', () => {
      expect(readableTime(1000, 's')).to.equal('1s')
    })

    it('returns the correct value for 59_999', () => {
      expect(readableTime(59_999, 's')).to.equal('59s')
    })

    it('returns the correct value for 60_000', () => {
      expect(readableTime(60_000, 's')).to.equal('1m 0s')
    })

    it('returns the correct value for 3_599_999', () => {
      expect(readableTime(3_599_990, 's')).to.equal('59m 59s')
    })

    it('returns the correct value for 3_600_000', () => {
      expect(readableTime(3_600_000, 's')).to.equal('1h 0m')
    })
  })
})
