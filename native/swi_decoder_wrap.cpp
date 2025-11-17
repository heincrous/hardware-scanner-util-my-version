#include <node_api.h>
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
    printf("  argc: %zu\n", argc);

    if (argc < 1) {
        printf("  ERROR: missing argument\n");
        napi_throw_error(env, nullptr, "missing argument");
        return nullptr;
    }

    unsigned char* cmpData = nullptr;
    size_t cmpSize = 0;
    napi_get_buffer_info(env, args[0], (void**)&cmpData, &cmpSize);

    printf("  cmpData pointer: %p\n", cmpData);
    printf("  cmpSize: %zu bytes\n", cmpSize);

    if (!cmpData || cmpSize == 0) {
        printf("  ERROR: invalid buffer\n");
        napi_throw_error(env, nullptr, "invalid buffer");
        return nullptr;
    }

    if (cmpSize > 0) {
        printf("  First 16 bytes:\n    ");
        for (int i = 0; i < 16 && i < (int)cmpSize; i++) {
            printf("%02X ", cmpData[i]);
        }
        printf("\n");
    }

    WiDecmpOptions* opts = WiCreateDecmpOptions();
    printf("  opts: %p\n", opts);
    if (!opts) {
        printf("  ERROR: failed to allocate opts\n");
        napi_throw_error(env, nullptr, "failed to allocate options");
        return nullptr;
    }

    WiRawImage* raw = WiCreateRawImage();
    printf("  raw:  %p\n", raw);
    if (!raw) {
        printf("  ERROR: failed to allocate raw\n");
        napi_throw_error(env, nullptr, "failed to allocate raw image");
        return nullptr;
    }

    WiCmpImage* cmp = WiCreateCmpImage();
    printf("  cmp:  %p\n", cmp);
    if (!cmp) {
        printf("  ERROR: failed to allocate cmp image\n");
        napi_throw_error(env, nullptr, "failed to allocate cmp image");
        return nullptr;
    }

    cmp->CmpData = cmpData;
    cmp->Size = (int)cmpSize;

    printf("  cmp->CmpData: %p\n", cmp->CmpData);
    printf("  cmp->Size:    %d\n", cmp->Size);

    int r = WiDecompress(opts, raw, cmp);

    printf("  WiDecompress returned: %d\n", r);

    if (r != 0) {
        printf("  ERROR: WiDecompress failed\n");
        napi_throw_error(env, nullptr, "decode failed");
        return nullptr;
    }

    printf("  WiDecompress succeeded\n");
    printf("  raw->Raw:    %p\n", raw->Raw);
    printf("  raw->Width:  %d\n", raw->Width);
    printf("  raw->Height: %d\n", raw->Height);

    if (!raw->Raw || raw->Width <= 0 || raw->Height <= 0) {
        printf("  ERROR: invalid decoded image\n");
        napi_throw_error(env, nullptr, "decoder produced invalid image");
        return nullptr;
    }

    napi_value out;
    napi_create_object(env, &out);

    napi_value w, h;
    napi_create_int32(env, raw->Width, &w);
    napi_create_int32(env, raw->Height, &h);

    napi_set_named_property(env, out, "width", w);
    napi_set_named_property(env, out, "height", h);

    int dataSize = raw->Width * raw->Height;
    printf("  dataSize: %d\n", dataSize);

    napi_value buf;
    napi_create_buffer_copy(env, dataSize, raw->Raw, nullptr, &buf);
    napi_set_named_property(env, out, "data", buf);

    printf("  Freeing raw image\n");
    WiFreeRawImageData(raw);

    printf("decode_swi() completed\n");

    return out;
}

NAPI_MODULE_INIT() {
    printf("SWI decoder module loaded\n");

    napi_value fn;
    napi_create_function(env, "decode", NAPI_AUTO_LENGTH, decode_swi, nullptr, &fn);
    napi_set_named_property(env, exports, "decode", fn);
    return exports;
}
