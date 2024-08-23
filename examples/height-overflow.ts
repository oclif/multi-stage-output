import {MultiStageOutput} from '../src/multi-stage-output.js'

const SLEEP_TIME = Number.parseInt(process.env.SLEEP ?? '500', 10) ?? 100

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

const stages = Array.from({length: process.stdout.rows + 4}, (_, i) => i.toString())

const ms = new MultiStageOutput({
  jsonEnabled: false,
  // showElapsedTime: false,
  stages,
})

for (const stage of stages) {
  ms.goto(stage)
  // eslint-disable-next-line no-await-in-loop
  await sleep(SLEEP_TIME)
}

ms.stop()
