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
    // NO OFFSET. Pass WI buffer exactly as provided.
    // ---------------------------------------------------------

    printf("  Using full WI buffer with NO offset\n");
    unsigned char* swiPayload = cmpData;
    size_t swiSize = cmpSize;

    printf("  swiPayload pointer: %p\n", swiPayload);
    printf("  swiSize: %zu bytes\n", swiSize);

    printf("  First 16 bytes of WI data:\n    ");
    for (int i = 0; i < 16 && i < swiSize; i++) {
        printf("%02X ", swiPayload[i]);
    }
    printf("\n");

    // ---------------------------------------------------------
    // Allocate decoder structures
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
    // Decode
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
    // Build JS output
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
