import type { PurchaseRequestDetail } from '../../purchase-requests/application/purchase-request.mapper';

/**
 * Données qui alimentent le gabarit docxtemplater (assets/fiche-template.docx),
 * dérivé du formulaire officiel SESUR « Fiche de demande d'achat ». Les clés
 * correspondent exactement aux variables {…} injectées dans le gabarit.
 */

const CHECKED = '☒';
const UNCHECKED = '☐';

export interface RequestDocumentItem {
  description: string;
  qte: string;
  specs: string;
  delai: string;
  obs: string;
}

export interface RequestDocumentData {
  ref: string;
  annee: string;
  dateDemande: string;
  nom: string;
  service: string;
  fonction: string;
  responsable: string;
  cHardware: string;
  cFurniture: string;
  cSupplies: string;
  cService: string;
  cMaintenance: string;
  cSoftware: string;
  cOther: string;
  autreDetail: string;
  description: string;
  objectif: string;
  impact: string;
  utilisateur: string;
  items: RequestDocumentItem[];
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function check(types: string[], key: string): string {
  return types.includes(key) ? CHECKED : UNCHECKED;
}

export function toRequestDocumentData(
  detail: PurchaseRequestDetail,
): RequestDocumentData {
  const created = new Date(detail.createdAt);
  const types = detail.purchaseTypes;

  return {
    ref: detail.reference,
    annee: String(created.getFullYear()),
    dateDemande: `${pad2(created.getDate())} / ${pad2(created.getMonth() + 1)} / ${created.getFullYear()}`,
    nom: detail.requesterName,
    service: detail.department,
    fonction: detail.jobTitle,
    responsable: detail.lineManager,
    cHardware: check(types, 'HARDWARE'),
    cFurniture: check(types, 'FURNITURE'),
    cSupplies: check(types, 'SUPPLIES'),
    cService: check(types, 'SERVICE'),
    cMaintenance: check(types, 'MAINTENANCE'),
    cSoftware: check(types, 'SOFTWARE'),
    cOther: check(types, 'OTHER'),
    autreDetail: detail.otherTypeDetail ?? '',
    description: detail.description,
    objectif: detail.objective,
    impact: detail.operationalImpact,
    utilisateur: detail.endUser,
    items: detail.items.map((i) => ({
      description: i.description,
      qte: String(i.quantity),
      specs: i.specifications || '',
      delai: i.desiredDeadline || '',
      obs: i.observations || '',
    })),
  };
}
