use crate::graph::{Graph, Path};

pub trait CalculatePenalties {
  fn calculate_penalties(&self) -> (Option<u32>, Path);
}

impl CalculatePenalties for Graph {
  fn calculate_penalties(&self) -> (Option<u32>, Path) {
    let mut max_penalty = 0;
    let mut max_path = Path { row: 0, col: 0 };

    for (index, cell) in self.matrix.indexed_iter() {
      if cell.value == 0 {
        let (i, j) = index;
        let row_min = self.matrix.row(i)
          .iter()
          .enumerate()
          .filter(|&(idx, _)| idx != j)
          .map(|(_, cell)| cell.value)
          .min()
          .unwrap_or(u32::MAX);
        let col_min = self.matrix.column(j)
          .iter()
          .enumerate()
          .filter(|&(idx, _)| idx != i)
          .map(|(_, cell)| cell.value)
          .min()
            .unwrap_or(u32::MAX);

        let penalty = row_min.saturating_add(col_min);
        if penalty > max_penalty {
          max_penalty = penalty;
          max_path = Path {
            row: cell.row,
            col: cell.col,
          };
        }
      }
    }

    if max_penalty == u32::MAX {
      (None, max_path)
    } else {
      (Some(max_penalty), max_path)
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
