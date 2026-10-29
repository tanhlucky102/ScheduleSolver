#!/usr/bin/env bash
set -e

# Chuyển về thư mục chứa dự án
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

# 1. Đọc cấu hình mavenrc nếu có
if [ -f "$HOME/.mavenrc" ]; then
    # shellcheck source=/dev/null
    source "$HOME/.mavenrc"
fi

# 2. Tìm Java 21+ nếu java hiện tại chưa đủ phiên bản
JAVA_CMD="java"
JAVA_VER=$("$JAVA_CMD" -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)

if [ -z "$JAVA_VER" ] || [ "$JAVA_VER" -lt 21 ] 2>/dev/null; then
    for candidate in "$HOME"/.jdks/openjdk-24* "$HOME"/.jdks/*21* /usr/lib/jvm/java-21*; do
        if [ -x "$candidate/bin/java" ]; then
            JAVA_CMD="$candidate/bin/java"
            break
        fi
    done
fi

# 3. Đảm bảo file JAR đã được build
JAR="target/schedulesolver.jar"
if [ ! -f "$JAR" ]; then
    echo "Đang đóng gói ứng dụng..."
    mvn package -DskipTests
fi

# 4. Khởi chạy ứng dụng
exec "$JAVA_CMD" -jar "$JAR" "$@"
