pub struct MatrixCell {
  row: u16,
  col: u16,
  value: u32,
}

#[derive(Debug, Clone)]
pub struct Matrix {
  data: Box<[MatrixCell]>,
  dim: u16,
}

impl Matrix {

  pub fn min_sum_min(&self) -> Option<(MatrixCell, u32)> {
    self.data.iter().filter_map(|cell| {
      let min_row = self.min_row_except(cell.row, cell.col);
      let min_col = self.min_col_except(cell.col, cell.row);
      match (min_row, min_col) {
        (Some(min_row), Some(min_col)) => {
          let sum = min_row + min_col;
          Some((*cell, sum))
        }
        _ => None,
      }
    }).min_by_key(|&(_, sum)| sum)
  }

  fn min_row_except(&self, row: usize, except_col: usize) -> Option<u32> {
    self.data.iter().filter(|&cell| cell.row == row && cell.col != except_col).map(|cell| cell.value).min()
  }

  fn min_col_except(&self, col: usize, except_row: usize) -> Option<u32> {
    self.data.iter().filter(|&cell| cell.col == col && cell.row != except_row).map(|cell| cell.value).min()
  }

  pub fn remove_row_and_col(&self, removed_row: u16, removed_col: u16) -> Matrix {
    let new_data: Vec<MatrixCell> = self.data.iter()
      .filter_map(|cell| {
        if cell.row != removed_row && cell.col != removed_col {
          Some(cell.clone())
        } else {
          None
        }
      })
      .collect();

    Matrix { data: new_data.into_boxed_slice(), dim: self.dim - 1 }
  }

  pub fn set_value(&mut self, row: u16, col: u16, value: u32) {
    if let Some(cell) = self.data.iter_mut().find(|cell| cell.row == row && cell.col == col) {
      cell.value = value;
    }
  }
}
