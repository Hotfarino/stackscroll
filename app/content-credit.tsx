import type {Card} from "./content";
import {licensedWork,contentLicenseUrl,contentPolicyUrl} from "./content-rights";
export function ContentCredit({card}:{card:Card}){
 const work=licensedWork(card);
 if(!work)return null;
 return <p className="content-credit">Adapted from <a href={work.source} target="_blank" rel="noopener noreferrer">{work.title}</a> by {work.creator}, under <a href={contentLicenseUrl} target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. Condensed and rewritten by StackScroll. <a href={contentPolicyUrl} target="_blank" rel="noopener noreferrer">Source policy</a>. No endorsement implied.</p>;
}
