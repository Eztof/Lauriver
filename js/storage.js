// js/storage.js
import { supabase } from "./supabaseClient.js";
import { APP } from "./config.js";


export async function uploadFile(file) {
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error("Nicht angemeldet");
const path = `${user.id}/${Date.now()}_${file.name}`;
const { error } = await supabase.storage.from(APP.storageBucket).upload(path, file);
if (error) throw error;
return path;
}


export async function signedUrl(path, expiresInSec = 3600) {
const { data, error } = await supabase.storage
.from(APP.storageBucket)
.createSignedUrl(path, expiresInSec);
if (error) throw error;
return data.signedUrl;
}