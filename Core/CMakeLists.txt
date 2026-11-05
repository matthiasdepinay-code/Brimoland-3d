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

add_library(brimo_core STATIC src/json.cpp src/donnees.cpp src/sceau.cpp src/pont.cpp)
target_include_directories(brimo_core PUBLIC include)

enable_testing()
add_executable(parite tests/parite.cpp)
target_link_libraries(parite PRIVATE brimo_core)
add_test(NAME parite COMMAND parite ${CMAKE_CURRENT_SOURCE_DIR})

add_executable(pont tests/pont.cpp)
target_link_libraries(pont PRIVATE brimo_core)
add_test(NAME pont COMMAND pont ${CMAKE_CURRENT_SOURCE_DIR})

# BrimoCore compilé comme Unreal le compilera : le fichier même que le module Unreal compile
# (Unreal/Brimoland/Source/Brimoland/Private/BrimoCoreSources.cpp, qui inclut toutes les sources d'un coup),
# en C++20 et sans RTTI. La parité doit passer à l'identique.
set(BRIMO_UNITE ${CMAKE_CURRENT_SOURCE_DIR}/../Unreal/Brimoland/Source/Brimoland/Private/BrimoCoreSources.cpp)
if(EXISTS ${BRIMO_UNITE})
  add_library(brimo_unreal STATIC ${BRIMO_UNITE})
  target_include_directories(brimo_unreal PUBLIC include PRIVATE src)
  set_target_properties(brimo_unreal PROPERTIES CXX_STANDARD 20)
  if(MSVC)
    target_compile_options(brimo_unreal PUBLIC /GR- /EHsc)
  else()
    target_compile_options(brimo_unreal PUBLIC -fno-rtti)
  endif()
  foreach(t parite pont)
    add_executable(${t}_unreal tests/${t}.cpp)
    target_link_libraries(${t}_unreal PRIVATE brimo_unreal)
    set_target_properties(${t}_unreal PROPERTIES CXX_STANDARD 20)
    add_test(NAME ${t}_unreal COMMAND ${t}_unreal ${CMAKE_CURRENT_SOURCE_DIR})
  endforeach()
endif()
