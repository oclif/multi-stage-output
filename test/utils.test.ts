import {expect} from 'chai'

import {readableTime, truncate} from '../src/utils.js'

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

describe('truncate', () => {
  describe('with default decimal places (2)', () => {
    it('should format whole numbers', () => {
      expect(truncate(5)).to.equal('5.00')
      expect(truncate(100)).to.equal('100.00')
      expect(truncate(59_999)).to.equal('59999.00')
      expect(truncate(60_000)).to.equal('60000.00')
    })

    it('should truncate decimals', () => {
      expect(truncate(5.678)).to.equal('5.67')
      expect(truncate(5.674)).to.equal('5.67')
      // node is inexact when handling floating point numbers
      expect(truncate(5.1)).to.equal('5.09')
    })

    it('should handle zero', () => {
      expect(truncate(0)).to.equal('0.00')
    })
  })

  describe('with custom decimal places', () => {
    it('should format with 0 decimal places', () => {
      expect(truncate(5.678, 0)).to.equal('5')
      expect(truncate(5.1, 0)).to.equal('5')
      expect(truncate(5, 0)).to.equal('5')
    })

    it('should format with 1 decimal place', () => {
      expect(truncate(5.678, 1)).to.equal('5.6')
      expect(truncate(5.1, 1)).to.equal('5.1')
      expect(truncate(5, 1)).to.equal('5.0')
    })

    it('should format with 3 decimal places', () => {
      expect(truncate(5.6789, 3)).to.equal('5.678')
      expect(truncate(5.1, 3)).to.equal('5.100')
      expect(truncate(5, 3)).to.equal('5.000')
    })
  })

  describe('edge cases', () => {
    it('should handle very small numbers', () => {
      expect(truncate(0.0001)).to.equal('0.00')
      expect(truncate(0.0001, 4)).to.equal('0.0001')
    })

    it('should handle very large numbers', () => {
      expect(truncate(123_456.789)).to.equal('123456.78')
      expect(truncate(123_456.789, 0)).to.equal('123456')
    })
  })
})
