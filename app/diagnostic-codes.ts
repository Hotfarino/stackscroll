export const diagnosticLabels = {
 "browser-error":"Browser script error",
 "promise-error":"Unhandled async error",
 "render-error":"Application render failure",
 "news-request":"News request failed",
 "video-request":"Video catalog request failed",
 "api-request":"Other app request failed",
 "news-source":"News collection degraded",
 "video-source":"Video discovery degraded",
 "image-load":"Thumbnail or image failed",
 "media-load":"Audio or video failed",
 "youtube-player":"YouTube player failed",
 "self-test":"Diagnostics test",
} as const;
export type DiagnosticCode=keyof typeof diagnosticLabels;
export function isDiagnosticCode(value:unknown):value is DiagnosticCode {
 return typeof value==="string"&&Object.hasOwn(diagnosticLabels,value);
}
