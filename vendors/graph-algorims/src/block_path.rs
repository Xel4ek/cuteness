use crate::graph::{Graph, Path};

pub trait BlockPath {
  fn block_path(&mut self, path: &Path);
}

impl BlockPath for Graph {
  fn block_path(&mut self, path: &Path) {
    for cell in self.matrix.iter_mut() {
      if cell.row == path.row && cell.col == path.col {
        cell.value = u32::MAX;
        break;
      }
    }
  }
}
