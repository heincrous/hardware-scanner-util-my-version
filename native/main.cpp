#include <cstdio>
#include <fstream>
#include <vector>

extern "C" {
    #include "SWIDecoder.h"
}

int main() {

    const char* path = "../src/core/__tests__/female.wi";

    std::ifstream f(path, std::ios::binary);
    if (!f) {
        printf("cannot open file at path: %s\n", path);
        return 1;
    }

    std::vector<unsigned char> wi(
        (std::istreambuf_iterator<char>(f)),
        std::istreambuf_iterator<char>()
    );

    printf("file size: %zu\n", wi.size());

    // pass the FULL WI stream, not skipping anything
    unsigned char* payload = wi.data();
    int payloadSize = wi.size();

    WiDecmpOptions* opts = WiCreateDecmpOptions();
    WiRawImage* raw = WiCreateRawImage();
    WiCmpImage* cmp = WiCreateCmpImage();

    cmp->CmpData = payload;
    cmp->Size = payloadSize;

    int r = WiDecompress(opts, raw, cmp);
    printf("decode result: %d\n", r);

    if (r == 0) {
        printf("decoded width: %d\n", raw->Width);
        printf("decoded height: %d\n", raw->Height);
    }

    return 0;
}
