/// <reference lib="webworker" />
import { FractalPoint, FractalView, fixedToNumber, pointAt, scaledParts } from '../fractal-viewport';
import { ReferenceOrbit, buildReference, referencesInView } from './mandelbrot-math';
import { mandelbrotShader } from './mandelbrot-shader';
import { MandelbrotWorkerCommand } from './mandelbrot-worker-command';
import { MandelbrotWorkerResult } from './mandelbrot-worker-result';
import { WorkerEvent } from './worker-event';

class Mandelbrot {
  private device!: GPUDevice;
  private context!: GPUCanvasContext;
  private canvas!: OffscreenCanvas;
  private computePipeline!: GPUComputePipeline;
  private displayPipeline!: GPURenderPipeline;
  private computeBindings!: GPUBindGroup;
  private displayBindings!: GPUBindGroup;
  private parameters!: GPUBuffer;
  private orbit!: GPUBuffer;
  private references!: GPUBuffer;
  private pixels!: GPUBuffer;
  private indices!: GPUBuffer;
  private readback!: GPUBuffer;
  private initialIndices!: Uint32Array;
  private cachedReferences: ReferenceOrbit[] = [];

  public async init(canvas: OffscreenCanvas): Promise<void> {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();

    if (!device) {
      throw new Error('This fractal requires a browser with WebGPU support.');
    }

    const context = canvas.getContext('webgpu');

    if (!context) {
      throw new Error('Could not create the WebGPU canvas context.');
    }

    this.device = device;
    this.context = context;
    this.canvas = canvas;
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format, alphaMode: 'opaque' });
    const module = device.createShaderModule({ code: mandelbrotShader });
    this.computePipeline = await device.createComputePipelineAsync({
      layout: 'auto',
      compute: { module, entryPoint: 'calculate' },
    });
    this.displayPipeline = await device.createRenderPipelineAsync({
      layout: 'auto',
      vertex: { module, entryPoint: 'vertex' },
      fragment: { module, entryPoint: 'fragment', targets: [{ format }] },
    });
    this.parameters = this.buffer(48, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    this.references = this.buffer(24, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
    this.allocatePixels();
  }

  public resize(width: number, height: number): void {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.allocatePixels();

      if (this.orbit) {
        this.createBindings();
      }
    }
  }

  private allocatePixels(): void {
    this.pixels?.destroy();
    this.indices?.destroy();
    this.readback?.destroy();
    const { width, height } = this.canvas;
    this.pixels = this.buffer(width * height * 4, GPUBufferUsage.STORAGE);
    this.indices = this.buffer(width * height * 4, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC);
    this.readback = this.buffer(width * height * 4, GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST);
    this.initialIndices = new Uint32Array(width * height);

    for (let index = 0; index < this.initialIndices.length; index++) {
      this.initialIndices[index] = index;
    }
  }

  private buffer(size: number, usage: GPUBufferUsageFlags): GPUBuffer {
    return this.device.createBuffer({ size, usage });
  }

  private allocateOrbit(maximum: number): void {
    if (this.orbit?.size !== (maximum + 1) * 32) {
      this.orbit?.destroy();
      this.orbit = this.buffer((maximum + 1) * 32, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
      this.createBindings();
    }
  }

  private createBindings(): void {
    this.computeBindings = this.device.createBindGroup({
      layout: this.computePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.parameters } },
        { binding: 1, resource: { buffer: this.orbit } },
        { binding: 2, resource: { buffer: this.references } },
        { binding: 3, resource: { buffer: this.pixels } },
        { binding: 4, resource: { buffer: this.indices } },
      ],
    });
    this.displayBindings = this.device.createBindGroup({
      layout: this.displayPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.parameters } },
        { binding: 3, resource: { buffer: this.pixels } },
      ],
    });
  }

  private writeParameters(view: FractalView, maximum: number): void {
    const data = new ArrayBuffer(48);
    const integers = new Uint32Array(data);
    const signed = new Int32Array(data);
    const floats = new Float32Array(data);
    integers.set([this.canvas.width, this.canvas.height, maximum, 0]);
    const [spanMantissa, , spanExponent] = scaledParts(view.span, 0n, view.precision);
    floats.set(
      [fixedToNumber(view.centerRe, view.precision), fixedToNumber(view.centerIm, view.precision), fixedToNumber(view.span, view.precision) / this.canvas.width, spanMantissa],
      4,
    );
    signed[8] = spanExponent;
    this.device.queue.writeBuffer(this.parameters, 0, data);
  }

  private writeReference(reference: ReferenceOrbit, origin: FractalPoint, view: FractalView, pixel: number): void {
    const data = new ArrayBuffer(24);
    const integers = new Uint32Array(data);
    const floats = new Float32Array(data);
    const span = view.span << BigInt(origin.precision - view.precision);
    const width = BigInt(this.canvas.width);
    // Subtract fixed-point coordinates before converting to screen-space floats.
    floats.set([fixedToNumber((((reference.point.re - origin.re) * width) << 32n) / span, 32), fixedToNumber((((reference.point.im - origin.im) * width) << 32n) / span, 32)]);
    integers.set([reference.iterations, reference.length, pixel], 2);
    this.device.queue.writeBuffer(this.references, 0, data);
  }

  private display(): void {
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          loadOp: 'clear',
          storeOp: 'store',
          clearValue: [0, 0, 0, 1],
        },
      ],
    });
    pass.setPipeline(this.displayPipeline);
    pass.setBindGroup(0, this.displayBindings);
    pass.draw(3);
    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }

  private async calculate(active: Uint32Array): Promise<Uint32Array> {
    const count = active.length;
    this.device.queue.writeBuffer(this.indices, 0, active);
    this.device.queue.writeBuffer(this.parameters, 12, new Uint32Array([count]));
    const batchSize = 262144;
    let offset = 0;

    while (offset < count) {
      const size = Math.min(batchSize, count - offset);
      this.device.queue.writeBuffer(this.parameters, 40, new Uint32Array([offset]));
      const encoder = this.device.createCommandEncoder();
      const pass = encoder.beginComputePass();
      pass.setPipeline(this.computePipeline);
      pass.setBindGroup(0, this.computeBindings);
      pass.dispatchWorkgroups(Math.ceil(size / 64));
      pass.end();
      this.device.queue.submit([encoder.finish()]);
      offset += size;

      if (offset < count) {
        await this.device.queue.onSubmittedWorkDone();
      }
    }

    const encoder = this.device.createCommandEncoder();
    encoder.copyBufferToBuffer(this.indices, 0, this.readback, 0, count * 4);
    this.device.queue.submit([encoder.finish()]);
    await this.readback.mapAsync(GPUMapMode.READ);
    const remaining = new Uint32Array(this.readback.getMappedRange(0, count * 4).slice(0));
    this.readback.unmap();

    let unresolved = 0;

    for (let index = 0; index < remaining.length; index++) {
      if (remaining[index] !== 0xffffffff) {
        remaining[unresolved++] = remaining[index];
      }
    }

    return remaining.subarray(0, unresolved);
  }

  public async render(view: FractalView, maximum: number): Promise<MandelbrotWorkerResult> {
    const started = performance.now();
    this.allocateOrbit(maximum);
    const width = this.canvas.width;
    const height = this.canvas.height;
    const origin = pointAt(view, width, height, 0, 0);
    this.cachedReferences = referencesInView(this.cachedReferences, view, width, height, maximum);
    const cached = [...this.cachedReferences];
    let active: Uint32Array = this.initialIndices;
    let referenceCount = 0;
    let referencesBuilt = 0;
    this.writeParameters(view, maximum);

    while (active.length) {
      let reference = cached[referenceCount];
      let referencePixel = 0xffffffff;

      if (!reference) {
        referencePixel = referenceCount === 0 ? Math.floor(height / 2) * width + Math.floor(width / 2) : active[Math.floor(active.length / 2)];
        const point = pointAt(view, width, height, (referencePixel % width) + 0.5, Math.floor(referencePixel / width) + 0.5);
        reference = buildReference(point, maximum);
        this.cachedReferences.push(reference);

        if (this.cachedReferences.length > 16) {
          this.cachedReferences.shift();
        }

        referencesBuilt++;
      }

      this.device.queue.writeBuffer(this.orbit, 0, reference.samples);
      this.writeReference(reference, origin, view, referencePixel);
      active = await this.calculate(active);
      referenceCount++;
    }

    this.display();
    await this.device.queue.onSubmittedWorkDone();
    const image = this.canvas.transferToImageBitmap();

    return {
      type: 'rendered',
      referenceCount,
      referencesBuilt,
      renderTimeMs: performance.now() - started,
      image,
    };
  }
}

const mandelbrot = new Mandelbrot();
// The component sends another request only after receiving the completed frame.
self.onmessage = async ({ data }: MessageEvent<MandelbrotWorkerCommand>) => {
  if (data.type === WorkerEvent.Init) {
    await mandelbrot.init(data.offscreenCanvas);
  } else {
    mandelbrot.resize(data.width, data.height);
  }

  const result = await mandelbrot.render(data.coordinates, data.maxIteration);
  self.postMessage(result, [result.image]);
};
