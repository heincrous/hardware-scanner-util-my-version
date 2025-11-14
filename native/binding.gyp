{
  "targets": [
    {
      "target_name": "swi_decoder",
      "sources": [
        "swi_decoder_wrap.cpp",
        "SWIDecoder.cpp"
      ],
      "libraries": [
        "<(module_root_dir)/libSWIDecoder.so"
      ],
      "include_dirs": [
        "<(module_root_dir)"
      ],
      "cflags": ["-std=c++11"],
      "ldflags": [
        "-Wl,-rpath,'$ORIGIN'"
      ]
    }
  ]
}
