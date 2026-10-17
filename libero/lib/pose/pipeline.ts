/**
 * Ham karelerden rapora tüm saf boru hattı (DOM yok): takip → iskelet → ölçümler → olaylar → rapor.
 * Kareler bir kez çıkarılır; oyuncu seçimi değişirse yalnızca bu fonksiyon yeniden çalıştırılır (hızlıdır).
 */
import { detectEvents } from './events';
import { computeMetrics } from './metrics';
import { buildReport, type Report, type ReportInput } from './report';
import { buildSkeleton } from './skeleton';
import { trackPlayer } from './tracking';
import type { Dims, Metrics, PoseEvent, RawFrame, Seed, Skeleton, Track } from './types';

export interface PipelineResult {
  track: Track;
  skeleton: Skeleton;
  metrics: Metrics;
  events: PoseEvent[];
  report: Report;
}

export function runPipeline(frames: RawFrame[], dims: Dims, fps: number, seeds: Seed[], input: ReportInput): PipelineResult {
  const track = trackPlayer(frames, dims, fps, seeds);
  const skeleton = buildSkeleton(frames, track, dims, fps);
  const metrics = computeMetrics(skeleton);
  const events = detectEvents(skeleton, metrics);
  const report = buildReport(skeleton, metrics, track, events, input);
  return { track, skeleton, metrics, events, report };
}
