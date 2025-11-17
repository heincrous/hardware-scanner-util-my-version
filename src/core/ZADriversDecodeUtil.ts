// Research
// https://github.com/DanieLeeuwner/Reply.Net.SADL
// https://github.com/the-mars-rover/rsa_identification/issues/2
// https://github.com/ugommirikwe/sa-license-decoder/blob/master/SPEC.md
// Most promising for image decoding so far: https://github.com/Businessware/Swi/tree/master

import { RSA_KEYS } from '../common/rsaKeys';
import { ZADecodedData, ZADriversBarcodeData } from '../common/types';

const { BigInteger } = require('jsbn');

const NUMBER_OF_128_BLOCKS = 5;

// Quiet mode to hide internal debug logs
const QUIET = true;
function log(...args: any[]) {
  if (!QUIET) console.log(...args);
}

export class ZADriversBarcodeProcessor {

	public static process(data: Buffer): ZADecodedData {
		try {

			const { version, blocks } = this.parseZADriversBarcodeBuffer(data);

			log(`Successfully parsed barcode with version: ${version} in ${blocks.length} blocks`);

			const decryptedBlocks = blocks.map((block, index) => {
				const blockSize = index < NUMBER_OF_128_BLOCKS ? 128 : 74; // First 5 is 128 and last one 74
				log(`Decrypting block ${index + 1} with size ${blockSize}`);
				const decryptedBlock = this.decryptBlock(block, version, blockSize);
				log(`Decrypted block ${index + 1}`);
				return decryptedBlock;
			}
			);

			const licenseData = Buffer.concat(decryptedBlocks);

			// ---------------------------------------------------------
			// TEMPORARY DEBUG: dump full decrypted RSA stream
			// ---------------------------------------------------------
			try {
				require("fs").writeFileSync("full_decrypted.raw", Buffer.from(licenseData));
				console.log("Dumped full decrypted buffer to full_decrypted.raw");
				console.log("Decrypted byte length:", licenseData.length);
			} catch (err) {
				console.log("Failed writing full_decrypted.raw:", err);
			}
			// ---------------------------------------------------------

			return this.parseDecryptedData(licenseData);
		} catch (error) {
			throw new Error(`Failed to process barcode: ${error.message} ${error.trace}`);
		}
	}

	/**
	 * Parse the encrypted ZA Drivers license PDF417 barcode.
	 * You get 720 bytes of data structured as follows:
	 * - First 4 Bytes: Indicate the version of the barcode.
	 * - Next 2 Bytes: Padding or reserved bytes, always zero (00 00).
	 * - Remaining 714 Bytes: Divided into 6 blocks:
	 *   - Block 1: 128 bytes
	 *   - Block 2: 128 bytes
	 *   - Block 3: 128 bytes
	 *   - Block 4: 128 bytes
	 *   - Block 5: 128 bytes
	 *   - Block 6: 74 bytes
	 *
	 * @param {Buffer} data - The buffer containing the scanned barcode data.
	 * @returns {ZADriversBarcodeData} - An object containing the version and an array of data blocks.
	 * @throws {Error} - Throws an error if the version is unsupported or if the padding bytes are not as expected.
	 */
	public static parseZADriversBarcodeBuffer(data: Buffer): ZADriversBarcodeData {
		if (data.length !== 720) {
			log('Invalid data length. Expected 720 bytes.');
		}

		// Read the version bytes
		const versionHex = data.subarray(0, 4).toString('hex');
		log(`Version Bytes: ${versionHex}`);

		// Determine the version based on the version bytes
		const version = versionHex === '01e10245' ? 1 : (versionHex === '019b0945' ? 2 : null);
		if (version === null) {
			throw new Error('Unsupported version');
		}
		log(`Version: ${version}`);

		// Read and verify the padding bytes (next 2 bytes)
		const paddingBytes = data.subarray(4, 6).toString('hex');
		if (paddingBytes !== '0000') {
			throw new Error('Invalid padding bytes. Expected 0000.');
		}
		log(`Padding Bytes: ${paddingBytes}`);

		// Define the block sizes
		const blockSizes = [128, 128, 128, 128, 128, 74];


		const licenseData = data.subarray(6);

		log(`Remaining data ${licenseData.toString('hex')}`);
		log(`License Data: ${licenseData.toString('hex').length / 2} length`);

		// Initialize offset and read blocks
		let offset = 0; // Skip the version and the next two zero bytes
		const blocks = blockSizes.map((size) => {
			const block = licenseData.subarray(offset, offset + size);
			log(`Block ${block.toString('hex').length / 2} - ${offset + size}: ${block.toString('hex')}`);
			offset += size;
			return block;
		});

		return { version, blocks };
	}

