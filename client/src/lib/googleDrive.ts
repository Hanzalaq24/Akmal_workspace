// Google Drive - Simple shared folder (no API key needed)
// Just stores the shared Drive folder link and opens it

const FOLDER_LINK_KEY = "akmal-drive-folder-link";

export function setDriveFolderLink(link: string) {
  localStorage.setItem(FOLDER_LINK_KEY, link.trim());
}

export function getDriveFolderLink(): string {
  return localStorage.getItem(FOLDER_LINK_KEY) || "";
}

export function isDriveConfigured(): boolean {
  return !!getDriveFolderLink();
}

export function clearDriveConfig() {
  localStorage.removeItem(FOLDER_LINK_KEY);
}

export function getDriveUploadLink(): string {
  return getDriveFolderLink();
}

export function getDriveFolderId(): string {
  const link = getDriveFolderLink();
  const match = link.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : "";
}

// No API needed - just returns empty, UI uses folder link
export async function listDriveFiles(): Promise<any[]> {
  return [];
}
