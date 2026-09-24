export async function clearStackscrollDeviceData(){
  const removed:string[]=[];
  for(let index=localStorage.length-1;index>=0;index--){
    const key=localStorage.key(index);if(key?.startsWith("stackscroll-")){localStorage.removeItem(key);removed.push(key);}
  }
  if("caches" in globalThis){for(const key of await caches.keys())if(key.startsWith("stackscroll-"))await caches.delete(key);}
  if("serviceWorker" in navigator){for(const registration of await navigator.serviceWorker.getRegistrations())if(registration.scope.startsWith(location.origin))await registration.unregister();}
  return removed;
}
