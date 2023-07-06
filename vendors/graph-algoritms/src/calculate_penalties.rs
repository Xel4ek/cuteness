use crate::graph::{Graph, Path};

pub trait CalculatePenalties {
  fn calculate_penalties(&self) -> (Option<u32>, Option<Path>);
}

impl CalculatePenalties for Graph {
  fn calculate_penalties(&self) -> (Option<u32>, Option<Path>) {
    let mut max_penalty = None;
    let mut max_path = None;

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

        if max_penalty.map_or(true, |p| penalty > p) {
          max_penalty = Some(penalty);
          max_path = Some(Path {
            row: cell.row,
            col: cell.col,
          });
        }
      }
    }

    (max_penalty, max_path)
  }
}
