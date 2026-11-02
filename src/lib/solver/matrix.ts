/** Dense linear solve, A·x = b, by Gaussian elimination with partial pivoting.
 *  Circuits in this app are tens of nodes, not thousands, so dense is fine and
 *  a sparse library would be a dependency we do not need. */

export class SingularMatrixError extends Error {
  constructor(public readonly row: number) {
    super(`Circuit has no unique solution (singular at row ${row})`);
    this.name = 'SingularMatrixError';
  }
}

export function solveLinear(a: number[][], b: number[]): number[] {
  const n = b.length;
  // Work on copies so callers can keep their matrices.
  const m = a.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(m[row][col]) > Math.abs(m[pivot][col])) pivot = row;
    }
    if (Math.abs(m[pivot][col]) < 1e-18) throw new SingularMatrixError(col);
    if (pivot !== col) [m[col], m[pivot]] = [m[pivot], m[col]];

    const d = m[col][col];
    for (let row = col + 1; row < n; row++) {
      const f = m[row][col] / d;
      if (f === 0) continue;
      for (let k = col; k <= n; k++) m[row][k] -= f * m[col][k];
    }
  }

  const x = new Array<number>(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = m[row][n];
    for (let k = row + 1; k < n; k++) sum -= m[row][k] * x[k];
    x[row] = sum / m[row][row];
  }
  return x;
}

export const zeros = (rows: number, cols: number): number[][] =>
  Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
