use crate::graph::{Graph, Path};

pub trait PathRestore {
  fn restore_path(&mut self) -> Option<Vec<u32>>;
}

impl PathRestore for Graph {
  fn restore_path(&mut self) -> Option<Vec<u32>> {

    let mut restored_path = Vec::new();
    let mut current_path = Path { col: self.indexes.cols[0], row: self.indexes.rows[0] };
    restored_path.push(current_path.row);

    while !self.path.is_empty() {
      let position = self.path.iter().position(|path| path.row == current_path.col);

      match position {
        Some(pos) => {
          current_path = self.path.remove(pos);
          restored_path.push(current_path.row);
        },
        None => return None,
      }
    }

    restored_path.push(current_path.col);
    Some(restored_path)
  }
}
