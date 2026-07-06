import { v4 as uuidv4 } from 'uuid';

/** Generate a unique ID (UUID v4). */
export function generateID(): string {
  return uuidv4();
}
