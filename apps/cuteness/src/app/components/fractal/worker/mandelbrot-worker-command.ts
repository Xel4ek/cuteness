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
      width: number;
      height: number;
      coordinates: FractalView;
      maxIteration: number;
    };
