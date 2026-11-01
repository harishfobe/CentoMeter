import {describe,it,expect} from 'vitest';
import {agents,listings,publicListing,filterListings,defaults,filtersFromQuery,filtersQuery,parseAgentRoute,findAgents} from '../src/lib/agents';
import {getExactLocation,setAccessRequests} from '../src/lib/locationAccess';
import {indianMobile} from '../src/PropertyModel';
import {canRequest,LIMITS} from '../src/lib/agentStore';
describe('agent foundation',()=>{
it('provides eight agents and thirty public listings',()=>{expect(agents).toHaveLength(8);expect(listings).toHaveLength(30);for(const p of listings){expect(JSON.stringify(publicListing(p))).not.toMatch(/"(?:lat|lng|location|boundary|address)":/);expect(p.type==='Land'&&p.mode==='RENT').toBe(false)}});
it('decodes routes and round trips filters',()=>{expect(parseAgentRoute('#agent/riya%2Emenon?src=ig').handle).toBe('riya.menon');const f={...defaults,beds:'3',mode:'RENT',available:false};expect(filtersFromQuery(filtersQuery(f))).toEqual(f)});
it('filters prices, availability and languages',()=>{expect(filterListings(listings,{...defaults,max:1000000}).every(p=>p.price<=1000000)).toBe(true);expect(findAgents(agents,{language:'Kannada'}).every(a=>a.languages.includes('Kannada'))).toBe(true)});
it('checks approval per viewer, expiry and revocation',()=>{const p=listings[0];setAccessRequests([{propertyId:p.id,viewerId:'one',status:'approved'}]);expect(getExactLocation(p.id,'one')).toHaveLength(2);expect(getExactLocation(p.id,'two')).toBeNull();for(const status of ['requested','declined','expired','revoked']){setAccessRequests([{propertyId:p.id,viewerId:'one',status}]);expect(getExactLocation(p.id,'one')).toBeNull()}setAccessRequests([{propertyId:p.id,viewerId:'one',status:'approved',expiresAt:'2020-01-01'}]);expect(getExactLocation(p.id,'one')).toBeNull()});
it('normalises Indian mobile formats',()=>{for(const n of ['+91 90000 00000','09000000000','9000000000'])expect(indianMobile(n)).toBe('9000000000')});
it('enforces daily cap and decline cooldown',()=>{const now=Date.now();const r={viewerId:'one',propertyId:'p',status:'declined',createdAt:new Date(now).toISOString(),repliedAt:new Date(now).toISOString()};expect(canRequest([r],'p','one',now)).toContain('24 hours');expect(canRequest(Array.from({length:LIMITS.daily},(_,i)=>({...r,propertyId:String(i)})),'other','one',now)).toContain('Daily')});
});
