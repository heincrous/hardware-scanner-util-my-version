{
  "targets": [
    {
      "target_name": "swi_decoder",
      "sources": [
        "swi_decoder_wrap.cpp",
        "SWIDecoder.cpp"
      ],
      "include_dirs": [
        "<!(node -e \"require('node-addon-api').include\")"
      ],
      "libraries": [
        "-L./build",        # search path
        "-lSWIDecoder"      # link libSWIDecoder.so
      ],
      "cflags_cc": [
        "-std=c++17"
      ]
    }
  ]
}
