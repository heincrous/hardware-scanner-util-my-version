#include <node_api.h>
#include <cstdlib>
#include <cstdio>
#include "SWIDecoder.h"

WiDecmpOptions* WiCreateDecmpOptions();
WiRawImage* WiCreateRawImage();
WiCmpImage* WiCreateCmpImage();
int WiDecompress(WiDecmpOptions*, WiRawImage*, WiCmpImage*);
void WiFreeRawImageData(WiRawImage*);

static napi_value decode_swi(napi_env env, napi_callback_info info) {

    printf("decode_swi() called\n");

    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    printf("  Args received: %zu\n", argc);

    unsigned char* cmpData;
    size_t cmpSize;
    napi_get_buffer_info(env, args[0], (void**)&cmpData, &cmpSize);

    printf("  cmpData pointer: %p\n", cmpData);
    printf("  cmpSize: %zu bytes\n", cmpSize);

    // ---------------------------------------------------------
    // PATCH: skip WI metadata header (0x2A bytes)
    // ---------------------------------------------------------

    const int SWI_OFFSET = 0x2A;

    printf("  Applying SWI offset: 0x%X (%d)\n", SWI_OFFSET, SWI_OFFSET);

    if (cmpSize <= SWI_OFFSET) {
        printf("  ERROR: cmpSize smaller than header offset!\n");
        napi_throw_error(env, nullptr, "input too small for WI header");
        return nullptr;
    }

    unsigned char* swiPayload = cmpData + SWI_OFFSET;
    size_t swiSize = cmpSize - SWI_OFFSET;

    printf("  swiPayload pointer: %p\n", swiPayload);
    printf("  swiSize: %zu bytes\n", swiSize);

    // Dump first 16 bytes of payload for inspection
    printf("  First 16 bytes of SWI payload:\n    ");
    for (int i = 0; i < 16 && i < swiSize; i++) {
        printf("%02X ", swiPayload[i]);
    }
    printf("\n");

    // ---------------------------------------------------------
    // Allocate the decoder structures
    // ---------------------------------------------------------

    WiDecmpOptions* opts = WiCreateDecmpOptions();
    WiRawImage* raw = WiCreateRawImage();
    WiCmpImage* cmp = WiCreateCmpImage();

    printf("  Allocated opts: %p\n", opts);
    printf("  Allocated raw:  %p\n", raw);
    printf("  Allocated cmp:  %p\n", cmp);

    // ---------------------------------------------------------
    // Setup compressed image structure
    // ---------------------------------------------------------

    cmp->CmpData = swiPayload;
    cmp->Size    = swiSize;

    printf("  cmp->CmpData: %p\n", cmp->CmpData);
    printf("  cmp->Size:    %d\n", (int)cmp->Size);

    // ---------------------------------------------------------
    // Call decoder
    // ---------------------------------------------------------

    printf("  Calling WiDecompress...\n");
    int r = WiDecompress(opts, raw, cmp);
    printf("  WiDecompress returned: %d\n", r);

    if (r != 0) {
        printf("  ERROR: WiDecompress failed\n");
        napi_throw_error(env, nullptr, "decode failed");
        return nullptr;
    }

    printf("  WiDecompress SUCCESS\n");
    printf("  Decoded Width:  %d\n", raw->Width);
    printf("  Decoded Height: %d\n", raw->Height);
    printf("  Raw pointer:    %p\n", raw->Raw);

    // ---------------------------------------------------------
    // Build JS output object
    // ---------------------------------------------------------

    napi_value out;
    napi_create_object(env, &out);

    napi_value w, h;
    napi_create_int32(env, raw->Width, &w);
    napi_create_int32(env, raw->Height, &h);
    napi_set_named_property(env, out, "width", w);
    napi_set_named_property(env, out, "height", h);

    int dataSize = raw->Width * raw->Height;
    napi_value buf;
    napi_create_buffer_copy(env, dataSize, raw->Raw, nullptr, &buf);
    napi_set_named_property(env, out, "data", buf);

    // Cleanup
    printf("  Freeing raw image data...\n");
    WiFreeRawImageData(raw);

    printf("decode_swi() completed successfully.\n");

    return out;
}

NAPI_MODULE_INIT() {
    printf("SWI Decoder module loaded.\n");
    napi_value fn;
    napi_create_function(env, "decode", NAPI_AUTO_LENGTH, decode_swi, nullptr, &fn);
    napi_set_named_property(env, exports, "decode", fn);
    return exports;
}
