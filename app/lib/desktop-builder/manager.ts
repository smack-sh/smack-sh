// app/lib/desktop-builder/manager.ts
import { openDB, IDBPDatabase } from 'idb';
import JSZip from 'jszip';
import fileSaver from 'file-saver'; // Assuming file-saver is available

const DB_NAME = 'DesktopAppBuilderDB';
const DB_VERSION = 1;
const STORE_NAME = 'desktop-projects';

export interface DesktopProject {
  id: string;
  name: string;
  templateName: string;
  outputPath: string; // Path where the project was generated
  buildTarget: string; // e.g., 'electron-mac', 'tauri-win'
  createdAt: Date;
  lastBuiltAt?: Date;
  lastDownloadedAt?: Date;
  metadata?: Record<string, any>; // For additional project-specific data
  buildHistory?: { timestamp: Date; status: 'success' | 'failure'; log: string }[];
  // For version control, we might store hashes or commit IDs, or simply rely on the file system
}

let db: IDBPDatabase<unknown>;

export async function initDB() {
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

export async function addProject(project: DesktopProject): Promise<void> {
  if (!db) await initDB();
  await db.add(STORE_NAME, project);
}

export async function getProject(id: string): Promise<DesktopProject | undefined> {
  if (!db) await initDB();
  return db.get(STORE_NAME, id);
}

export async function getAllProjects(): Promise<DesktopProject[]> {
  if (!db) await initDB();
  return db.getAll(STORE_NAME);
}

export async function updateProject(project: DesktopProject): Promise<void> {
  if (!db) await initDB();
  await db.put(STORE_NAME, project);
}

export async function deleteProject(id: string): Promise<void> {
  if (!db) await initDB();
  await db.delete(STORE_NAME, id);
}

export async function exportProjectAsZip(projectId: string): Promise<void> {
  const project = await getProject(projectId);
  if (!project) {
    throw new Error('Project not found.');
  }

  const zip = new JSZip();

  // In a real scenario, you would read the files from `project.outputPath`
  // and add them to the zip. For this placeholder, we'll just add a dummy file.
  zip.file(`${project.name}/README.md`, `This is a placeholder for the exported project: ${project.name}`);

  const content = await zip.generateAsync({ type: 'blob' });
  const { saveAs } = fileSaver as typeof import('file-saver');
  saveAs(content, `${project.name}.zip`);
}
