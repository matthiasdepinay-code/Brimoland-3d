# BrimoCore : la magie de L'Atelier des Sceaux, en C++17 pur (sans Unreal).
#   cmake -S Core -B build && cmake --build build && ctest --test-dir build --output-on-failure
cmake_minimum_required(VERSION 3.16)
project(BrimoCore LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
if(MSVC)
  add_compile_options(/W4 /utf-8)
else()
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()

add_library(brimo_core STATIC src/json.cpp src/donnees.cpp src/sceau.cpp)
target_include_directories(brimo_core PUBLIC include)

enable_testing()
add_executable(parite tests/parite.cpp)
target_link_libraries(parite PRIVATE brimo_core)
add_test(NAME parite COMMAND parite ${CMAKE_CURRENT_SOURCE_DIR})
