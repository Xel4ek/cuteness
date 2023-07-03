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
