import { WorkerEvent } from './worker-event';
import { FractalView } from '../fractal-viewport';

export type MandelbrotWorkerCommand =
  | {
      type: WorkerEvent.init;
      offscreenCanvas: OffscreenCanvas;
      coordinates: FractalView;
      maxIteration: number;
    }
  | {
      type: WorkerEvent.render;
      coordinates: FractalView;
      maxIteration: number;
    };
