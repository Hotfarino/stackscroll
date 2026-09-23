import type {Card} from "./content";

// Page-level review only. A publisher's hostname is never a permission grant.
export const licensedWorks = [
 {id:"licensed-web-vitals",source:"https://web.dev/articles/vitals",title:"Web Vitals",creator:"Philip Walton / Google"},
 {id:"licensed-devtools",source:"https://developer.chrome.com/docs/devtools/overview",title:"Overview (Chrome DevTools)",creator:"Google"},
 {id:"licensed-overfitting",source:"https://developers.google.com/machine-learning/crash-course/overfitting/overfitting",title:"Overfitting",creator:"Google"},
 {id:"licensed-classification",source:"https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall",title:"Classification: Accuracy, recall, precision, and related metrics",creator:"Google"},
] as const;
export const contentLicenseUrl="https://creativecommons.org/licenses/by/4.0/";
export const contentPolicyUrl="https://developers.google.com/terms/site-policies";
export const rightsReviewedAt="2026-09-23";
export function licensedWork(card:Pick<Card,"id"|"source"|"attribution">){
 // Saved provenance survives a later registry change. It is attribution only,
 // never authority to display a publisher excerpt or import additional media.
 const saved=card.attribution;
 if(saved&&saved.cardId===card.id&&saved.source===card.source&&saved.license==="CC-BY-4.0"&&/^https:\/\//.test(saved.source))return saved;
 return licensedWorks.find(work=>work.id===card.id&&work.source===card.source);
}
// No catalog excerpts have completed a reuse-permission review yet. Defaults
// stay closed even for old cached cards or a newly imported excerpt field.
export function permittedCatalogExcerpt(_card:Card):string|undefined{return undefined;}
// Also applies to old saved cards and cached feed responses, without deleting them.
export function permittedCardBody(card:Card){
 return card.kind==="news"&&card.id.startsWith("rss-")
  ? `Read the original at ${card.sourceName}. Publisher excerpts are withheld until reuse permissions are verified.`
  : card.body;
}
// No publisher image has independently verified rights yet. Text licenses do not
// authorize photographs, screenshots, logos, or other third-party media.
export function permittedNewsImage(_card:Card):string|undefined{return undefined;}