	/**
 * Decrypts a block of data using RSA.
 * @param {Buffer} block - The block of data to decrypt.
 * @param {number} version - The version of the RSA key to use.
 * @param {number} blockSize - The size of the block to decrypt.
 * @returns {Uint8Array} - The decrypted data.
 * @throws {Error} - Throws an error if decryption fails.
 */
	public static decryptBlock(block: Buffer, version: number, blockSize: number): Uint8Array {
		const version_keys = RSA_KEYS[version];
		const key = blockSize === 128 ? version_keys.block128 : version_keys.block74;

		try {
			const byteArrayClone = [...block];
			byteArrayClone.unshift(0); // Add a leading zero to ensure the number is positive
			var data = new BigInteger(byteArrayClone, 256); // 256 indicates that each element of the array represents a byte (8 bits), so the array is treated as a sequence of bytes.

			const e = new BigInteger(key.e, 16);
			const n = new BigInteger(key.n, 16);
			var plaintext = data.modPow(e, n);
			// log(`Plaintext: ${plaintext}`);
			var bytes = plaintext.toByteArray();
			const byteArray = new Uint8Array(bytes);
			return byteArray;//Buffer.from(byteArray).toString('hex');

		} catch (error) {
			throw new Error(`Failed to create public key: ${error.message}`);
		}
	}

	/**
 * Parses the decrypted data from the barcode.
 * @param {Uint8Array} barcodeByteArray - The decrypted data as a byte array.
 * @returns {ZADecodedData} - The parsed driver's license data.
 * @throws {Error} - Throws an error if parsing fails.
 */
	private static parseDecryptedData(barcodByteArray: Uint8Array): any {//ZADecodedData {
		let currentPositon = 0;
		const START_SEQUENCE_LENGTH = 5;
		const HEADER_LENGTH = 10;

		// Implement the parsing logic based on the provided specifications
		const startSequence = getHexValueFromBytes(barcodByteArray.subarray(currentPositon, START_SEQUENCE_LENGTH));
		if (startSequence !== '0102030405') {
			log(`Invalid format ${startSequence}? Expected 0102030405`);
		}

		currentPositon = START_SEQUENCE_LENGTH;
		// Get the header section
		const header = barcodByteArray.subarray(currentPositon, currentPositon + HEADER_LENGTH); // Skip the first 10 bytes
		const lengthSection1 = header[5];
		currentPositon += HEADER_LENGTH;
		// Get the string section
		const stringSectionByteArray = barcodByteArray.subarray(currentPositon, currentPositon + lengthSection1);
		let driverData = this.parseStringsSection(stringSectionByteArray);
		currentPositon += lengthSection1;

		// Get the binary section
		const lengthSection2 = header[7];
		const byteSectionByteArray = barcodByteArray.subarray(currentPositon, currentPositon + lengthSection2);
		driverData = this.parseBinarySection(byteSectionByteArray, driverData);
		currentPositon += lengthSection2;
		
		log("REMAINING HEX (IMAGE CANDIDATE):");
		log(getHexValueFromBytes(barcodByteArray.subarray(currentPositon)));

		// ---------------------------------------------------------
		// IMAGE SECTION - extract WI block by raw bytes
		// ---------------------------------------------------------

		// Defensive: ensure there *are* bytes left
		if (currentPositon >= barcodByteArray.length) {
			log("No remaining bytes for image section");
			driverData.image = null;
			return driverData;
		}

		const imageBytes = barcodByteArray.subarray(currentPositon);
		log("Expected WI size:", imageBytes.length);
		log("Decrypted buffer size:", barcodByteArray.length);

		// Defensive: ensure we have enough data to even contain "WI"
		if (imageBytes.length < 4) {
			log("Image section too small to contain WI header");
			driverData.image = null;
			return driverData;
		}

		// Locate WI header 0x57 0x49
		let wiStart = -1;
		for (let i = 0; i < imageBytes.length - 1; i++) {
			if (imageBytes[i] === 0x57 && imageBytes[i + 1] === 0x49) {
				wiStart = i;
				break;
			}
		}

		if (wiStart === -1) {
			log("Could not find WI block in decrypted data");
			driverData.image = null;
			return driverData;
		}

		log("Found WI header at offset:", wiStart);

		// Extract remainder as WI block
		const wiBuffer = imageBytes.subarray(wiStart);

		// Defensive: ensure WI is not empty
		if (wiBuffer.length === 0) {
			log("WI block extracted but empty");
			driverData.image = null;
			return driverData;
		}

		// Check first four bytes
		if (wiBuffer.length >= 4) {
			const h0 = wiBuffer[0].toString(16).padStart(2, "0");
			const h1 = wiBuffer[1].toString(16).padStart(2, "0");
			const h2 = wiBuffer[2].toString(16).padStart(2, "0");
			const h3 = wiBuffer[3].toString(16).padStart(2, "0");
			log("WI header bytes:", h0, h1, h2, h3);
		}

		// Dump raw WI bytes
		try {
			require("fs").writeFileSync("wi_image.raw", Buffer.from(wiBuffer));
			log("WI image written to wi_image.raw");
		} catch (err) {
			log("Failed writing wi_image.raw:", err);
		}

		// Return WI hex
		driverData.image = Buffer.from(wiBuffer).toString("hex");

		return driverData;

	}

