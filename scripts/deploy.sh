#!/bin/bash
# Find3D Material Search - 部署脚本

set -e

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOY_ENV="${DEPLOY_ENV:-production}"
APP_VERSION="${APP_VERSION:-$(git rev-parse --short HEAD)}"
BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
COMMIT_HASH="$(git rev-parse HEAD)"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"

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

# 显示帮助信息
show_help() {
    cat << EOF
Find3D Material Search 部署脚本

用法: $0 [选项] <命令>

命令:
    build       构建Docker镜像
    deploy      部署到指定环境
    rollback    回滚到上一个版本
    status      查看部署状态
    logs        查看应用日志
    cleanup     清理旧版本和未使用的资源

选项:
    -e, --env ENV           部署环境 (development|staging|production)
    -v, --version VERSION   应用版本标签
    -f, --force            强制部署，跳过确认
    -d, --debug            启用调试模式
    -h, --help             显示此帮助信息

环境变量:
    DEPLOY_ENV             部署环境
    APP_VERSION            应用版本
    DOCKER_REGISTRY        Docker镜像仓库
    DEPLOY_TARGET          部署目标 (local|swarm|k8s)

示例:
    $0 build
    $0 deploy -e production -v 1.2.3
    $0 rollback -e staging
    $0 status -e production
EOF
}

# 解析命令行参数
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--env)
                DEPLOY_ENV="$2"
                shift 2
                ;;
            -v|--version)
                APP_VERSION="$2"
                shift 2
                ;;
            -f|--force)
                FORCE_DEPLOY=true
                shift
                ;;
            -d|--debug)
                DEBUG=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            build|deploy|rollback|status|logs|cleanup)
                COMMAND="$1"
                shift
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done

    if [ -z "$COMMAND" ]; then
        log_error "请指定命令"
        show_help
        exit 1
    fi
}

# 验证环境
validate_environment() {
    log_info "验证部署环境: $DEPLOY_ENV"

    case $DEPLOY_ENV in
        development|staging|production)
            ;;
        *)
            log_error "无效的部署环境: $DEPLOY_ENV"
            exit 1
            ;;
    esac

    # 检查必需的工具
    local required_tools=("docker" "docker-compose" "git")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "缺少必需的工具: $tool"
            exit 1
        fi
    done

    # 检查Docker是否运行
    if ! docker info &> /dev/null; then
        log_error "Docker未运行或无权限访问"
        exit 1
    fi

    log_info "环境验证通过"
}

# 加载环境配置
load_environment_config() {
    local env_file="$PROJECT_ROOT/.env.$DEPLOY_ENV"
    
    if [ -f "$env_file" ]; then
        log_info "加载环境配置: $env_file"
        set -a
        source "$env_file"
        set +a
    else
        log_warn "环境配置文件不存在: $env_file"
    fi

    # 设置默认值
    DOCKER_REGISTRY="${DOCKER_REGISTRY:-find3d}"
    DEPLOY_TARGET="${DEPLOY_TARGET:-local}"
    IMAGE_NAME="${DOCKER_REGISTRY}/material-search"
    IMAGE_TAG="${IMAGE_NAME}:${APP_VERSION}"

    log_debug "Docker Registry: $DOCKER_REGISTRY"
    log_debug "Image Name: $IMAGE_NAME"
    log_debug "Image Tag: $IMAGE_TAG"
    log_debug "Deploy Target: $DEPLOY_TARGET"
}

# 构建Docker镜像
build_image() {
    log_info "构建Docker镜像: $IMAGE_TAG"

    cd "$PROJECT_ROOT"

    # 构建参数
    local build_args=(
        "--build-arg" "VITE_API_BASE_URL=${VITE_API_BASE_URL}"
        "--build-arg" "VITE_CDN_BASE_URL=${VITE_CDN_BASE_URL}"
        "--build-arg" "VITE_APP_VERSION=${APP_VERSION}"
        "--build-arg" "VITE_BUILD_TIME=${BUILD_TIME}"
        "--build-arg" "VITE_COMMIT_HASH=${COMMIT_HASH}"
        "--build-arg" "VITE_BRANCH=${BRANCH}"
        "--tag" "$IMAGE_TAG"
        "--tag" "${IMAGE_NAME}:latest"
        "--file" "docker/Dockerfile"
    )

    # 如果是生产环境，启用多平台构建
    if [ "$DEPLOY_ENV" = "production" ]; then
        build_args+=("--platform" "linux/amd64,linux/arm64")
    fi

    log_info "执行Docker构建..."
    docker build "${build_args[@]}" .

    log_info "Docker镜像构建完成: $IMAGE_TAG"

    # 推送到镜像仓库
    if [ "$DEPLOY_ENV" != "development" ] && [ -n "$DOCKER_REGISTRY" ]; then
        log_info "推送镜像到仓库..."
        docker push "$IMAGE_TAG"
        docker push "${IMAGE_NAME}:latest"
        log_info "镜像推送完成"
    fi
}

# 部署应用
deploy_application() {
    log_info "部署应用到 $DEPLOY_ENV 环境"

    cd "$PROJECT_ROOT"

    # 确认部署
    if [ "$FORCE_DEPLOY" != "true" ] && [ "$DEPLOY_ENV" = "production" ]; then
        echo -n "确认部署到生产环境? (y/N): "
        read -r confirm
        if [[ ! $confirm =~ ^[Yy]$ ]]; then
            log_info "部署已取消"
            exit 0
        fi
    fi

    # 选择部署方式
    case $DEPLOY_TARGET in
        local)
            deploy_local
            ;;
        swarm)
            deploy_swarm
            ;;
        k8s)
            deploy_kubernetes
            ;;
        *)
            log_error "不支持的部署目标: $DEPLOY_TARGET"
            exit 1
            ;;
    esac

    log_info "应用部署完成"
}

