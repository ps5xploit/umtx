// @ts-check

const LOCALSTORE_REDIRECTOR_LAST_URL_KEY = "redirector_last_url";
const SESSIONSTORE_ON_LOAD_AUTORUN_KEY = "on_load_autorun";
const MAINLOOP_EXECUTE_PAYLOAD_REQUEST = "mainloop_execute_payload_request";

let exploitStarted = false;
let payloadsInitialized = false;

/* =========================
   HEX STYLE INJECT
========================= */
const hexStyle = document.createElement("style");
hexStyle.textContent = `
:root{
  --sqrt3: 1.7320508075688772;
  --edge-size: 70px;
  --hex-width: calc(var(--edge-size) * 2);
  --hex-height: calc(var(--sqrt3) * var(--edge-size));
  --soft-yellow: rgba(0,255,0,1);
  --ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
  --ease-out-quart: cubic-bezier(0.165, 0.84, 0.44, 1);
}

.hex-btn {
  position: relative;
  width: var(--hex-width);
  height: var(--hex-height);
  margin: 18px auto;
  cursor: pointer;
  transform: rotate(30deg);
}

.hex-btn:hover .hex:last-child {
  transform: scale(1.25);
  opacity: 1;
}

.hex-btn:hover .hex:first-child {
  transform: scale(1.15);
  opacity: 1;
}

.hex {
  position: absolute;
  top: 0;
  left: calc(var(--edge-size) / 2);
  width: var(--edge-size);
  height: var(--hex-height);
  opacity: 0.6;
}

.hex:first-child {
  transform: scale(0.9);
  transition: all 0.3s var(--ease-out-quart);
}

.hex:last-child {
  transition: all 0.3s var(--ease-out-expo);
}

.hex div {
  position: absolute;
  width: var(--edge-size);
  height: var(--hex-height);
}

.hex div:before,
.hex div:after {
  content: '';
  position: absolute;
  width: 100%;
  height: 1px;
  background: var(--soft-yellow);
  transition: height 0.3s;
}

.hex div:before { top: 0; }
.hex div:after { bottom: 0; }

.hex div:nth-child(1) { transform: rotate(0deg); }
.hex div:nth-child(2) { transform: rotate(60deg); }
.hex div:nth-child(3) { transform: rotate(120deg); }

.hex div { transform-origin: center; }

.hex-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  color: #0f0;
  font-family: monospace;
  font-size: 11px;
  text-align: center;
  pointer-events: none;
}
`;
document.head.appendChild(hexStyle);

/* =========================
   RUN
========================= */
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

/* =========================
   SWITCH PAGE (UNCHANGED)
========================= */
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

/* =========================
   PAYLOAD UI (HEX VERSION)
========================= */
function populatePayloadsPage(wkOnlyMode = false) {
    const payloadsView = document.getElementById('payloads-view');
    const buttonsContainer = document.getElementById('payloads-buttons-right');

    const storedMode = sessionStorage.getItem(SESSIONSTORE_ON_LOAD_AUTORUN_KEY);
    const isWkOnly = wkOnlyMode || storedMode === "wkonly";

    payloadsView.replaceChildren();

    const debugMessage = document.createElement("div");
    debugMessage.classList.add("btn");
    debugMessage.style.pointerEvents = "none";
    debugMessage.style.cursor = "default";

    if (!isWkOnly) {
        debugMessage.innerHTML =
            "★ Debug Settings Ready ✓<br>Exit and Return to send payloads";

        payloadsView.appendChild(debugMessage);

        buttonsContainer.replaceChildren();
        buttonsContainer.style.display = "none";

        payloadsInitialized = false;
        return;
    }

    debugMessage.innerHTML =
        "★ Debug Settings Ready ✓<br>Waiting payload";

    payloadsView.appendChild(debugMessage);

    buttonsContainer.style.display = "block";

    if (payloadsInitialized) return;
    payloadsInitialized = true;

    buttonsContainer.replaceChildren();

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

    /* =========================
       HEX BUTTON FACTORY
    ========================= */
    const makeHexBtn = (title, desc, file, ver) => {
        const wrapper = document.createElement("div");
        wrapper.className = "hex-btn";

        const mkHex = () => {
            const hex = document.createElement("div");
            hex.className = "hex";
            hex.innerHTML = "<div></div><div></div><div></div>";
            return hex;
        };

        const h1 = mkHex();
        const h2 = mkHex();

        const label = document.createElement("div");
        label.className = "hex-label";
        label.innerHTML = `${title}<br>${ver}`;

        wrapper.appendChild(h1);
        wrapper.appendChild(h2);
        wrapper.appendChild(label);

        wrapper.onclick = () => dispatchPayload(file);

        return wrapper;
    };

    buttonsContainer.appendChild(
        makeHexBtn("BackPork", "BackPork payload", "Backpork.elf", "v0.1")
    );

    buttonsContainer.appendChild(
        makeHexBtn("shadowmount", "shadowmount payload", "shadowmount.elf", "v1.03")
    );
}
