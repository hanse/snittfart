import * as timestring from './timestring';

const hundreds = (value: string | null | undefined) => {
  if (!value) {
    return 0;
  }

  const number = value.slice(1);

  const digits = number.toString().length;
  return parseInt(number, 10) / 10 ** digits;
};

type Rule = [RegExp, number | ((match: RegExpMatchArray) => number)];

const TIMES: Rule[] = [
  [
    /^([\d\s]+)(\.\d{1,3})?$/,
    (match) => parseInt(match[1], 10) + hundreds(match[2]),
  ],
  [
    /^(\d{1,2}):(\d{1,2})(\.\d{1,3})?$/,
    (match) => {
      return (
        60 * parseInt(match[1], 10) +
        parseInt(match[2], 10) +
        hundreds(match[3])
      );
    },
  ],
  [
    /^(\d{1,2}):(\d{1,2}):(\d{1,2})(\.\d{1,3})?$/,
    (match) => {
      return (
        60 * 60 * parseInt(match[1], 10) +
        60 * parseInt(match[2], 10) +
        parseInt(match[3], 10) +
        hundreds(match[4])
      );
    },
  ],
  [
    /.*/,
    (match) => {
      try {
        return timestring.parse(match[0].replace(/,/g, '.'));
      } catch (error) {
        return 0;
      }
    },
  ],
];

const DISTANCES: Rule[] = [
  [/half[-\s]?marath?on/i, 21098],
  [/marath?on/i, 42195],
  [
    /(\d+(,|.\d+)?)\s*km?/i,
    (match) => {
      return parseFloat(match[1].replace(/,/g, '.')) * 1000;
    },
  ],
  [
    /^(a|(\d+(,|.\d+)?))?\s*miles?$/i,
    (match) => {
      const multiplier =
        match[1] === 'a' || !match[1]
          ? 1
          : parseFloat(match[1].replace(/,/g, '.'));
      return 1609.34 * multiplier;
    },
  ],
];

const parseInput =
  (rules: Rule[], defaultEvaluator: (value: string) => number) =>
  (value: string) => {
    for (const [regex, parsedValue] of rules) {
      const match = value.match(regex);
      if (match) {
        if (typeof parsedValue === 'function') {
          return parsedValue(match);
        }
        return parsedValue;
      }
    }

    return defaultEvaluator(value);
  };

export const parseSeconds = parseInput(TIMES, () => 0);
export const parseMeters = parseInput(
  DISTANCES,
  (value) => parseFloat(value) || 0
);
