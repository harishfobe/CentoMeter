import {toCents} from './LandMeasurements';

export const plotColors = {available:'#10B981', reserved:'#F59E0B', sold:'#EF4444'};
export const plotStatus = p => Object.hasOwn(plotColors, String(p.plotStatus || '').trim().toLowerCase()) ? String(p.plotStatus).trim().toLowerCase() : null;
export const pricePerCent = p => p.type==='Land' && Number.isFinite(Number(p.area)) && Number.isFinite(Number(p.price)) && Number(p.area)>0 && Number(p.price)>0 ? Number(p.price)/toCents(p.area) : null;
export const pinPrice = (p,money) => {
 const perCent = p.mode==='BUY' && pricePerCent(p);
 const amount = money(perCent || p.price).replace(/\s/g,'');
 return perCent ? amount+'/c' : amount+(p.mode==='RENT' ? p.type==='PG' ? p.occupancy==='Private room' ? '/room/mo' : '/bed/mo' : '/mo' : '');
};

// Boundaries must be supplied as an ordered ring of [latitude, longitude] pairs.
// A marker's approximate location is never used to invent a parcel boundary.
export function plotBoundary(p) {
 const ring=p.type==='Land' && p.boundary;
 if(!Array.isArray(ring) || ring.length<3 || ring.some(point=>!Array.isArray(point) || point.length!==2 || !point.every(Number.isFinite) || Math.abs(point[0])>90 || Math.abs(point[1])>180))return null;
 const area=ring.reduce((sum,[lat,lng],i)=>{const next=ring[(i+1)%ring.length];return sum+lat*next[1]-next[0]*lng},0);
 return Math.abs(area)>1e-12 ? ring : null;
}
export function plotStyle(p,selected=false) {
 const color=plotColors[plotStatus(p)] || '#71717A';
 return {color:selected?'#FFFFFF':color,weight:selected?2.5:1.5,fillColor:selected?'#F96B13':color,fillOpacity:selected?1:0.25,opacity:1};
}

export function approvalLabels(p) {
 const supplied=[...(Array.isArray(p.approvals)?p.approvals:[]),...(Array.isArray(p.features)?p.features:[])];
 return ['DTCP','RERA'].filter(name=>supplied.some(value=>typeof value==='string' && new RegExp('^'+name+'(?: approved)?$','i').test(value.trim()))).map(name=>name+' Approved');
}
