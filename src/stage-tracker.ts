import {Performance} from '@oclif/core/performance'

export type StageStatus = 'pending' | 'current' | 'completed' | 'skipped' | 'failed'

export class StageTracker {
  public current: string | undefined
  private map = new Map<string, StageStatus>()
  private markers = new Map<string, ReturnType<typeof Performance.mark>>()

  public constructor(private stages: readonly string[] | string[]) {
    this.map = new Map(stages.map((stage) => [stage, 'pending']))
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

  public getCurrent(): {stage: string; status: StageStatus} | undefined {
    if (this.current) {
      return {
        stage: this.current,
        status: this.map.get(this.current) as StageStatus,
      }
    }
  }

  public indexOf(stage: string): number {
    return this.stages.indexOf(stage)
  }

  public refresh(nextStage: string, opts?: {hasError?: boolean; isStopping?: boolean}): void {
    const stages = [...this.map.keys()]
    for (const stage of stages) {
      if (this.map.get(stage) === 'skipped') continue
      if (this.map.get(stage) === 'failed') continue

      // .stop() was called with an error => set the stage to failed
      if (nextStage === stage && opts?.hasError) {
        this.set(stage, 'failed')
        this.stopMarker(stage)
        continue
      }

      // .stop() was called without an error => set the stage to completed
      if (nextStage === stage && opts?.isStopping) {
        this.set(stage, 'completed')
        this.stopMarker(stage)
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

      // any stage before the current stage should be marked as skipped if it's still pending
      if (stages.indexOf(stage) < stages.indexOf(nextStage) && this.map.get(stage) === 'pending') {
        this.set(stage, 'skipped')
        continue
      }

      // any stage before the current stage should be as completed (if it hasn't been marked as skipped or failed yet)
      if (stages.indexOf(nextStage) > stages.indexOf(stage)) {
        this.set(stage, 'completed')
        this.stopMarker(stage)
        continue
      }

      // default to pending
      this.set(stage, 'pending')
    }
  }

  public set(stage: string, status: StageStatus): void {
    if (status === 'current') {
      this.current = stage
    }

    this.map.set(stage, status)
  }

  public values(): IterableIterator<StageStatus> {
    return this.map.values()
  }

  private stopMarker(stage: string): void {
    const marker = this.markers.get(stage)
    if (marker && !marker.stopped) {
      marker.stop()
    }
  }
}
