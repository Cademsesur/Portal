import { execFile } from 'child_process';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Convertit un .docx en PDF via LibreOffice headless : le PDF est ainsi le rendu
 * exact du document Word (même charte, même mise en page).
 *
 * Nécessite `libreoffice`/`soffice` dans le PATH (ou LIBREOFFICE_PATH). En cas
 * d'absence, l'appelant doit gérer l'erreur (l'export Word reste disponible).
 */
const SOFFICE_BIN = process.env.LIBREOFFICE_PATH ?? 'soffice';
const CONVERT_TIMEOUT_MS = 60_000;

export async function renderRequestPdf(docx: Buffer): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), 'sesur-doc-'));
  const inputPath = join(dir, 'fiche.docx');
  const outputPath = join(dir, 'fiche.pdf');

  try {
    await writeFile(inputPath, docx);
    await runSoffice(dir, inputPath);
    return await readFile(outputPath);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

function runSoffice(dir: string, inputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      SOFFICE_BIN,
      [
        '--headless',
        '--nologo',
        '--nofirststartwizard',
        // Profil isolé par appel → conversions concurrentes possibles.
        `-env:UserInstallation=file://${join(dir, 'profile')}`,
        '--convert-to',
        'pdf',
        '--outdir',
        dir,
        inputPath,
      ],
      { timeout: CONVERT_TIMEOUT_MS },
      (error, _stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              `Conversion PDF (LibreOffice) échouée: ${error.message}${
                stderr ? ` — ${stderr}` : ''
              }`,
            ),
          );
          return;
        }
        resolve();
      },
    );
  });
}
