/**
 * Construit le gabarit docxtemplater à partir du formulaire officiel SESUR
 * (apps/frontend/public/docs/FICHE DE DEMANDE D'ACHAT.docx) en y injectant des
 * variables {…}, sans toucher à la charte (logo, en-tête, pied de page, tableau,
 * blocs signature). Le résultat est commité dans assets/fiche-template.docx et
 * rempli à l'exécution par le DocxRenderer.
 *
 *   pnpm --filter @sesur/backend exec ts-node scripts/build-fiche-template.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import PizZip from 'pizzip';

const SOURCE = resolve(
  __dirname,
  "../../frontend/public/docs/FICHE DE DEMANDE D'ACHAT.docx",
);
const OUT = resolve(__dirname, '../src/modules/documents/assets/fiche-template.docx');

const RUN_FONT =
  '<w:rPr><w:rFonts w:ascii="Amasis MT Pro" w:hAnsi="Amasis MT Pro"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="fr-FR"/></w:rPr>';

/** Empêche une ligne de tableau de se scinder entre deux pages. */
function cantSplit(rowXml: string): string {
  return rowXml.replace(
    /(<w:tr\b[^>]*>)/,
    '$1<w:trPr><w:cantSplit/></w:trPr>',
  );
}

function replaceOnce(xml: string, find: string, repl: string): string {
  const i = xml.indexOf(find);
  if (i !== -1) return xml.slice(0, i) + repl + xml.slice(i + find.length);

  // Repli : les libellés français peuvent contenir une espace insécable
  // (U+00A0) avant « : ». On autorise chaque espace à matcher l'une ou l'autre.
  const pattern = find
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/ /g, '[ \\u00a0]');
  const m = new RegExp(pattern).exec(xml);
  if (!m) throw new Error(`Introuvable: ${find}`);
  return xml.slice(0, m.index) + repl + xml.slice(m.index + m[0].length);
}

