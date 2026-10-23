@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo   Xavier 的博客  -  本地预览
echo   ---------------------------------------
echo.

set NODE=node
where node >nul 2>nul || set NODE="C:\Users\Hush\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe"

if not exist ".next\BUILD_ID" (
  echo   [!] 还没有服务端构建产物，先构建一次（约 30 秒）
  echo.
  set NEXT_OUTPUT=server
  %NODE% "node_modules\next\dist\bin\next" build
  set NEXT_OUTPUT=
  if not exist ".next\BUILD_ID" (
    echo.
    echo   [x] 构建失败，请把上面的报错发给我。
    pause
    exit /b 1
  )
  echo.
)

echo   Starting on http://127.0.0.1:3000
echo   Keep this window open. Press Ctrl+C to stop.
echo.

%NODE% "node_modules\next\dist\bin\next" start -p 3000 -H 127.0.0.1

echo.
echo   Server stopped.
pause
