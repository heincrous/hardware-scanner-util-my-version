#include <node_api.h>
#include <cstdlib>
#include "SWIDecoder.h"

// use C++ linkage exactly matching SWIDecoder.cpp
WiResultImage DecodeImage(unsigned char* imageData, int size);

static napi_value decode_swi(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    unsigned char* cmpData;
    size_t cmpSize;
    napi_get_buffer_info(env, args[0], (void**)&cmpData, &cmpSize);

    WiResultImage result = DecodeImage(cmpData, (int)cmpSize);

    if (result.size <= 0 || result.raw == nullptr) {
        napi_throw_error(env, nullptr, "decode failed");
        return nullptr;
    }

    napi_value out;
    napi_create_object(env, &out);

    // size only; width and height unknown
    napi_value size;
    napi_create_int32(env, result.size, &size);
    napi_set_named_property(env, out, "size", size);

    napi_value buf;
    napi_create_buffer_copy(env, result.size, result.raw, nullptr, &buf);
    napi_set_named_property(env, out, "rgb", buf);

    return out;
}

NAPI_MODULE_INIT() {
    napi_value fn;
    napi_create_function(env, "decode", NAPI_AUTO_LENGTH, decode_swi, nullptr, &fn);
    napi_set_named_property(env, exports, "decode", fn);
    return exports;
}
