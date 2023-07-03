use crate::graph::{Graph, Path};

pub trait BlockPath {
  fn block_path(&mut self, path: &Path);
}

impl BlockPath for Graph {
  fn block_path(&mut self, path: &Path) {
    let row_index = self.indexes.rows.iter().position(|&r| r == path.row);
    let col_index = self.indexes.cols.iter().position(|&c| c == path.col);

    match (row_index, col_index) {
      (Some(row), Some(col)) => {
        self.matrix[row][col] = u32::MAX;
      },
      _ => {}
    }
  }
}
