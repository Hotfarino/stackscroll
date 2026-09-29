export const metricLabels = {
 "page-view":"Feed views",
 "session-start":"Sessions started",
 "navigation":"Navigation changes",
 "feed-refresh":"Feed refreshes",
 "filter-open":"Filter opens",
 "load-more":"More cards loaded",
 "search-use":"Searches used",
 "card-save":"Cards saved or unsaved",
 "video-load":"Video players requested",
 "external-source-open":"Original sources opened",
 "stack-action":"Stack actions",
 "social-project-open":"Creator-project form opens",
 "social-project-submit":"Creator projects submitted",
 "account-open":"Account panels opened",
 "scroll-half":"Sessions reaching 50% depth",
 "scroll-end":"Sessions reaching 90% depth",
} as const;

export const metricSurfaces=["feed","policy","admin"] as const;
export type MetricCode=keyof typeof metricLabels;
export type MetricSurface=(typeof metricSurfaces)[number];
export function isMetricCode(value:unknown):value is MetricCode{return typeof value==="string"&&Object.hasOwn(metricLabels,value);}
export function isMetricSurface(value:unknown):value is MetricSurface{return typeof value==="string"&&(metricSurfaces as readonly string[]).includes(value);}
