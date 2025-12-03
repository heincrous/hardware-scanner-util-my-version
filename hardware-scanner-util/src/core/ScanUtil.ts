import { BroadcastInterface, JourneyInterface, ZADriversLicenseInterface, ScanCallback } from '../common/types';
import { registeredScanners } from '../scanners/registeredScanners';

export default class ScanUtil {
    private LAST_SCAN: number | null;
    private SCAN_INTERVAL_MS: number;
    private Broadcast: BroadcastInterface;
    private journey: JourneyInterface;
    private ZADriversLicense: ZADriversLicenseInterface;

    constructor(broadcast: BroadcastInterface, journey: JourneyInterface, ZADriversLicense: ZADriversLicenseInterface) {
        this.LAST_SCAN = null;
        this.SCAN_INTERVAL_MS = 3000;
        this.Broadcast = broadcast;
        this.journey = journey;
        this.ZADriversLicense = ZADriversLicense;
    }

    async refreshScanner(callback: ScanCallback) {
        this.LAST_SCAN = null;
        await this.registerScanService(callback);
    }

    async registerScanService(callback: ScanCallback) {
        const capabilities = await this.Broadcast.getCapabilities();
        if (capabilities && !capabilities.supported) {
            console.log("Broadcast API not supported.");
            return;
        }

        console.log("Registering new scan service");
        const manufacturer = this.getManufacturer();
        console.log(`*Manufacturer: ${manufacturer}*`);

        const scanner = this.getScannerConfig();

        if (!scanner) {
            console.log(`Currently not support for Manufacturer: ${manufacturer} Model: ${this.journey.device.model}`);
            return;
        }

        const target = {
            action: scanner.action,
            categories: scanner.categories,
        };

        const manufacturerCallback = async (data: any) => {
            if (this.canScanAgain()) {
                if (scanner.isBase64Encoded) {
                    console.log(`The scanner has base64 encoded responses ${JSON.stringify(data)}`);
                    const decodedData = this.decodeScanData(data[scanner.data_field]);
                    await callback(decodedData, data[scanner.data_field]);
                } else {
                    console.log(`The scanner DOES NOT have base64 encoded responses ${JSON.stringify(data)}`);
                    await callback(data[scanner.data_field]);
                }
            }
        };

        try {
            await this.Broadcast.deregisterAll();
            await this.Broadcast.register(target, manufacturerCallback);
        } catch (error) {
            console.log("Scanning Broadcast Register Error: ", error);
        }
    }

    decodeDriversLicence(drivers_licence_data: string): { licence_type: string, data: any } | null {
        if (!drivers_licence_data) {
            this.journey.dialog.simple({ title: "Error", message: "Something went wrong." });
            return null;
        }
        if (drivers_licence_data.length < 260) {
            const scanned_data = this.decodeScanData(drivers_licence_data);
            if (scanned_data.startsWith('%LL')) {
                return { licence_type: 'learners', data: this.extractLearnersInfoFromBarcode(scanned_data) };
            } else if (scanned_data.startsWith('%TDL')) {
                return { licence_type: 'temp', data: this.extractTempInfoFromBarcode(scanned_data) };
            } else {
                return null;
            }
        } else if (drivers_licence_data.length === 260) {
            const scanned_data = this.decodeScanData(drivers_licence_data);
            return { licence_type: 'id_card', data: this.extractIDInfoFromBarcode(scanned_data) };
        } else if (drivers_licence_data.length === 960) {
            // TODO figure this part out
            //@ts-ignore
            const base64_drivers_licence_data = drivers_licence_data.hasOwnProperty("toBase64") ? drivers_licence_data.toBase64() : drivers_licence_data;
            return { licence_type: 'drivers', data: this.ZADriversLicense.decode(base64_drivers_licence_data) };
        } else {
            console.log(`Unknown drivers licence type with length: ${drivers_licence_data.length}`);
            return { licence_type: 'unknown', data: drivers_licence_data };
        }
    }

