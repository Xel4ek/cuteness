use ndarray::Array;
use crate::graph::{Cell, Graph, Path};
use crate::redux::Redux;


pub trait Transform {
  fn transform(&mut self, path: Path) -> Self;
}

impl Transform for Graph {
  fn transform(&mut self, path: Path) -> Self {
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

    let new_matrix = Array::from_iter(iter).into_shape((size, size)).unwrap();

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
