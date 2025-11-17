import fs from "fs";
const swi = require("../native/build/Release/swi_decoder.node");
import { ZADriversBarcodeProcessor } from './core/ZADriversDecodeUtil';
import { Buffer } from 'buffer';

// Helper to format long hex strings into readable lines
function formatHexBlock(hex: string, lineLength = 64): string[] {
  const lines = [];
  for (let i = 0; i < hex.length; i += lineLength) {
    lines.push(hex.slice(i, i + lineLength));
  }
  return lines;
}

// Load sample base64 barcode
const base64 = fs.readFileSync('src/core/__tests__/license_sample.base64', 'utf8').trim();

// Convert to raw bytes
const buffer = Buffer.from(base64, 'base64');

// Decode licence structure
const info = ZADriversBarcodeProcessor.process(buffer);

// Extract only the important information
const {
  surname,
  initials,
  idNumber,
  birthDate,
  gender,
  licenseNumber,
  licenseValidityStart,
  licenseValidityExpiry,
  vehicleLicenses,
  image,
} = info;

// Print clean summary
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
  vehicleLicenses,
});

// Print WI hex block cleanly
console.log('\nWI hex block:');

if (image && (image as any).constructor === Uint8Array) {
    console.log("WI byte length:", image.length);

    const result = swi.decode(image as any);

    console.log("Decoded SWI Image:");
    console.log({
        width: result.width,
        height: result.height,
        dataLength: result.data.length
    });

    fs.writeFileSync("decoded.raw", result.data);
} else {
    console.log("No WI block found.");
}

