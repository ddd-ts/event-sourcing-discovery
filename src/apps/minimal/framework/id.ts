export interface Id { toString(): string }

export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}
