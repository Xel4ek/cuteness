interface Position {
  x: number;
  y: number;
  z: number;
}

/** Metric MDS: fit screen distances to travel costs, without changing the graph. */
export function layoutByCost(matrix: readonly (readonly number[])[]): Position[] {
  const size = matrix.length;
  // A deterministic spread through a sphere avoids coincident starting points.
  const positions = Array.from({ length: size }, (_, index) => {
    const angle = index * Math.PI * (3 - Math.sqrt(5));
    const z = 1 - (2 * (index + 0.5)) / size;
    const radius = Math.cbrt((index + 0.5) / size);
    const planarRadius = Math.sqrt(1 - z * z) * radius;

    return { x: Math.cos(angle) * planarRadius, y: Math.sin(angle) * planarRadius, z: z * radius };
  });
  const pairs: { from: number; to: number; cost: number }[] = [];
  const degree = new Uint32Array(size);
  let totalCost = 0;

  for (let from = 0; from < size; from++) {
    for (let to = from + 1; to < size; to++) {
      const forward = matrix[from][to];
      const backward = matrix[to][from];
      const costs = [forward, backward].filter((value) => value > 0 && Number.isFinite(value));

      if (costs.length) {
        const cost = Math.min(...costs);
        pairs.push({ from, to, cost });
        totalCost += cost;
        degree[from]++;
        degree[to]++;
      }
    }
  }

  let best = positions;

  if (pairs.length) {
    const meanCost = totalCost / pairs.length;
    const step = 0.5 / Math.max(...degree);
    const alternate = positions.map((_, index) => ({
      x: Math.cos((index * Math.PI * 2) / size),
      y: Math.sin((index * Math.PI * 2) / size),
      z: 0,
    }));
    let bestStress = Infinity;

    // Two fixed starts reduce local-minimum artifacts while keeping redraws reproducible.
    for (const candidate of [positions, alternate]) {
      let previousStress = Infinity;

      for (let iteration = 0; iteration < 200; iteration++) {
        const gradients = Array.from({ length: size }, () => ({ x: 0, y: 0, z: 0 }));
        let stress = 0;

        for (const { from, to, cost } of pairs) {
          const dx = candidate[from].x - candidate[to].x;
          const dy = candidate[from].y - candidate[to].y;
          const dz = candidate[from].z - candidate[to].z;
          const distance = Math.hypot(dx, dy, dz);
          const error = distance - cost / meanCost;
          const force = error / Math.max(distance, 1e-9);
          gradients[from].x += force * dx;
          gradients[from].y += force * dy;
          gradients[from].z += force * dz;
          gradients[to].x -= force * dx;
          gradients[to].y -= force * dy;
          gradients[to].z -= force * dz;
          stress += error * error;
        }

        if (stress < bestStress) {
          bestStress = stress;
          best = candidate.map((position) => ({ ...position }));
        }

        if (iteration > 20 && Math.abs(previousStress - stress) < 1e-6 * previousStress) {
          break;
        }

        previousStress = stress;

        for (let index = 0; index < size; index++) {
          candidate[index].x -= step * gradients[index].x;
          candidate[index].y -= step * gradients[index].y;
          candidate[index].z -= step * gradients[index].z;
        }
      }
    }
  }

  return best;
}
