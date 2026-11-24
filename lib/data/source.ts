import "server-only";
import type { Property } from "../types";
import { sampleProperties } from "./sample";

/**
 * THE ONE PLACE DATA COMES FROM.
 * Swap this for the real county feed (database, Google Sheet sync, etc.).
 * Return every record; non-compliant files are filtered out in queries.ts.
 */
export function loadAllProperties(): Property[] {
  return sampleProperties();
}
