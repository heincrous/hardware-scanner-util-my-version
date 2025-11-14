#include <node_api.h>
#include <cstdlib>
#include "SWIDecoder.h"

extern "C" {
    // real internal decoder
    int sub_10011840(unsigned char* input, int inputSize, unsigned char** outRGB, int* width, int* height);
}

static napi_value decode_swi(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    unsigned char* cmpData;
    size_t cmpSize;
    napi_get_buffer_info(env, args[0], (void**)&cmpData, &cmpSize);

    unsigned char* rgb = nullptr;
    int width = 0;
    int height = 0;

    int r = sub_10011840(cmpData, (int)cmpSize, &rgb, &width, &height);
    if (r != 0) {
        napi_throw_error(env, nullptr, "decode failed");
        return nullptr;
    }

    napi_value out;
    napi_create_object(env, &out);

    napi_value w, h;
    napi_create_int32(env, width, &w);
    napi_create_int32(env, height, &h);
    napi_set_named_property(env, out, "width", w);
    napi_set_named_property(env, out, "height", h);

    int dataSize = width * height * 3;
    napi_value buf;
    unsigned char* dst;
    napi_create_buffer_copy(env, dataSize, rgb, (void**)&dst, &buf);
    napi_set_named_property(env, out, "data", buf);

    // free memory allocated by SWIDecoder.cpp
    free(rgb);

    return out;
}

NAPI_MODULE_INIT() {
    napi_value fn;
    napi_create_function(env, "decode", NAPI_AUTO_LENGTH, decode_swi, nullptr, &fn);
    napi_set_named_property(env, exports, "decode", fn);
    return exports;
}
