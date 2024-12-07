mod calculate_penalties;
mod graph;
mod little;
mod path_restore;
mod redux;
mod transform;

use wasm_bindgen::prelude::*;

#[cfg(target_arch = "wasm32")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

pub use little::solve_traveling_salesman_problem_little;
