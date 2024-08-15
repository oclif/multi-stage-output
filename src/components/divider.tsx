import {Box, Text} from 'ink'
import React from 'react'

const getSideDividerWidth = (width: number, titleWidth: number): number => (width - titleWidth) / 2
const getNumberOfCharsPerWidth = (char: string, width: number): number => width / char.length

const PAD = ' '

export function Divider({
  dividerChar = '─',
  dividerColor = 'dim',
  padding = 1,
  textColor = 'white',
  textPadding: titlePadding = 1,
  title = '',
  width = 50,
}: {
  readonly title?: string
  readonly width?: number | 'full'
  readonly padding?: number
  readonly textColor?: string
  readonly textPadding?: number
  readonly dividerChar?: string
  readonly dividerColor?: string
}): React.ReactNode {
  const titleString = title ? `${PAD.repeat(titlePadding) + title + PAD.repeat(titlePadding)}` : ''
  const titleWidth = titleString.length
  const terminalWidth = process.stdout.columns ?? 80
  const widthToUse = width === 'full' ? terminalWidth - titlePadding : width > terminalWidth ? terminalWidth : width

  const dividerWidth = getSideDividerWidth(widthToUse, titleWidth)
  const numberOfCharsPerSide = getNumberOfCharsPerWidth(dividerChar, dividerWidth)
  const dividerSideString = dividerChar.repeat(numberOfCharsPerSide)

  const paddingString = PAD.repeat(padding)

  return (
    <Box flexDirection="row">
      <Text>
        {paddingString}
        <Text color={dividerColor}>{dividerSideString}</Text>
        <Text color={textColor}>{titleString}</Text>
        <Text color={dividerColor}>{dividerSideString}</Text>
        {paddingString}
      </Text>
    </Box>
  )
}
