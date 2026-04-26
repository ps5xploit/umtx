// @ts-check

const LOCALSTORE_REDIRECTOR_LAST_URL_KEY = "redirector_last_url";
const SESSIONSTORE_ON_LOAD_AUTORUN_KEY = "on_load_autorun";
const MAINLOOP_EXECUTE_PAYLOAD_REQUEST = "mainloop_execute_payload_request";

let exploitStarted = false;

/**
 * ⚠️ FIX IMPORTANTE:
 * Antes: bloque global (rompía re-entradas)
 * Ahora: depende del modo wkOnly
 */
let payloadsInitialized = false;

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

    return;
}

async function switchPage(id, animate = true) {
    const parentElement = document.getElementById('main-content');
    const targetElement = document.getElementById(id);

    if (!targetElement || targetElement.parentElement !== parentElement) {
        throw new Error('Invalid target element');
    }

    const oldSelectedElement = parentElement.querySelector('.selected');

    if (oldSelectedElement) {
        if (animate) {
            await new Promise((resolve) => {
                oldSelectedElement.addEventListener("transitionend", function handler(e) {
                    if (e.target === oldSelectedElement) {
                        oldSelectedElement.removeEventListener("transitionend", handler);
                        resolve();
                    }
                });

                oldSelectedElement.classList.remove('selected');
            });
        } else {
            oldSelectedElement.style.setProperty('transition', 'none', 'important');
            oldSelectedElement.offsetHeight;
            oldSelectedElement.classList.remove('selected');
            oldSelectedElement.offsetHeight;
            oldSelectedElement.style.removeProperty('transition');
        }
    }

    if (animate) {
        await new Promise((resolve) => {
            targetElement.addEventListener("transitionend", function handler(e) {
                if (e.target === targetElement) {
                    targetElement.removeEventListener("transitionend", handler);
                    resolve();
                }
            });

            targetElement.classList.add('selected');
        });
    } else {
        targetElement.style.setProperty('transition', 'none', 'important');
        targetElement.offsetHeight;
        targetElement.classList.add('selected');
        targetElement.offsetHeight;
        targetElement.style.removeProperty('transition');
    }
}

function showToast(message, timeout = 2000) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');

    toast.className = 'toast';
    toast.textContent = message;

    toastContainer.appendChild(toast);

    toast.offsetHeight;
    toast.classList.add('show');

    if (timeout > 0) {
        setTimeout(() => removeToast(toast), timeout);
    }

    return toast;
}

async function removeToast(toast) {
    if (!toast) return;

    toast.classList.add('hide');

    toast.addEventListener('transitionend', () => {
        toast.remove();
    });
}

/**
 * 🔥 FIX PRINCIPAL AQUÍ
 * SOLO se activa cuando wkOnlyMode = true (post jailbreak)
 */
function populatePayloadsPage(wkOnlyMode = false) {
    const payloadsView = document.getElementById('payloads-view');
    const buttonsContainer = document.getElementById('payloads-buttons-right');

    if (!payloadsView || !buttonsContainer) return;

    /**
     * 🔥 CAMBIO CLAVE:
     * antes bloqueabas siempre -> rompía reentradas
     * ahora SOLO bloquea si ya se inicializó en modo wkOnly
     */
    if (wkOnlyMode && payloadsInitialized) return;

    // SOLO marcar inicializado en modo jailbreak real
    if (wkOnlyMode) payloadsInitialized = true;

    payloadsView.replaceChildren();
    buttonsContainer.replaceChildren();

    const debugMessage = document.createElement("div");
    debugMessage.classList.add("btn");
    debugMessage.style.pointerEvents = "none";
    debugMessage.style.cursor = "default";

    debugMessage.innerHTML = "★ Debug Settings Ready ✓<br>Waiting payload";

    payloadsView.appendChild(debugMessage);

    // ❌ IMPORTANTE: NO ocultar container (esto te podía romper layout / triggers)
    // buttonsContainer.style.display = "none";

    const dispatchPayload = (fileName) => {
        const payload = payload_map.find(p => p.fileName === fileName);
        if (!payload) return;

        window.dispatchEvent(
            new CustomEvent(MAINLOOP_EXECUTE_PAYLOAD_REQUEST, {
                detail: payload
            })
        );
    };

    const makeButton = (title, desc, info, file) => {
        const btn = document.createElement("a");
        btn.classList.add("btn", "w-100");
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
        makeButton("BackPork", "BackPork payload", "v0.1", "Backpork.elf")
    );

    buttonsContainer.appendChild(
        makeButton("shadowmount", "shadowmount payload", "v1.03", "shadowmount.elf")
    );
}
