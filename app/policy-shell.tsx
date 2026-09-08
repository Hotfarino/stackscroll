import { Brand } from "./brand";

export function PolicyShell({title,children}: {title:string;children:React.ReactNode}) {
  return <div className="policy-page"><header><a href="/" aria-label="Stackscroll home"><Brand/></a><a href="/">Back to feed</a></header><main><p className="eyebrow">STACKSCROLL / CONTENT & PRIVACY</p><h1>{title}</h1>{children}</main><footer><a href="/privacy">Privacy</a><a href="/terms">Content terms</a><a href="/">Your feed</a></footer></div>;
}
