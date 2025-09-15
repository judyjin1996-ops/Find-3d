import React from 'react';
import { Card, Loading, Button, Icon, Modal, ErrorBoundary, EmptyState, ToastContainer } from './components/ui';
import { SearchBox, SearchHistory, SearchStatus } from './components/search';
import { WebsiteManager } from './components/website-manager';
import { ResultList, ResultDetailModal, GroupedResultList } from './components/results';
import { useSearch } from './hooks/useSearch';
import { useWebsiteConfig } from './hooks/useWebsiteConfig';
import { useToast } from './hooks/useToast';
import { useResponsive } from './hooks/useResponsive';
import { errorService } from './services/errorService';
import type { MaterialResult, AppError } from './types';

function App() {
  const { isMobile, isTablet } = useResponsive();
  const { toasts, removeToast, error: showError, success: showSuccess } = useToast();

  const {
    searchState,
    searchHistory,
    websiteStatuses,
    historyVisible,
    performSearch,
    searchFromHistory,
    toggleHistory,
    clearHistory,
    removeFromHistory,
    isLoading,
    hasResults
  } = useSearch({
    enableGroupedResults: false, // 可以切换为true启用分组模式
    enableLiveSearch: false,     // 可以切换为true启用实时搜索
    onSearchProgress: (progress) => {
      console.log('搜索进度:', progress);
    },
    onError: (error) => {
      showError(errorService.getUserFriendlyMessage(error));
    },
    onSuccess: (resultCount) => {
      if (resultCount > 0) {
        showSuccess(`找到 ${resultCount} 个搜索结果`);
      }
    }
  });

  const {
    websites,
    addWebsite,
    updateWebsite,
    deleteWebsite,
    toggleWebsiteActive,
    stats
  } = useWebsiteConfig();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [showWebsiteManager, setShowWebsiteManager] = React.useState(false);
  const [selectedResult, setSelectedResult] = React.useState<MaterialResult | null>(null);
  const [viewMode, setViewMode] = React.useState<'unified' | 'grouped'>('unified');

  // 全局错误处理
  const handleGlobalError = React.useCallback((error: AppError) => {
    showError(errorService.getUserFriendlyMessage(error));
  }, [showError]);


  return (
    <ErrorBoundary onError={handleGlobalError}>
      <div className={`min-h-screen bg-sketch-background ${isMobile ? 'p-2' : 'p-4'}`}>
        <div className={`max-w-6xl mx-auto ${isMobile ? 'px-2' : ''}`}>
        {/* 头部标题 */}
        <div className={`text-center ${isMobile ? 'mb-6' : 'mb-8'}`}>
          <h1 className={`font-bold sketch-text-primary mb-2 font-sketch ${
            isMobile ? 'text-2xl' : 'text-4xl'
          }`}>
            🎨 Find 3D
          </h1>
          <p className={`sketch-text-secondary font-sketch ${
            isMobile ? 'text-base' : 'text-lg'
          }`}>
            专为三维设计师打造的素材搜索平台
          </p>
        </div>

        {/* 搜索区域 */}
        <Card className={isMobile ? 'mb-6' : 'mb-8'}>
          <SearchBox
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={(query) => {
              setSearchQuery(query);
              performSearch(query);
            }}
            loading={isLoading}
            showHistory={historyVisible}
            onToggleHistory={toggleHistory}
            searchHistory={searchHistory}
            showSuggestions={true}
          />
        </Card>

        {/* 搜索历史 */}
        <SearchHistory
          history={searchHistory}
          visible={historyVisible}
          onSelectHistory={(query) => {
            setSearchQuery(query);
            searchFromHistory(query);
          }}
          onClearHistory={clearHistory}
          onRemoveHistory={removeFromHistory}
          className={isMobile ? 'mb-6' : 'mb-8'}
        />

        {/* 网站管理和功能展示区域 */}
        <div className={isMobile ? 'mb-6' : 'mb-8'}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-4' : 'mb-6'}`}>
            <h2 className={`font-bold text-sketch-text ${isMobile ? 'text-xl' : 'text-2xl'}`}>
              功能特色
            </h2>
            <Button
              variant="outline"
              size={isMobile ? 'sm' : 'md'}
              onClick={() => setShowWebsiteManager(true)}
              icon={<Icon name="settings" size="sm" />}
            >
              {isMobile ? '管理' : `管理网站 (${stats.active}/${stats.total})`}
            </Button>
          </div>

          <div className={`grid gap-4 ${
            isMobile ? 'grid-cols-1' : 
            isTablet ? 'grid-cols-2' : 
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            <Card hoverable>
              <div className="text-center">
                <div className="text-3xl mb-3">🔍</div>
                <h3 className="text-lg font-semibold sketch-text-primary mb-2 font-sketch">
                  多网站搜索
                </h3>
                <p className="sketch-text-secondary text-sm font-sketch">
                  同时搜索魔顿网、CG资源网、书生CG资源站等多个平台
                </p>
              </div>
            </Card>

            <Card hoverable>
              <div className="text-center">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="text-lg font-semibold sketch-text-primary mb-2 font-sketch">
                  统一结果展示
                </h3>
                <p className="sketch-text-secondary text-sm font-sketch">
                  标准化显示预览图、价格、免费状态等关键信息
                </p>
              </div>
            </Card>

            <Card hoverable onClick={() => setShowWebsiteManager(true)}>
              <div className="text-center">
                <div className="text-3xl mb-3">⚙️</div>
                <h3 className="text-lg font-semibold sketch-text-primary mb-2 font-sketch">
                  灵活配置
                </h3>
                <p className="sketch-text-secondary text-sm font-sketch">
                  自定义搜索源和显示字段，个性化你的搜索体验
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* 搜索状态和结果 */}
        {isLoading && (
          <Card className={`text-center ${isMobile ? 'mb-6' : 'mb-8'}`}>
            <Loading 
              size={isMobile ? 'md' : 'lg'} 
              text="正在搜索三维素材..." 
              type="spinner"
            />
          </Card>
        )}

        {/* 搜索状态详情 */}
        {(hasResults || websiteStatuses.length > 0) && (
          <SearchStatus
            statuses={websiteStatuses}
            totalResults={searchState.totalCount}
            searchTime={searchState.searchTime}
            performanceMetrics={searchState.performanceMetrics}
            showDetails={!isMobile}
            className={isMobile ? 'mb-6' : 'mb-8'}
          />
        )}

        {/* 视图模式切换 */}
        {hasResults && (
          <div className={`flex items-center justify-between ${isMobile ? 'mb-4' : 'mb-6'}`}>
            <h2 className={`font-semibold text-sketch-text ${isMobile ? 'text-lg' : 'text-xl'}`}>
              搜索结果
            </h2>
            {!isMobile && (
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'unified' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('unified')}
                >
                  统一视图
                </Button>
                <Button
                  variant={viewMode === 'grouped' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grouped')}
                >
                  分组视图
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 搜索结果展示 */}
        {hasResults && (isMobile || viewMode === 'unified') && (
          <ResultList
            results={searchState.results}
            totalCount={searchState.totalCount}
            onResultClick={setSelectedResult}
            className={isMobile ? 'mb-6' : 'mb-8'}
          />
        )}

        {/* 分组搜索结果展示 */}
        {hasResults && !isMobile && viewMode === 'grouped' && searchState.resultGroups && (
          <GroupedResultList
            groups={searchState.resultGroups}
            onResultClick={setSelectedResult}
            className="mb-8"
          />
        )}

        {/* 空状态 */}
        {!isLoading && !hasResults && searchQuery && (
          <EmptyState
            type="search"
            title="未找到相关素材"
            description={`没有找到与"${searchQuery}"相关的三维素材，请尝试其他关键词`}
            primaryAction={{
              label: '清空搜索',
              onClick: () => setSearchQuery('')
            }}
            secondaryAction={{
              label: '管理网站',
              onClick: () => setShowWebsiteManager(true)
            }}
            className={isMobile ? 'mb-6' : 'mb-8'}
          />
        )}

        {/* 错误状态 */}
        {searchState.error && (
          <EmptyState
            type="error"
            title="搜索出错了"
            description={searchState.error}
            primaryAction={{
              label: '重新搜索',
              onClick: () => searchQuery && performSearch(searchQuery)
            }}
            secondaryAction={{
              label: '检查网站配置',
              onClick: () => setShowWebsiteManager(true)
            }}
            className={isMobile ? 'mb-6' : 'mb-8'}
          />
        )}

        {/* 网站管理模态框 */}
        <Modal
          open={showWebsiteManager}
          onClose={() => setShowWebsiteManager(false)}
          title="网站配置管理"
          size={isMobile ? 'full' : 'xl'}
        >
          <WebsiteManager
            websites={websites}
            onAdd={addWebsite}
            onEdit={updateWebsite}
            onDelete={deleteWebsite}
            onToggleActive={toggleWebsiteActive}
          />
        </Modal>

        {/* 结果详情模态框 */}
        <ResultDetailModal
          result={selectedResult}
          open={!!selectedResult}
          onClose={() => setSelectedResult(null)}
        />

        {/* 底部信息 */}
        <div className={`text-center ${isMobile ? 'mt-8' : 'mt-12'}`}>
          <p className={`sketch-text-secondary font-sketch ${isMobile ? 'text-xs' : 'text-sm'}`}>
            简约设计 · 高效搜索 · 专业工具
          </p>
        </div>
        
        {/* Toast 通知容器 */}
        <ToastContainer
          toasts={toasts}
          onClose={removeToast}
          position={isMobile ? 'top-center' : 'top-right'}
          maxToasts={isMobile ? 3 : 5}
        />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;