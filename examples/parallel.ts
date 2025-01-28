import {ParallelMultiStageOutput} from '../src/multi-stage-output.js'

const SLEEP_TIME = Number.parseInt(process.env.SLEEP ?? '1000', 10) ?? 100

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

const ms = new ParallelMultiStageOutput<{message: string; staticValue: string; dynamicValue: string}>({
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

ms.startStage('one', {message: 'This is a message', staticValue: 'This is a static key:value pair'})
await sleep(SLEEP_TIME)

ms.startStage('two', {dynamicValue: 'This is a dynamic key:value pair'})
await sleep(SLEEP_TIME)

ms.stopStage('one')
await sleep(SLEEP_TIME)

ms.pauseStage('two')
await sleep(SLEEP_TIME)

ms.resumeStage('two')
await sleep(SLEEP_TIME)

ms.startStage('three')
await sleep(SLEEP_TIME)

ms.stopStage('two')
await sleep(SLEEP_TIME)

ms.stopStage('three')

ms.stop()
