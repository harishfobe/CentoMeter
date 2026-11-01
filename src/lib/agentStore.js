import {useSyncExternalStore} from 'react';
import {readLocal,writeLocal} from '../Discovery';
import {indianMobile} from '../PropertyModel';
import {accessStatus,setAccessRequests,setAccessViewer} from './locationAccess';
let viewerId;try{viewerId=sessionStorage.getItem('centometer-buyer');if(!viewerId){viewerId=crypto.randomUUID();sessionStorage.setItem('centometer-buyer',viewerId)}}catch{viewerId='session-'+Math.random().toString(36).slice(2)}
export {viewerId};setAccessViewer(viewerId);
const key='centometer-agents-v2';const empty={followed:[],saved:[],requests:[],overrides:{},reports:[],events:[]};const stored=readLocal(key,null);let state=stored&&typeof stored==='object'?{...empty,...stored}:empty;for(const field of ['followed','saved','requests','reports','events'])if(!Array.isArray(state[field]))state[field]=[];if(!state.overrides||typeof state.overrides!=='object')state.overrides={};const listeners=new Set();setAccessRequests(state.requests);
export const LIMITS={daily:5,declineCooldownMs:86400000};
export const snapshot=()=>state;
export function updateStore(fn){state=fn(state);setAccessRequests(state.requests);writeLocal(key,state);listeners.forEach(fn=>fn())}
export function useAgentStore(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn)},snapshot,snapshot)}
export const toggleStore=(field,id)=>updateStore(s=>({...s,[field]:s[field].includes(id)?s[field].filter(x=>x!==id):[...s[field],id]}));
export function canRequest(requests,id,buyer=viewerId,now=Date.now()){const own=requests.filter(r=>r.viewerId===buyer);const last=own.find(r=>r.propertyId===id);if(last&&['requested','approved'].includes(accessStatus(last,now)))return 'A request is already active.';if(last&&last.status==='declined'&&now-Date.parse(last.repliedAt||last.createdAt)<LIMITS.declineCooldownMs)return 'Please wait 24 hours after a decline.';if(own.filter(r=>now-Date.parse(r.createdAt)<86400000).length>=LIMITS.daily)return 'Daily request limit reached. Try tomorrow.';return ''}
export function requestLocation(p,buyer,source='direct'){const error=canRequest(state.requests,p.id);const phone=indianMobile(buyer.phone);if(error)throw Error(error);if(!buyer.name?.trim()||!phone||!buyer.consent)throw Error('Enter your name, a valid Indian mobile and consent.');const request={id:crypto.randomUUID(),propertyId:p.id,agentId:p.agentId,viewerId,buyer:{...buyer,name:buyer.name.trim(),phone},source:['ig','share'].includes(source)?source:'direct',status:'requested',createdAt:new Date().toISOString()};updateStore(s=>({...s,requests:[request,...s.requests]}));return request}
export function decideRequest(id,status,hours=24){updateStore(s=>({...s,requests:s.requests.map(r=>r.id===id?{...r,status,repliedAt:new Date().toISOString(),expiresAt:status==='approved'&&hours?new Date(Date.now()+hours*3600000).toISOString():null}:r)}))}
export const recordEvent=(kind,agentId,source='direct')=>updateStore(s=>({...s,events:[...s.events.slice(-999),{kind,agentId,source,at:new Date().toISOString()}]}));
