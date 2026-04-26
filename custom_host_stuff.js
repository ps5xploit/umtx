// @ts-check

const LOCALSTORE_REDIRECTOR_LAST_URL_KEY = "redirector_last_url";

const SESSIONSTORE_ON_LOAD_AUTORUN_KEY = "on_load_autorun";

const MAINLOOP_EXECUTE_PAYLOAD_REQUEST = "mainloop_execute_payload_request";

let exploitStarted = false;

async function run(wkonly = false, animate = true) {
    if (exploitStarted) {
        return;
    }
    exploitStarted = true;

    await switchPage("console-view", animate);

    // not setting it in the catch since we want to retry both on a handled error and on a browser crash
    sessionStorage.setItem(SESSIONSTORE_ON_LOAD_AUTORUN_KEY, wkonly ? "wkonly" : "kernel");

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

    log("Retrying in 4 seconds...", LogLevel.LOG);
    await new Promise((resolve) => setTimeout(resolve, 4000));
    window.location.reload();
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
            let oldSelectedElementTransitionEnd = new Promise((resolve) => {
                oldSelectedElement.addEventListener("transitionend", function handler(event) {
                    if (event.target === oldSelectedElement) {
                        oldSelectedElement.removeEventListener("transitionend", handler);
                        resolve();
                    }
                });
            });
            oldSelectedElement.classList.remove('selected');
            await oldSelectedElementTransitionEnd;
        } else {
            oldSelectedElement.style.setProperty('transition', 'none', 'important');
            oldSelectedElement.offsetHeight;
            oldSelectedElement.classList.remove('selected');
            oldSelectedElement.offsetHeight;
            oldSelectedElement.style.removeProperty('transition');
        }
    }

    if (animate) {
        let targetElementTransitionEnd = new Promise((resolve) => {
            targetElement.addEventListener("transitionend", function handler(event) {
                if (event.target === targetElement) {
                    targetElement.removeEventListener("transitionend", handler);
                    resolve();
                }
            });
        });
        targetElement.classList.add('selected');
        await targetElementTransitionEnd;
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

    appCache.addEventListener('cached', function (e) {
        createOrUpdateAppCacheToast('★ Finished caching site', 1500);
    }, false);

    appCache.addEventListener('checking', function (e) {
        createOrUpdateAppCacheToast('★ Check updates...');
    }, false);

    appCache.addEventListener('downloading', function (e) {
        createOrUpdateAppCacheToast('★ Downloading cache');
    }, false);

    appCache.addEventListener('error', function (e) {
        if (navigator.onLine) {
            createOrUpdateAppCacheToast('★ Error caching', 5000);
        } else {
            createOrUpdateAppCacheToast('★ Off-line wait...', 2000);
        }
    }, false);

    appCache.addEventListener('noupdate', function (e) {
        createOrUpdateAppCacheToast('★ Cache is up', 1500);
    }, false);

    appCache.addEventListener('obsolete', function (e) {
        createOrUpdateAppCacheToast('★ Site is obsolete');
    }, false);

    appCache.addEventListener('progress', function (e) {
        let dots = '.'.repeat(Math.min(Math.floor((e.loaded / e.total) * 3), 3));
        createOrUpdateAppCacheToast('★ Downloading cache' + dots);
        if (e.loaded + 1 == e.total) {
            createOrUpdateAppCacheToast("★ Done wait ...");
        }
    }, false);

    appCache.addEventListener('updateready', function (e) {
        if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
            createOrUpdateAppCacheToast('★ Site updated. Refresh');
        }
    }, false);
}

const TOAST_SUCCESS_TIMEOUT = 2000;
const TOAST_ERROR_TIMEOUT = 5000;

function showToast(message, timeout = 2000) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    toastContainer.appendChild(toast);

    toast.offsetHeight;

    toast.classList.add('show');

    if (timeout > 0) {
        setTimeout(() => {
            removeToast(toast);
        }, timeout);
    }

    return toast;
}

function updateToastMessage(toast, message) {
    if (!toast) {
        return;
    }
    toast.textContent = message;
}

async function removeToast(toast) {
    if (!toast) {
        return;
    }
    toast.classList.add('hide');
    toast.addEventListener('transitionend', () => {
        toast.remove();
    });
}

function populatePayloadsPage(wkOnlyMode = false) {
    const payloadsView = document.getElementById('payloads-view');

    while (payloadsView.firstChild) {
        payloadsView.removeChild(payloadsView.firstChild);
    }

    // Eliminar contenedor de botones previo si existe
    const oldButtonsContainer = document.getElementById('payloads-buttons-right');
    if (oldButtonsContainer) oldButtonsContainer.remove();

    const payloads = payload_map;

    for (const payload of payloads) {
        if (wkOnlyMode && !payload.toPort && !payload.customAction) {
            continue;
        }
        if (payload.supportedFirmwares && !payload.supportedFirmwares.some(fwPrefix => window.fw_str.startsWith(fwPrefix))) {
            continue;
        }
    }

    // Mensaje de estado fijo a la izquierda (donde siempre estuvo)
    const debugMessage = document.createElement("div");
    debugMessage.classList.add("btn");
    debugMessage.style.pointerEvents = "none";
    debugMessage.style.cursor = "default";
    debugMessage.innerHTML = "★ Debug Settings Ready ✓<br>Waiting payload";
    payloadsView.appendChild(debugMessage);

    // Contenedor de botones fijo a la derecha
    const buttonsContainer = document.createElement("div");
    buttonsContainer.id = "payloads-buttons-right";
    buttonsContainer.style.cssText = "position: fixed; right: 20px; top: 120px; z-index: 9999; text-align: right;";
    document.body.appendChild(buttonsContainer);

    // Botón BackPork
    const backporkButton = document.createElement("a");
    backporkButton.classList.add("btn", "w-100");
    backporkButton.tabIndex = 0;
    backporkButton.style.display = "block";
    backporkButton.innerHTML = "<p class='payload-btn-title'>BackPork</p><p class='payload-btn-description'>BackPork payload</p><p class='payload-btn-info'>v0.1</p>";
    backporkButton.addEventListener("click", function () {
        const payload = payload_map.find(p => p.fileName === "Backpork.elf");
        if (payload) window.dispatchEvent(new CustomEvent(MAINLOOP_EXECUTE_PAYLOAD_REQUEST, { detail: payload }));
    });
    buttonsContainer.appendChild(backporkButton);

    // Botón shadowmount
    const shadowButton = document.createElement("a");
    shadowButton.classList.add("btn", "w-100");
    shadowButton.tabIndex = 0;
    shadowButton.style.display = "block";
    shadowButton.innerHTML = "<p class='payload-btn-title'>shadowmount</p><p class='payload-btn-description'>shadowmount payload</p><p class='payload-btn-info'>v1.03</p>";
    shadowButton.addEventListener("click", function () {
        const payload = payload_map.find(p => p.fileName === "shadowmount.elf");
        if (payload) window.dispatchEvent(new CustomEvent(MAINLOOP_EXECUTE_PAYLOAD_REQUEST, { detail: payload }));
    });
    buttonsContainer.appendChild(shadowButton);
}