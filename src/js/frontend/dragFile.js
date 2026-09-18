// dragDrop.js
import { gamePill, editorPill, setSaveName, new_update_notifications, setIsShowingNotification } from "./renderer.js";
import { saveHandleToRecents, getRecentHandles } from "./recentsManager.js";
import { Command } from "../backend/command.js";

let carAnalysisUtils = null;
export const dbWorker = new Worker(new URL('../backend/worker.js', import.meta.url));

let currentFileHandle = null;
export function getCurrentFileHandle() { return currentFileHandle; }
export function setCurrentFileHandle(handle) { currentFileHandle = handle; }

const dropDiv = document.querySelector(".drop-div");
const statusCircle = document.getElementById("statusCircle");
const statusIcon = document.getElementById("statusIcon");
const statusTitle = document.getElementById("statusTitle");
const loadingSpinner = document.querySelector(".loading-spinner");
const statusDesc = document.getElementById("statusDesc");
const body = document.querySelector("body");

export const handleDragEnter = (event) => {
    event.preventDefault();
    body.classList.add("drag-active");
};

export const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
};

export const handleDragLeave = (event) => {
    event.preventDefault();
    body.classList.remove("drag-active");
};

export const handleDrop = async (event) => {
    event.preventDefault();
    body.classList.remove("drag-active");

    const item = event.dataTransfer.items[0];
    
    // ... el resto de tu lógica de drop ...
    if (item && item.kind === 'file') {
        try {
            const handle = await item.getAsFileSystemHandle();
            
            if (handle) {
                currentFileHandle = handle;
                await saveHandleToRecents(handle);
                const file = await handle.getFile();
                await processSaveFile(file)
            } else {
                const file = item.getAsFile();
                await processSaveFile(file);
            }
        } catch (e) {
            console.error("Error with file handle:", e);
            const file = event.dataTransfer.files[0];
            await processSaveFile(file);
        }
    }
};

dropDiv.addEventListener("dragenter", handleDragEnter);
dropDiv.addEventListener("dragover", handleDragOver);
dropDiv.addEventListener("dragleave", handleDragLeave);
dropDiv.addEventListener("drop", handleDrop);

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));


export async function processSaveFile(file) {
    if (!file) return;

    // A save opened by hand (drop, picker, recents) takes over from the watcher's one
    if (localSave && localSave.file !== file) localSave = null;

    // --- Validaciones de archivo ---
    if (file.name.split('.').pop() === "vdf") {
        console.error("File not supported");
        new_update_notifications(
            'File type not supported. See <a href="https://www.youtube.com/watch?v=w-USlPQxZm0" target="_blank">this video</a> to find your save file.',
            "error"
        );
        return;
    } else if (file.name.split('.').pop() === "sav") {
        
        const footerNotification = document.querySelector('.footer-notification');
        if (footerNotification && footerNotification.classList.contains('error')) {
            footerNotification.classList.remove('show');
            setIsShowingNotification(false);
        }
        
        setSaveName(file.name);

        // 1. Ponemos el icono en modo SPINNER
        await updateStatusUI('loading');

        // 2. Definimos la tarea de carga
        const dbLoadTask = new Promise((resolve, reject) => {
            dbWorker.postMessage({ command: 'loadDB', data: { file: file } });

            dbWorker.onmessage = (msg) => {
                if (msg.data.responseMessage === "Database loaded") {
                    console.log("[Main Thread] Database loaded in Worker");
                    const dateObj = new Date(msg.data.content);
                    const day = dateObj.getDate();
                    const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(dateObj);
                    const year = dateObj.getFullYear();
                    const completeDay = day + (day % 10 == 1 && day != 11 ? "st" : day % 10 == 2 && day != 12 ? "nd" : day % 10 == 3 && day != 13 ? "rd" : "th");
                    
                    document.querySelector("#dateDay").textContent = completeDay;
                    document.querySelector("#dateMonth").textContent = month;
                    document.querySelector("#dateYear").textContent = year;
                    document.querySelector("#dateDay2026").textContent = completeDay;
                    document.querySelector("#dateMonth2026").textContent = month;
                    document.querySelector("#dateYear2026").textContent = year;           

                    resolve(); 
                } else if (msg.data.error) {
                    console.error("[Main Thread] Error loading DB:", msg.data.error);
                    reject(new Error(msg.data.error));
                }
            };
        });

        // 3. Ejecutamos: Carga + Espera
        try {
            await Promise.all([
                dbLoadTask,
                wait(2000)
            ]);

            // 4. Ponemos el icono en modo CHECK VERDE
            await updateStatusUI('success', { filename: file.name });

            // 5. Esperamos 1 segundo extra
            await wait(1000);

            // 6. Finalmente mostramos el editor
            editorPill.classList.remove("d-none");
            gamePill.classList.remove("d-none");

            const command = new Command("saveSelected", {});
            command.execute();

            document.querySelector(".script-selector").classList.remove("hidden");
            document.querySelector(".footer").classList.remove("hidden");

        } catch (error) {
            console.error("Error en el proceso:", error);
            // Aquí podrías manejar el error visualmente si quisieras
        }
    }
}


