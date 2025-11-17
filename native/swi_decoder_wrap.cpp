#include <node_api.h>
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

    unsigned char* cmpData;
    size_t cmpSize;
    napi_get_buffer_info(env, args[0], (void**)&cmpData, &cmpSize);

    WiDecmpOptions* opts = WiCreateDecmpOptions();
    WiRawImage* raw = WiCreateRawImage();
    WiCmpImage* cmp = WiCreateCmpImage();

    cmp->CmpData = cmpData;
    cmp->Size = cmpSize;

    int r = WiDecompress(opts, raw, cmp);
    if (r != 0) {
        napi_throw_error(env, nullptr, "decode failed");
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
