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

    // full buffer
    unsigned char* full = wi.data();
    int fullSize = wi.size();

    // print header preview
    printf("first 64 bytes:\n");
    for (int i = 0; i < 64 && i < fullSize; i++) {
        printf("%02X ", full[i]);
    }
    printf("\n");

    // required WI header skip
    const int OFFSET = 0x2A;

    if (fullSize <= OFFSET) {
        printf("file too small\n");
        return 1;
    }

    unsigned char* payload = full + OFFSET;
    int payloadSize = fullSize - OFFSET;

    printf("payload starts with: %02X %02X %02X %02X\n",
        payload[0], payload[1], payload[2], payload[3]);

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
