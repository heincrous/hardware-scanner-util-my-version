#include <cstdio>
#include <fstream>
#include <vector>

#include "SWIDecoder.h"

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

    unsigned char* payload = wi.data() + 4;
    int payloadSize = wi.size() - 4;

    WiDecmpOptions* opts = WiCreateDecmpOptions();
    WiRawImage* raw = WiCreateRawImage();
    WiCmpImage* cmp = WiCreateCmpImage();

    cmp->CmpData = payload;
    cmp->Size = payloadSize;

    int r = WiDecompress(opts, raw, cmp);
    printf("decode result: %d\n", r);

    return 0;
}
