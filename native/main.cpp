#include <cstdio>
#include <fstream>
#include <vector>
#include <unistd.h>
#include <sys/stat.h>
#include "SWIDecoder.h"

int main() {

    const char* path = "../src/core/__tests__/female.wi";

    // Working directory
    char cwd[4096];
    getcwd(cwd, sizeof(cwd));
    printf("cwd: %s\n", cwd);
    printf("opening relative path: %s\n", path);

    // Build absolute path manually
    char abs[4096];
    snprintf(abs, sizeof(abs), "%s/%s", cwd, path);
    printf("absolute path: %s\n", abs);

    // Size on disk via stat
    struct stat st;
    if (stat(abs, &st) != 0) {
        printf("ERROR: file does not exist\n");
        return 1;
    }
    printf("size on disk: %lld bytes\n", (long long)st.st_size);

    // Open file
    std::ifstream f(abs, std::ios::binary);
    if (!f) {
        printf("ERROR: cannot open file\n");
        return 1;
    }

    std::vector<unsigned char> wi(
        (std::istreambuf_iterator<char>(f)),
        std::istreambuf_iterator<char>()
    );

    printf("read into memory: %zu bytes\n", wi.size());

    unsigned char* full = wi.data();
    int fullSize = wi.size();

    // Print header region
    printf("bytes 0x20 - 0x40:\n");
    for (int i = 0x20; i < 0x40 && i < fullSize; i++) {
        printf("%02X ", full[i]);
    }
    printf("\n");

    // Search for the real start of the compressed stream (6B 5E)
    int foundOffset = -1;
    for (int i = 0; i < fullSize - 1; i++) {
        if (full[i] == 0x6B && full[i+1] == 0x5E) {
            foundOffset = i;
            break;
        }
    }

    if (foundOffset < 0) {
        printf("ERROR: could not find 6B 5E sequence in file\n");
        return 1;
    }

    printf("found compressed start at offset: %d (0x%X)\n",
           foundOffset, foundOffset);

    // Use the detected offset
    unsigned char* payload = full + foundOffset;
    int payloadSize = fullSize - foundOffset;

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
