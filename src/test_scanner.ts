import { ZADriversBarcodeProcessor } from './core/ZADriversDecodeUtil';
import { Buffer } from 'buffer';
import * as fs from 'fs';

// Load the sample base64 barcode
const base64 = fs.readFileSync('src/core/__tests__/license_sample.base64', 'utf8').trim();

// Convert to raw bytes
const buffer = Buffer.from(base64, 'base64');

// Decode only the licence structure (ZADriversBarcodeProcessor already does this)
const info = ZADriversBarcodeProcessor.process(buffer);

// Print only the parsed fields
console.log('Driver Licence Data:');
console.log(info);

