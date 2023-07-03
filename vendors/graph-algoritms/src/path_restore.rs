use crate::graph::{Graph, Path};

pub trait PathRestore {
  fn restore_path(&mut self) -> Option<Vec<u16>>;
}

impl PathRestore for Graph {
  fn restore_path(&mut self) -> Option<Vec<u16>> {

    let mut restored_path = Vec::new();
    let cell = &self.matrix[[0, 0]];
    let mut current_path = Path { col: cell.col, row: cell.row };
    if cell.value == u32::MAX {
      return None
    }

    self.lower_bound += cell.value as u64;
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