	/**
 * Parses the string section of the decrypted data.
 * @param {Uint8Array} data - The string section data as a byte array.
 * @returns {ZADecodedData} - The parsed string section data.
 */
	private static parseStringsSection(data: Uint8Array): ZADecodedData {
		const returnData: ZADecodedData = {
			vehicleLicenses: [] as { code: string }[],
			surname: '',
			idNumber: '',
			idNumberType: '',
			idCountryOfIssue: '',
			gender: '',
			initials: '',
			birthDate: '',
			driverRestrictions: [],
			licenseCountryOfIssue: '',
			licenseIssueNumber: '',
			licenseNumber: '',
			licenseValidityStart: '',
			licenseValidityExpiry: '',
			professionalDrivingPermitCodes: [],
		};

		const dataHexString = getHexValueFromBytes(data);
		let dataHexStringArrayMain = dataHexString.split('e0'); // First split by e0

		// Calculate the number of vehicle codes
		const MaxNumberOfVehicleCodes = 4;
		const numberOfEmtpyVehicleCodes = dataHexStringArrayMain[0].split('e1').length - 1; // Get the empty vehicle codes
		const numberOfVehicleCodes = MaxNumberOfVehicleCodes - numberOfEmtpyVehicleCodes; // Calculate actual codes
		// Calculate the number of vehicle restrictions
		const MaxNumberOfVehicleRestrictions = 4;
		const numberOfEmtpyfVehicleRestrictions = dataHexStringArrayMain[3].split('e1').length - 1; // Get the empty restriction codes
		const numberOffVehicleRestrictions = MaxNumberOfVehicleRestrictions - numberOfEmtpyfVehicleRestrictions; // Calculate actual restriction codes

		let dataHexStringArray: string[] = []
		for (const hexData of dataHexStringArrayMain) {
			dataHexStringArray = [...dataHexStringArray, ...hexData.split('e1')];
		}

		dataHexStringArray = dataHexStringArray.filter((data) => data !== '');

		for (const hexData of dataHexStringArray) {
			log(hex2a(hexData));
		}

		let dataIndex = 0;

		// Get the vehicle codes
		for (let index = 0; index < numberOfVehicleCodes; index++) {
			const codeData = dataHexStringArray[index];
			dataIndex += 1;
			returnData.vehicleLicenses.push({ code: hex2a(codeData) });
		}

		const fieldArray = ['surname', 'initials', 'professionalDrivingPermitCodes', 'idCountryOfIssue', 'licenseCountryOfIssue', 'driverRestrictions', 'licenseNumber', 'idNumber'];
		let fieldIndex = 0;
		let restrictionCount = 0; // Count how many restrictions have been populated

		for (let index = numberOfVehicleCodes; index < dataHexStringArray.length; index++) {
			const data = hex2a(dataHexStringArray[index]);
			let fieldName = fieldArray[fieldIndex];
			if (fieldName === 'professionalDrivingPermitCodes') {
				if (data !== 'ZA') {
					returnData.professionalDrivingPermitCodes.push(data);
				} else {
					fieldIndex++;
					fieldName = fieldArray[fieldIndex];
					//@ts-ignore
					returnData[fieldName] = data;
				}
			} if (fieldName === 'driverRestrictions') {
				//@ts-ignore
				returnData[fieldName].push(data); // TODO Cater for multiple restrictions Vehicle Restriction, up to 4
				restrictionCount++;

				if (restrictionCount < numberOffVehicleRestrictions) {
					fieldIndex--;
				}
			} else {
				//@ts-ignore
				returnData[fieldName] = data;
			}

			fieldIndex++;
		}

		return returnData;
	}

