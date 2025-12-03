# ScanUtil

`ScanUtil` is a JavaScript/TypeScript library designed to interface with various hardware scanners, normalize scanned data, and provide utility functions for handling different types of driver licenses and ID cards. This library is particularly useful for environments with a global `Broadcast` object and specific requirements for handling scanned data.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Initialization](#initialization)
  - [Refreshing Scanner](#refreshing-scanner)
  - [Decoding Driver's License](#decoding-drivers-license)
  - [Extracting Info from Barcode](#extracting-info-from-barcode)
  - [Triggering Scanner](#triggering-scanner)
- [Configuration](#configuration)
  - [Registered Scanners](#registered-scanners)
- [API Reference](#api-reference)
  - [Methods](#methods)
  - [Private Methods](#private-methods)
- [Testing](#testing)
- [License](#license)

## Installation

Install the package using npm:

```bash
npm install scan-util
```

## Usage

### Initialization

To use `ScanUtil`, you need to initialize it with the required dependencies: `Broadcast`, `journey`, and `ZADriversLicense`.

```typescript
import ScanUtil from '@gatekeeper_technology/hardware_scanner_util';

const scanUtil = new ScanUtil(Broadcast, journey, ZADriversLicense);
```

### Refreshing Scanner

Refresh the scanner with a new callback function.

```typescript
const callback = (data) => {
  console.log('Scanned data:', data);
};

await scanUtil.refreshScanner(callback);
```

### Decoding Driver's License

Decode the data received from a driver's license scan.

```typescript
const driversLicenceData = 'scanned_data';
const decodedData = scanUtil.decodeDriversLicence(driversLicenceData);
console.log('Decoded Driver's License Data:', decodedData);
```

### Extracting Info from Barcode

Extract information from learner's license, temporary license, and ID card barcodes.

```typescript
const learnersBarcode = '%LL%data%';
const learnersInfo = scanUtil.extractLearnersInfoFromBarcode(learnersBarcode);
console.log('Learners Info:', learnersInfo);

const tempBarcode = '%TDL%data%';
const tempInfo = scanUtil.extractTempInfoFromBarcode(tempBarcode);
console.log('Temp Info:', tempInfo);

const idCardBarcode = 'ID|data|';
const idInfo = scanUtil.extractIDInfoFromBarcode(idCardBarcode);
console.log('ID Card Info:', idInfo);
```

### Validating Filenames

Validate filenames to ensure they conform to expected patterns.

```typescript
const validFilename = 'test.txt';
const isValid = scanUtil.validateFilename(validFilename);
console.log('Is valid filename:', isValid);
```

### Triggering Scanner

Trigger a scan if the software trigger is supported.

```typescript
await scanUtil.triggerScanner();
```

## Configuration

### Registered Scanners

The `ScanUtil` class comes with a predefined set of registered scanners, which can be customized in the `registeredScanners.js` file.

```typescript
export const registeredScanners = {
  Honeywell: {
    action: "com.datalogic.decodewedge.decode_action",
    categories: ["com.datalogic.decodewedge.decode_category"],
    data_field: "dataBytes",
    base64_data: false,
    software_trigger: null,
  },
  // Add more scanner configurations here...
};
```

## API Reference

### Methods

#### `constructor(broadcast: BroadcastInterface, journey: JourneyInterface, ZADriversLicense: ZADriversLicenseInterface)`

Creates an instance of `ScanUtil`.

#### `async refreshScanner(callback: ScanCallback)`

Refreshes the scanner with a new callback function.

#### `decodeDriversLicence(drivers_licence_data: string)`

Decodes the data received from a driver's license scan.

#### `extractLearnersInfoFromBarcode(decoded_data: string)`

Extracts information from a learner's license barcode.

#### `extractTempInfoFromBarcode(decoded_data: string)`

Extracts information from a temporary license barcode.

#### `extractIDInfoFromBarcode(decoded_data: string)`

Extracts information from an ID card barcode.

#### `validateFilename(filename: string): boolean`

Validates a filename.

#### `async triggerScanner()`

Triggers a scan if the software trigger is supported.

### Private Methods

#### `private normalizeData(scanner: any, data: any): any`

Normalizes data based on the scanner configuration.

#### `private getManufacturer()`

Gets the manufacturer of the device.

#### `private canScanAgain(): boolean`

Determines if enough time has passed since the last scan.

#### `private getScannerConfig()`

Gets the scanner configuration based on the manufacturer.

#### `private decodeBase64(base64_str: string): string`

Decodes a base64-encoded string.

## Testing

The package uses Jest for testing. To run the tests, use the following command:

```bash
npm test
```

Example tests can be found in the `src/__tests__/ScanUtil.test.ts` file.

## License

This project is licensed under the LGPL-2.1+ License - see the [LICENSE](LICENSE) file for details.