export interface ScannerConfig {
    action: string;
    categories: string[] | null;
    data_field: string;
    isBase64Encoded: boolean;
    software_trigger: string | null; // The command to trigger the software scan
}

export const registeredScanners: Record<string, ScannerConfig> = {
    Unitech_Electronics: {
        action: "unitech.scanservice.data",
        categories: null,
        data_field: "text",
        isBase64Encoded: false,
        software_trigger: null,
    },
    Honeywell: {
        action: "com.datalogic.decodewedge.decode_action",
        categories: ["com.datalogic.decodewedge.decode_category"],
        data_field: "dataBytes",
        isBase64Encoded: false,
        software_trigger: null,
    },
    DataLogic: {
        action: "com.datalogic.decodewedge.decode_action",
        categories: ["com.datalogic.decodewedge.decode_category"],
        data_field: "com.datalogic.decode.intentwedge.barcode_data",
        isBase64Encoded: true,
        software_trigger: "com.datalogic.decode.action.START_DECODE",
    },
    "Datalogic ADC": {
        action: "com.datalogic.decodewedge.decode_action",
        categories: ["com.datalogic.decodewedge.decode_category"],
        data_field: "com.datalogic.decode.intentwedge.barcode_data",
        isBase64Encoded: true,
        software_trigger: "com.datalogic.decode.action.START_DECODE",
    },
    Datalogic: {
        action: "com.datalogic.decodewedge.decode_action",
        categories: ["com.datalogic.decodewedge.decode_category"],
        data_field: "com.datalogic.decode.intentwedge.barcode_data",
        isBase64Encoded: true,
        software_trigger: "com.datalogic.decode.action.START_DECODE",
    },
    GIGABYTE: {
        action: "com.datalogic.decodewedge.decode_action",
        categories: ["com.datalogic.decodewedge.decode_category"],
        data_field: "com.motorolasolutions.emdk.datawedge.data_string",
        isBase64Encoded: false,
        software_trigger: null,
    },
    UBX: {
        action: "com.intent.decode_data",
        categories: null,
        data_field: "barcode",
        isBase64Encoded: true,
        software_trigger: null,
    },
    QUALCOMM: {
        action: "com.intent.decode_data",
        categories: null,
        data_field: "barcode",
        isBase64Encoded: true,
        software_trigger: null,
    },
    alps: {
        action: "com.se4500.onDecodeComplete",
        categories: ["com.geomobile.oemscanservice"],
        data_field: "se4500_byte",
        isBase64Encoded: true,
        software_trigger: null,
    },
    "Universal Global Scientific Industrial Co., Ltd.": {
        action: "com.datalogic.decodewedge.decode_action",
        categories: ["com.datalogic.decodewedge.decode_category"],
        data_field: "data",
        isBase64Encoded: true,
        software_trigger: null,
    },
    Urovo: {
        action: "com.intent.decode_data",
        categories: null,
        data_field: "barcode_string",
        isBase64Encoded: false,
        software_trigger: null,
    },
};