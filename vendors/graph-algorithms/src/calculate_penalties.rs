use crate::graph::{Graph, Path};

pub trait CalculatePenalties {
    fn calculate_penalties(&self) -> (Option<u64>, Option<Path>);
}

impl CalculatePenalties for Graph {
    fn calculate_penalties(&self) -> (Option<u64>, Option<Path>) {
        let mut max_penalty = None;
        let mut max_path = None;

        let row_alternatives = (0..self.matrix.nrows())
            .map(|row| two_smallest(self.matrix.row(row).iter().map(|cell| cell.value)))
            .collect::<Vec<_>>();
        let column_alternatives = (0..self.matrix.ncols())
            .map(|column| two_smallest(self.matrix.column(column).iter().map(|cell| cell.value)))
            .collect::<Vec<_>>();

        for (index, cell) in self.matrix.indexed_iter() {
            if cell.value == 0 {
                let (i, j) = index;
                let row_min = row_alternatives[i].1;
                let col_min = column_alternatives[j].1;

                let penalty = row_min.saturating_add(col_min);

                if max_penalty.map_or(true, |p| penalty > p) {
                    max_penalty = Some(penalty);
                    max_path = Some(Path {
                        row: cell.row,
                        col: cell.col,
                    });
                }
            }
        }

        (max_penalty, max_path)
    }
}

fn two_smallest(values: impl Iterator<Item = u32>) -> (u64, u64) {
    let mut first = u64::MAX;
    let mut second = u64::MAX;

    for value in values.filter(|value| *value != u32::MAX).map(u64::from) {
        if value <= first {
            second = first;
            first = value;
        } else if value < second {
            second = value;
        }
    }

    (first, second)
}

#[cfg(test)]
mod tests {
    use crate::calculate_penalties::CalculatePenalties;
    use crate::graph::Graph;

    #[test]
    fn marks_a_forced_edge_with_no_alternative_as_infinite() {
        let graph = Graph::new(vec![
            vec![u32::MAX, 1, u32::MAX],
            vec![u32::MAX, u32::MAX, 1],
            vec![1, u32::MAX, u32::MAX],
        ]);

        let (penalty, path) = graph.calculate_penalties();

        let path = path.expect("the forced zero edge");
        assert_eq!(penalty, Some(u64::MAX));
        assert_eq!(path.row, 0);
        assert_eq!(path.col, 1);
    }

    #[test]
    fn keeps_a_large_finite_penalty_distinct_from_infinity() {
        let graph = Graph::new(vec![
            vec![u32::MAX, 0, 3_000_000_000],
            vec![3_000_000_000, u32::MAX, 0],
            vec![0, 3_000_000_000, u32::MAX],
        ]);

        let (penalty, path) = graph.calculate_penalties();

        assert_eq!(penalty, Some(6_000_000_000));
        assert!(path.is_some());
    }
}
