#include <cstdio>
#include <fstream>
#include <vector>

#include "SWIDecoder.h"

int main() {

    const char* path = "female.wi";   // adjust the path if needed

    std::ifstream f(path, std::ios::binary);
    if (!f) {
        printf("cannot open file\n");
        return 1;
    }

    std::vector<unsigned char> wi(
        (std::istreambuf_iterator<char>(f)),
        std::istreambuf_iterator<char>()
    );

    printf("file size: %zu\n", wi.size());

    if (wi.size() < 4) {
        printf("invalid file\n");
        return 1;
    }

    unsigned char* payload = wi.data() + 4;
    int payloadSize = wi.size() - 4;

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

        int dataSize = raw->Width * raw->Height;

        FILE* out = fopen("output.pgm", "wb");
        fprintf(out, "P5\n%d %d\n255\n", raw->Width, raw->Height);
        fwrite(raw->Raw, 1, dataSize, out);
        fclose(out);

        printf("saved output.pgm\n");
    }

    return 0;
}
