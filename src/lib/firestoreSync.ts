import { db, auth } from './firebase';
import {
  doc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { Movement, HistoryEvent } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || 'app-user',
      email: auth.currentUser?.email || null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// 1. Inmutable Audit History Event Writer (Firestore Collection: historyEvents)
export async function syncHistoryEventToFirestore(evt: HistoryEvent) {
  const path = `historyEvents/${evt.id}`;
  try {
    await setDoc(doc(db, 'historyEvents', String(evt.id)), {
      id: String(evt.id),
      timestamp: evt.timestamp,
      tipoEvento: evt.tipoEvento,
      usuarioResponsable: evt.usuarioResponsable || 'Sistema',
      detalles: evt.detalles || '',
      impactoStock: evt.impactoStock || [],
      impactoFinanciero: evt.impactoFinanciero || null,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// 2. Atomic Stock Transaction Engine (Garantiza consistencia entre productos, movimientos e historial)
export async function executeAtomicStockTransaction(
  updatedProducts: { id: string | number; stockBandejas?: number; stockGranelKg?: number }[],
  movements: Movement[],
  historyEvt?: HistoryEvent
) {
  const path = 'atomic_stock_transaction';
  try {
    const batch = writeBatch(db);

    // Update products atomically
    updatedProducts.forEach((p) => {
      const pRef = doc(db, 'products', String(p.id));
      const payload: any = { updatedAt: new Date().toISOString() };
      if (p.stockBandejas !== undefined) payload.stockBandejas = p.stockBandejas;
      if (p.stockGranelKg !== undefined) payload.stockGranelKg = p.stockGranelKg;
      batch.set(pRef, payload, { merge: true });
    });

    // Write movements atomically
    movements.forEach((m) => {
      const mRef = doc(db, 'movements', String(m.id));
      batch.set(mRef, {
        id: String(m.id),
        fecha: m.fecha,
        tipo: m.tipo,
        item: m.item,
        cantidad: m.cantidad,
        clienteProveedor: m.clienteProveedor,
      });
    });

    // Append to immutable history log atomically
    if (historyEvt) {
      const hRef = doc(db, 'historyEvents', String(historyEvt.id));
      batch.set(hRef, {
        id: String(historyEvt.id),
        timestamp: historyEvt.timestamp,
        tipoEvento: historyEvt.tipoEvento,
        usuarioResponsable: historyEvt.usuarioResponsable || 'Sistema',
        detalles: historyEvt.detalles || '',
        impactoStock: historyEvt.impactoStock || [],
        impactoFinanciero: historyEvt.impactoFinanciero || null,
      });
    }

    await batch.commit();
    console.log('Atomic stock transaction successfully committed to Firestore.');
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// 3. Document Sync Helper
export async function syncDocumentToFirestore(collectionName: string, docId: string, data: any) {
  const path = `${collectionName}/${docId}`;
  try {
    await setDoc(doc(db, collectionName, String(docId)), data, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
