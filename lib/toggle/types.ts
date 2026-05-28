export type GiftCard = {
  id: string;
  /** Masked code for manager UI: e.g. "•••• 4421". Never the full PAN. */
  maskedCode: string;
  balancePence: number;
  expiresAt: number;
};

export type GiftCardLookupResult =
  | { match: false }
  | { match: true; toggleRef: string; giftCards: GiftCard[] };
