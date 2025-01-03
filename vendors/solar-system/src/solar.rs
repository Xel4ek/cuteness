use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = foo)]
// pub async fn foo(canvas: web_sys::OffscreenCanvas) {
pub async fn foo(canvas: web_sys::OffscreenCanvas) {
  let instance = wgpu::Instance::new(wgpu::InstanceDescriptor {
    backends: wgpu::Backends::GL,
    ..Default::default()
  });

  // let surface = instance.create_surface(canvas).unwrap();
  // let context = canvas
  //   .get_context("webgl")
  //   .unwrap();
  // let adapter = instance.request_adapter(
  //   &wgpu::RequestAdapterOptions {
  //     power_preference: wgpu::PowerPreference::default(),
  //     compatible_surface: Some(&surface),
  //     force_fallback_adapter: false,
  //   },
  // ).await.unwrap();
}