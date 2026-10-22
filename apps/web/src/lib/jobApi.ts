import type { JobInput, SavedJobInput } from '@pba/shared';
import { getApiBaseUrl } from './config'; import { authHeaders } from './session'; const uid = import.meta.env.VITE_USER_ID as string|undefined; const email = import.meta.env.VITE_USER_EMAIL as string|undefined;
export type JobRecord = JobInput & { id:string; userId:string; savedJob:{id:string;notes:string|null;priority:string;savedAt:string}|null; createdAt:string; updatedAt:string };
async function request<T>(path:string, init:RequestInit={}):Promise<T>{const response=await fetch(`${getApiBaseUrl()}${path}`,{...init,credentials:'include',headers:{'Content-Type':'application/json',...authHeaders(uid,email),...init.headers}});if(!response.ok){const body=await response.json().catch(()=>({}));throw new Error(body.error??'The job request could not be completed.');}return response.status===204?(undefined as T):response.json();}
export const listJobs=(filters:{search?:string;saved?:boolean;remoteStatus?:string})=>request<{jobs:JobRecord[]}>(`/jobs?${new URLSearchParams(Object.entries(filters).filter(([,value])=>value!==undefined&&value!==''&&value!==false).map(([key,value])=>[key,String(value)]))}`);
export const createJob=(body:JobInput)=>request<{job:JobRecord}>('/jobs',{method:'POST',body:JSON.stringify(body)});
export const saveJob=(id:string,body:SavedJobInput)=>request<{savedJob:JobRecord['savedJob']}>(`/jobs/${id}/save`,{method:'POST',body:JSON.stringify(body)});
export const unsaveJob=(id:string)=>request<void>(`/jobs/${id}/save`,{method:'DELETE'});