	private static parseBinarySection(data: Uint8Array, licenseData: ZADecodedData): ZADecodedData {
		const nibbleArray = convertUint8ArrayToNibbles(data);

		const fieldArray = [
			{ field: 'idNumberType', length: 2, isDate: false },
			{ field: 'firstIssueDate', length: 8, isDate: true },
			{ field: 'driverRestrictions', length: 2, isDate: false },
			{ field: 'professionalDrivingPermitExpiry', length: 8, isDate: true }, // Can be 1 or 8; default to 8 for consistency
			{ field: 'licenseIssueNumber', length: 2, isDate: false },
			{ field: 'birthDate', length: 8, isDate: true },
			{ field: 'licenseValidityStart', length: 8, isDate: true },
			{ field: 'licenseValidityExpiry', length: 8, isDate: true },
			{ field: 'gender', length: 2, isDate: false },
		];

		for (const field of fieldArray) {
			// Could be multiple issue dates of vehicle licenses
			if (field.field === 'firstIssueDate') {
				if (hex2a(nibbleArray[0].toString()) == 'a') {
					nibbleArray.shift();
				} else {
					for (const vehicle of licenseData.vehicleLicenses) {
						vehicle.firstIssueDate = this.parseDate(nibbleArray.splice(0, field.length).join(''));
					}
				}
			} else if (hex2a(nibbleArray[0].toString()) == 'a') {
				nibbleArray.shift();
			} else if (field.field === 'driverRestrictions') {
				licenseData.driverRestrictions = nibbleArray.splice(0, field.length).map((restriction) => restriction.toString());
			} else if (field.field === 'professionalDrivingPermitExpiry') {
				if (nibbleArray.slice(0, 4).join('') === '100010') { // This was not in the spec, did this for it to work
					licenseData.professionalDrivingPermitExpiry = null;
					nibbleArray.splice(0, 4);
				} else {
					this.parseDate(nibbleArray.splice(0, field.length).join(''));
				}
			} else {
				const fieldData = nibbleArray.splice(0, field.length).join('');

				//@ts-ignore
				licenseData[field.field] = field.isDate ? this.parseDate(fieldData) : fieldData;
			}
		}

		return licenseData;
	}

	// private static parseImageSection(data: string): string {
	// 	// Parse the image data section
	// 	const imageData = data.match(/57 49 (\d{2} \d{2} .+ )00 00 00 00 00 00 00 00/);
	// 	if (imageData) {
	// 		const imageHex = imageData[1].replace(/\s+/g, '');
	// 		const imageBytes = Buffer.from(imageHex, 'hex');
	// 		return imageBytes.toString('base64');
	// 	}
	// 	return '';
	// }

	// #####################################################################################

	private static parseImageSection(data: string): string {
		const match = data.match(/57 49 ([0-9a-fA-F ]+)/);
		if (!match) return '';

		// include the WI header (match[0])
		const hex = match[0].replace(/ /g, '');
		const bytes = Buffer.from(hex, 'hex');
		return bytes.toString('base64');
	}

	// #####################################################################################


	private static parseDate(data: string): string {
		// Implement the logic to parse the date from nibbles
		const year = data.slice(0, 4);
		const month = data.slice(4, 6);
		const day = data.slice(6, 8);
		return `${year}-${month}-${day}`;
	}
}

function hex2a(hexx: string): string {
	if (!hexx) return '';

	let hex = hexx.toString(); // ensure it's a string
	let str = '';
	for (let i = 0; i < hex.length; i += 2) {
		str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
	}
	return str;
}

function getHexValueFromBytes(byteArray: Uint8Array): string {
	return Buffer.from(byteArray).toString('hex');
}

function bytesToAscii(byteArray: Uint8Array): string {
	return Buffer.from(byteArray).toString('utf8');
}

function convertUint8ArrayToNibbles(uint8Array: Uint8Array): number[] {
	const nibbles: number[] = [];

	for (const byte of uint8Array) {
		// Extract the high nibble (first 4 bits)
		const highNibble = byte >> 4;
		// Extract the low nibble (last 4 bits)
		const lowNibble = byte & 0x0F;

		// Add the nibbles to the result array
		nibbles.push(highNibble, lowNibble);
	}

	return nibbles;
}