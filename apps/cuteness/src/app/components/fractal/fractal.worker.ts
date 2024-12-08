/// <reference lib="webworker" />

interface WorkerData {
  canvasWidth: number;
  canvasHeight: number;
  rightBound: number;
  leftBound: number;
  topBound: number;
}

import('fractal').then(({ renderMandelbrot }) => {
  postMessage({ type: 'READY'});

  self.onmessage = ({ data }: { data: WorkerData }) => {
    console.warn('start', data);
    const start = performance.now();

    postMessage({
      type: 'IMG',
      data: renderMandelbrot(data.canvasWidth, data.canvasHeight, 256, data.leftBound, data.rightBound, data.topBound),
    });

    console.warn('done ', (performance.now() - start).toFixed(2));
  }
})


