
// @ts-check

const LOCALSTORE_REDIRECTOR_LAST_URL_KEY = "redirector_last_url";
const SESSIONSTORE_ON_LOAD_AUTORUN_KEY = "on_load_autorun";
const MAINLOOP_EXECUTE_PAYLOAD_REQUEST = "mainloop_execute_payload_request";

let exploitStarted = false;
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
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        await run_psfree(fw_str);

    } catch (error) {
        log("Webkit exploit failed: " + error, LogLevel.ERROR);
        log("Retrying in 2 seconds...", LogLevel.LOG);

        await new Promise((resolve) => setTimeout(resolve, 2000));
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
   SWITCH PAGE (SIN CAMBIOS)
========================================================= */
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
   🔥 FIX REAL DEL "REFRESH VISUAL"
========================================================= */
function populatePayloadsPage(wkOnlyMode = false) {

    const payloadsView = document.getElementById('payloads-view');
    const buttonsContainer = document.getElementById('payloads-buttons-right');

    if (!payloadsView || !buttonsContainer) return;

    /* 🔴 FIX 1: evitar reinit duplicado */
    if (payloadsInitialized) return;
    payloadsInitialized = true;

    /* 🔴 FIX 2: NO replaceChildren (causa repaint fuerte) */
    payloadsView.innerHTML = "";
    buttonsContainer.innerHTML = "";

    const debugMessage = document.createElement("div");
    debugMessage.className = "btn";
    debugMessage.style.pointerEvents = "none";
    debugMessage.style.cursor = "default";
    debugMessage.innerHTML = "★ Debug Settings Ready ✓<br>Waiting payload";

    payloadsView.appendChild(debugMessage);

    /* 🔴 FIX 3: NO display none (provoca reflow fuerte) */
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

    const backporkButton = document.createElement("a");
    backporkButton.className = "btn w-100";
    backporkButton.tabIndex = 0;
    backporkButton.style.display = "block";

    backporkButton.innerHTML =
        "<p class='payload-btn-title'>BackPork</p><p class='payload-btn-description'>BackPork payload</p><p class='payload-btn-info'>v0.1</p>";

    backporkButton.onclick = () => dispatchPayload("Backpork.elf");

    buttonsContainer.appendChild(backporkButton);

    const shadowButton = document.createElement("a");
    shadowButton.className = "btn w-100";
    shadowButton.tabIndex = 0;
    shadowButton.style.display = "block";

    shadowButton.innerHTML =
        "<p class='payload-btn-title'>shadowmount</p><p class='payload-btn-description'>shadowmount payload</p><p class='payload-btn-info'>v1.03</p>";

    shadowButton.onclick = () => dispatchPayload("shadowmount.elf");

    buttonsContainer.appendChild(shadowButton);
}