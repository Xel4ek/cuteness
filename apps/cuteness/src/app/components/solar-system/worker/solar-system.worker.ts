const code = `
struct MandelbrotBound {
  canvasSize: vec2f,
  bound: vec2f,
};

struct MandelbrotSettings {
  maxIteration: u32,
}


@vertex
fn vs(
  @builtin(vertex_index)
  vertexIndex : u32
) -> @builtin(position) vec4f {
  let pos = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f(-1.0, 3.0),
    vec2f(3.0, -1.0),
  );

  return vec4f(pos[vertexIndex], 0.0, 1.0);
}

fn mandelbrot(position: vec4f) -> vec4f {
  return vec4f(0.0, 1.0, 0.0, 1.0);
}

@fragment
fn fs(@builtin(position) position: vec4f) -> @location(0) vec4f {
  return mandelbrot(position);
}
`;

abstract class BaseWebGPU {
  public adapter!: GPUAdapter | null;
  public device?: GPUDevice;
  public context?: GPUCanvasContext | null;
  public presentationFormat?: GPUTextureFormat;
  protected offscreenCanvas?: OffscreenCanvas;

  public async init(offscreenCanvas: OffscreenCanvas) {
    this.adapter = await navigator.gpu.requestAdapter();
    this.device = await this.adapter?.requestDevice({
      requiredFeatures: ['timestamp-query'],
    });

    if (!this.device) {
      throw new Error('Need a browser that supports WebGPU');
    }

    this.offscreenCanvas = offscreenCanvas;
    this.context = this.offscreenCanvas.getContext('webgpu') as GPUCanvasContext;
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: this.presentationFormat,
    });
  }
}

class SolarSystem extends BaseWebGPU {
  protected module?: GPUShaderModule;
  protected pipeline?: GPURenderPipeline;
  protected renderPassDescriptor!: GPURenderPassDescriptor & { colorAttachments: [GPURenderPassColorAttachment] };
  private bindGroup?: GPUBindGroup;
  private staticUniformBuffer?: GPUBuffer;
  private uniformValues?: Float32Array;
  private settingsUniformBuffer!: GPUBuffer;
  private settingsUniformValues!: ArrayBuffer;

  public override async init(offscreenCanvas: OffscreenCanvas): Promise<void> {
    await super.init(offscreenCanvas);

    const context = this.context;

    if (!context) {
      throw new Error('Could not create a WebGPU canvas context');
    }

    this.module = this.device?.createShaderModule({
      label: 'our hardcoded red triangle shaders',
      code: code,
    });

    this.pipeline = this.device?.createRenderPipeline({
      label: 'our hardcoded red triangle pipeline',
      layout: 'auto',
      primitive: { topology: 'triangle-strip' },
      vertex: {
        module: this.module!,
      },
      fragment: {
        module: this.module!,
        targets: [{ format: this.presentationFormat! }],
      },
    });

    this.renderPassDescriptor = {
      label: 'our basic canvas renderPass',
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          clearValue: [0.3, 0.3, 0.3, 0.1],
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    };

    this.createUniforms();
  }

  private createUniforms() {
    // const staticUniformBufferSize = 16;
    //
    // this.staticUniformBuffer = this.device.createBuffer({
    //   label: `static uniforms for obj`,
    //   size: staticUniformBufferSize,
    //   usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    // });
    //
    // this.uniformValues = new Float32Array(staticUniformBufferSize / 4);
    //
    // const settingsUniformBufferSize = 4;
    // this.settingsUniformBuffer = this.device.createBuffer({
    //   label: `calc settings`,
    //   size: settingsUniformBufferSize,
    //   usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    // });
    //
    // this.settingsUniformValues = new ArrayBuffer(settingsUniformBufferSize)
    // this.updateSettings(500);
    //
    // this.bindGroup = this.device.createBindGroup({
    //   label: `bind group for obj`,
    //   layout: this.pipeline.getBindGroupLayout(0),
    //   entries: [
    //     { binding: 0, resource: { buffer: this.staticUniformBuffer } },
    //     { binding: 1, resource: { buffer: this.settingsUniformBuffer } },
    //   ],
    // });
  }

  public updateUniforms(_leftBound: number, _rightBound: number, _topBound?: number) {
    // const pixPerDin = (rightBound - leftBound)/this.offscreenCanvas.width;
    // const hPix = -this.offscreenCanvas.height * pixPerDin / 2;
    //
    // this.uniformValues.set([pixPerDin, pixPerDin, leftBound, topBound ?? hPix]);
    // this.device.queue.writeBuffer(this.staticUniformBuffer, 0, this.uniformValues);
  }

  public render() {
    this.renderPassDescriptor.colorAttachments[0]!.view = this.context!.getCurrentTexture().createView();

    const encoder = this.device?.createCommandEncoder({ label: 'our encoder' });

    // создаем render pass encoder для установке нашего шаблона
    const pass = encoder!.beginRenderPass(this.renderPassDescriptor);
    pass.setPipeline(this.pipeline!);
    // pass.setBindGroup(0, this.bindGroup);
    pass.draw(3);
    pass.end();
    // encoder.resolveQuerySet(querySet, 0, querySet.count, resolveBuffer, 0);

    // if (resultBuffer.mapState === 'unmapped') {
    //   encoder.copyBufferToBuffer(resolveBuffer, 0, resultBuffer, 0, resultBuffer.size);
    // }

    const commandBuffer = encoder!.finish();
    this.device?.queue.submit([commandBuffer]);
  }

  public updateSettings(maxIteration: number) {
    const maxIterationBuffer = new Uint32Array(this.settingsUniformValues);
    maxIterationBuffer.set([maxIteration]);
    this.device?.queue.writeBuffer(this.settingsUniformBuffer, 0, this.settingsUniformValues);
  }
}

const solarSystem = new SolarSystem();
const render = solarSystem.render.bind(solarSystem);

export enum WorkerEvent {
  Init = 'init',
  Render = 'render',
  Coordinates = 'coordinates',
  Settings = 'settings',
}

export type SolarSystemWorkerCommand =
  | {
      type: WorkerEvent.Init;
      offscreenCanvas: OffscreenCanvas;
    }
  | {
      type: WorkerEvent.Settings;
      maxIteration: number;
    };

self.onmessage = async ({ data }: MessageEvent<SolarSystemWorkerCommand>) => {
  switch (data.type) {
    case WorkerEvent.Init:
      await solarSystem.init(data.offscreenCanvas);
      // mandelbrot.updateUniforms(-2, 1);
      break;
    case WorkerEvent.Settings:
      // solarSystem.updateSettings(data.maxIteration);
      break;
  }

  requestAnimationFrame(render);
};
