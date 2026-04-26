// @ts-check

const LOCALSTORE_REDIRECTOR_LAST_URL_KEY = "redirector_last_url";
const SESSIONSTORE_ON_LOAD_AUTORUN_KEY = "on_load_autorun";
const MAINLOOP_EXECUTE_PAYLOAD_REQUEST = "mainloop_execute_payload_request";

let exploitStarted = false;

// 🚨 FIX: evitar múltiples inicializaciones de payload UI
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
                oldSelectedElement.addEventListener("transitionend", function handler(event) {
                    if (event.target === oldSelectedElement) {
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
            targetElement.addEventListener("transitionend", function handler(event) {
                if (event.target === targetElement) {
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

function registerAppCacheEventHandlers() {
    var appCache = window.applicationCache;

    let toast;

    function createOrUpdateAppCacheToast(message, timeout = -1) {
        if (!toast) {
            toast = showToast(message, timeout);
        } else {
            updateToastMessage(toast, message);
        }

        if (timeout > 0) {
            setTimeout(() => {
                removeToast(toast);
                toast = null;
            }, timeout);
        }
    }

    if (document.documentElement.hasAttribute("manifest")) {
        if (!navigator.onLine) {
            createOrUpdateAppCacheToast('★ Off-line wait...', 2000);
        } else {
            createOrUpdateAppCacheToast("★ Check updates...");
        }
    }

    appCache.addEventListener('cached', () => {
        createOrUpdateAppCacheToast('★ Finished caching site', 1500);
    });

    appCache.addEventListener('checking', () => {
        createOrUpdateAppCacheToast('★ Check updates...');
    });

    appCache.addEventListener('downloading', () => {
        createOrUpdateAppCacheToast('★ Downloading cache');
    });

    appCache.addEventListener('error', () => {
        if (navigator.onLine) {
            createOrUpdateAppCacheToast('★ Error caching', 5000);
        } else {
            createOrUpdateAppCacheToast('★ Off-line wait...', 2000);
        }
    });

    appCache.addEventListener('noupdate', () => {
        createOrUpdateAppCacheToast('★ Cache is up', 1500);
    });

    appCache.addEventListener('obsolete', () => {
        createOrUpdateAppCacheToast('★ Site is obsolete');
    });

    appCache.addEventListener('progress', (e) => {
        let dots = '.'.repeat(Math.min(Math.floor((e.loaded / e.total) * 3), 3));
        createOrUpdateAppCacheToast('★ Downloading cache' + dots);

        if (e.loaded + 1 == e.total) {
            createOrUpdateAppCacheToast("★ Done wait ...");
        }
    });

    appCache.addEventListener('updateready', () => {
        if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
            createOrUpdateAppCacheToast('★ Site updated. Refresh');
        }
    });
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

function populatePayloadsPage(wkOnlyMode = false) {
    const payloadsView = document.getElementById('payloads-view');
    const buttonsContainer = document.getElementById('payloads-buttons-right');

    // 🚨 FIX CRÍTICO: evitar reconstrucción múltiple (causa del “refresh”)
    if (payloadsInitialized) return;
    payloadsInitialized = true;

    // limpiar SOLO una vez
    payloadsView.replaceChildren();
    buttonsContainer.replaceChildren();

    const debugMessage = document.createElement("div");
    debugMessage.classList.add("btn");
    debugMessage.style.pointerEvents = "none";
    debugMessage.style.cursor = "default";
    debugMessage.innerHTML = "★ Debug Settings Ready ✓<br>Waiting payload";

    payloadsView.appendChild(debugMessage);

    buttonsContainer.style.display = "none";

    // helper para evitar listeners duplicados
    const dispatchPayload = (fileName) => {
        const payload = payload_map.find(p => p.fileName === fileName);
        if (payload) {
            window.dispatchEvent(
                new CustomEvent(MAINLOOP_EXECUTE_PAYLOAD_REQUEST, {
                    detail: payload
                })
            );
        }
    };

    const backporkButton = document.createElement("a");
    backporkButton.classList.add("btn", "w-100");
    backporkButton.tabIndex = 0;
    backporkButton.style.display = "block";
    backporkButton.innerHTML =
        "<p class='payload-btn-title'>BackPork</p><p class='payload-btn-description'>BackPork payload</p><p class='payload-btn-info'>v0.1</p>";

    backporkButton.onclick = () => dispatchPayload("Backpork.elf");

    buttonsContainer.appendChild(backporkButton);

    const shadowButton = document.createElement("a");
    shadowButton.classList.add("btn", "w-100");
    shadowButton.tabIndex = 0;
    shadowButton.style.display = "block";
    shadowButton.innerHTML =
        "<p class='payload-btn-title'>shadowmount</p><p class='payload-btn-description'>shadowmount payload</p><p class='payload-btn-info'>v1.03</p>";

    shadowButton.onclick = () => dispatchPayload("shadowmount.elf");

    buttonsContainer.appendChild(shadowButton);
}