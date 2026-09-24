import { Brand } from "./brand";
import Link from "next/link";

export function PolicyShell({title,children}: {title:string;children:React.ReactNode}) {
  return <div className="policy-page"><header><Link href="/" aria-label="Stackscroll home"><Brand/></Link><Link href="/">Back to feed</Link></header><main><p className="eyebrow">STACKSCROLL / CONTENT & PRIVACY</p><h1>{title}</h1>{children}</main><footer><Link href="/privacy">Privacy</Link><Link href="/terms">Content terms</Link><Link href="/">Your feed</Link></footer></div>;
}
