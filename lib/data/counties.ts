import type { County } from "../types";

// Hot counties shown on the Florida map. labelY values are hand-placed so labels never overlap.
export const COUNTIES: County[] = [
  {
    slug: "duval", name: "Duval", hot: true, lat: 30.33, lng: -81.65, labelSide: "right", labelY: 52,
    cities: [
      { name: "Jacksonville", zip: "32208", lat: 30.39, lng: -81.69 },
      { name: "Jacksonville", zip: "32210", lat: 30.26, lng: -81.75 },
      { name: "Jacksonville", zip: "32244", lat: 30.21, lng: -81.73 },
    ],
  },
  {
    slug: "marion", name: "Marion", hot: false, lat: 29.2, lng: -82.05, labelSide: "left", labelY: 150,
    cities: [
      { name: "Ocala", zip: "34475", lat: 29.21, lng: -82.15 },
      { name: "Silver Springs Shores", zip: "34472", lat: 29.12, lng: -82.01 },
      { name: "Dunnellon", zip: "34432", lat: 29.05, lng: -82.46 },
    ],
  },
  {
    slug: "volusia", name: "Volusia", hot: false, lat: 29.05, lng: -81.2, labelSide: "right", labelY: 150,
    cities: [
      { name: "Daytona Beach", zip: "32114", lat: 29.2, lng: -81.04 },
      { name: "Deltona", zip: "32725", lat: 28.9, lng: -81.21 },
      { name: "DeLand", zip: "32720", lat: 29.03, lng: -81.3 },
    ],
  },
  {
    slug: "orange", name: "Orange", hot: false, lat: 28.5, lng: -81.3, labelSide: "right", labelY: 208,
    cities: [
      { name: "Orlando", zip: "32808", lat: 28.57, lng: -81.44 },
      { name: "Orlando", zip: "32822", lat: 28.49, lng: -81.29 },
      { name: "Apopka", zip: "32703", lat: 28.68, lng: -81.51 },
    ],
  },
  {
    slug: "polk", name: "Polk", hot: true, lat: 27.95, lng: -81.7, labelSide: "left", labelY: 208,
    cities: [
      { name: "Lakeland", zip: "33805", lat: 28.07, lng: -81.95 },
      { name: "Winter Haven", zip: "33880", lat: 27.99, lng: -81.72 },
      { name: "Haines City", zip: "33844", lat: 28.11, lng: -81.62 },
    ],
  },
  {
    slug: "brevard", name: "Brevard", hot: false, lat: 28.3, lng: -80.75, labelSide: "right", labelY: 266,
    cities: [
      { name: "Palm Bay", zip: "32907", lat: 28.0, lng: -80.67 },
      { name: "Melbourne", zip: "32935", lat: 28.14, lng: -80.66 },
      { name: "Cocoa", zip: "32922", lat: 28.37, lng: -80.74 },
    ],
  },
  {
    slug: "hillsborough", name: "Hillsborough", hot: false, lat: 27.9, lng: -82.35, labelSide: "left", labelY: 266,
    cities: [
      { name: "Tampa", zip: "33610", lat: 27.99, lng: -82.39 },
      { name: "Brandon", zip: "33511", lat: 27.91, lng: -82.29 },
      { name: "Riverview", zip: "33569", lat: 27.85, lng: -82.31 },
    ],
  },
  {
    slug: "pinellas", name: "Pinellas", hot: false, lat: 27.88, lng: -82.73, labelSide: "left", labelY: 324,
    cities: [
      { name: "St. Petersburg", zip: "33713", lat: 27.79, lng: -82.68 },
      { name: "Clearwater", zip: "33755", lat: 27.98, lng: -82.78 },
      { name: "Largo", zip: "33771", lat: 27.92, lng: -82.77 },
    ],
  },
  {
    slug: "manatee", name: "Manatee", hot: true, lat: 27.47, lng: -82.35, labelSide: "left", labelY: 382,
    cities: [
      { name: "Bradenton", zip: "34205", lat: 27.48, lng: -82.58 },
      { name: "Palmetto", zip: "34221", lat: 27.53, lng: -82.55 },
      { name: "Parrish", zip: "34219", lat: 27.58, lng: -82.42 },
    ],
  },
  {
    slug: "palm-beach", name: "Palm Beach", hot: false, lat: 26.65, lng: -80.45, labelSide: "right", labelY: 382,
    cities: [
      { name: "West Palm Beach", zip: "33407", lat: 26.75, lng: -80.08 },
      { name: "Lake Worth", zip: "33460", lat: 26.62, lng: -80.07 },
      { name: "Boynton Beach", zip: "33435", lat: 26.53, lng: -80.07 },
    ],
  },
  {
    slug: "sarasota", name: "Sarasota", hot: false, lat: 27.18, lng: -82.35, labelSide: "left", labelY: 440,
    cities: [
      { name: "Sarasota", zip: "34232", lat: 27.33, lng: -82.48 },
      { name: "North Port", zip: "34286", lat: 27.07, lng: -82.2 },
      { name: "Venice", zip: "34293", lat: 27.06, lng: -82.41 },
    ],
  },
  {
    slug: "broward", name: "Broward", hot: true, lat: 26.15, lng: -80.45, labelSide: "right", labelY: 410,
    cities: [
      { name: "Fort Lauderdale", zip: "33311", lat: 26.14, lng: -80.17 },
      { name: "Hollywood", zip: "33024", lat: 26.03, lng: -80.23 },
      { name: "Pompano Beach", zip: "33060", lat: 26.24, lng: -80.12 },
    ],
  },
  {
    slug: "charlotte", name: "Charlotte", hot: false, lat: 26.95, lng: -82.0, labelSide: "left", labelY: 498,
    cities: [
      { name: "Port Charlotte", zip: "33952", lat: 26.99, lng: -82.1 },
      { name: "Punta Gorda", zip: "33950", lat: 26.93, lng: -82.05 },
    ],
  },
  {
    slug: "miami-dade", name: "Miami-Dade", hot: true, lat: 25.6, lng: -80.5, labelSide: "right", labelY: 492,
    cities: [
      { name: "Miami", zip: "33147", lat: 25.85, lng: -80.24 },
      { name: "Homestead", zip: "33033", lat: 25.48, lng: -80.45 },
      { name: "Hialeah", zip: "33012", lat: 25.86, lng: -80.3 },
    ],
  },
  {
    slug: "lee", name: "Lee", hot: true, lat: 26.58, lng: -81.82, labelSide: "left", labelY: 556,
    cities: [
      { name: "Cape Coral", zip: "33914", lat: 26.6, lng: -81.99 },
      { name: "Fort Myers", zip: "33907", lat: 26.57, lng: -81.87 },
      { name: "Lehigh Acres", zip: "33971", lat: 26.62, lng: -81.64 },
      { name: "Bonita Springs", zip: "34135", lat: 26.36, lng: -81.78 },
      { name: "North Fort Myers", zip: "33903", lat: 26.7, lng: -81.9 },
    ],
  },
  {
    slug: "collier", name: "Collier", hot: false, lat: 26.1, lng: -81.4, labelSide: "right", labelY: 556,
    cities: [
      { name: "Naples", zip: "34116", lat: 26.18, lng: -81.71 },
      { name: "Naples", zip: "34120", lat: 26.27, lng: -81.6 },
      { name: "Immokalee", zip: "34142", lat: 26.42, lng: -81.42 },
    ],
  },
];

export const COUNTY_BY_SLUG = Object.fromEntries(COUNTIES.map((c) => [c.slug, c])) as Record<string, County>;
