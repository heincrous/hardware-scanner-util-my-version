import fs from "fs";
const swi = require("../native/build/Release/swi_decoder.node");

// -------------------------------------------------------
// Load WI image (already extracted from licence)
// -------------------------------------------------------

// const raw = fs.readFileSync("wi_image.raw");
const raw = fs.readFileSync("src/core/__tests__/female.wi");

// -------------------------------------------------------
// Convert to Uint8Array (required for N-API buffer)
// -------------------------------------------------------

// Convert to real Node buffer
const wi = Buffer.from(raw);

console.log("WI size:", wi.length);
console.log("WI header bytes:", wi[0].toString(16), wi[1].toString(16), wi[2].toString(16), wi[3].toString(16));

// -------------------------------------------------------
// Decode
// -------------------------------------------------------

try {
    const result = swi.decode(wi);

    console.log("Decoded SWI Image:");
    console.log({
        width: result.width,
        height: result.height,
        dataLength: result.data.length
    });

    // Save output buffer
    fs.writeFileSync("decoded.raw", result.data);

} catch (err) {
    console.error("Decoder crashed:", err);
}
