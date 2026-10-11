use crate::calculate_penalties::CalculatePenalties;
use crate::graph::Graph;
use crate::path_restore::PathRestore;
use crate::redux::Redux;
use crate::transform::Transform;
use std::collections::BinaryHeap;
use wasm_bindgen::prelude::*;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct Matrix {
    data: Vec<Vec<u32>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TsmResult {
    pub path: Vec<u16>,
    pub distance: u64,
    pub steps: u64,
}

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
        }
        Err(error) => {
            let error_response = serde_json::json!({
              "error": format!("Failed to parse input JSON: {}", error)
            });
            return error_response.to_string();
        }
    };

    let res = solve_traveling_salesman_problem_little(matrix.data);
    match &res {
        Some(tsm_result) => match serde_json::to_string(tsm_result) {
            Ok(json) => json,
            Err(e) => {
                let error_response = serde_json::json!({
                  "error": format!("Failed to serialize TsmResult: {}", e)
                });
                return error_response.to_string();
            }
        },
        None => {
            let error_response = serde_json::json!({
              "error": "No TSM result"
            });
            return error_response.to_string();
        }
    }
}

pub fn solve_traveling_salesman_problem_little(matrix: Vec<Vec<u32>>) -> Option<TsmResult> {
    if matrix.len() < 2 {
        return None;
    }

    let mut steps = 0;
    let mut queue = BinaryHeap::new();
    queue.push(Graph::new(matrix));

    while let Some(mut graph) = queue.pop() {
        if graph.lower_bound == u64::MAX {
            continue;
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

        if let Some(position) = max_penalty_pos {
            queue.push(graph.transform(position));
        }

        if let Some(penalty) = penalty_option {
            if penalty != u64::MAX {
                graph.redux(Some(penalty));
                if graph.lower_bound != u64::MAX {
                    queue.push(graph);
                }
            }
        }

        steps += 1;
    }

    None
}

#[cfg(test)]
mod tests {
    use super::solve_traveling_salesman_problem_little;

    fn assert_hamiltonian_cycle(matrix: &[Vec<u32>], path: &[u16], expected_distance: u64) {
        assert_eq!(path.len(), matrix.len() + 1);
        assert_eq!(path.first(), path.last());

        let mut unique_vertices = path[..path.len() - 1].to_vec();
        unique_vertices.sort_unstable();
        unique_vertices.dedup();
        assert_eq!(unique_vertices.len(), matrix.len());

        let distance = path
            .windows(2)
            .map(|edge| matrix[edge[0] as usize][edge[1] as usize] as u64)
            .sum::<u64>();
        assert_eq!(distance, expected_distance);
    }

    #[test]
    fn solves_a_closed_two_city_cycle() {
        let matrix = vec![vec![u32::MAX, 7], vec![11, u32::MAX]];

        let result =
            solve_traveling_salesman_problem_little(matrix.clone()).expect("a two-city cycle");

        assert_eq!(result.distance, 18);
        assert_hamiltonian_cycle(&matrix, &result.path, 18);
    }

    #[test]
    fn returns_none_when_no_hamiltonian_cycle_exists() {
        let matrix = vec![
            vec![u32::MAX, 4, u32::MAX],
            vec![4, u32::MAX, u32::MAX],
            vec![u32::MAX, u32::MAX, u32::MAX],
        ];

        assert!(solve_traveling_salesman_problem_little(matrix).is_none());
    }

    #[test]
    fn does_not_treat_the_absence_sentinel_as_an_edge() {
        let matrix = vec![
            vec![u32::MAX, 1, u32::MAX],
            vec![u32::MAX, u32::MAX, 1],
            vec![u32::MAX, u32::MAX, u32::MAX],
        ];

        assert!(solve_traveling_salesman_problem_little(matrix).is_none());
    }

    #[test]
    fn supports_distances_above_u32_max() {
        let matrix = vec![
            vec![u32::MAX, 2_000_000_000, 2_000_000_001],
            vec![2_000_000_001, u32::MAX, 2_000_000_000],
            vec![2_000_000_000, 2_000_000_001, u32::MAX],
        ];

        let result =
            solve_traveling_salesman_problem_little(matrix.clone()).expect("a finite cycle");

        assert_eq!(result.distance, 6_000_000_000);
        assert_hamiltonian_cycle(&matrix, &result.path, 6_000_000_000);
    }

    #[test]
    fn accepts_a_cycle_whose_total_distance_is_exactly_u32_max() {
        let edge = u32::MAX / 3;
        let matrix = vec![
            vec![u32::MAX, edge, edge + 1],
            vec![edge + 1, u32::MAX, edge],
            vec![edge, edge + 1, u32::MAX],
        ];

        let result =
            solve_traveling_salesman_problem_little(matrix.clone()).expect("a finite cycle");

        assert_eq!(result.distance, u32::MAX as u64);
        assert_hamiltonian_cycle(&matrix, &result.path, u32::MAX as u64);
    }

    #[test]
    fn returns_none_for_an_empty_matrix() {
        assert!(solve_traveling_salesman_problem_little(Vec::new()).is_none());
    }
}
