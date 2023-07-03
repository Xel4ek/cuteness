use crate::graph::{Graph, Path};

pub trait CalculatePenalties {
  fn calculate_penalties(&self) -> (Option<u32>, Path);
}

impl CalculatePenalties for Graph {
  fn calculate_penalties(&self) -> (Option<u32>, Path) {
    let mut max_penalty = 0;
    let mut max_path = None;

    let size = self.matrix.len();
    for i in 0..size {
      for j in 0..size {
        if self.matrix[i][j] == 0 {
          let row_min = self.matrix[i]
            .iter()
            .enumerate()
            .filter(|&(index, _)| index != j)
            .map(|(_, &value)| value)
            .min()
            .unwrap();
          let col_min = self
            .matrix
            .iter()
            .enumerate()
            .filter(|&(index, _)| index != i)
            .map(|(_, row)| row[j])
            .min()
            .unwrap();

          if let Some(penalty) = row_min.checked_add(col_min) {
            if penalty > max_penalty {
              max_penalty = penalty;
              max_path = Some(Path {
                row: self.indexes.rows[i],
                col: self.indexes.cols[j],
              });
            }
          }
        }
      }
    }

    if max_penalty == u32::MAX {
      (None, max_path.unwrap())
    } else {
      (Some(max_penalty), max_path.unwrap())
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::graph::Indexes;

  #[test]
  fn test_calculate_penalties_no_zeroes() {
    let graph = Graph {
      matrix: vec![vec![1, 2, 3], vec![4, 0, 6], vec![7, 8, 9]],
      indexes: Indexes {
        rows: vec![0, 1, 2],
        cols: vec![0, 1, 2],
      },

      path: vec![],
      lower_bound: 0,
    };

    let result = graph.calculate_penalties();

    assert_eq!(result, (Some(6), Path { row: 1, col: 1 }));
  }

  #[test]
  fn test_calculate_penalties_with_zeroes() {
    let graph = Graph {
      matrix: vec![vec![1, 0, 3], vec![4, 0, 6], vec![7, 0, 9]],
      indexes: Indexes {
        rows: vec![0, 1, 2],
        cols: vec![0, 1, 2],
      },
      path: vec![],
      lower_bound: 0,
    };

    let result = graph.calculate_penalties();

    assert_eq!(result, (Some(7), Path { row: 2, col: 1 }));
  }
}
