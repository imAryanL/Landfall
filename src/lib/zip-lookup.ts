// Turns a five-digit ZIP code into map coordinates, using a table bundled in the app.
// NWS only accepts lat/lon, and doing it locally means it works with no signal.

export type Coordinates = {
  lat: number;
  lon: number;
};

type ZipTable = Record<string, [number, number]>;

let loadedTable: ZipTable | null = null;

function getTable(): ZipTable {
  // require() in here rather than a top-level import, so the 824 KB file is only read
  // when someone actually looks up a ZIP — not on every launch.
  if (loadedTable === null) {
    loadedTable = require("./zip-coords.json") as ZipTable;
  }

  return loadedTable;
}

export function lookupZip(zip: string): Coordinates | null {
  const cleaned = zip.trim();

  // Checked first so a half-typed ZIP never triggers the file read.
  if (cleaned.length !== 5) {
    return null;
  }

  const table = getTable();
  const entry = table[cleaned];

  if (entry === undefined) {
    return null;
  }

  return { lat: entry[0], lon: entry[1] };
}
