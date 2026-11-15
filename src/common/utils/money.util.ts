import { Types } from 'mongoose';
export type Decimal128 = Types.Decimal128;
export const toDecimal128 = (value: string | number | Decimal128): Decimal128 => {
  if (value instanceof Types.Decimal128) return value;
  if (typeof value === 'number' && !Number.isInteger(value)) throw new Error('Use string input for non-integer money values.');
  return Types.Decimal128.fromString(String(value));
};
export const decimalToString = (value?: Decimal128 | null): string | undefined => value?.toString();