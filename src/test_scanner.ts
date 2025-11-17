import fs from "fs";
const swi = require("../native/build/Release/swi_decoder.node");
import { ZADriversBarcodeProcessor } from './core/ZADriversDecodeUtil';
import { Buffer } from 'buffer';

// Load sample base64 barcode
const base64 = fs.readFileSync('src/core/__tests__/license_sample.base64', 'utf8').trim();

// Convert to raw bytes
const buffer = Buffer.from(base64, 'base64');

// Decode licence structure (this also saves wi_image.raw)
const info = ZADriversBarcodeProcessor.process(buffer);

// Extract and print textual licence info
const {
  surname,
  initials,
  idNumber,
  birthDate,
  gender,
  licenseNumber,
  licenseValidityStart,
  licenseValidityExpiry,
  vehicleLicenses
} = info;

console.log('Driver licence data:\n');
console.log({
  surname,
  initials,
  idNumber,
  birthDate,
  gender,
  licenseNumber,
  licenseValidityStart,
  licenseValidityExpiry,
  vehicleLicenses
});

// Try loading WI image saved by ZADriversDecodeUtil
let wiData: Uint8Array;

try {
  const raw = fs.readFileSync("wi_image.raw");
  wiData = new Uint8Array(raw);
  console.log("Loaded wi_image.raw:", wiData.length, "bytes");
} catch (e) {
  console.log("No wi_image.raw found. Licence probably contains no WI image.");
  process.exit(0);
}

// Decode WI image using native SWI decoder
try {
  const result = swi.decode(wiData);

  console.log("Decoded SWI Image:");
  console.log({
    width: result.width,
    height: result.height,
    dataLength: result.data.length
  });

  fs.writeFileSync("decoded.raw", result.data);
  console.log("Decoded image saved to decoded.raw");
} catch (err) {
  console.error("Decoder crashed:", err);
}
