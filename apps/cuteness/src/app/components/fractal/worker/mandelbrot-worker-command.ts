import { WorkerEvent } from './worker-event';

export type MandelbrotWorkerCommand =
  | {
      type: WorkerEvent.init;
      offscreenCanvas: OffscreenCanvas;
    }
  | {
      type: WorkerEvent.coordinates;
      coordinates: {
        leftBound: number;
        rightBound: number;
        topBound: number;
      };
    }
  | {
      type: WorkerEvent.settings;
      maxIteration: number;
    };
