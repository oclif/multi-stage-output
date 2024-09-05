<img src="https://user-images.githubusercontent.com/449385/38243295-e0a47d58-372e-11e8-9bc0-8c02a6f4d2ac.png" width="260" height="73">

[![Version](https://img.shields.io/npm/v/@oclif/multi-stage-output.svg)](https://npmjs.org/package/@oclif/multi-stage-output)
[![Downloads/week](https://img.shields.io/npm/dw/@oclif/multi-stage-output.svg)](https://npmjs.org/package/@oclif/multi-stage-output)
[![License](https://img.shields.io/npm/l/@oclif/multi-stage-output.svg)](https://github.com/oclif/multi-stage-output/blob/main/LICENSE)

# Description

This is a framework for showing multi-stage output in the terminal. It's integrated with oclif's builtin [Performance](https://oclif.io/docs/performance/) capabilities so that perf metrics are automatically captured for each stage.

![Demo](./assets/demo.gif?raw=true 'Demo')

# Features

- Integrated Performance Tracking: this is integrated with oclif's builtin [Performance](https://oclif.io/docs/performance/) capabilities so that perf metrics are automatically captured for each stage.
- Responsive Design: elements will be added or removed based on the height of the terminal window. It even resizes itself if you resize the screen while the command is running.
- CI Friendly Output: a simpler output will be shown inside non-tty environments like CI systems to avoid any excessive output that might be hard to read in CI logs.

# Examples

You can see examples of how to use it in the [examples](./examples/) directory.

You can run any of these with the following:

```
tsx examples/basic.ts
```

# Usage

## Basic Usage

```typescript
const ms = new MultiStageOutput({
  jsonEnabled: false,
  stages: ['stage 1', 'stage 2', 'stage 3'],
  title: 'Basic Example',
})
// goto `stage 1`
ms.goto('stage 1')
// do some stuff

// goto `stage 2`
ms.goto('stage 2')

// As a convenience, use .next() to goto the next stage
ms.next()

// stop the multi-stage output from running anymore. Pass in an Error if applicable.
ms.stop()
```

## Adding information blocks before or after the stages output.

You can add blocks on information before or after the list of stages. There are 3 kinds of information that can be displayed:

- `message`: a simple string message
- `static-key-value`: a simple key:value pair, e.g. `name: Foo`. If the value is undefined, the key will not be shown.
- `dynamic-key-value`: a key:value pair where the value is expected to come in at an unknown time. This will display a spinner until the value is provided. If `.stop` is called with an error before the value is provided, then a `✘` will be displayed.

```typescript
const ms = new MultiStageOutput<{message: string; staticValue: string; dynamicValue: string}>({
  jsonEnabled: false,
  stages: ['stage 1', 'stage 2', 'stage 3'],
  // preStagesBlock will be displayed BEFORE the list of stages
  preStagesBlock: [
    {
      get: (data) => data?.message,
      type: 'message',
    },
  ],
  // postStagesBlock will be displayed AFTER the list of stages
  postStagesBlock: [
    {
      get: (data) => data?.staticValue,
      label: 'Static',
      type: 'static-key-value',
    },
    {
      get: (data) => data?.dynamicValue,
      label: 'Dynamic',
      type: 'dynamic-key-value',
    },
  ],
})
// Goto `stage 1` and provide partial data to use for the information blocks
ms.goto('stage 1', {message: 'This is a message', staticValue: 'This is a static key:value pair'})

// Provide more data to use
ms.updateData({dynamicValue: 'This is a dynamic key:value pair'})

// Goto `stage 2` and provide more partial data
ms.goto('stage 2')

// Goto stage 3
ms.goto('stage 3')

ms.stop()
```

## Adding information blocks on a specific stage

You can also add information blocks onto specific stages, which will nest the information underneath the stage.

```typescript
const ms = new MultiStageOutput<{message: string; staticValue: string; dynamicValue: string}>({
  jsonEnabled: false,
  stageSpecificBlock: [
    // This will be nested underneath `stage 1`
    {
      get: (data) => data?.message,
      stage: 'one',
      type: 'message',
    },
    // This will be nested underneath `stage 2`
    {
      get: (data) => data?.staticValue,
      label: 'Static',
      stage: 'two',
      type: 'static-key-value',
    },
    // This will be nested underneath `stage 1`
    {
      get: (data) => data?.dynamicValue,
      label: 'Dynamic',
      stage: 'one',
      type: 'dynamic-key-value',
    },
  ],
  stages: ['stage 1', 'stage 2', 'stage 3'],
  title: 'Stage-Specific Information Block Example',
})

ms.goto('stage 1', {message: 'This is a message', staticValue: 'This is a static key:value pair'})

ms.goto('stage 2', {dynamicValue: 'This is a dynamic key:value pair'})

ms.goto('stage 3')

ms.stop()
```

## Customizing the Design

You can customize the design of the multi-stage output using the `design` property:

```typescript
const ms = new MultiStageOutput({
  jsonEnabled: false,
  stages: ['stage 1', 'stage 2', 'stage 3'],
  title: 'Basic Example',
  design: {
    title: {
      textColor: 'red',
    }
    icons: {
      completed: {
        figure: 'C',
        paddingLeft: 1,
        color: '#00FF00'
      }
    }
  }
})
```

See [`Design`](./src/design.ts) for all the options available to you.

## Other Options

- `showElapsedTime`: Optional. Whether or not to show the `Elapsed Time` at the bottom. Defaults to `true`
- `showStageTime`: Optional. Whether or not to show the time for each stage. Defaults to `true`
- `title`: Optional. The title to show at the top.
- `timerUnit`: The unit to use for the elapsed time and stage time. Can be `ms` or `s`. Defaults to `ms`

# Contributing

See the [contributing guide](./CONRTIBUTING.md).
