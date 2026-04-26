// @ts-check

const CUSTOM_ACTION_APPCACHE_REMOVE = "appcache-remove";

/**
 * @typedef {Object} PayloadInfo
 * @property {string} displayTitle
 * @property {string} description
 * @property {string} fileName - path relative to the payloads folder
 * @property {string} author
 * @property {string} projectSource
 * @property {string} binarySource - should be direct download link to the included version, so that you can verify the hashes
 * @property {string} version
 * @property {string[]?} [supportedFirmwares] - optional, these are interpreted as prefixes, so "" would match all, and "4." would match 4.xx, if not set, the payload is assumed to be compatible with all firmwares
 * @property {number?} [toPort] - optional, if the payload should be sent to "127.0.0.1:<port>" instead of loading directly, if specified it'll show up in webkit-only mode too
 * @property {string?} [customAction]
 */

/**
 * @type {PayloadInfo[]}
*/
const payload_map = [
    // { // auto-loaded
    //     displayTitle: "PS5 Payload ELF Loader",
    //     description: "Uses port 9021. Persistent network elf loader",
    //     fileName: "elfldr.elf",
    //     author: "john-tornblom",
    //     projectSource: "https://github.com/ps5-payload-dev/elfldr",
    //     binarySource: "https://github.com/ps5-payload-dev/elfldr/releases/download/v0.19/Payload.zip",
    //     version: "0.19",
    //     supportedFirmwares: ["1.", "2.", "3.", "4.", "5."]
    // },
    {
        displayTitle: "etaHEN",
        description: "AIO HEN",
        fileName: "etaHEN.bin",
        author: "LightningMods, Buzzer, sleirsgoevy, ChendoChap, astrelsky, illusion, CTN, SiSTR0, Nomadic",
        projectSource: "https://github.com/LightningMods/etaHEN",
        binarySource: "https://github.com/LightningMods/etaHEN/releases/download/1.9b/etaHEN.bin",
        version: "2.2b",
         supportedFirmwares: ["1.", "2.", "3.", "4.", "5."],
    },
    {
        displayTitle: "BackPork",
        description: "BackPork payload",
        fileName: "Backpork.elf",
        author: "BackPork",
        projectSource: "BackPork",
        binarySource: "BackPork",
        version: "0.1",
        supportedFirmwares: ["1.", "2.", "3.", "4.", "5."],
        toPort: 9021
    },
    {
        displayTitle: "shadowmount",
        description: "shadowmount payload",
        fileName: "shadowmount.elf",
        author: "shadowmount",
        projectSource: "shadowmount",
        binarySource: "shadowmount",
        version: "1.03",
        supportedFirmwares: ["1.", "2.", "3.", "4.", "5."],
        toPort: 9021
    },

    // {
    //     // https://github.com/Storm21CH/PS5_Browser_appCache_remove
    //     displayTitle: "Browser appcache remover",
    //     description: "Deletes for only the current user in webkit-only mode",
    //     fileName: "",
    //     author: "Storm21CH, idlesauce",
    //     projectSource: "",
    //     binarySource: "",
    //     version: "1.0",
    //     customAction: CUSTOM_ACTION_APPCACHE_REMOVE
    // }
];