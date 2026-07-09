/** Deep clone a JSON-serializable value. */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/** Check whether a plain object has no own keys. */
export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}
