#include <cstdio>
#include <fstream>
#include <vector>
#include <unistd.h>
#include <filesystem>
#include "SWIDecoder.h"

int main() {

    const char* path = "../src/core/__tests__/female.wi";

    // print working directory
    char cwd[4096];
    getcwd(cwd, sizeof(cwd));
    printf("cwd: %s\n", cwd);
    printf("opening relative path: %s\n", path);

    // resolve absolute path
    std::filesystem::path abs = std::filesystem::absolute(path);
    printf("absolute path resolved: %s\n", abs.string().c_str());

    // print file size on disk
    if (!std::filesystem::exists(abs)) {
        printf("ERROR: file does not exist at resolved path\n");
        return 1;
    }
    printf("size on disk: %lld bytes\n",
        (long long)std::filesystem::file_size(abs));

    // open file
    std::ifstream f(abs, std::ios::binary);
    if (!f) {
        printf("cannot open file\n");
        return 1;
    }

    std::vector<unsigned char> wi(
        (std::istreambuf_iterator<char>(f)),
        std::istreambuf_iterator<char>()
    );

    printf("read into memory: %zu bytes\n", wi.size());

    unsigned char* full = wi.data();
    int fullSize = wi.size();

    // print bytes 0x20-0x40 for comparison
    printf("bytes 0x20 - 0x40:\n");
    for (int i = 0x20; i < 0x40 && i < fullSize; i++) {
        printf("%02X ", full[i]);
    }
    printf("\n");

    // find where 6B 5E is located
    int foundOffset = -1;
    for (int i = 0; i < fullSize - 1; i++) {
        if (full[i] == 0x6B && full[i+1] == 0x5E) {
            foundOffset = i;
            break;
        }
    }

    if (foundOffset < 0) {
        printf("ERROR: could not find 6B 5E signature in file\n");
        return 1;
    }

    printf("found compressed start at offset: %d (0x%X)\n",
           foundOffset, foundOffset);

    // use detected offset
    unsigned char* payload = full + foundOffset;
    int payloadSize = fullSize - foundOffset;

    printf("payload starts with: %02X %02X %02X %02X\n",
           payload[0], payload[1], payload[2], payload[3]);

    // decode
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
