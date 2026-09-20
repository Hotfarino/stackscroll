"use client";
import {useEffect} from "react";
import {reportDiagnostic} from "./diagnostics-client";
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){
 useEffect(()=>{void reportDiagnostic("render-error");},[]);
 return <main className="policy-shell"><h1>Stackscroll hit a problem</h1><p>Your saved data has not been cleared.</p><button onClick={reset}>Try again</button><p><a href="/diagnostics">Open diagnostics</a></p></main>;
}
