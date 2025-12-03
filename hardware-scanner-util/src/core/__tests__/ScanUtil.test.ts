import { describe, expect } from '@jest/globals';
import { BroadcastInterface, JourneyInterface, ZADriversLicenseInterface } from '../../common/types';
import ScanUtil from '../ScanUtil.ts';
import { ZADriversBarcodeProcessor } from '../ZADriversDecodeUtil.ts';
import { registeredScanners } from '../../scanners/registeredScanners';

import fs from 'fs';
import path from 'path';

// TODO continue working on the Drivers licenses processing
// describe('ZADriversBarcodeProcessor', () => {

//     const sampleLicenseBase64 = fs.readFileSync(path.join(__dirname, 'license_sample.base64'),'utf8');
//     const driverDetails = {"surname":"SEVENSTER","initials":"GJ","professionalDrivingPermitCodes":[],"idCountryOfIssue":"ZA","licenseCountryOfIssue":"ZA","licenseNumber":"60570003BLMR","idNumber":"6712165128087","idNumberType":"02","vehicleLicenses":[{"code":"EB","restriction":"0","firstIssuedDate":"1999-12-02"}],"driverRestrictions":"00","professionalDrivingPermitExpiry":null,"licenseIssueNumber":"01","birthDate":"1967-12-16","licenseValidityStart":"2020-10-02","licenseValidityExpiry":"2025-10-01","gender":"01"};

//     it(`should decode the driver's license `, () => {
//         const driverBuffer = Buffer.from(sampleLicenseBase64, 'base64');
//         const driverResults = ZADriversBarcodeProcessor.process(driverBuffer);
//         expect(driverResults).toEqual(driverDetails);
//     });
// });

