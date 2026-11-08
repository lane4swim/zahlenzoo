import type { Hint, MathInfo, TextParams } from '../types/task';

/** Rechenweg einer Addition als Sprünge auf dem Rechenstrich. */
export type Strategy = { id: string; start: number; jumps: number[] };

const tens = (n: number) => Math.floor(n / 10) * 10;
const ones = (n: number) => n % 10;

/**
 * Wählt die Strategie zu einer Addition a + b = c (Hinweise zeigen Zerlegen,
 * nie Weiterzählen in Einzelschritten).
 */
export function additionStrategy(m: MathInfo): Strategy {
  const { a, b } = m;
  if (m.missing === 'b') {
    // Ergänzen: erst zum nächsten Zehner, dann in Zehnern, dann die Einer.
    const jumps: number[] = [];
    let pos = a;
    const toTen = ones(pos) === 0 ? 0 : 10 - ones(pos);
    if (toTen > 0 && pos + toTen <= m.result) {
      jumps.push(toTen);
      pos += toTen;
    }
    const tensPart = tens(m.result - pos);
    if (tensPart > 0) {
      jumps.push(tensPart);
      pos += tensPart;
    }
    if (m.result - pos > 0) jumps.push(m.result - pos);
    const tensOnly = ones(a) === 0 && ones(m.result) === 0;
    return { id: tensOnly ? 'add_complement_tens' : 'add_complement', start: a, jumps };
  }
  if (b < 10) {
    if (!m.carry) return { id: 'add_ones', start: a, jumps: [b] };
    const toTen = 10 - ones(a);
    return { id: 'add_bridge', start: a, jumps: [toTen, b - toTen].filter((j) => j > 0) };
  }
  if (ones(a) === 0 && ones(b) === 0) return { id: 'add_tens', start: a, jumps: [b] };
  const jumps = ones(b) === 0 ? [b] : [tens(b), ones(b)];
  return { id: 'add_stepwise', start: a, jumps };
}

/** Zwischenschritte als Gleichungen, z. B. "47 + 20 = 67; 67 + 6 = 73" oder "43 − 3 = 40". */
export function stepsText(strategy: Strategy): string {
  const parts: string[] = [];
  let pos = strategy.start;
  for (const jump of strategy.jumps) {
    parts.push(jump < 0 ? `${pos} − ${-jump} = ${pos + jump}` : `${pos} + ${jump} = ${pos + jump}`);
    pos += jump;
  }
  return parts.join('; ');
}

/**
 * Strategie zu einer Subtraktion a − b = c: rückwärts in Schritten, erst bis zum
 * Zehner bzw. erst die Zehner. Beim Ergänzen (a − ? = c) von c vorwärts bis a.
 */
export function subtractionStrategy(m: MathInfo): Strategy {
  const { a, b } = m;
  if (m.missing === 'b') {
    const forward = additionStrategy({ ...m, op: '+', a: m.result, b: a - m.result, result: a });
    return { id: 'sub_complement', start: m.result, jumps: forward.jumps };
  }
  if (b < 10) {
    if (ones(a) >= b) return { id: 'sub_ones', start: a, jumps: [-b] };
    return { id: 'sub_bridge', start: a, jumps: [-ones(a), -(b - ones(a))].filter((j) => j < 0) };
  }
  if (ones(a) === 0 && ones(b) === 0) return { id: 'sub_tens', start: a, jumps: [-b] };
  const jumps = ones(b) === 0 ? [-b] : [-tens(b), -ones(b)];
  return { id: 'sub_stepwise', start: a, jumps };
}

/** Die drei Hilfestufen zu einer Subtraktion. */
export function subtractionHints(m: MathInfo): [Hint, Hint, Hint] {
  const strategy = subtractionStrategy(m);
  const params: TextParams = {
    a: m.a,
    b: m.b,
    result: m.result,
    aOnes: ones(m.a),
    aTens: tens(m.a),
    aTensDigit: Math.floor(m.a / 10),
    bTensDigit: Math.floor(m.b / 10),
    bTens: tens(m.b),
    bOnes: ones(m.b),
  };
  return [
    { key: `hint.${strategy.id}.1`, params },
    {
      key: 'hint.jumps.2',
      params,
      visual: { type: 'jumps', start: strategy.start, jumps: strategy.jumps, hideResults: true },
    },
    {
      key: m.missing === 'b' ? 'hint.sub_complement.3' : 'hint.steps.3',
      params: { ...params, steps: stepsText(strategy) },
      visual: { type: 'jumps', start: strategy.start, jumps: strategy.jumps },
    },
  ];
}

/** Die drei Hilfestufen zu einer Addition. */
export function additionHints(m: MathInfo): [Hint, Hint, Hint] {
  const strategy = additionStrategy(m);
  const params: TextParams = {
    a: m.a,
    b: m.b,
    result: m.result,
    aOnes: ones(m.a),
    aTens: tens(m.a),
    bOnes: ones(m.b),
    bTens: tens(m.b),
    aTensDigit: Math.floor(m.a / 10),
    bTensDigit: Math.floor(m.b / 10),
    toTen: ones(m.a) === 0 ? 0 : 10 - ones(m.a),
    nextTen: tens(m.a) + 10,
  };
  return [
    { key: `hint.${strategy.id}.1`, params },
    {
      key: 'hint.jumps.2',
      params,
      visual: { type: 'jumps', start: strategy.start, jumps: strategy.jumps, hideResults: true },
    },
    {
      key: m.missing === 'b' ? 'hint.complement.3' : 'hint.steps.3',
      params: { ...params, steps: stepsText(strategy) },
      visual: { type: 'jumps', start: strategy.start, jumps: strategy.jumps },
    },
  ];
}
