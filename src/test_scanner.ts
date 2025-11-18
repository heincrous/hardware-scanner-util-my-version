import fs from "fs";
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

// Retrieve raw RSA-encrypted blocks before decryption
const { version, blocks } = ZADriversBarcodeProcessor.parseZADriversBarcodeBuffer(buffer);

console.log('\nEncrypted RSA blocks:\n');

blocks.forEach((block, index) => {
  const hex = block.toString('hex');
  console.log(`Block ${index + 1} (${block.length} bytes):`);
  const lines = formatHexBlock(hex, 64);
  lines.forEach(line => console.log(line));
  console.log('');
});

// Now run the full decode pipeline
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

// Print WI block from wi_image.raw
try {
  const raw = fs.readFileSync("wi_image.raw");
  const hex = Buffer.from(raw).toString("hex");

  console.log("\nWI hex block:\n");
  const lines = formatHexBlock(hex, 64);
  lines.forEach(line => console.log(line));
} catch {
  console.log("\nNo WI block found.");
}
