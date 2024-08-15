import {Box, Text} from 'ink'
import React from 'react'

export type IconProps = {
  figure?: string | false
  paddingLeft?: number
  paddingRight?: number
  color?: string | false
}

export function Icon({
  children,
  icon,
}: {
  readonly children?: React.ReactNode
  readonly icon: IconProps
}): React.ReactNode {
  if (!icon) return false
  return (
    <Box>
      <Box paddingLeft={icon.paddingLeft} paddingRight={icon.paddingRight}>
        {icon.color && <Text color={icon.color}>{icon.figure}</Text>}
        {!icon.color && <Text>{icon.figure}</Text>}
      </Box>

      <Box>{children}</Box>
    </Box>
  )
}
