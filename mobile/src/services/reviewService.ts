import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebaseConfig';
import { CustomerReviewItem, ReviewScope, ReviewStatus } from '../types';

const ID_PATTERN = /[^a-zA-Z0-9_-]/g;
export const MAX_REVIEW_REPLY_LENGTH = 1000;

function sanitizeId(raw: string, fallback: string): string {
  const cleaned = raw.replace(ID_PATTERN, '_').slice(0, 128);
  return cleaned.length > 0 ? cleaned : fallback;
}

export function sanitizeReplyText(raw: string): string {
  return raw.trim().slice(0, MAX_REVIEW_REPLY_LENGTH);
}

/**
 * Subscribe to verified seller's store & product customer reviews in Firestore.
 * Only attaches onSnapshot when Firebase Auth has a signed-in verified user.
 */
export function subscribeToTenantReviews(
  tenantId: string,
  onReviews: (items: CustomerReviewItem[]) => void
): () => void {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    return () => {};
  }

  const safeTenant = sanitizeId(tenantId, 'sanjit_musical_guwahati');
  const colPath = `tenants/${safeTenant}/reviews`;

  const q = query(
    collection(db, 'tenants', safeTenant, 'reviews'),
    where('tenantId', '==', safeTenant),
    where('sellerOwnerId', '==', user.uid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: CustomerReviewItem[] = snapshot.docs.map((snap) => {
        const d = snap.data();
        const scope: ReviewScope = d.scope === 'STORE' ? 'STORE' : 'PRODUCT';
        const status: ReviewStatus = d.status === 'REPLIED' ? 'REPLIED' : 'PENDING_REPLY';
        const createdIso =
          d.createdAt && typeof d.createdAt.toDate === 'function'
            ? d.createdAt.toDate().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })
            : 'Recent';
        const updatedIso =
          d.updatedAt && typeof d.updatedAt.toDate === 'function'
            ? d.updatedAt.toDate().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })
            : undefined;

        return {
          id: snap.id,
          scope,
          productId: String(d.productId || 'store_overall'),
          productName: String(d.productName || 'Store Review'),
          orderRef: String(d.orderRef || 'ORD'),
          customerId: String(d.customerId || 'customer'),
          customerName: String(d.customerName || 'Verified Buyer'),
          customerCity: 'Verified Order',
          rating: Math.max(1, Math.min(5, Number(d.rating) || 5)),
          comment: String(d.comment || ''),
          createdAt: createdIso,
          sellerReply: typeof d.sellerReply === 'string' && d.sellerReply.length > 0 ? d.sellerReply : undefined,
          sellerRepliedAt: status === 'REPLIED' ? updatedIso : undefined,
          status,
          verifiedPurchase: true,
          source: 'FIRESTORE_LIVE',
        };
      });
      onReviews(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, colPath);
    }
  );
}

/**
 * Publishes or updates the verified seller's response to a customer review in Firestore.
 * Strictly adheres to firebase-blueprint.json CustomerReview update constraints.
 */
export async function publishSellerReviewReply(
  tenantId: string,
  reviewId: string,
  replyText: string
): Promise<boolean> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return false;

  const cleanReply = sanitizeReplyText(replyText);
  if (cleanReply.length < 2) return false;

  const safeTenant = sanitizeId(tenantId, 'sanjit_musical_guwahati');
  const safeReviewId = sanitizeId(reviewId, 'rev_001');
  const docPath = `tenants/${safeTenant}/reviews/${safeReviewId}`;

  try {
    await updateDoc(doc(db, 'tenants', safeTenant, 'reviews', safeReviewId), {
      sellerReply: cleanReply,
      status: 'REPLIED',
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}
