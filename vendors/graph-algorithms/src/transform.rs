use crate::graph::{Cell, Graph, Path};
use crate::redux::Redux;
use ndarray::Array;

pub trait Transform {
    fn transform(&mut self, path: Path) -> Self;
}

impl Transform for Graph {
    fn transform(&mut self, path: Path) -> Self {
        let size = self.matrix.shape()[0] - 1;
        let mut new_path = self.path.clone();
        new_path.push(path.clone());
        let mut head = path.row;
        let mut tail = path.col;

        while let Some(predecessor) = new_path.iter().find(|edge| edge.col == head) {
            head = predecessor.row;
        }

        while let Some(successor) = new_path.iter().find(|edge| edge.row == tail) {
            tail = successor.col;
        }

        let blocks_subtour = self.matrix.shape()[0] > 2;
        let iter = self
            .matrix
            .iter_mut()
            .map(|cell| {
                if cell.row == path.row && cell.col == path.col {
                    cell.value = u32::MAX;
                }

                cell
            })
            .filter(|cell| !(cell.row == path.row || cell.col == path.col))
            .map(|cell| {
                if blocks_subtour && cell.row == tail && cell.col == head {
                    Cell {
                        row: cell.row,
                        col: cell.col,
                        value: u32::MAX,
                    }
                } else {
                    cell.clone()
                }
            });

        let test = Array::from_iter(iter);
        let new_matrix = test.into_shape_with_order((size, size)).unwrap();

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
    use super::Transform;
    use crate::graph::{Graph, Path};
    use crate::path_restore::PathRestore;

    #[test]
    fn blocks_a_premature_subtour_closure() {
        let mut graph = Graph::new(vec![
            vec![u32::MAX, 1, 100, 100, 100],
            vec![100, u32::MAX, 1, 100, 100],
            vec![1, 100, u32::MAX, 10, 100],
            vec![100, 100, 100, u32::MAX, 1],
            vec![10, 100, 100, 100, u32::MAX],
        ]);

        let graph = graph
            .transform(Path { row: 0, col: 1 })
            .transform(Path { row: 1, col: 2 });
        let closure = graph
            .matrix
            .iter()
            .find(|cell| cell.row == 2 && cell.col == 0)
            .expect("the premature closure is still represented in the reduced graph");

        assert_eq!(closure.value, u32::MAX);
    }

    #[test]
    fn leaves_the_final_hamiltonian_closure_available() {
        let mut graph = Graph::new(vec![
            vec![u32::MAX, 1, u32::MAX, u32::MAX, u32::MAX],
            vec![u32::MAX, u32::MAX, 1, u32::MAX, u32::MAX],
            vec![u32::MAX, u32::MAX, u32::MAX, 1, u32::MAX],
            vec![u32::MAX, u32::MAX, u32::MAX, u32::MAX, 1],
            vec![1, u32::MAX, u32::MAX, u32::MAX, u32::MAX],
        ]);

        let mut graph = graph
            .transform(Path { row: 0, col: 1 })
            .transform(Path { row: 1, col: 2 })
            .transform(Path { row: 2, col: 3 })
            .transform(Path { row: 3, col: 4 });

        assert_eq!(graph.restore_path(), Some(vec![4, 0, 1, 2, 3, 4]));
    }
}