describe('ScanUtil', () => {
    let scanUtil: ScanUtil;
    let mockBroadcast: BroadcastInterface;
    let mockJourney: JourneyInterface;
    let mockZADriversLicense: ZADriversLicenseInterface;

    beforeEach(() => {
        mockBroadcast = {
            getCapabilities: jest.fn().mockResolvedValue({ supported: true }),
            deregisterAll: jest.fn().mockResolvedValue(undefined),
            register: jest.fn().mockResolvedValue(undefined),
            trigger: jest.fn().mockResolvedValue(undefined)
        };

        mockJourney = {
            device: {
                manufacturer: 'DataLogic',
                model: 'TestModel'
            },
            dialog: {
                simple: jest.fn()
            }
        };

        mockZADriversLicense = {
            decode: jest.fn().mockReturnValue({ decoded: 'test' })
        };

        scanUtil = new ScanUtil(mockBroadcast, mockJourney, mockZADriversLicense);
    });

    it('should initialize properties correctly in the constructor', () => {
        expect(scanUtil['LAST_SCAN']).toBeNull();
        expect(scanUtil['SCAN_INTERVAL_MS']).toBe(3000);
        expect(scanUtil['Broadcast']).toBe(mockBroadcast);
        expect(scanUtil['journey']).toBe(mockJourney);
        expect(scanUtil['ZADriversLicense']).toBe(mockZADriversLicense);
    });

    it('should refresh scanner', async () => {
        const callback = jest.fn();
        await scanUtil.refreshScanner(callback);
        expect(scanUtil['LAST_SCAN']).toBeNull();
        expect(mockBroadcast.deregisterAll).toHaveBeenCalled();
        expect(mockBroadcast.register).toHaveBeenCalled();
    });

    it('should register scan service', async () => {
        const callback = jest.fn();
        await scanUtil.refreshScanner(callback);

        const capabilities = await mockBroadcast.getCapabilities();
        expect(capabilities.supported).toBe(true);

        expect(mockBroadcast.deregisterAll).toHaveBeenCalled();
        expect(mockBroadcast.register).toHaveBeenCalledWith(
            { action: 'com.datalogic.decodewedge.decode_action', categories: ['com.datalogic.decodewedge.decode_category'] },
            expect.any(Function)
        );
    });

    it('should not register scan service if Broadcast API is not supported', async () => {
        mockBroadcast.getCapabilities = jest.fn().mockResolvedValue({ supported: false });
        const callback = jest.fn();
        await scanUtil.refreshScanner(callback);

        expect(mockBroadcast.deregisterAll).not.toHaveBeenCalled();
        expect(mockBroadcast.register).not.toHaveBeenCalled();
    });

    it('should log an error if registering scan service fails', async () => {
        const error = new Error('Test Error');
        mockBroadcast.register = jest.fn().mockRejectedValue(error);

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        const callback = jest.fn();
        await scanUtil.refreshScanner(callback);

        expect(mockBroadcast.register).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Scanning Broadcast Register Error: ', error);

        consoleSpy.mockRestore();
    });

    it('should not register scan service if scanner is not supported', async () => {
        scanUtil['getManufacturer'] = jest.fn().mockReturnValue('UnsupportedManufacturer');
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

        const callback = jest.fn();
        await scanUtil.refreshScanner(callback);

        // Verify that the console log was called with the appropriate message
        expect(consoleSpy).toHaveBeenCalledWith(`Currently not support for Manufacturer: UnsupportedManufacturer Model: ${mockJourney.device.model}`);
        // Ensure that the register function was not called
        expect(mockBroadcast.register).not.toHaveBeenCalled();
        // Verify that the function returned null, no error should be thrown
        expect(scanUtil.getScannerConfig()).toBeNull();

        consoleSpy.mockRestore();
    });

    it('should get manufacturer', () => {
        expect(scanUtil.getManufacturer()).toBe('DataLogic');
    });

    it('should correctly decode a ID Card', () => {
        const result = scanUtil.decodeDriversLicence('VkFOIERFUiBXRVNUSFVJWkVOfE1BUlRIQSBNQUdEQUxFTkF8RnxSU0F8NTUxMjAyMDA1MzA4N3wwMiBERUMgMTk1NXxOQU18Q0lUSVpFTnwxNCBOT1YgMjAyMHwyODM2MXwxMTQ0NDU4NTJ8MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3');
        expect(result).toBeDefined();
        expect(result?.licence_type).toBeDefined();
        expect(result?.licence_type).toBe('id_card');
        const expectedResult = { "idNumber": "CITIZEN", "initials": "MARTHA MAGDALENA", "surname": "VAN DER WESTHUIZEN" };
        expect(result?.data).toEqual(expectedResult);
    });

    it('should correctly decode a driver\'s license', () => {
        const result = scanUtil.decodeDriversLicence('AZsJRQAAZ2lMmE38Taym4/R4SdbBBXw7h0zgV0Mc9g0ajsXdZdDkKVfBHM9evvEjodE9PpzEciGQnZUwmAD1g53Jc2EvStaHA3D7oUq0xvDcFgu3YBnrNHuG0jRSYYDmdZB/xm8ZKP1S6PDRw7vhTa0kq9GWxn5MPE73oDUHFm03DP9jKggVO1IWYjNyVE5hyBc78PBxxzxGQ/aLruMxAY+pq98qImn/mWY/WtpeJ9psKaQsHsh0jJOoHOMfNNQiwEKHc60+xyaObBWnN1/2+jV7qtZON0MTe1TM7oX9KropSplhAWyxjQiJT3peVIHJf78liMCraDWFxauqF4YaetmUJIyc7UONbOg20Z+qByJ9Ax/E2l8COoAQR+VZvWW3uIaJ3HNnQbtCepIsGoeaSt4V8jF/vh8PFy8/4/hcLNnu4EoFczz61Q+QsxmcFGqqMcBwCRk3WFYusTgGqlbCza6O2B/Z2VWOXvsrXYRNdm+C4x/Mq4ywNElUN8olCMzbK452xYAlij0cCvyU/ZJMMdCyr12+cPmzu2xvnxSZHCa+SmEWmkuED8R41UrcGw4x1K3V5x+qe3py/DgoYIGpdMdaa30B6Im86vaCBBzRFrgyQcVnEn1usLCGRwH3P0A3h5WgOV2JdBgyffBA1QGoCaj+m5eIYMytNqRruuc2jDVVYlhq/WFoMQmtCnBj2BWVJp6lwvA9i2rMjGzytn4VXaj27+ykskb80cWZXSRo5i/Q3fGuLF5pNmIg2Zuoozb9VvfEIpDMv4iAC/VU4G1sPHGfZWj3xnFL6mx3W46CdJaOwgL9L59+JPkAZ97z4TGIA7HFAFCZzn2ET76caGbclvQXjP5Lc4SETpqki1naXp++6fNgSqyPTzAuHiwf8wOGtusYvbb6GslZDKkYHSMrsgTTkxrDZuORQK7F/IFK3muRo311QHVvQ6BeBitFuWsP');
        expect(result).toBeDefined();
        expect(result?.licence_type).toBeDefined();
        expect(result?.licence_type).toBe('drivers');
        const expectedResult = { "decoded": "test" };
        expect(result?.data).toEqual(expectedResult);
    });

    it('should correctly decode a temp license', () => {
        const result = scanUtil.decodeDriversLicence('JVRETDY4JTAwOTElNjA1NEEwQzklMSU2MDU0MDAwMDNWMUclMDIlOTIwNTA3NTg3MjA4MSVTIERVQkElQzEvMjAxNy0xMC0wNC8wJSUlJSUyMDIyLTEwLTI1JQ');
        expect(result).toBeDefined();
        expect(result?.licence_type).toBeDefined();
        expect(result?.licence_type).toBe('temp');
        const expectedResult = { "idNumber": "9205075872081", "licenceNumber": "605400003V1G", "surname": "DUBA" };
        expect(result?.data).toEqual(expectedResult);
    });

    it('should correctly decode a learners license', () => {
        const result = scanUtil.decodeDriversLicence('JUxMMjMwJTAxMTclNjA5MEEwNUslMSU2MDkwMDAwMTZUSkwlMDIlMDUxMjE3NTE0MzA4NCVKSyBOT0JMRSUyMDA1LTEyLTE3JTIlTm9uZSAvIEdlZW4lTm9uZSUlMSUyMDIzLTAzLTI1JTIwMjUtMDMtMjQl');
        expect(result).toBeDefined();
        expect(result?.licence_type).toBeDefined();
        expect(result?.licence_type).toBe('learners');
        const expectedResult = { "idNumber": "0512175143084", "licenceNumber": "609000016TJL", "surname": "NOBLE" };
        expect(result?.data).toEqual(expectedResult);
    });

    it('should not decode vehicle license', () => {
        const result = scanUtil.decodeDriversLicence('JU1WTDFDQzA2JTAxNjMlMzAwMUExOTQlMSUzMDAxMDAzMTlaTU0lRkJDMTIwRlMlRFdGMDI4SyVIYXRjaCBiYWNrIC8gTHVpa3J1ZyVWT0xLU1dBR0VOJVBPTE8gVklWTyBCTFVFIExJTkUlU2lsdmVyIC8gU2lsd2VyJUFBVlpaWjZTWkNVMDA3MDgxJUNMUDA2NjQwMCUyMDIzLTA1LTMxJQ');
        expect(result).toBeNull();
    });

    it('should trigger scanner if supported', async () => {
        scanUtil['getScannerConfig'] = jest.fn().mockReturnValue(registeredScanners['DataLogic']);
        await scanUtil.triggerScanner();
        expect(mockBroadcast.trigger).toHaveBeenCalled();
    });

    it('should decode base64 data correctly', () => {
        const base64Data = 'dGVzdA==';
        const decodedData = scanUtil.decodeBase64(base64Data);
        expect(decodedData).toBe('test');
    });

    it('should determine if scan can be done again', () => {
        scanUtil['LAST_SCAN'] = Date.now() - 4000;
        expect(scanUtil.canScanAgain()).toBe(true);
    });

    it('should get scanner configuration', () => {
        scanUtil['journey'].device.manufacturer = 'Honeywell';
        const scannerConfig = scanUtil.getScannerConfig();
        expect(scannerConfig).toBe(registeredScanners['Honeywell']);
    });
});