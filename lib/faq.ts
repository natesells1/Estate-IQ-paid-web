import { COUNTIES } from "./data/counties";
import { PRO_PRICE_LABEL, SERVICES, TRIAL_DAYS, money } from "./config";

const names = COUNTIES.map((c) => c.name);

export const FAQ: { q: string; a: string }[] = [
  {
    q: "What can I see for free?",
    a: "Every auction result in every county we cover, in full. For new lis pendens filings and upcoming auctions you see the photo, case number and filing or sale date, plus the Equity Score when it's 70 or higher.",
  },
  {
    q: "What does Pro unlock?",
    a: "The address, owner name and contact, mortgage, final judgment, plaintiff max bid and values on every new filing and upcoming auction, plus the Equity Score on every property.",
  },
  {
    q: "How much is Pro?",
    a: `${PRO_PRICE_LABEL} a month after a ${TRIAL_DAYS}-day free trial. Title searches are ${money(SERVICES["title-search"].cents)} and skip traces ${money(SERVICES["skip-trace"].cents)} each, on any plan.`,
  },
  { q: "How often is the data updated?", a: "New lis pendens filings load every weekday with that day's filings. Auction results load for each day an auction runs." },
  { q: "Which counties do you cover?", a: `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} counties, with more coming.` },
  {
    q: "What is the Equity Score?",
    a: "A 1–100 score that weighs fair market value against what's owed: the mortgage on a lis pendens, or the final judgment at auction. 80+ is Great, 70–79 Good, 45–69 Fair, under 45 Weak.",
  },
  {
    q: "Can I cancel anytime?",
    a: `Yes. Pro starts with a ${TRIAL_DAYS}-day free trial, then ${PRO_PRICE_LABEL}/month. Cancel from your account before the trial ends and you won't be charged.`,
  },
];
