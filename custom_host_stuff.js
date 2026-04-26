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
            await new Promise(r => setTimeout(r, 100));
        }

        await run_psfree(fw_str);

    } catch (error) {
        log("Webkit exploit failed: " + error, LogLevel.ERROR);
        log("Retrying in 2 seconds...", LogLevel.LOG);

        await new Promise(r => setTimeout(r, 2000));
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
   SWITCH PAGE
========================================================= */
async function switchPage(id, animate = true) {
    const parent = document.getElementById('main-content');
    const target = document.getElementById(id);

    if (!parent || !target || target.parentElement !== parent) {
        throw new Error('Invalid target element');
    }

    const old = parent.querySelector('.selected');

    if (old) {
        await new Promise(resolve => {
            if (!animate) {
                old.classList.remove('selected');
                resolve();
                return;
            }

            old.addEventListener("transitionend", function h(e) {
                if (e.target === old) {
                    old.removeEventListener("transitionend", h);
                    resolve();
                }
            });

            old.classList.remove('selected');
        });
    }

    await new Promise(resolve => {
        if (!animate) {
            target.classList.add('selected');
            resolve();
            return;
        }

        target.addEventListener("transitionend", function h(e) {
            if (e.target === target) {
                target.removeEventListener("transitionend", h);
                resolve();
            }
        });

        target.classList.add('selected');
    });
}

/* =========================================================
   PAYLOAD UI (FIX REAL)
========================================================= */
function populatePayloadsPage(wkOnlyMode = false) {

    const payloadsView = document.getElementById('payloads-view');
    const buttonsContainer = document.getElementById('payloads-buttons-right');

    if (!payloadsView || !buttonsContainer) return;

    /* 🔥 FIX CLAVE: idempotencia real */
    if (payloadsView.dataset.initialized === "1") return;
    payloadsView.dataset.initialized = "1";

    /* =========================
       DEBUG MESSAGE (UNA VEZ)
    ========================== */
    const debugMessage = document.createElement("div");
    debugMessage.className = "btn";
    debugMessage.style.pointerEvents = "none";
    debugMessage.style.cursor = "default";
    debugMessage.innerHTML = "★ Debug Settings Ready ✓<br>Waiting payload";

    payloadsView.appendChild(debugMessage);

    /* =========================
       PAYLOAD DISPATCH
    ========================== */
    const dispatchPayload = (fileName) => {
        const payload = payload_map.find(p => p.fileName === fileName);
        if (!payload) return;

        window.dispatchEvent(
            new CustomEvent(MAINLOOP_EXECUTE_PAYLOAD_REQUEST, {
                detail: payload
            })
        );
    };

    /* =========================
       BUTTON CREATION (NO RESET DOM)
    ========================== */

    const createButton = (title, desc, info, file) => {

        const btn = document.createElement("a");
        btn.className = "btn w-100";
        btn.tabIndex = 0;

        btn.innerHTML = `
            <p class='payload-btn-title'>${title}</p>
            <p class='payload-btn-description'>${desc}</p>
            <p class='payload-btn-info'>${info}</p>
        `;

        btn.onclick = () => dispatchPayload(file);

        return btn;
    };

    /* =========================
       AÑADIR SOLO UNA VEZ
    ========================== */

    if (!buttonsContainer.dataset.ready) {

        buttonsContainer.appendChild(
            createButton("BackPork", "BackPork payload", "v0.1", "Backpork.elf")
        );

        buttonsContainer.appendChild(
            createButton("shadowmount", "shadowmount payload", "v1.03", "shadowmount.elf")
        );

        buttonsContainer.dataset.ready = "1";
    }

    /* IMPORTANTE: NO display none (causa reflow raro) */
    buttonsContainer.style.visibility = "hidden";
}

/* =========================================================
   TOAST SYSTEM (SIN CAMBIOS CRÍTICOS)
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

async function removeToast(toast) {
    if (!toast) return;

    toast.classList.add('hide');

    toast.addEventListener('transitionend', () => {
        toast.remove();
    });
}