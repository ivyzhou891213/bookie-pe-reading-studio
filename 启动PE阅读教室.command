#!/bin/zsh
cd "/Users/zhouziyue/Desktop/我的运营文档/pe-reading-classroom" || exit 1
open "http://localhost:3000/"
exec "./node_modules/.bin/vinext" dev
