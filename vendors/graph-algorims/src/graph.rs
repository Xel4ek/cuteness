use std::cmp::Ordering;
use std::fmt;
use crate::redux::Redux;

#[derive(Debug, Clone, PartialEq)]
pub struct Path {
  pub row: u32,
  pub col: u32,
}

pub struct Indexes {
  pub rows: Vec<u32>,
  pub cols: Vec<u32>,
}

pub struct Graph {
  pub matrix: Vec<Vec<u32>>,
  pub indexes: Indexes,
  pub path: Vec<Path>,
  pub lower_bound: u64,
}

impl Graph {
  pub fn new(matrix: Vec<Vec<u32>>) -> Self {
    let size = matrix.len();
    let indexes = Indexes {
      rows: (0..size as u32).collect(),
      cols: (0..size as u32).collect(),
    };
    let mut graph = Graph {
      matrix,
      indexes,
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
    assert_eq!(graph.matrix, target);
    assert_eq!(graph.indexes.rows, vec![0, 1, 2]);
    assert_eq!(graph.indexes.cols, vec![0, 1, 2]);
    assert!(graph.path.is_empty());
    assert_eq!(graph.lower_bound, 5);
  }

  #[test]
  fn test_graph_new_with_empty_matrix() {
    let matrix: Vec<Vec<u32>> = Vec::new();

    let graph = Graph::new(matrix.clone());

    assert_eq!(graph.matrix, matrix);
    assert!(graph.indexes.rows.is_empty());
    assert!(graph.indexes.cols.is_empty());
    assert!(graph.path.is_empty());
    assert_eq!(graph.lower_bound, 0);
  }
}




impl fmt::Debug for Graph {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "Graph {{\n  matrix:\n")?;
    for row in &self.matrix {
      write!(f, "    ")?;
      for &value in row {
        if value == u32::MAX {
          write!(f, "{:<5}", "∞ ")?; // Задайте ширину вместо 5 на подходящее значение
        } else {
          write!(f, "{:<5}", format!("{} ", value))?; // Задайте ширину вместо 5 на подходящее значение
        }
      }
      writeln!(f)?;
    }
    write!(f, "  indexes: {:?},\n", self.indexes)?;
    write!(f, "  path: {:?},\n", self.path)?;
    write!(f, "  lower_bound: {}\n", self.lower_bound)?;
    write!(f, "}}")
  }
}
impl fmt::Debug for Indexes {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "Indexes(rows: {:?}, cols: {:?})", self.rows, self.cols)
  }
}
