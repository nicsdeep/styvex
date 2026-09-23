import { useEffect, useRef, useState } from 'react';

export type AddressSuggestion = { street?:string; city?:string; state?:string; zip?:string };
type Place = {label:string; address:AddressSuggestion};

// Optional helpers, never address validation. Missing fields remain editable.
export function AddressAssistance({country,zip,onChoose,onPostal}: {
  country:string; zip:string; onChoose:(value:AddressSuggestion)=>void;
  onPostal:(value:AddressSuggestion)=>void;
}) {
  const [enabled,setEnabled] = useState(false);
  const [query,setQuery] = useState('');
  const [places,setPlaces] = useState<Place[]>([]);
  const [postal,setPostal] = useState<Place[]>([]);
  const [status,setStatus] = useState('');
  const [postalStatus,setPostalStatus] = useState('');
  const postalCallback = useRef(onPostal);
  postalCallback.current=onPostal;

  useEffect(()=>{
    setPlaces([]);
    if (!enabled || query.trim().length<3) return;
    const controller=new AbortController();
    const timer=setTimeout(async()=>{
      setStatus('Looking for suggestions…');
      try {
        const params=new URLSearchParams({q:query.trim(),countrycode:country,limit:'5',lang:'en'});
        const response=await fetch(`https://photon.komoot.io/api/?${params}`,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
        if (!response.ok) throw new Error();
        const result=await response.json();
        if (controller.signal.aborted) return;
        const suggestions=(result.features || []).filter((f:any)=>f.properties?.countrycode?.toUpperCase()===country).map((f:any)=>{
          const p=f.properties;
          const street=[p.housenumber,p.street].filter(Boolean).join(' ');
          return {label:[p.name,street,p.city || p.town,p.state,p.postcode].filter(Boolean).join(', '),address:{...(street ? {street}:{}),...(p.city || p.town ? {city:p.city || p.town}:{}),...(p.state ? {state:p.state}:{}),...(p.postcode ? {zip:p.postcode}:{})}};
        });
        setPlaces(suggestions); setStatus(suggestions.length ? 'Select a suggestion, then check the fields below.' : 'No matches. Add a street or city, or enter the address manually.');
      } catch {if (!controller.signal.aborted) setStatus('Suggestions unavailable. Please enter your address manually.');}
    },850);
    return ()=>{clearTimeout(timer);controller.abort();};
  },[query,country,enabled]);

  useEffect(()=>{
    setPostal([]); setPostalStatus('');
    if (!enabled || country!=='US' || !/^\d{5}(-\d{4})?$/.test(zip.trim())) return;
    const controller=new AbortController();
    const timer=setTimeout(async()=>{
      try {
        const response=await fetch(`https://api.zippopotam.us/us/${zip.trim().slice(0,5)}`,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
        if (!response.ok) throw new Error();
        const data=await response.json();
        if (controller.signal.aborted) return;
        const options=(data.places || []).map((p:any)=>({label:`${p['place name']}, ${p['state abbreviation']}`,address:{city:p['place name'],state:p['state abbreviation']}}));
        if (options.length===1) {postalCallback.current(options[0].address);setPostalStatus('ZIP lookup complete. Check city and state; you can edit them.');}
        else {setPostal(options);setPostalStatus('Choose your city for this ZIP code.');}
      } catch {if (!controller.signal.aborted) setPostalStatus('ZIP lookup unavailable. Enter city and state manually.');}
    },600);
    return ()=>{clearTimeout(timer);controller.abort();};
  },[zip,country,enabled]);

  return <div className="mb-4 rounded-xl border border-border/60 bg-white p-3">
    <label className="flex items-center gap-2 text-sm" style={{display:'flex'}}><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)} style={{height:16,width:16}}/>Use address suggestions and U.S. ZIP assistance</label>
    <p className="mt-1 text-xs text-muted-foreground">Optional: searches go to Photon; ZIP codes go to Zippopotam.us. Names, email and phone are not sent. You can always type your own address.</p>
    {enabled && <>
      <input aria-label="Find an address or place" autoComplete="off" className="mt-3 w-full border" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Start with a street, city or state"/>
      <p role="status" className="mt-2 text-xs text-muted-foreground">{status}</p>
      <ul aria-label="Address suggestions" className="mt-2 space-y-1">{places.map((p,i)=><li key={i}><button type="button" className="w-full rounded-lg p-2 text-left text-sm hover:bg-muted focus:bg-muted" onClick={()=>{onChoose(p.address);setPlaces([]);setStatus('Suggestion selected. Add the house number or apartment if needed.');}}>{p.label}</button></li>)}</ul>
      <p role="status" className="text-xs text-muted-foreground">{postalStatus}</p>
      <ul aria-label="ZIP city suggestions">{postal.map((p,i)=><li key={i}><button type="button" className="p-2 text-sm underline" onClick={()=>{onChoose(p.address);setPostal([]);}}>{p.label}</button></li>)}</ul>
      <p className="mt-2 text-xs text-muted-foreground">Place data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">OpenStreetMap contributors</a>. Suggestions are not proof of deliverability.</p>
    </>}
  </div>;
}
