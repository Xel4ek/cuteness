use crate::graph::{Cell, Graph};
use ndarray::Array2;

pub trait Redux {
    fn redux(&mut self, penalty: Option<u64>) -> u64;
}

impl Redux for Graph {
    fn redux(&mut self, penalty: Option<u64>) -> u64 {
        self.lower_bound = self.lower_bound.saturating_add(self.matrix.redux(penalty));
        self.lower_bound
    }
}

impl Redux for Array2<Cell> {
    fn redux(&mut self, penalty: Option<u64>) -> u64 {
        let size = self.dim().0;
        let mut lower_bound = 0u64;

        for i in 0..size {
            let min_row = self
                .row(i)
                .iter()
                .filter(|cell| cell.value != u32::MAX)
                .min_by_key(|cell| cell.value)
                .map(|cell| cell.value as u64);

            let Some(min_row) = min_row else {
                return u64::MAX;
            };

            for cell in self.row_mut(i) {
                if cell.value != u32::MAX {
                    cell.value -= min_row as u32;
                }
            }

            lower_bound = lower_bound.saturating_add(min_row);
        }

        for j in 0..size {
            let min_col = self
                .column(j)
                .iter()
                .filter(|cell| cell.value != u32::MAX)
                .min_by_key(|cell| cell.value)
                .map(|cell| cell.value as u64);

            let Some(min_col) = min_col else {
                return u64::MAX;
            };

            for cell in self.column_mut(j) {
                if cell.value != u32::MAX {
                    cell.value -= min_col as u32;
                }
            }

            lower_bound = lower_bound.saturating_add(min_col);
        }

        match penalty {
            Some(p) => p,
            None => lower_bound,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::graph::Graph;

    #[test]
    fn redux_reduces_an_ndarray_matrix_without_changing_absent_edges() {
        let mut graph = Graph::new(vec![
            vec![u32::MAX, 4, 5],
            vec![6, u32::MAX, 8],
            vec![9, 10, u32::MAX],
        ]);
        let result = graph.matrix.redux(None);

        assert_eq!(result, 0);
        assert_eq!(graph.matrix[[0, 0]].value, u32::MAX);
        assert_eq!(graph.matrix[[0, 1]].value, 0);
        assert_eq!(graph.matrix[[0, 2]].value, 0);
        assert_eq!(graph.matrix[[1, 0]].value, 0);
        assert_eq!(graph.matrix[[1, 2]].value, 1);
        assert_eq!(graph.matrix[[2, 0]].value, 0);
        assert_eq!(graph.matrix[[2, 1]].value, 1);
    }

    #[test]
    fn redux_keeps_an_explicit_penalty_as_its_return_value() {
        let mut graph = Graph::new(vec![
            vec![u32::MAX, 4, 5],
            vec![6, u32::MAX, 8],
            vec![9, 10, u32::MAX],
        ]);

        assert_eq!(graph.matrix.redux(Some(10)), 10);
    }
}
