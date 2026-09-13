// The document vault. Photos are copied off the picker's temporary cache into a folder
// this app owns, so the vault survives even if the original camera-roll photo is deleted.

import { Directory, File, Paths } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';

// One document row as the table stores it. photo_uris is JSON — same trick
// household.medical_notes uses for a list in one column, parsed where it's read.
export type DocumentRow = {
  id: number;
  title: string;
  category: string;
  photo_uris: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

// Copies one picker result into the vault folder under a name that can't collide with
// another photo saved the same millisecond, then hands back the permanent path.
async function copyIntoVault(sourceUri: string, index: number) {
  const vaultDir = new Directory(Paths.document, 'vault');
  vaultDir.create({ idempotent: true });

  const extension = sourceUri.split('.').pop() ?? 'jpg';
  const destFile = new File(vaultDir, `${Date.now()}-${index}.${extension}`);

  await new File(sourceUri).copy(destFile);

  return destFile.uri;
}

/**
 * Saves a new document: copies every photo into the vault first, then writes one row
 * pointing at the permanent paths. sourceUris are whatever the picker or camera returned.
 */
export async function saveDocument(
  db: SQLiteDatabase,
  title: string,
  category: string,
  sourceUris: string[]
) {
  const permanentUris = [];
  for (let i = 0; i < sourceUris.length; i++) {
    permanentUris.push(await copyIntoVault(sourceUris[i], i));
  }

  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO documents (title, category, photo_uris, created_at, updated_at)
     VALUES ($title, $category, $photo_uris, $created_at, $updated_at)`,
    {
      $title: title,
      $category: category,
      $photo_uris: JSON.stringify(permanentUris),
      $created_at: now,
      $updated_at: now,
    }
  );
}

/**
 * Every saved document. The screen groups these by category, same as the checklist does.
 */
export async function getDocuments(db: SQLiteDatabase) {
  return db.getAllAsync<DocumentRow>('SELECT * FROM documents ORDER BY id');
}

/**
 * One document, for the detail screen. Null when the id doesn't exist.
 */
export async function getDocument(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<DocumentRow>('SELECT * FROM documents WHERE id = $id', { $id: id });
}

/**
 * Renames a document. Category and photos are untouched — this is just the title field.
 */
export async function updateDocumentTitle(db: SQLiteDatabase, id: number, title: string) {
  await db.runAsync('UPDATE documents SET title = $title, updated_at = $updated_at WHERE id = $id', {
    $title: title,
    $updated_at: new Date().toISOString(),
    $id: id,
  });
}

/**
 * Saves the free-text notes field. Same shape as updateDocumentTitle.
 */
export async function updateDocumentNotes(db: SQLiteDatabase, id: number, notes: string) {
  await db.runAsync('UPDATE documents SET notes = $notes, updated_at = $updated_at WHERE id = $id', {
    $notes: notes,
    $updated_at: new Date().toISOString(),
    $id: id,
  });
}

/**
 * Deletes the row and its photo files. A photo that's already missing is skipped rather
 * than blocking the rest — a stray file shouldn't make a document impossible to remove.
 */
export async function deleteDocument(db: SQLiteDatabase, id: number) {
  const doc = await getDocument(db, id);
  if (doc === null) {
    return;
  }

  const uris: string[] = JSON.parse(doc.photo_uris);
  for (const uri of uris) {
    try {
      new File(uri).delete();
    } catch {
      // Already gone — fine, the row is what actually matters here.
    }
  }

  await db.runAsync('DELETE FROM documents WHERE id = $id', { $id: id });
}
