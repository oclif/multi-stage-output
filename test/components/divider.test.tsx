import {config, expect} from 'chai'
import {render} from 'ink-testing-library'
import React from 'react'
import stripAnsi from 'strip-ansi'

import {Divider} from '../../src/components/divider.js'

config.truncateThreshold = 0

function renderAndStrip(input: React.ReactElement) {
  const {lastFrame} = render(input)
  return stripAnsi(lastFrame() ?? '')
}

describe('Divider', () => {
  it('renders a simple divider', () => {
    expect(renderAndStrip(<Divider />)).to.equal(' ──────────────────────────────────────────────────')
  })

  it('renders a divider with a title', () => {
    expect(renderAndStrip(<Divider title="Hello" />)).to.equal(' ───────────────────── Hello ─────────────────────')
  })

  it('renders a divider with a title and padding', () => {
    expect(renderAndStrip(<Divider title="Hello" padding={2} />)).to.equal(
      '  ───────────────────── Hello ─────────────────────',
    )
  })

  it('renders a divider with a title and title padding', () => {
    expect(renderAndStrip(<Divider title="Hello" titlePadding={2} />)).to.equal(
      ' ────────────────────  Hello  ────────────────────',
    )
  })

  it('renders a divider with a title and divider char', () => {
    expect(renderAndStrip(<Divider title="Hello" dividerChar="=" />)).to.equal(
      ' ===================== Hello =====================',
    )
  })
})
