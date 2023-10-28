/// <reference lib="webworker" />

import { renderMandelbrot } from 'graph-drawer'
interface WorkerData {
  canvasWidth: number;
  canvasHeight: number;
  fractalY: number;
  fractalX: number;
}

addEventListener('message', ({ data }: {data: WorkerData}) => {
  const response = renderMandelbrot(data.canvasWidth, data.canvasHeight, 1, data.fractalX, data.fractalY);
  postMessage(response);
});

