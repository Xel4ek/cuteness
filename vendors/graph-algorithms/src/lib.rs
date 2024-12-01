mod graph;
mod redux;
mod transform;
mod calculate_penalties;
mod little;
mod path_restore;

use wasm_bindgen::prelude::*;

#[cfg(target_arch = "wasm32")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

pub use little::solve_traveling_salesman_problem_little;

