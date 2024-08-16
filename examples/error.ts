import {MultiStageOutput} from '../src/multi-stage-output.js'

const SLEEP_TIME = Number.parseInt(process.env.SLEEP ?? '100', 10) ?? 100

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

const ms = new MultiStageOutput({
  jsonEnabled: false,
  stages: ['one', 'two', 'three'],
  title: 'Example',
})

ms.goto('one')
await sleep(SLEEP_TIME)

ms.goto('two')
await sleep(SLEEP_TIME)

ms.stop(new Error('An error occurred'))
