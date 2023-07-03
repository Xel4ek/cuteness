use std::collections::BinaryHeap;
use crate::calculate_penalties::CalculatePenalties;
use crate::graph::{Graph};
use crate::path_restore::PathRestore;
use crate::redux::Redux;
use crate::transform::Transform;

use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
#[derive(Debug)]
pub struct Matrix {
  data: Vec<Vec<u32>>,
}


#[derive(Debug)]
#[derive(Serialize, Deserialize)]
pub struct TsmResult {
  pub path: Vec<u16>,
  pub distance: u64,
  pub steps: u64,
}

use wasm_bindgen::prelude::*;


#[wasm_bindgen]
extern "C" {
  #[wasm_bindgen(js_namespace = console)]
  fn log(s: &str);

}

#[allow(unused_macros)]
macro_rules! log {
    ($($t:tt)*) => (log(&format!("{:#?}", $($t)*)))
}


#[wasm_bindgen]
extern "C" {
  fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet(name: &str) {
  alert(&format!("Hello, {}!", name));
}


#[wasm_bindgen]
pub fn solve_traveling_salesman_problem_little_js(data: &str) -> String {
  let result = serde_json::from_str::<Matrix>(data);
  let matrix = match result {
    Ok(mut matrix) => {
      for row in &mut matrix.data {
        for value in row {
          if *value == 0 {
            *value = u32::MAX;
          }
        }
      }
      matrix
    },
    Err(error) => {
      let error_response = serde_json::json!({
        "error": format!("Failed to parse input JSON: {}", error)
      });
      return error_response.to_string();
    },
  };

  let res = solve_traveling_salesman_problem_little(matrix.data);
  match &res {
    Some(tsm_result) => {
      match serde_json::to_string(tsm_result) {
        Ok(json) => json,
        Err(e) => {
          let error_response = serde_json::json!({
            "error": format!("Failed to serialize TsmResult: {}", e)
          });
          return error_response.to_string();
        },
      }
    }
    None => {
      let error_response = serde_json::json!({
        "error": "No TSM result"
      });
      return error_response.to_string();
    },
  }
}

pub fn solve_traveling_salesman_problem_little(matrix: Vec<Vec<u32>>) -> Option<TsmResult> {

  let mut steps = 0;
  let mut queue = BinaryHeap::new();
  queue.push(Graph::new(matrix));

  while let Some(mut graph) = queue.pop() {

    if graph.lower_bound == u32::MAX as u64 {
      return None;
    }

    if graph.matrix.len() == 1 {
      if let Some(path) = graph.restore_path() {
        return Some(TsmResult {
          path,
          distance: graph.lower_bound,
          steps,
        });
      }
      continue;
    }

    let (penalty_option, max_penalty_pos) = graph.calculate_penalties();

    queue.push(graph.transform(max_penalty_pos));

    if let Some(penalty) = penalty_option {
      graph.redux(Some(penalty as u64));
      queue.push(graph);
    }

    steps += 1;
  }

  None
}

#[cfg(test)]
mod tests {
  use std::result;
  use super::*;

  // #[test]
  // fn test_graph_new() {
  //   let result = solve_traveling_salesman_problem_little(vec![
  //     vec![u32::MAX, 20, 18, 12, 8],
  //     vec![5, u32::MAX, 14, 7, 11],
  //     vec![12, 18, u32::MAX, 6, 11],
  //     vec![11, 17, 11, u32::MAX, 12],
  //     vec![5, 5, 5, 5, u32::MAX],
  //   ]);
  //
  //   println!("{:?}", result);
  //   assert_eq!(1,2);
  // }
}
