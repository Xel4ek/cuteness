import { FractalView } from '../fractal-viewport';
import { WorkerEvent } from './worker-event';

export type MandelbrotWorkerCommand =
  | {
      type: WorkerEvent.Init;
      offscreenCanvas: OffscreenCanvas;
      coordinates: FractalView;
      maxIteration: number;
    }
  | {
      type: WorkerEvent.Render;
      width: number;
      height: number;
      coordinates: FractalView;
      maxIteration: number;
    };
