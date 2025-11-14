cmake_minimum_required(VERSION 3.10)
project(SWIDecoder)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

add_library(SWIDecoder SHARED
    SWIDecoder.cpp
)

target_link_libraries(SWIDecoder
    m
)
