#!/bin/sh
# Find3D Material Search - 容器启动脚本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_debug() {
    if [ "$DEBUG" = "true" ]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

# 显示启动信息
show_startup_info() {
    log_info "========================================="
    log_info "Find3D Material Search Platform"
    log_info "Version: ${APP_VERSION:-1.0.0}"
    log_info "Environment: ${NODE_ENV:-production}"
    log_info "Build Time: ${BUILD_TIME:-unknown}"
    log_info "Commit: ${COMMIT_HASH:-unknown}"
    log_info "========================================="
}

# 验证环境变量
validate_environment() {
    log_info "验证环境变量..."
    
    # 可选的环境变量验证
    if [ -n "$REQUIRED_ENV_VARS" ]; then
        for var in $REQUIRED_ENV_VARS; do
            if [ -z "$(eval echo \$$var)" ]; then
                log_error "缺少必需的环境变量: $var"
                exit 1
            fi
        done
    fi
    
    log_info "环境变量验证通过"
}

# 检查文件权限
check_permissions() {
    log_info "检查文件权限..."
    
    # 检查关键目录权限
    local dirs=(
        "/usr/share/nginx/html"
        "/var/cache/nginx"
        "/var/log/nginx"
    )
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            log_warn "目录不存在: $dir"
            continue
        fi
        
        if [ ! -r "$dir" ]; then
            log_error "目录不可读: $dir"
            exit 1
        fi
    done
    
    log_info "文件权限检查通过"
}

# 初始化应用配置
initialize_config() {
    log_info "初始化应用配置..."
    
    # 如果有配置模板，可以在这里处理
    if [ -f "/usr/share/nginx/html/config.template.js" ]; then
        log_info "处理配置模板..."
        
        # 替换环境变量
        envsubst < /usr/share/nginx/html/config.template.js > /usr/share/nginx/html/config.js
        
        log_info "配置模板处理完成"
    fi
    
    # 设置默认配置
    if [ ! -f "/usr/share/nginx/html/config.js" ]; then
        log_info "创建默认配置..."
        
        cat > /usr/share/nginx/html/config.js << EOF
window.APP_CONFIG = {
    API_BASE_URL: '${API_BASE_URL:-/api}',
    CDN_BASE_URL: '${CDN_BASE_URL:-}',
    VERSION: '${APP_VERSION:-1.0.0}',
    ENVIRONMENT: '${NODE_ENV:-production}',
    FEATURES: {
        ENABLE_ANALYTICS: ${ENABLE_ANALYTICS:-true},
        ENABLE_ERROR_TRACKING: ${ENABLE_ERROR_TRACKING:-true}
    }
};
EOF
        
        log_info "默认配置创建完成"
    fi
}

# 验证Nginx配置
validate_nginx_config() {
    log_info "验证Nginx配置..."
    
    if ! nginx -t; then
        log_error "Nginx配置验证失败"
        exit 1
    fi
    
    log_info "Nginx配置验证通过"
}

# 设置信号处理
setup_signal_handlers() {
    log_info "设置信号处理..."
    
    # 优雅关闭处理
    trap 'log_info "收到SIGTERM信号，开始优雅关闭..."; nginx -s quit; exit 0' TERM
    trap 'log_info "收到SIGINT信号，开始优雅关闭..."; nginx -s quit; exit 0' INT
    
    log_info "信号处理设置完成"
}

# 预热应用
warmup_application() {
    if [ "$ENABLE_WARMUP" = "true" ]; then
        log_info "预热应用..."
        
        # 启动Nginx（后台）
        nginx &
        
        # 等待服务启动
        sleep 2
        
        # 发送预热请求
        if command -v curl > /dev/null; then
            curl -f -s http://localhost:8080/health > /dev/null || log_warn "预热请求失败"
            curl -f -s http://localhost:8080/ > /dev/null || log_warn "主页预热失败"
        fi
        
        # 停止后台Nginx
        nginx -s quit
        
        # 等待完全停止
        sleep 1
        
        log_info "应用预热完成"
    fi
}

# 启动前检查
pre_start_checks() {
    log_info "执行启动前检查..."
    
    # 检查端口是否被占用
    if netstat -ln 2>/dev/null | grep -q ":8080 "; then
        log_warn "端口8080已被占用"
    fi
    
    # 检查磁盘空间
    local disk_usage=$(df /usr/share/nginx/html | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 95 ]; then
        log_error "磁盘空间不足: ${disk_usage}%"
        exit 1
    elif [ "$disk_usage" -gt 85 ]; then
        log_warn "磁盘空间较少: ${disk_usage}%"
    fi
    
    # 检查内存
    if [ -f /proc/meminfo ]; then
        local mem_available=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
        if [ "$mem_available" -lt 51200 ]; then  # 50MB
            log_warn "可用内存较少: $((mem_available / 1024))MB"
        fi
    fi
    
    log_info "启动前检查完成"
}

# 启动后验证
post_start_validation() {
    log_info "执行启动后验证..."
    
    # 等待服务启动
    local max_wait=30
    local wait_time=0
    
    while [ $wait_time -lt $max_wait ]; do
        if curl -f -s --max-time 5 http://localhost:8080/health > /dev/null; then
            log_info "服务启动验证成功"
            return 0
        fi
        
        sleep 1
        wait_time=$((wait_time + 1))
    done
    
    log_error "服务启动验证失败，超时 ${max_wait}s"
    return 1
}

# 主函数
main() {
    # 显示启动信息
    show_startup_info
    
    # 执行初始化步骤
    validate_environment
    check_permissions
    initialize_config
    validate_nginx_config
    setup_signal_handlers
    
    # 预热应用（可选）
    warmup_application
    
    # 启动前检查
    pre_start_checks
    
    # 如果有参数，执行指定命令
    if [ $# -gt 0 ]; then
        log_info "执行命令: $*"
        exec "$@"
    else
        log_info "启动Nginx服务..."
        
        # 启动Nginx
        nginx &
        
        # 获取Nginx进程ID
        nginx_pid=$!
        
        # 启动后验证
        if ! post_start_validation; then
            log_error "启动验证失败，退出"
            kill $nginx_pid 2>/dev/null || true
            exit 1
        fi
        
        log_info "Find3D Material Search Platform 启动成功"
        log_info "服务地址: http://localhost:8080"
        
        # 等待Nginx进程
        wait $nginx_pid
    fi
}

# 执行主函数
main "$@"