use crate::graph::{Cell, Graph};
use ndarray::Array2;

pub trait Redux {
  fn redux(&mut self, penalty: Option<u64>) -> u64;
}

impl Redux for Graph {
  fn redux(&mut self, penalty: Option<u64>) -> u64 {
    self.lower_bound += self.matrix.redux(penalty);
    self.lower_bound
  }
}

impl Redux for Array2<Cell> {
  fn redux(&mut self, penalty: Option<u64>) -> u64 {
    let size = self.dim().0;
    let mut lower_bound: u32 = 0;

    // Subtract min from each row
    for i in 0..size {
      let min_row = self.row(i).iter()
        .filter(|cell| cell.value != u32::MAX)
        .min_by_key(|cell| cell.value)
        .map(|cell| cell.value)
        .unwrap_or(0);

      for cell in self.row_mut(i) {
        if cell.value != u32::MAX {
          cell.value -= min_row;
        }
      }

      lower_bound += min_row;
    }

    // Subtract min from each column
    for j in 0..size {
      let min_col = self.column(j).iter()
        .filter(|cell| cell.value != u32::MAX)
        .min_by_key(|cell| cell.value)
        .map(|cell| cell.value)
        .unwrap_or(0);

      for cell in self.column_mut(j) {
        if cell.value != u32::MAX {
          cell.value -= min_col;
        }
      }

      lower_bound += min_col;
    }

    match penalty {
      Some(p) => p,
      None => lower_bound as u64,
    }
  }
}



#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_redux_on_matrix() {
    let mut matrix = vec![
      vec![u32::MAX, 4, 5],
      vec![6, u32::MAX, 8],
      vec![9, 10, u32::MAX],
    ];
    let penalty = Some(10);
    let result = matrix.redux(penalty);

    assert_eq!(result, penalty.unwrap());

    let mut matrix = vec![
      vec![u32::MAX, 1, 2],
      vec![1, u32::MAX, 3],
      vec![2, 3, u32::MAX],
    ];

    let penalty = Some(5);
    let result = matrix.redux(penalty);

    assert_eq!(result, penalty.unwrap());

    let mut matrix = vec![
      vec![u32::MAX, 4, 5],
      vec![6, u32::MAX, 8],
      vec![9, 10, u32::MAX],
    ];
    let result = matrix.redux(None);


    assert_eq!(matrix, vec![
      vec![u32::MAX, 0, 0],
      vec![0, u32::MAX, 1],
      vec![0, 1, u32::MAX],
    ]);

     assert_eq!(result, 20);
  }
}
