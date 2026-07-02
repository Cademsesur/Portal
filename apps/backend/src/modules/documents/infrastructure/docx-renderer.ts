import { readFileSync } from 'fs';
import { join } from 'path';
import Docxtemplater from 'docxtemplater';
import ImageModule from 'docxtemplater-image-module-free';
import PizZip from 'pizzip';
import type { RequestDocumentData } from '../domain/request-document.model';

/**
 * Remplit le gabarit du formulaire officiel SESUR (assets/fiche-template.docx)
 * avec les données de la demande → fichier .docx fidèle à la charte, signatures
 * du demandeur et de l'approbateur apposées le cas échéant.
 */
export interface RequestSignatures {
  demandeur?: Buffer | null;
  approbateur?: Buffer | null;
}

// PNG transparent 1×1 — utilisé quand aucune signature n'est définie (invisible).
const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

let templateBuffer: Buffer | null = null;

function loadTemplate(): Buffer {
  if (!templateBuffer) {
    const path = join(__dirname, '..', 'assets', 'fiche-template.docx');
    templateBuffer = readFileSync(path);
  }
  return templateBuffer;
}

/** Dimensions (px) du PNG, lues dans l'en-tête IHDR. */
function pngSizePx(buf: Buffer): [number, number] {
  // Signature PNG : largeur @ octet 16, hauteur @ octet 20 (uint32 big-endian).
  if (buf.length >= 24 && buf.toString('latin1', 1, 4) === 'PNG') {
    return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  }
  return [300, 120];
}

/** Met la signature à l'échelle de la case (max 170×60 px), ratio conservé. */
function signatureSize(buf: Buffer): [number, number] {
  const [w, h] = pngSizePx(buf);
  const maxW = 170;
  const maxH = 60;
  const ratio = Math.min(maxW / w, maxH / h, 1);
  return [Math.round(w * ratio), Math.round(h * ratio)];
}

export function renderRequestDocx(
  data: RequestDocumentData,
  signatures: RequestSignatures = {},
): Buffer {
  // Le module image attend une valeur STRING (un Buffer est interprété comme un
  // objet déjà résolu) → on transmet du base64, décodé dans getImage.
  const renderData = {
    ...data,
    demandeurSig: (signatures.demandeur ?? TRANSPARENT_PNG).toString('base64'),
    approbateurSig: (signatures.approbateur ?? TRANSPARENT_PNG).toString('base64'),
  };

  const imageModule = new ImageModule({
    getImage: (tagValue) => Buffer.from(tagValue as string, 'base64'),
    getSize: (img) => signatureSize(img),
    centered: false,
  });

  const zip = new PizZip(loadTemplate());
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{', end: '}' },
    modules: [imageModule],
  });

  doc.render(renderData);

  return doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  }) as Buffer;
}
