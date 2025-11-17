#include <node_api.h>
#include <cstdio>
#include "SWIDecoder.h"

WiDecmpOptions* WiCreateDecmpOptions();
WiRawImage* WiCreateRawImage();
WiCmpImage* WiCreateCmpImage();
int WiDecompress(WiDecmpOptions*, WiRawImage*, WiCmpImage*);
void WiFreeRawImageData(WiRawImage*);

static napi_value decode_swi(napi_env env, napi_callback_info info) {

    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    if (argc < 1) {
        napi_throw_error(env, nullptr, "missing argument");
        return nullptr;
    }

    unsigned char* cmpData = nullptr;
    size_t cmpSize = 0;
    napi_get_buffer_info(env, args[0], (void**)&cmpData, &cmpSize);

    if (!cmpData || cmpSize == 0) {
        napi_throw_error(env, nullptr, "invalid buffer");
        return nullptr;
    }

    WiDecmpOptions* opts = WiCreateDecmpOptions();
    if (!opts) {
        napi_throw_error(env, nullptr, "failed to allocate options");
        return nullptr;
    }

    WiRawImage* raw = WiCreateRawImage();
    if (!raw) {
        napi_throw_error(env, nullptr, "failed to allocate raw image");
        return nullptr;
    }

    WiCmpImage* cmp = WiCreateCmpImage();
    if (!cmp) {
        napi_throw_error(env, nullptr, "failed to allocate cmp image");
        return nullptr;
    }

    cmp->CmpData = cmpData;
    cmp->Size = (int)cmpSize;

    if (!cmp->CmpData || cmp->Size <= 0) {
        napi_throw_error(env, nullptr, "invalid cmp image payload");
        return nullptr;
    }

    int r = WiDecompress(opts, raw, cmp);

    if (r != 0) {
        napi_throw_error(env, nullptr, "decode failed");
        return nullptr;
    }

    if (!raw->Raw || raw->Width <= 0 || raw->Height <= 0) {
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
    if (dataSize <= 0) {
        napi_throw_error(env, nullptr, "invalid data size");
        return nullptr;
    }

    napi_value buf;
    napi_create_buffer_copy(env, dataSize, raw->Raw, nullptr, &buf);
    napi_set_named_property(env, out, "data", buf);

    WiFreeRawImageData(raw);

    return out;
}

NAPI_MODULE_INIT() {
    napi_value fn;
    napi_create_function(env, "decode", NAPI_AUTO_LENGTH, decode_swi, nullptr, &fn);
    napi_set_named_property(env, exports, "decode", fn);
    return exports;
}