function main(): void {
  const zip = new PizZip(readFileSync(SOURCE));
  let xml = zip.file('word/document.xml')!.asText();

  // ── Champs simples (variable insérée dans le run du libellé) ─────────────
  xml = replaceOnce(
    xml,
    '<w:t xml:space="preserve"> ____ </w:t>',
    '<w:t xml:space="preserve"> {ref} </w:t>',
  );
  xml = replaceOnce(xml, '<w:t>/ Année ____</w:t>', '<w:t>/ Année {annee}</w:t>');
  xml = replaceOnce(
    xml,
    '<w:t xml:space="preserve"> ____ / ____ / ______</w:t>',
    '<w:t xml:space="preserve"> {dateDemande}</w:t>',
  );
  // « Nom et Prénom » : le « : » est le dernier run du libellé.
  xml = replaceOnce(
    xml,
    '<w:t xml:space="preserve"> :</w:t>',
    '<w:t xml:space="preserve"> : {nom}</w:t>',
  );
  xml = replaceOnce(
    xml,
    '<w:t>Service / Département :</w:t>',
    '<w:t xml:space="preserve">Service / Département : {service}</w:t>',
  );
  xml = replaceOnce(
    xml,
    '<w:t>Fonction :</w:t>',
    '<w:t xml:space="preserve">Fonction : {fonction}</w:t>',
  );
  xml = replaceOnce(
    xml,
    '<w:t>Responsable hiérarchique :</w:t>',
    '<w:t xml:space="preserve">Responsable hiérarchique : {responsable}</w:t>',
  );
  xml = replaceOnce(
    xml,
    '<w:t>Autre : ____________________________________________</w:t>',
    '<w:t xml:space="preserve">Autre : {autreDetail}</w:t>',
  );
  xml = replaceOnce(
    xml,
    '<w:t>Description précise (caractéristiques techniques obligatoires) :</w:t>',
    '<w:t xml:space="preserve">Description précise (caractéristiques techniques obligatoires) : {description}</w:t>',
  );
  xml = replaceOnce(
    xml,
    '<w:t>Objectif de l’achat :</w:t>',
    '<w:t xml:space="preserve">Objectif de l’achat : {objectif}</w:t>',
  );
  xml = replaceOnce(
    xml,
    '<w:t>Impact opérationnel :</w:t>',
    '<w:t xml:space="preserve">Impact opérationnel : {impact}</w:t>',
  );
  xml = replaceOnce(
    xml,
    '<w:t xml:space="preserve">Utilisateur : </w:t>',
    '<w:t xml:space="preserve">Utilisateur : {utilisateur}</w:t>',
  );

  // ── Cases à cocher (7 runs « ☐ » identiques, dans l'ordre du formulaire) ──
  const checks = [
    'cHardware',
    'cFurniture',
    'cSupplies',
    'cService',
    'cMaintenance',
    'cSoftware',
    'cOther',
  ];
  for (const name of checks) {
    xml = replaceOnce(xml, '<w:t>☐</w:t>', `<w:t>{${name}}</w:t>`);
  }

  // ── Tableau des articles : 1ʳᵉ ligne de corps → ligne de boucle {#items} ──
  const tblStart = xml.indexOf('<w:tbl>');
  const tblEnd = xml.indexOf('</w:tbl>', tblStart) + '</w:tbl>'.length;
  let tbl = xml.slice(tblStart, tblEnd);

  // Rééquilibre les largeurs de colonnes (total identique = 10343 dxa) pour que
  // les titres ne se coupent plus au milieu d'un mot (« Descriptio n »…).
  const widthMap: Record<string, string> = {
    '1338': '1700', // Description
    '1267': '800', //  Qté
    '3166': '2900', // Spécifications techniques
    '1028': '1400', // Délai souhaité
    '3544': '3543', // Observations
  };
  for (const [from, to] of Object.entries(widthMap)) {
    tbl = tbl.split(`w:w="${from}"`).join(`w:w="${to}"`);
  }

  const rowRe = /<w:tr\b[\s\S]*?<\/w:tr>/g;
  const rows = tbl.match(rowRe)!;
  // rows[0] = en-tête, rows[1] = modèle de ligne, rows[2..] = lignes vides à supprimer.
  const header = rows[0];
  let templateRow = rows[1];

  const cellPlaceholders = [
    '{#items}{description}',
    '{qte}',
    '{specs}',
    '{delai}',
    '{obs}{/items}',
  ];
  let cellIdx = 0;
  templateRow = templateRow.replace(/<\/w:p>\s*<\/w:tc>/g, (match) => {
    const ph = cellPlaceholders[cellIdx++];
    const run = `<w:r>${RUN_FONT}<w:t xml:space="preserve">${ph}</w:t></w:r>`;
    return match.replace('</w:p>', `${run}</w:p>`);
  });
  if (cellIdx !== 5) throw new Error(`Cellules attendues=5, trouvées=${cellIdx}`);
  templateRow = cantSplit(templateRow);

  // Reconstruit le tableau : tout avant la 1ʳᵉ ligne + en-tête + ligne boucle + fermeture.
  const beforeRows = tbl.slice(0, tbl.indexOf(rows[0]));
  tbl = `${beforeRows}${header}${templateRow}</w:tbl>`;

  xml = xml.slice(0, tblStart) + tbl + xml.slice(tblEnd);

  // ── Tableau signatures : cellules vides (row1) sous Demandeur/Approbateur ──
  // On y insère une image de signature, conditionnée à sa présence.
  const sigStart = xml.indexOf('<w:tbl>', xml.indexOf('</w:tbl>') + 8);
  const sigEnd = xml.indexOf('</w:tbl>', sigStart) + '</w:tbl>'.length;
  let sigTbl = xml.slice(sigStart, sigEnd);
  const sigRows = sigTbl.match(rowRe)!;
  let sigRow = sigRows[1]; // row0 = libellés, row1 = cases de signature
  // Balise image seule dans son run (le module image l'exige). Quand l'utilisateur
  // n'a pas de signature, le renderer fournit un PNG transparent 1×1 (invisible).
  const sigPlaceholders = ['{%demandeurSig}', '{%approbateurSig}'];
  let sci = 0;
  sigRow = sigRow.replace(/<w:tc>[\s\S]*?<\/w:tc>/g, (cell) => {
    if (sci >= 2) return cell;
    const ph = sigPlaceholders[sci++];
    const run = `<w:r>${RUN_FONT}<w:t xml:space="preserve">${ph}</w:t></w:r>`;
    return cell.replace('</w:p>', `${run}</w:p>`); // 1er paragraphe de la cellule
  });
  if (sci !== 2) throw new Error(`Cellules signature attendues=2, trouvées=${sci}`);
  sigRow = cantSplit(sigRow);
  sigTbl = sigTbl.replace(sigRows[1], sigRow);
  xml = xml.slice(0, sigStart) + sigTbl + xml.slice(sigEnd);

  zip.file('word/document.xml', xml);

  // ── Pied de page : retire « p. {PAGE} » (on garde l'image du pied) ───────
  let footer = zip.file('word/footer1.xml')!.asText();
  const pStart = footer.indexOf('<w:t xml:space="preserve">p. </w:t>');
  if (pStart !== -1) {
    const runOpen = footer.lastIndexOf('<w:r>', pStart);
    const fieldEnd = footer.indexOf('<w:fldChar w:fldCharType="end"/>', pStart);
    const runClose =
      footer.indexOf('</w:r>', fieldEnd) + '</w:r>'.length;
    footer = footer.slice(0, runOpen) + footer.slice(runClose);
    zip.file('word/footer1.xml', footer);
  } else {
    console.warn('Avertissement: « p. PAGE » introuvable dans footer1.xml');
  }

  const out = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, out);
  console.log(`Gabarit écrit: ${OUT} (${out.length} octets)`);
}

main();
