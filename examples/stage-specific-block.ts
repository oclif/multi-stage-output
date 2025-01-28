import {MultiStageOutput} from '../src/multi-stage-output.js'

const SLEEP_TIME = Number.parseInt(process.env.SLEEP ?? '100', 10) ?? 100

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

const ms = new MultiStageOutput<{message: string; staticValue: string; dynamicValue: string}>({
  jsonEnabled: false,
  stages: ['one', 'two', 'three'],
  stageSpecificBlock: [
    {
      get: (data) => data?.message,
      stage: 'one',
      type: 'message',
    },
    {
      get: (data) => data?.staticValue,
      label: 'Static',
      stage: 'two',
      type: 'static-key-value',
    },
    {
      get: (data) => data?.dynamicValue,
      label: 'Dynamic',
      stage: 'one',
      type: 'dynamic-key-value',
    },
  ],
  title: 'Example',
})

ms.goto('one', {message: 'This is a message', staticValue: 'This is a static key:value pair'})
await sleep(SLEEP_TIME)

ms.goto('two', {dynamicValue: 'This is a dynamic key:value pair'})
await sleep(SLEEP_TIME)

ms.goto('three')
await sleep(SLEEP_TIME)

ms.stop()
