use std::cmp::Ordering;
use std::fmt;
use js_sys::Array;
use crate::redux::Redux;
use ndarray::Array2;
use ndarray::Array as NDArray;

#[derive(Debug, Clone, PartialEq)]
pub struct Path {
  pub row: u16,
  pub col: u16,
}

#[derive(Clone, PartialEq)]
pub struct Cell {
  pub row: u16,
  pub col: u16,
  pub value: u32,
}

pub struct Indexes {
  pub rows: Vec<u16>,
  pub cols: Vec<u16>,
}

pub struct Graph {
  pub matrix: Array2<Cell>,
  pub path: Vec<Path>,
  pub lower_bound: u64,
}

impl Graph {
  pub fn new(matrix: Vec<Vec<u32>>) -> Self {
    let size = matrix.len();
    let indexes = Indexes {
      rows: (0..size as u16).collect(),
      cols: (0..size as u16).collect(),
    };

    let data = matrix.into_iter().enumerate()
      .flat_map(|(i, row)| {
        row.into_iter().enumerate().map(move |(j, value)| {
          Cell {
            row: i as u16,
            col: j as u16,
            value,
          }
        })
      });


    let arr = NDArray::from_iter(data).into_shape((size, size)).unwrap();

    let mut graph = Graph {
      matrix: arr,
      path: Vec::new(),
      lower_bound: 0,
    };

    graph.redux(None);
    graph
  }
}

impl PartialEq for Graph {
  fn eq(&self, other: &Self) -> bool {
    self.lower_bound == other.lower_bound
  }
}

impl Eq for Graph {}

impl PartialOrd for Graph {
  fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
    Some(self.cmp(other))
  }
}

impl Ord for Graph {
  fn cmp(&self, other: &Self) -> Ordering {
    other.lower_bound.cmp(&self.lower_bound)
  }
}

impl fmt::Debug for Cell {
  fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
    write!(f, "[{}, {}] {}", self.row, self.col, if self.value == u32::MAX { "∞".to_string() } else { self.value.to_string() })
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_graph_new() {
    let matrix = vec![
      vec![u32::MAX, 1, 2],
      vec![1, u32::MAX, 3],
      vec![2, 3, u32::MAX],
    ];

    let target = vec![
      vec![u32::MAX,  0 ,           0],           // 1
      vec![0,             u32::MAX, 1],           // 1
      vec![0,             1,            u32::MAX], // 2
      //   0              0             1
    ];

    let mut graph = Graph::new(matrix.clone());

    assert_eq!(5, graph.redux(Some(0)));
    assert!(graph.path.is_empty());
    assert_eq!(graph.lower_bound, 5);
  }

  #[test]
  fn test_graph_new_with_empty_matrix() {
    let matrix: Vec<Vec<u32>> = Vec::new();

    let graph = Graph::new(matrix.clone());

    assert!(graph.path.is_empty());
    assert_eq!(graph.lower_bound, 0);
  }
}




impl fmt::Debug for Graph {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    writeln!(f, "Graph {{")?;
    writeln!(f, "  matrix:")?;
    for row in self.matrix.outer_iter() {
      write!(f, "    ")?;
      for cell in row {
        if cell.value == u32::MAX {
          write!(f, "{:<5}", "∞ ")?; // Задайте ширину вместо 5 на подходящее значение
        } else {
          write!(f, "{:<5}", format!("{} ", cell.value))?; // Задайте ширину вместо 5 на подходящее значение
        }
      }
      writeln!(f)?;
    }
    writeln!(f, "  path: {:?},", self.path)?;
    writeln!(f, "  lower_bound: {}", self.lower_bound)?;
    write!(f, "}}")
  }
}

impl fmt::Debug for Indexes {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "Indexes(rows: {:?}, cols: {:?})", self.rows, self.cols)
  }
}