    extractLearnersInfoFromBarcode(decoded_data: string) {
        const extracted_info = decoded_data.split('%');

        if (extracted_info[7] && extracted_info[7].length === 13) {
            const id_number = extracted_info[7];
            const name_and_surname = extracted_info[8];

            const name_broken = name_and_surname.split(' ');
            let surname = name_broken[1];
            for (let i = 2; i < name_broken.length; i++) {
                surname += ' ' + name_broken[i];
            }

            return {
                surname: surname,
                idNumber: id_number,
                licenceNumber: extracted_info[5],
            };
        } else {
            throw new Error('Barcode not recognised as Learner. Please contact your supervisor.');
        }
    }

    extractTempInfoFromBarcode(decoded_data: string) {
        const extracted_info = decoded_data.split('%');

        if (extracted_info[7] && extracted_info[7].length === 13) {
            const id_number = extracted_info[7];
            const name_and_surname = extracted_info[8];

            const name_broken = name_and_surname.split(' ');
            let surname = name_broken[1];
            for (let i = 2; i < name_broken.length; i++) {
                surname += ' ' + name_broken[i];
            }

            return {
                surname: surname,
                idNumber: id_number,
                licenceNumber: extracted_info[5],
            };
        } else {
            throw new Error('Barcode not recognised as Temp. Please contact your supervisor.');
        }
    }

    extractIDInfoFromBarcode(decoded_data: string) {
        const extracted_info = decoded_data.split('|');

        if (extracted_info[4] && extracted_info[4].length === 13) {
            const id_number = extracted_info[7];
            const initials = extracted_info[1];
            const surname = extracted_info[0];

            return {
                initials: initials,
                surname: surname,
                idNumber: id_number,
            };
        } else {
            throw new Error(`Barcode not recognised as ID Card. Please contact your supervisor. ${JSON.stringify(extracted_info)}`);    
        }
    }

    getManufacturer() {
        return this.journey.device ? this.journey.device.manufacturer : null;
    }

    canScanAgain() {
        if (!this.LAST_SCAN) {
            this.LAST_SCAN = Date.now();
            console.log("First scan at ", this.LAST_SCAN);
            return true;
        }

        const _time_diff_ms = Date.now() - this.LAST_SCAN;
        if (_time_diff_ms > this.SCAN_INTERVAL_MS) {
            this.LAST_SCAN = Date.now();
            console.log("First scan in " + _time_diff_ms + " ms");
            return true;
        } else {
            console.log("Wait boet, you have scanned " + _time_diff_ms + " ms ago.");
            this.LAST_SCAN = Date.now();
            return false;
        }
    }

    supportsSoftwareTrigger() {
        const scanner = this.getScannerConfig();
        if (scanner) {
            return !!scanner.software_trigger;
        } else {
            return false;
        }
    }

    async triggerScanner() {
        if (this.supportsSoftwareTrigger()) {
            console.log("Software can triggered");
            try {
                const scanner = this.getScannerConfig();
                await this.Broadcast.trigger({ action: scanner.software_trigger, categories: null }, {});
            } catch (error) {
                console.log(error);
            }
        } else {
            await this.journey.dialog.simple({ title: "Warning", message: "Software trigger not supported." });
        }
    }

    decodeScanData(barcode: string) {
        const scanner = this.getScannerConfig();
        return scanner.isBase64Encoded ? this.decodeBase64(barcode) : barcode;
    }

    decodeBase64(base64_str: string) {
        const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        const e: { [key: string]: number } = {};
        let b = 0, c, l = 0, a, result = "";
        for (let i = 0; i < 64; i++) {
            e[A.charAt(i)] = i;
        }

        for (let i = 0; i < base64_str.length; i++) {
            c = e[base64_str.charAt(i)];
            b = (b << 6) + c;
            l += 6;
            while (l >= 8) {
                a = (b >>> (l -= 8)) & 0xff;
                if (a || i < base64_str.length - 2) {
                    result += String.fromCharCode(a);
                }
            }
        }
        return result;
    }

    getScannerConfig() {
        const manufacturer = this.getManufacturer();
        if (manufacturer && registeredScanners.hasOwnProperty(manufacturer)) {
            return registeredScanners[manufacturer];
        } else {
            console.log(`Currently not support for Manufacturer: ${manufacturer} Model: ${this.journey.device.model}`);
            return null;
        }
    }
}