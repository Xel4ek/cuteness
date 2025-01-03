mod utils;
mod solar;
use wasm_bindgen::prelude::*;

#[cfg(target_arch="wasm32")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

pub use solar::*;

#[cfg_attr(target_arch="wasm32", wasm_bindgen(start))]
fn init() {
  console_log::init_with_level(log::Level::Trace).expect("error initializing log");
  #[cfg(feature = "console_error_panic_hook")]
  console_error_panic_hook::set_once();
}