# travelling-salesman-problem

This library was generated with [Nx](https://nx.dev).

## Running unit tests

Run `bun nx test travelling-salesman-problem` to execute the unit tests via Vitest.

The Little solver tests compare optimal tour costs with an independent exhaustive search on deterministic small graphs, including missing edges and tied weights. Regression cases cover two-city tours and premature subtours.

## Ant colony solver

`GraphAlgorithms.solveTravelingSalesmanProblemACO` is a heuristic for directed graphs with finite positive edge weights; zero means that an edge is absent. It returns the best closed Hamiltonian cycle found with its actual distance, or `null` when the search finds none. Neither optimality nor infeasibility is proved.

Transition weights use pheromone and inverse distance. Only complete valid tours deposit pheromone on their directed edges, including the closing edge. The search uses at most 100 ants per iteration and stops after 30 consecutive iterations without a strict improvement, or 300 total iterations. This stagnation limit also applies before any valid tour is found. `paths` counts attempted ant tours, including attempts that reach a dead end.

Seeded tests check closed tours, sparse cycles, dead ends, missing incoming/outgoing edges, bounded termination on disconnected cycles, and input immutability.

## Genetic solver

`GraphAlgorithms.solveTravelingSalesmanProblemGA` is a heuristic for directed graphs; a zero weight means that an edge is absent. It returns a closed Hamiltonian cycle with its actual distance, or `null` if the search finds none. A `null` result does not prove that no cycle exists, and a returned cycle is not guaranteed to be optimal.

The solver preserves the best candidate across generations, caches candidate scores, and ranks incomplete tours by missing edges before comparing costs. Random initial tours are supplemented with up to eight greedy tours. Independent tournament selection and linear order crossover generate new candidates, with elite tours retained. The search stops after 100 consecutive generations without improvement or the generation budget of `floor(100_000 / vertexCount)`, whichever comes first. Every strict improvement resets the stagnation counter. `paths` counts evaluated candidates, including the initial population, without recounting cached elites.

Seeded regression tests cover best-tour retention, improvements after a short plateau, sparse directed cycles, tiny inputs, bounded termination, route validity, and input immutability. They do not require the heuristic to match the exact optimum on arbitrary graphs.

The application's Genetic method supports graphs of up to 100 vertices.
