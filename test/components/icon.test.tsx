import {config, expect} from 'chai'
import {Text} from 'ink'
import {render} from 'ink-testing-library'
import React from 'react'
import stripAnsi from 'strip-ansi'

import {Icon} from '../../src/components/icon.js'

config.truncateThreshold = 0

function renderAndStrip(input: React.ReactElement) {
  const {lastFrame} = render(input)
  return stripAnsi(lastFrame() ?? '')
}

describe('Icon', () => {
  it('renders an icon', () => {
    const icon = {
      figure: 'x',
      paddingLeft: 0,
      paddingRight: 0,
    }
    expect(renderAndStrip(<Icon icon={icon} />)).to.equal('x')
  })

  it('renders an icon with padding', () => {
    const icon = {
      figure: 'x',
      paddingLeft: 2,
      paddingRight: 2,
    }
    // no right padding because there is no text after the icon
    expect(renderAndStrip(<Icon icon={icon} />)).to.equal('  x')
  })

  it('renders an icon with children', () => {
    const icon = {
      figure: 'x',
      paddingLeft: 0,
      paddingRight: 0,
    }
    expect(
      renderAndStrip(
        <Icon icon={icon}>
          <Text>children</Text>
        </Icon>,
      ),
    ).to.equal('xchildren')
  })

  it('renders an icon with children and padding', () => {
    const icon = {
      figure: 'x',
      paddingLeft: 2,
      paddingRight: 2,
    }
    expect(
      renderAndStrip(
        <Icon icon={icon}>
          <Text>children</Text>
        </Icon>,
      ),
    ).to.equal('  x  children')
  })

  it('renders nothing if icon.figure is undefined', () => {
    const icon = {
      figure: undefined,
      paddingLeft: 0,
      paddingRight: 0,
    }
    expect(renderAndStrip(<Icon icon={icon} />)).to.equal('')
  })
})