# 本地部署
deploy_local() {
    log_info "执行本地Docker Compose部署"

    local compose_files=("-f" "docker-compose.yml")
    
    if [ "$DEPLOY_ENV" = "production" ]; then
        compose_files+=("-f" "docker-compose.prod.yml")
    fi

    # 设置环境变量
    export APP_VERSION
    export BUILD_TIME
    export COMMIT_HASH
    export BRANCH

    # 停止现有服务
    log_info "停止现有服务..."
    docker-compose "${compose_files[@]}" down

    # 拉取最新镜像
    log_info "拉取最新镜像..."
    docker-compose "${compose_files[@]}" pull

    # 启动服务
    log_info "启动服务..."
    docker-compose "${compose_files[@]}" up -d

    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10

    # 验证部署
    verify_deployment
}

# Docker Swarm部署
deploy_swarm() {
    log_info "执行Docker Swarm部署"

    # 检查Swarm状态
    if ! docker info | grep -q "Swarm: active"; then
        log_error "Docker Swarm未激活"
        exit 1
    fi

    # 部署Stack
    docker stack deploy \
        --compose-file docker-compose.yml \
        --compose-file docker-compose.prod.yml \
        find3d

    log_info "Docker Stack部署完成"
}

# Kubernetes部署
deploy_kubernetes() {
    log_info "执行Kubernetes部署"

    local k8s_dir="$PROJECT_ROOT/k8s"
    
    if [ ! -d "$k8s_dir" ]; then
        log_error "Kubernetes配置目录不存在: $k8s_dir"
        exit 1
    fi

    # 检查kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl未安装"
        exit 1
    fi

    # 应用配置
    kubectl apply -f "$k8s_dir/"

    log_info "Kubernetes部署完成"
}

# 验证部署
verify_deployment() {
    log_info "验证部署状态..."

    local max_attempts=30
    local attempt=0
    local health_url="http://localhost:8080/health"

    while [ $attempt -lt $max_attempts ]; do
        if curl -f -s --max-time 5 "$health_url" > /dev/null; then
            log_info "✅ 应用健康检查通过"
            return 0
        fi

        attempt=$((attempt + 1))
        log_info "等待应用启动... ($attempt/$max_attempts)"
        sleep 2
    done

    log_error "❌ 应用健康检查失败"
    return 1
}

# 回滚部署
rollback_deployment() {
    log_info "回滚部署到上一个版本"

    case $DEPLOY_TARGET in
        local)
            rollback_local
            ;;
        swarm)
            rollback_swarm
            ;;
        k8s)
            rollback_kubernetes
            ;;
        *)
            log_error "不支持的部署目标: $DEPLOY_TARGET"
            exit 1
            ;;
    esac

    log_info "回滚完成"
}

# 本地回滚
rollback_local() {
    log_info "执行本地回滚"

    # 获取上一个版本
    local previous_version
    previous_version=$(docker images --format "table {{.Tag}}" "$IMAGE_NAME" | grep -v "latest" | head -2 | tail -1)

    if [ -z "$previous_version" ]; then
        log_error "未找到上一个版本"
        exit 1
    fi

    log_info "回滚到版本: $previous_version"

    # 更新版本并重新部署
    APP_VERSION="$previous_version"
    deploy_local
}

# Docker Swarm回滚
rollback_swarm() {
    log_info "执行Docker Swarm回滚"
    
    docker service rollback find3d_app
}

# Kubernetes回滚
rollback_kubernetes() {
    log_info "执行Kubernetes回滚"
    
    kubectl rollout undo deployment/find3d-app
}

# 查看部署状态
show_status() {
    log_info "查看部署状态: $DEPLOY_ENV"

    case $DEPLOY_TARGET in
        local)
            docker-compose ps
            ;;
        swarm)
            docker stack services find3d
            ;;
        k8s)
            kubectl get pods -l app=find3d
            ;;
    esac
}

# 查看日志
show_logs() {
    log_info "查看应用日志"

    case $DEPLOY_TARGET in
        local)
            docker-compose logs -f --tail=100 app
            ;;
        swarm)
            docker service logs -f find3d_app
            ;;
        k8s)
            kubectl logs -f -l app=find3d-app
            ;;
    esac
}

# 清理资源
cleanup_resources() {
    log_info "清理未使用的资源"

    # 清理未使用的镜像
    docker image prune -f

    # 清理未使用的容器
    docker container prune -f

    # 清理未使用的网络
    docker network prune -f

    # 清理未使用的卷
    docker volume prune -f

    log_info "资源清理完成"
}

# 主函数
main() {
    log_info "Find3D Material Search 部署脚本"
    log_info "版本: $APP_VERSION"
    log_info "环境: $DEPLOY_ENV"
    log_info "构建时间: $BUILD_TIME"

    validate_environment
    load_environment_config

    case $COMMAND in
        build)
            build_image
            ;;
        deploy)
            build_image
            deploy_application
            ;;
        rollback)
            rollback_deployment
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        cleanup)
            cleanup_resources
            ;;
        *)
            log_error "未知命令: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

# 解析参数并执行
parse_args "$@"
main