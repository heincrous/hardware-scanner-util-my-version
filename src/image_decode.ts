import fs from "fs";
const swi = require("../native/build/Release/swi_decoder.node");

// -------------------------------------------------------
// CONFIG: toggle between REAL licence WI or TEST WI
// -------------------------------------------------------
const TEST_MODE = false;      // <---- change to true to run known-good test
const TEST_HEX = `
57490100080008000C000000000000000000004D6F64756C655465737400000000
785E5D4B4A494847464544434241403F3D3C3B3938363534333231302F2E2D2C
2B292827262524232221201F1E1D1C1B1A191817161514131211100F0E0D0C0B
0A0908070605040302010000
`;

// -------------------------------------------------------
// LOAD DATA: either real WI or built-in test WI
// -------------------------------------------------------
let raw: Buffer;

if (TEST_MODE) {
    console.log("TEST_MODE = TRUE (Using built-in WI v1 test image)");
    const cleanHex = TEST_HEX.replace(/\s+/g, "");
    raw = Buffer.from(cleanHex, "hex");
} else {
    console.log("TEST_MODE = FALSE (Reading wi_image.raw)");
    raw = fs.readFileSync("wi_image.raw");
}

// -------------------------------------------------------
// Convert to contiguous Uint8Array (CRITICAL for SWI)
// -------------------------------------------------------
const wi = new Uint8Array(raw.length);
for (let i = 0; i < raw.length; i++) {
    wi[i] = raw[i];
}

console.log("WI size:", wi.length);
console.log("WI header:", wi[0].toString(16), wi[1].toString(16));

try {
    const result = swi.decode(wi);

    console.log("Decoded SWI Image:");
    console.log(result);

    // Write decoded RGB buffer (optional)
    fs.writeFileSync(TEST_MODE ? "decoded_test.raw" : "decoded.raw", result.data);

} catch (err) {
    console.error("Decoder crashed:", err);
}
