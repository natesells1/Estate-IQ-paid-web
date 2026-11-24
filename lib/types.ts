// Shared shapes for every record the site shows.
// Real county data should be mapped into `Property` and nothing else needs to change.

export type Kind = "lis_pendens" | "foreclosure" | "tax_deed";

export type AuctionStatus =
  | "scheduled"
  | "sold_third_party"
  | "back_to_plaintiff"
  | "canceled"
  | "rescheduled";

export interface County {
  slug: string;
  name: string;
  /** Shown on the Florida hot-counties map */
  hot: boolean;
  lat: number;
  lng: number;
  /** Which side of the Florida map the label sits on */
  labelSide: "left" | "right";
  /** Label top, in Florida-map SVG units */
  labelY: number;
  cities: { name: string; zip: string; lat: number; lng: number }[];
}

/** Extra property-appraiser and court details shown on the property card. */
export interface PropertyDetails {
  totalBuildingSqft: number;
  garage: string;
  pool: boolean;
  carport: boolean;
  seawall: boolean;
  boatDock: boolean;
  taxesOwed: number;
  assessedValue: number;
  filingType: string;
  secondMortgage: number;
  hoaLien: number;
  /** Second defendant on the case, if any */
  coOwner: string;
}

export interface Property {
  id: string;
  kind: Kind;
  countySlug: string;
  caseNumber: string;
  parcelId: string;

  address: string;
  city: string;
  zip: string;
  lat: number;
  lng: number;
  photoUrl: string;

  beds: number;
  baths: number;
  sqft: number;
  lotSqft: number;
  yearBuilt: number;
  propertyType: string;

  owner: string;
  ownerPhone: string;
  mortgage: number;
  fairMarketValue: number;
  lastSalePrice: number;
  lastSaleDate: string;
  plaintiff: string;

  /** Lis pendens: filing date. Auctions: auction date. ISO yyyy-mm-dd */
  date: string;

  // Auction-only fields
  finalJudgment?: number;
  plaintiffMaxBid?: number;
  status?: AuctionStatus;
  soldTo?: string;
  soldAmount?: number;

  details: PropertyDetails;

  /** Only compliant (complete) files are ever shown. */
  compliant: boolean;
}

/** What a free user's browser receives for a locked record. Nothing else. */
export interface TeaserRecord {
  locked: true;
  id: string;
  kind: Kind;
  countySlug: string;
  countyName: string;
  caseNumber: string;
  photoUrl: string;
  date: string;
  /** Present only when the score is 70 or higher */
  equityScore: number | null;
  /** Approximate location (rounded on the server) for map pins */
  lat: number;
  lng: number;
}

/** A record the viewer may see in full. */
export interface FullRecord extends Omit<Property, "compliant"> {
  locked: false;
  countyName: string;
  /** null for free users when the score is under 70 */
  equityScore: number | null;
  /** Owner names and phone are Pro-only; when true they are blank strings */
  contactsLocked: boolean;
}

export type ViewRecord = TeaserRecord | FullRecord;

export interface Viewer {
  isPro: boolean;
}
