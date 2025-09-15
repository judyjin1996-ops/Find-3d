#!/bin/sh
# Find3D Material Search - 健康检查脚本

set -e

# 配置
HEALTH_URL="http://localhost:8080/health"
TIMEOUT=10
MAX_RETRIES=3

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Nginx进程
check_nginx_process() {
    if ! pgrep nginx > /dev/null; then
        log_error "Nginx进程未运行"
        return 1
    fi
    log_info "Nginx进程正常运行"
    return 0
}

# 检查端口监听
check_port_listening() {
    if ! netstat -ln | grep -q ":8080 "; then
        log_error "端口8080未监听"
        return 1
    fi
    log_info "端口8080正常监听"
    return 0
}

# 检查HTTP响应
check_http_response() {
    local retry=0
    
    while [ $retry -lt $MAX_RETRIES ]; do
        if curl -f -s --max-time $TIMEOUT "$HEALTH_URL" > /dev/null; then
            log_info "HTTP健康检查通过"
            return 0
        fi
        
        retry=$((retry + 1))
        log_warn "HTTP健康检查失败，重试 $retry/$MAX_RETRIES"
        
        if [ $retry -lt $MAX_RETRIES ]; then
            sleep 2
        fi
    done
    
    log_error "HTTP健康检查失败，已重试 $MAX_RETRIES 次"
    return 1
}

# 检查磁盘空间
check_disk_space() {
    local usage=$(df /usr/share/nginx/html | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -gt 90 ]; then
        log_error "磁盘使用率过高: ${usage}%"
        return 1
    elif [ "$usage" -gt 80 ]; then
        log_warn "磁盘使用率较高: ${usage}%"
    else
        log_info "磁盘使用率正常: ${usage}%"
    fi
    
    return 0
}

# 检查内存使用
check_memory_usage() {
    local mem_info=$(cat /proc/meminfo)
    local mem_total=$(echo "$mem_info" | grep MemTotal | awk '{print $2}')
    local mem_available=$(echo "$mem_info" | grep MemAvailable | awk '{print $2}')
    
    if [ "$mem_total" -gt 0 ]; then
        local mem_usage=$((100 - (mem_available * 100 / mem_total)))
        
        if [ "$mem_usage" -gt 90 ]; then
            log_error "内存使用率过高: ${mem_usage}%"
            return 1
        elif [ "$mem_usage" -gt 80 ]; then
            log_warn "内存使用率较高: ${mem_usage}%"
        else
            log_info "内存使用率正常: ${mem_usage}%"
        fi
    fi
    
    return 0
}

# 检查关键文件
check_critical_files() {
    local files=(
        "/usr/share/nginx/html/index.html"
        "/etc/nginx/nginx.conf"
        "/etc/nginx/conf.d/default.conf"
    )
    
    for file in "${files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "关键文件缺失: $file"
            return 1
        fi
    done
    
    log_info "关键文件检查通过"
    return 0
}

# 主健康检查函数
main() {
    log_info "开始健康检查..."
    
    local exit_code=0
    
    # 执行各项检查
    check_nginx_process || exit_code=1
    check_port_listening || exit_code=1
    check_critical_files || exit_code=1
    check_http_response || exit_code=1
    check_disk_space || exit_code=1
    check_memory_usage || exit_code=1
    
    if [ $exit_code -eq 0 ]; then
        log_info "所有健康检查通过"
        echo "healthy"
    else
        log_error "健康检查失败"
        echo "unhealthy"
    fi
    
    exit $exit_code
}

# 执行主函数
main "$@"