// --- Local mode (served by watcher/watcher.js) ---
// The watcher serves the newest save from the game's SaveGames directory and
// accepts exports back, so no file handle or download is needed.
const LOCAL_SAVE_POLL_MS = 5 * 60 * 1000;
let localSave = null; // { name, mtime } of the save loaded from the watcher
let dismissedLocalSaveMtime = 0;

export function getLocalSave() { return localSave; }

async function loadLatestLocalSave() {
    const res = await fetch('/api/latest-save', { cache: 'no-store' });
    if (!res.ok) throw new Error('No save available');
    const name = (res.headers.get('Content-Disposition') || '').match(/filename="(.+)"/)?.[1] || 'save.sav';
    const mtime = Number(res.headers.get('X-Save-Mtime')) || Date.now();
    const file = new File([await res.blob()], name);
    currentFileHandle = null;
    clearTimeout(autosaveTimer);
    localSave = { name, mtime, file };
    await processSaveFile(file);
}

export async function writeLocalSave(data) {
    const target = localSave;
    const res = await fetch(`/api/save/${encodeURIComponent(target.name)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/octet-stream',
            // First write since this save was loaded: have the watcher keep a copy of the original
            ...(target.backedUp ? {} : { 'X-Backup': '1' }),
        },
        body: data,
    });
    if (!res.ok) throw new Error(await res.text());
    if (localSave === target) localSave = { ...(await res.json()), backedUp: true };
}

// --- Autosave: the worker reports "DB modified" after any command that wrote
// to the database; a couple of seconds later we export and push to the watcher.
const AUTOSAVE_DELAY_MS = 2000;
let autosaveTimer = null;
let autosaveRunning = false;
let autosavePending = false;

function setAutosaveStatus(text, isError = false) {
    let pill = document.querySelector('.local-autosave-status');
    if (!pill) {
        pill = document.createElement('div');
        pill.className = 'local-autosave-status';
        pill.style.cssText = 'position:fixed;right:20px;bottom:30px;z-index:2000;padding:3px 10px;border-radius:12px;' +
            'background:#1f1f2b;border:1px solid #3a3a4d;font-size:12px;pointer-events:none;';
        document.body.appendChild(pill);
    }
    pill.textContent = text;
    pill.style.color = isError ? '#ff6b6b' : '#9fe6a0';
}

function exportSaveData() {
    return new Promise((resolve, reject) => {
        const handler = (msg) => {
            const response = msg.data;
            if (response?.command !== 'exportSave') return;
            if (response.responseMessage !== 'Database exported' && !response.error) return;
            dbWorker.removeEventListener('message', handler);
            if (response.error || response.content?.finalData == null) reject(new Error(response.error || 'Missing exported data'));
            else resolve(response.content.finalData);
        };
        dbWorker.addEventListener('message', handler);
        dbWorker.postMessage({ command: 'exportSave', data: {} });
    });
}

async function runAutosave() {
    if (!localSave) return;
    if (autosaveRunning) { autosavePending = true; return; }
    autosaveRunning = true;
    setAutosaveStatus('Saving…');
    try {
        const finalData = await exportSaveData();
        await writeLocalSave(new Blob([finalData], { type: 'application/binary' }));
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setAutosaveStatus(`Saved to ${localSave.name} at ${time}`);
    } catch (e) {
        console.error('Autosave failed:', e);
        setAutosaveStatus(`Autosave failed: ${e.message} (will retry on next edit)`, true);
    } finally {
        autosaveRunning = false;
        if (autosavePending) { autosavePending = false; scheduleAutosave(); }
    }
}

function scheduleAutosave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(runAutosave, AUTOSAVE_DELAY_MS);
}

dbWorker.addEventListener('message', (msg) => {
    if (msg.data?.responseMessage !== 'DB modified' || !localSave) return;
    // Loading a save writes the editor's own bookkeeping tables; that alone isn't worth a write
    if (msg.data.command === 'saveSelected') return;
    scheduleAutosave();
});

function offerLocalSaveSwitch(latest) {
    document.querySelector('.local-save-offer')?.remove();

    const offer = document.createElement('div');
    offer.className = 'local-save-offer';
    offer.style.cssText = 'position:fixed;right:20px;bottom:60px;z-index:2000;padding:12px 16px;border-radius:8px;' +
        'background:#1f1f2b;color:#fff;border:1px solid #3a3a4d;box-shadow:0 4px 16px rgba(0,0,0,.4);font-size:14px;';
    const time = new Date(latest.mtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const text = document.createElement('div');
    text.textContent = `Newer save found: ${latest.name} (${time}). Unsaved edits will be lost.`;
    const buttons = document.createElement('div');
    buttons.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;margin-top:10px;';
    const switchButton = document.createElement('button');
    switchButton.className = 'btn btn-sm btn-primary';
    switchButton.textContent = 'Switch';
    const dismissButton = document.createElement('button');
    dismissButton.className = 'btn btn-sm btn-secondary';
    dismissButton.textContent = 'Dismiss';
    buttons.append(dismissButton, switchButton);
    offer.append(text, buttons);

    switchButton.addEventListener('click', () => {
        offer.remove();
        loadLatestLocalSave().catch(e => console.error('Switching save failed:', e));
    });
    dismissButton.addEventListener('click', () => {
        dismissedLocalSaveMtime = latest.mtime;
        offer.remove();
    });

    document.body.appendChild(offer);
}

async function checkForNewerLocalSave() {
    if (!localSave) return;
    try {
        const res = await fetch('/api/latest-save/info', { cache: 'no-store' });
        if (!res.ok) return;
        const latest = await res.json();
        if (latest.mtime > localSave.mtime + 1 && latest.mtime > dismissedLocalSaveMtime) offerLocalSaveSwitch(latest);
    } catch (e) {
        console.log('Local save check failed:', e.message);
    }
}

if (window.__SAVE_WATCHER__) {
    loadLatestLocalSave()
        .then(() => setInterval(checkForNewerLocalSave, LOCAL_SAVE_POLL_MS))
        .catch(e => console.log('Auto-load skipped:', e.message));
}

async function updateStatusUI(type, textConfig) {
    statusIcon.classList.add("icon-scale-0");
    
    await wait(170);

    if (type === 'loading') {
        loadingSpinner.classList.add("show");
        statusCircle.classList.remove("success-mode");
        
        statusTitle.textContent = "Analyzing database...";
        statusDesc.innerText = "This may take a few seconds.";
        
    } else if (type === 'success') {
        loadingSpinner.classList.remove("show");
        // Cambiar icono a Check y Colores
        statusIcon.className = "bi bi-check-lg"; // Volvemos a poner clase de icono
        statusIcon.classList.add("success-mode"); // Color verde al icono
        statusCircle.classList.add("success-mode"); // Fondo verde al circulo
        
        // Textos
        statusTitle.textContent = "Save loaded successfully!";
        statusDesc.innerText = textConfig.filename;

        await wait(50); 
        statusIcon.classList.remove("icon-scale-0");
    }
    
    
}
