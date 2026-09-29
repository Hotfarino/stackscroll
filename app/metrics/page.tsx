import {headers} from "next/headers";
import {PolicyShell} from "../policy-shell";
import {isModeratorId} from "../video-server";
import {MetricsDashboard} from "./metrics-dashboard";

export const dynamic="force-dynamic";
export const metadata={title:"Development metrics — Stackscroll",robots:{index:false,follow:false}};
export default async function MetricsPage(){
 const requestHeaders=await headers();
 if(!isModeratorId(requestHeaders.get("oai-authenticated-user-id")))return <PolicyShell title="Development metrics"><p role="alert">This dashboard is restricted to the Stackscroll owner. Sign in with the owner account to continue.</p></PolicyShell>;
 return <PolicyShell title="Development metrics"><MetricsDashboard/></PolicyShell>;
}
