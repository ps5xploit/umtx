// @ts-check

const LOCALSTORE_REDIRECTOR_LAST_URL_KEY = "redirector_last_url";
const SESSIONSTORE_ON_LOAD_AUTORUN_KEY = "on_load_autorun";
const MAINLOOP_EXECUTE_PAYLOAD_REQUEST = "mainloop_execute_payload_request";

let exploitStarted = false;

/* =========================================================
   RUN
========================================================= */
async function run(wkonly = false, animate = true) {
    if (exploitStarted) return;

    exploitStarted = true;

    await switchPage("console-view", animate);

    sessionStorage.setItem(
        SESSIONSTORE_ON_LOAD_AUTORUN_KEY,
        wkonly ? "wkonly" : "kernel"
    );

    try {
        if (!animate) {
            await new Promise((r) => setTimeout(r, 100));
        }

        await run_psfree(fw_str);

    } catch (error) {
        log("Webkit exploit failed: " + error, LogLevel.ERROR);
        log("Retrying in 2 seconds...", LogLevel.LOG);

        await new Promise((r) => setTimeout(r, 2000));
        window.location.reload();
        return;
    }

    try {
        await main(window.p, wkonly);
    } catch (error) {
        log("Kernel exploit/main() failed: " + error, LogLevel.ERROR);
    }
}

/* =========================================================
   SWITCH PAGE (SIN CAMBIOS FUNCIONALES)
========================================================= */
async function switchPage(id, animate = true) {
    const parentElement = document.getElementById('main-content');
    const targetElement = document.getElementById(id);

    if (!parentElement || !targetElement || targetElement.parentElement !== parentElement) {
        throw new Error('Invalid target element');
    }

    const oldSelectedElement = parentElement.querySelector('.selected');

    if (oldSelectedElement) {
        if (animate) {
            await new Promise((resolve) => {
                oldSelectedElement.addEventListener("transitionend", function handler(event) {
                    if (event.target === oldSelectedElement) {
                        oldSelectedElement.removeEventListener("transitionend", handler);
                        resolve();
                    }
                });
                oldSelectedElement.classList.remove('selected');
            });
        } else {
            oldSelectedElement.classList.remove('selected');
        }
    }

    if (animate) {
        await new Promise((resolve) => {
            targetElement.addEventListener("transitionend", function handler(event) {
                if (event.target === targetElement) {
                    targetElement.removeEventListener("transitionend", handler);
                    resolve();
                }
            });

            targetElement.classList.add('selected');
        });
    } else {
        targetElement.classList.add('selected');
    }
}

/* =========================================================
   PAYLOAD UI (FIX REAL DEL PROBLEMA)
========================================================= */
function populatePayloadsPage(wkOnlyMode = false) {

    const payloadsView = document.getElementById('payloads-view');
    const buttonsContainer = document.getElementById('payloads-buttons-right');

    if (!payloadsView || !buttonsContainer) return;

    /* 🔥 FIX REAL: estado por DOM (NO global) */
    if (payloadsView.dataset.init === "1") return;
    payloadsView.dataset.init = "1";

    /* limpiar contenido */
    payloadsView.innerHTML = "";
    buttonsContainer.innerHTML = "";

    /* debug message */
    const debugMessage = document.createElement("div");
    debugMessage.className = "btn";
    debugMessage.style.pointerEvents = "none";
    debugMessage.style.cursor = "default";
    debugMessage.innerHTML = "★ Debug Settings Ready ✓<br>Waiting payload";

    payloadsView.appendChild(debugMessage);

    /* 🔥 FIX CRÍTICO: evita reflow agresivo */
    buttonsContainer.style.visibility = "hidden";

    const dispatchPayload = (fileName) => {
        const payload = payload_map.find(p => p.fileName === fileName);
        if (!payload) return;

        window.dispatchEvent(
            new CustomEvent(MAINLOOP_EXECUTE_PAYLOAD_REQUEST, {
                detail: payload
            })
        );
    };

    const createBtn = (title, desc, info, file) => {
        const btn = document.createElement("a");
        btn.className = "btn w-100";
        btn.tabIndex = 0;
        btn.style.display = "block";

        btn.innerHTML = `
            <p class='payload-btn-title'>${title}</p>
            <p class='payload-btn-description'>${desc}</p>
            <p class='payload-btn-info'>${info}</p>
        `;

        btn.onclick = () => dispatchPayload(file);

        return btn;
    };

    buttonsContainer.appendChild(
        createBtn("BackPork", "BackPork payload", "v0.1", "Backpork.elf")
    );

    buttonsContainer.appendChild(
        createBtn("shadowmount", "shadowmount payload", "v1.03", "shadowmount.elf")
    );
}

/* =========================================================
   TOAST SYSTEM (SIN CAMBIOS)
========================================================= */
function showToast(message, timeout = 2000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');

    toast.className = 'toast';
    toast.textContent = message;

    container.appendChild(toast);

    toast.offsetHeight;
    toast.classList.add('show');

    if (timeout > 0) {
        setTimeout(() => removeToast(toast), timeout);
    }

    return toast;
}

function updateToastMessage(toast, message) {
    if (!toast) return;
    toast.textContent = message;
}

async function removeToast(toast) {
    if (!toast) return;

    toast.classList.add('hide');

    toast.addEventListener('transitionend', () => {
        toast.remove();
    });
}