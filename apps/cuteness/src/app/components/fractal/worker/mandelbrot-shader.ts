/** Mandelbrot perturbation with extended exponents; equations: mathr.co.uk/web/deep-zoom.html. */
export const mandelbrotShader = /* wgsl */ `
struct Parameters {
  size: vec2u,
  maximum: u32,
  activeCount: u32,
  origin: vec2f,
  pixelStep: f32,
  spanMantissa: f32,
  spanExponent: i32,
  padding: u32,
  batchStart: u32,
  padding2: u32,
}
struct Reference {
  position: vec2f,
  iterations: u32,
  length: u32,
  pixel: u32,
  padding: u32,
}
struct Scaled {
  value: vec2f,
  exponent: i32,
}
@group(0) @binding(0) var<uniform> parameters: Parameters;
@group(0) @binding(1) var<storage, read> orbit: array<vec4f>;
@group(0) @binding(2) var<storage, read> references: array<Reference>;
@group(0) @binding(3) var<storage, read_write> pixels: array<u32>;
@group(0) @binding(4) var<storage, read_write> indices: array<u32>;

fn powerOfTwo(exponent: i32) -> f32 {
  if (exponent < -126) { return 0.0; }
  return bitcast<f32>(u32(exponent + 127) << 23u);
}
fn normalized(value: vec2f, exponent: i32) -> Scaled {
  let magnitude = max(abs(value.x), abs(value.y));
  if (magnitude == 0.0) { return Scaled(vec2f(0.0), 0); }
  let shift = i32((bitcast<u32>(magnitude) >> 23u) & 255u) - 127;
  return Scaled(value * powerOfTwo(-shift), exponent + shift);
}
fn plus(a: Scaled, b: Scaled) -> Scaled {
  if (all(a.value == vec2f(0.0))) { return b; }
  if (all(b.value == vec2f(0.0))) { return a; }
  if (a.exponent - b.exponent > 32) { return a; }
  if (b.exponent - a.exponent > 32) { return b; }
  let exponent = max(a.exponent, b.exponent);
  return normalized(a.value * powerOfTwo(a.exponent - exponent) + b.value * powerOfTwo(b.exponent - exponent), exponent);
}
fn times(a: Scaled, b: Scaled) -> Scaled {
  return normalized(vec2f(a.value.x * b.value.x - a.value.y * b.value.y,
    a.value.x * b.value.y + a.value.y * b.value.x), a.exponent + b.exponent);
}
fn realPart(a: Scaled) -> Scaled { return normalized(vec2f(a.value.x, 0.0), a.exponent); }
fn conjugate(a: Scaled) -> Scaled { return Scaled(vec2f(a.value.x, -a.value.y), a.exponent); }
fn normSquared(a: Scaled) -> Scaled { return normalized(vec2f(dot(a.value, a.value), 0.0), 2 * a.exponent); }
fn scaled(a: Scaled, factor: f32) -> Scaled { return normalized(a.value * factor, a.exponent); }
fn sample(index: u32) -> Scaled {
  let data = orbit[index];
  return Scaled(data.xy, i32(data.z));
}

fn inside(pixel: vec2u) -> bool {
  let c = parameters.origin + (vec2f(pixel) + vec2f(0.5) - vec2f(parameters.size) * 0.5) * parameters.pixelStep;
  let q = dot(vec2f(c.x - 0.25, c.y), vec2f(c.x - 0.25, c.y));
  return q * (q + c.x - 0.25) < 0.25 * c.y * c.y - 1e-5
    || dot(vec2f(c.x + 1.0, c.y), vec2f(c.x + 1.0, c.y)) < 0.0625 - 1e-5;
}

// Store the fractional escape count as float bits in the existing u32 pixel buffer.
// The logarithms run once per escaping pixel.
fn escapeColor(iteration: u32, norm: f32) -> u32 {
  let value = f32(iteration) + 2.0 - log2(log2(max(norm, 4.0)));
  return bitcast<u32>(max(value, 0.0));
}

fn perturbation(pixel: vec2u, reference: Reference) -> u32 {
  if (inside(pixel)) { return bitcast<u32>(f32(parameters.maximum)); }
  let offset = vec2f(pixel) + vec2f(0.5) - reference.position;
  // Delta and dc share one exponent, rescaled only when their mantissas grow.
  // GPU refinement and orbit reuse follow bertbaron/mandelbrot, mandelbrotWebGPU.mjs.
  var dc = offset * (parameters.spanMantissa / f32(parameters.size.x));
  var delta = vec2f(0.0);
  var exponent = parameters.spanExponent;
  for (var n = 0u; n < parameters.maximum; n++) {
    if (n >= reference.length) { return 0x80000000u; }
    let zReference = sample(n * 2u);
    let z = zReference.value * powerOfTwo(zReference.exponent);
    let physicalDelta = delta * powerOfTwo(exponent);
    let total = z + physicalDelta;
    let norm = dot(total, total);
    if (norm < 1e-6 * dot(z, z)) { return 0x80000000u; }
    if (abs(norm - 4.0) < 1e-5) {
      // Keep the sign at deep views around |Z|=2, where z + delta rounds back to z.
      let difference = normalized(delta, exponent);
      let referenceGap = sample(n * 2u + 1u);
      let cross = scaled(realPart(times(zReference, conjugate(difference))), 2.0);
      let squaredDelta = normSquared(difference);
      let gap = plus(plus(referenceGap, cross), squaredDelta);
      if (gap.value.x > 0.0) { return escapeColor(n, norm); }
    } else if (norm > 4.0) {
      return escapeColor(n, norm);
    }
    let multiplier = z + total;
    delta = vec2f(multiplier.x * delta.x - multiplier.y * delta.y,
      multiplier.x * delta.y + multiplier.y * delta.x) + dc;
    let largest = max(abs(delta.x), abs(delta.y));
    if (largest > 2.0) {
      let shift = i32((bitcast<u32>(largest) >> 23u) & 255u) - 127;
      delta *= powerOfTwo(-shift);
      dc *= powerOfTwo(-shift);
      exponent += shift;
    }
  }
  return bitcast<u32>(f32(parameters.maximum));
}

@compute @workgroup_size(64)
fn calculate(@builtin(global_invocation_id) id: vec3u) {
  let slot = parameters.batchStart + id.x;
  if (slot >= parameters.activeCount) { return; }
  let index = indices[slot];
  let pixel = vec2u(index % parameters.size.x, index / parameters.size.x);
  let reference = references[0];
  var result = bitcast<u32>(f32(reference.iterations));
  if (index != reference.pixel) {
    result = perturbation(pixel, reference);
  } else if (reference.iterations < parameters.maximum) {
    let point = sample(reference.iterations * 2u);
    let z = point.value * powerOfTwo(point.exponent);
    result = escapeColor(reference.iterations, dot(z, z));
  }
  if ((result & 0x80000000u) == 0u) {
    pixels[index] = result;
    indices[slot] = 0xffffffffu;
  }
}

@vertex
fn vertex(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
  let positions = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(-1.0, 3.0), vec2f(3.0, -1.0));
  return vec4f(positions[index], 0.0, 1.0);
}
@fragment
fn fragment(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let pixel = vec2u(position.xy);
  let rawValue = pixels[pixel.y * parameters.size.x + pixel.x];
  let invalid = (rawValue & 0x80000000u) != 0u || rawValue == 0u;
  let value = select(bitcast<f32>(rawValue), 0.0, invalid);
  // Derivatives must be evaluated before any per-pixel early return.
  let gradient = vec2f(dpdx(value), dpdy(value));
  if (invalid) { return vec4f(0.01, 0.005, 0.02, 1.0); }
  if (value >= f32(parameters.maximum)) { return vec4f(0.0, 0.0, 0.0, 1.0); }
  let phase = value * 0.025;
  let wave = vec3f(0.5) + 0.5 * sin(vec3f(phase) + vec3f(0.45, 0.15, 0.0));
  let paletteColor = vec3f(0.02, 0.015, 0.06) + vec3f(0.68, 0.55, 0.94) * wave;
  let neonWave = max(sin(phase * 1.5 + 2.0), 0.0);
  let neonColor = mix(vec3f(0.12, 0.85, 1.0), vec3f(0.90, 0.18, 1.0), wave.x);
  let deepSpaceDim = smoothstep(0.0, 200.0, value);
  let color = mix(paletteColor, neonColor, 0.15 * neonWave * neonWave) * deepSpaceDim;
  let variation = abs(gradient.x) + abs(gradient.y);
  let slope = gradient / (2.0 + variation);
  let normal = normalize(vec3f(-2.0 * slope, 1.0));
  let light = max(dot(normal, vec3f(-0.45, -0.55, 0.70)), 0.0);
  let highlight = pow(max(light - 0.75, 0.0), 2.0) * 0.15;
  let contrasted = color * (vec3f(0.65) + 0.35 * color);
  let litColor = contrasted * (0.75 + 0.35 * light) + vec3f(0.65, 0.80, 1.0) * highlight;
  return vec4f(mix(color, litColor, 0.20), 1.0);
}
`;
