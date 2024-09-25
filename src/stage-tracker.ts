import {Performance} from '@oclif/core/performance'

export type StageStatus =
  | 'aborted'
  | 'async'
  | 'completed'
  | 'current'
  | 'failed'
  | 'paused'
  | 'pending'
  | 'skipped'
  | 'warning'

export class StageTracker {
  public current: string[] = []
  private allowParallelTasks: boolean
  private map = new Map<string, StageStatus>()
  private markers = new Map<string, ReturnType<typeof Performance.mark>>()

  public constructor(
    private stages: readonly string[] | string[],
    opts?: {allowParallelTasks?: boolean},
  ) {
    this.map = new Map(stages.map((stage) => [stage, 'pending']))
    this.allowParallelTasks = opts?.allowParallelTasks ?? false
  }

  public get size(): number {
    return this.map.size
  }

  public entries(): IterableIterator<[string, StageStatus]> {
    return this.map.entries()
  }

  public get(stage: string): StageStatus | undefined {
    return this.map.get(stage)
  }

  public indexOf(stage: string): number {
    return this.stages.indexOf(stage)
  }

  public refresh(nextStage: string, opts?: {finalStatus?: StageStatus; bypassStatus?: StageStatus}): void {
    const stages = [...this.map.keys()]

    for (const stage of stages) {
      if (this.map.get(stage) === 'skipped') continue
      if (this.map.get(stage) === 'failed') continue

      // .stop() was called with a finalStatus
      if (nextStage === stage && opts?.finalStatus) {
        this.stopStage(stage, opts.finalStatus)
        continue
      }

      // set the current stage
      if (nextStage === stage) {
        this.set(stage, 'current')
        // create a marker for the current stage if it doesn't exist
        if (!this.markers.has(stage)) {
          this.markers.set(stage, Performance.mark('MultiStageComponent', stage.replaceAll(' ', '-').toLowerCase()))
        }

        continue
      }

      // any pending stage before the current stage should be marked using opts.bypassStatus
      if (stages.indexOf(stage) < stages.indexOf(nextStage) && this.map.get(stage) === 'pending') {
        this.set(stage, opts?.bypassStatus ?? 'completed')
        continue
      }

      // any stage before the current stage should be marked as completed (if it hasn't been marked as skipped or failed yet)
      if (stages.indexOf(nextStage) > stages.indexOf(stage)) {
        this.stopStage(stage, 'completed')
        continue
      }

      // default to pending
      this.set(stage, 'pending')
    }
  }

  public set(stage: string, status: StageStatus): void {
    if (status === 'current') {
      if (!this.current.includes(stage)) {
        this.current.push(stage)
      }
    } else {
      this.current = this.current.filter((s) => s !== stage)
    }

    this.map.set(stage, status)
  }

  public stop(currentStage: string, finalStatus: StageStatus): void {
    if (this.allowParallelTasks) {
      for (const [stage, status] of this.entries()) {
        if (status === 'current') {
          this.stopStage(stage, finalStatus)
        }
      }
    } else {
      this.refresh(currentStage, {finalStatus})
    }
  }

  public update(stage: string, status: StageStatus): void {
    if (status === 'completed' || status === 'failed' || status === 'aborted') {
      this.stopStage(stage, status)
    } else {
      this.set(stage, status)
    }
  }

  public values(): IterableIterator<StageStatus> {
    return this.map.values()
  }

  private stopStage(stage: string, status: StageStatus): void {
    this.set(stage, status)

    const marker = this.markers.get(stage)
    if (marker && !marker.stopped) {
      marker.stop()
    }
  }
}
