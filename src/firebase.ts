import {initializeApp} from 'firebase/app';
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged,type User} from 'firebase/auth';
import {getFirestore,doc,getDoc,runTransaction} from 'firebase/firestore';
import {validateDataset,type Dataset} from './valuation';
const config={apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID};
export const firebaseReady=Object.values(config).every(Boolean);
const app=firebaseReady?initializeApp(config):null;const auth=app?getAuth(app):null;const db=app?getFirestore(app):null;
export const login=async()=>{if(!auth)throw Error('Firebase configuration is not installed. See the deployment guide.');await signInWithPopup(auth,new GoogleAuthProvider());};
export const logout=()=>auth?signOut(auth):Promise.resolve();
export const watchAuth=(cb:(u:User|null)=>void)=>auth?onAuthStateChanged(auth,cb):()=>{};
export async function loadCloud(uid:string){if(!db)throw Error('Firebase not configured.');const snap=await getDoc(doc(db,'users',uid,'inventory','workspace'));return snap.exists()?{data:validateDataset(snap.data().data),revision:snap.data().revision as number}:null;}
export async function saveCloud(uid:string,data:Dataset,expectedRevision:number){if(!db)throw Error('Firebase not configured.');validateDataset(data);const ref=doc(db,'users',uid,'inventory','workspace');await runTransaction(db,async tx=>{const snap=await tx.get(ref);const current=snap.exists()?snap.data().revision:0;if(current!==expectedRevision)throw Error('Cloud version changed. Download a local backup, then load the cloud version before saving again.');tx.set(ref,{data,revision:current+1,updatedAt:new Date().toISOString()});});return expectedRevision+1;}
