use js_sys::Array;
use crate::block_path::BlockPath;
use crate::graph::{Cell, Graph, Indexes, Path};
use crate::redux::Redux;
use ndarray::Array as NDArray;

pub trait Transform {
  fn transform(&mut self, path: Path) -> Self;
}

impl Transform for Graph {
  fn transform(&mut self, path: Path) -> Self {
    // let row_idx = self.indexes.rows.iter().position(|&r| r == path.row).unwrap();
    // let col_idx = self.indexes.cols.iter().position(|&c| c == path.col).unwrap();
    let size = self.matrix.shape()[0] - 1;
    let iter = self.matrix.iter_mut()
      .map(|cell| {
        if cell.row == path.row && cell.col == path.col {
          cell.value = u32::MAX;
        }

        cell
      })
      .filter(|cell| !(cell.row == path.row || cell.col == path.col))
      .map(|cell| {
        if cell.row == path.col && cell.col == path.row {
          Cell {
            row: cell.row,
            col: cell.col,
            value: u32::MAX
          }
        } else {
          cell.clone()
        }
      });

    // println!("{:?}", size);
    let new_matrix = NDArray::from_iter(iter).into_shape((size, size)).unwrap();
    // println!("{:#?}", new_matrix);
    // println!("--------------------->");

    // let new_rows = self.indexes.rows.iter().enumerate()
    //   .filter(|&(i, _)| i != row_idx)
    //   .map(|(_, &item)| item)
    //   .collect();
    //
    // let new_cols = self.indexes.cols.iter().enumerate()
    //   .filter(|&(i, _)| i != col_idx)
    //   .map(|(_, &item)| item)
    //   .collect();

    let mut new_path = self.path.clone();
    new_path.push(path.clone());

    let mut new_graph = Graph {
      matrix: new_matrix,
      path: new_path,
      lower_bound: self.lower_bound,
    };

    new_graph.redux(None);
    new_graph
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_graph_transform_1() {
    let matrix = vec![
      vec![u32::MAX, 10, 15, 20],
      vec![5, u32::MAX, 9, 10],
      vec![6, 13, u32::MAX, 12],
      vec![8, 8, 9, u32::MAX],
    ];

    let graph = Graph::new(matrix);
    let new_graph = graph.transform(Path { row: 1, col: 2 });

    assert_eq!(new_graph.matrix, vec![
      vec![u32::MAX, 0, 4],
      vec![0, u32::MAX, 0],
      vec![0, 0, u32::MAX],
    ]);
    assert_eq!(new_graph.indexes.rows, vec![0, 2, 3]);
    assert_eq!(new_graph.indexes.cols, vec![0, 1, 3]);
    assert_eq!(new_graph.lower_bound, 36);
  }

  #[test]
  fn test_graph_transform_2() {
    let matrix = vec![
      vec![u32::MAX, 8, 9, 14],
      vec![6, u32::MAX, 7, 8],
      vec![5, 5, u32::MAX, 8],
      vec![7, 6, 7, u32::MAX],
    ];

    let graph = Graph::new(matrix);
    let new_graph = graph.transform(Path { row: 2, col: 1 });

    assert_eq!(new_graph.matrix, vec![
      vec![u32::MAX, 0, 4],
      vec![0, u32::MAX, 0],
      vec![1, 0, u32::MAX],
    ]);
    assert_eq!(new_graph.indexes.rows, vec![0, 1, 3]);
    assert_eq!(new_graph.indexes.cols, vec![0, 2, 3]);
  }
}
