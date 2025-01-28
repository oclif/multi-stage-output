import {MultiStageOutput} from '../../src/multi-stage-output.js'

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

type Data = {
  mdapiDeploy: any
  sourceMemberPolling: any
  status: string
  message: string
  username: string
  id: string
}

function round(value: number, precision: number): number {
  const multiplier = 10 ** (precision || 0)
  return Math.round(value * multiplier) / multiplier
}

function formatProgress(current: number, total: number): string {
  if (total === 0) {
    return '0/0 (0%)'
  }

  return `${current}/${total} (${round((current / total) * 100, 0)}%)`
}

const stages = [
  'Preparing',
  'Waiting for the org to respond',
  'Deploying Metadata',
  'Running Tests',
  'Updating Source Tracking',
  'Done',
]

const ms = new MultiStageOutput<Data>({
  jsonEnabled: false,
  postStagesBlock: [
    {
      bold: true,
      get: (data): string | undefined => data?.status,
      label: 'Status',
      onlyShowAtEndInCI: true,
      type: 'dynamic-key-value',
    },
    {
      get: (data): string | undefined => data?.id,
      label: 'Deploy ID',
      neverCollapse: true,
      type: 'static-key-value',
    },
    {
      get: (data): string | undefined => data?.username,
      label: 'Target Org',
      type: 'static-key-value',
    },
  ],
  preStagesBlock: [
    {
      get: (data): string | undefined => data?.message,
      type: 'message',
    },
  ],
  stages,
  stageSpecificBlock: [
    {
      get: (data): string | undefined =>
        data?.mdapiDeploy?.numberComponentsTotal
          ? formatProgress(data?.mdapiDeploy?.numberComponentsDeployed ?? 0, data?.mdapiDeploy?.numberComponentsTotal)
          : undefined,
      label: 'Components',
      stage: 'Deploying Metadata',
      type: 'dynamic-key-value',
    },
    {
      get: (data): string | undefined =>
        data?.mdapiDeploy?.numberTestsTotal && data?.mdapiDeploy?.numberTestsCompleted
          ? formatProgress(data?.mdapiDeploy?.numberTestsCompleted, data?.mdapiDeploy?.numberTestsTotal)
          : undefined,
      label: 'Successful',
      stage: 'Running Tests',
      type: 'dynamic-key-value',
    },
    {
      get: (data): string | undefined =>
        data?.mdapiDeploy?.numberTestsTotal && data?.mdapiDeploy?.numberTestsCompleted
          ? formatProgress(data?.mdapiDeploy?.numberTestErrors, data?.mdapiDeploy?.numberTestsTotal)
          : undefined,
      label: 'Failed',
      stage: 'Running Tests',
      type: 'dynamic-key-value',
    },

    {
      get: (data): string | undefined =>
        data?.sourceMemberPolling?.original
          ? formatProgress(data.sourceMemberPolling.remaining, data.sourceMemberPolling.original)
          : undefined,
      label: 'Members',
      stage: 'Updating Source Tracking',
      type: 'dynamic-key-value',
    },
  ],
  title: 'Deploying Metadata',
})

ms.goto('Preparing')
await sleep(400)

const username = 'test-byyrthcpuxjx@example.com'
ms.updateData({
  id: '0AfKP000000Xugj0AC',
  message: `Deploying v61.0 metadata to ${username} using the v62.0 REST API`,
  status: 'In Progress',
  username,
})

ms.goto('Deploying Metadata')

for (let i = 0; i <= 10; i++) {
  ms.updateData({
    mdapiDeploy: {
      numberComponentsDeployed: i,
      numberComponentsTotal: 10,
    },
  })

  // eslint-disable-next-line no-await-in-loop
  await sleep(200)
}

ms.goto('Running Tests')
const tests = 500
for (let i = 0; i <= tests; i++) {
  ms.updateData({
    mdapiDeploy: {
      numberComponentsDeployed: 10,
      numberComponentsTotal: 10,
      numberTestErrors: 0,
      numberTestsCompleted: i,
      numberTestsTotal: tests,
    },
  })

  // eslint-disable-next-line no-await-in-loop
  await sleep(10)
}

ms.updateData({status: 'Succeeded'})
ms.skipTo('Updating Source Tracking')

for (let i = 0; i <= 10; i++) {
  ms.updateData({
    sourceMemberPolling: {
      original: 10,
      remaining: i,
    },
  })
  // eslint-disable-next-line no-await-in-loop
  await sleep(100)
}

ms.goto('Done')

ms.stop()
