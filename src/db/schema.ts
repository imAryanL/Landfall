// Sets up Landfall's local database and keeps its shape up to date.
//
// This is the app's source of truth — everything the user owns lives in a SQLite file on
// the phone, and the app works with no internet at all. The database file carries its own
// version number, so future changes upgrade an old file in place instead of wiping it.

import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'landfall.db';

// Bump this by one every time a step is added to the ladder below.
const DATABASE_VERSION = 1;

/**
 * Brings a database file up to the current version. Runs once when the app starts.
 * A new phone comes in at version 0 and runs every step; a phone that already ran
 * version 1 skips past it and keeps its data.
 */
export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  // The version number is stored inside the database file, so it travels with the data.
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );

  // A file that has never been touched reports 0.
  let currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  console.log(`[db] upgrading from version ${currentVersion} to ${DATABASE_VERSION}`);

  // --- Step 1 ------------------------------------------------------------------------
  if (currentVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';

      CREATE TABLE household (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT,

        -- These drive the checklist targets, like 1 gallon of water per person per day.
        adults INTEGER NOT NULL DEFAULT 1,
        kids INTEGER NOT NULL DEFAULT 0,
        pets INTEGER NOT NULL DEFAULT 0,
        pet_types TEXT,

        -- SQLite has no true/false type, so a flag is 0 or 1.
        has_medical_needs INTEGER NOT NULL DEFAULT 0,
        medical_notes TEXT,

        home_type TEXT,

        -- Text, not a number: saved as a number, a zip like 01234 would lose its
        -- leading zero and become 1234.
        zip_code TEXT,

        -- Filled in by the National Weather Service, never typed by the user and never
        -- hardcoded by us. One call to /points returns all of these.
        county TEXT,
        nws_zone_id TEXT,
        nws_office TEXT,
        latitude REAL,
        longitude REAL,

        -- ISO strings — SQLite has no date type.
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    currentVersion = 1;
  }

  // --- Future steps go here ----------------------------------------------------------
  //   if (currentVersion === 1) {
  //     await db.execAsync(`CREATE TABLE checklist_items (...);`);
  //     currentVersion = 2;
  //   }

  await db.execAsync(`PRAGMA user_version = ${currentVersion}`);
}
