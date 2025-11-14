// common/types.ts
export interface JourneyInterface {
    device: {
        manufacturer: string;
        model: string;
    };
    dialog: {
        simple: (options: { title: string; message: string }) => void;
    };
}

export interface BroadcastInterface {
    getCapabilities: () => Promise<{ supported: boolean }>;
    deregisterAll: () => Promise<void>;
    register: (target: any, callback: (data: any) => void) => Promise<void>;
    trigger: (target: any, options: any) => Promise<void>;
}

export interface ZADriversLicenseInterface {
    decode: (licenseData: string) => object;
}

export interface ScanCallback {
    (data: string, base64Data?: string): Promise<void>|void;
}

export interface ZADriversBarcodeData {
    version: number;
    blocks: Buffer[];
  }
  
  export interface RSAKeys {
    [version: number]: {
      block128: string;
      block74: string;
    };
  }

// types.ts
export interface ZADecodedData {
    idNumber: string;
    idNumberType: string;
    idCountryOfIssue: string;
    surname: string;
    gender: string;
    initials: string;
    birthDate: string;
    driverRestrictions: string[];
    licenseCountryOfIssue: string;
    licenseIssueNumber: string;
    licenseNumber: string;
    licenseValidityStart: string;
    licenseValidityExpiry: string;
    professionalDrivingPermitExpiry?: string | null;
    professionalDrivingPermitCodes?: string[] | null;
    vehicleLicenses: Array<{
      code: string;
      restriction?: string;
      firstIssueDate?: string;
    }>;
    image?: string; // Base64 encoded image data
  }