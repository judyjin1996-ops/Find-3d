import React from 'react';
import { Card, Button, Icon, Modal, Badge } from '../ui';
import { WebsiteForm } from './WebsiteForm';
import { AdvancedWebsiteForm } from './AdvancedWebsiteForm';
import { WebsiteList } from './WebsiteList';
import type { WebsiteConfig } from '../../types';
import type { CrawlerRule } from '../../crawler/types/crawler';
import { crawlerService } from '../../services/crawlerService';

interface WebsiteManagerProps {
  websites: WebsiteConfig[];
  onAdd: (website: Omit<WebsiteConfig, 'id'>) => void;
  onEdit: (id: string, website: WebsiteConfig) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  className?: string;
}

export const WebsiteManager: React.FC<WebsiteManagerProps> = ({
  websites,
  onAdd,
  onEdit,
  onDelete,
  onToggleActive,
  className = ''
}) => {
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = React.useState(false);
  const [editingWebsite, setEditingWebsite] = React.useState<WebsiteConfig | null>(null);
  const [editingCrawlerRule, setEditingCrawlerRule] = React.useState<CrawlerRule | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);
  const [crawlerRules, setCrawlerRules] = React.useState<CrawlerRule[]>([]);

  const activeCount = websites.filter(w => w.isActive).length;
  const totalCount = websites.length;

  // 加载爬虫规则
  React.useEffect(() => {
    const loadCrawlerRules = async () => {
      try {
        await crawlerService.initialize();
        const availableWebsites = crawlerService.getAvailableWebsites();
        // 这里需要获取完整的爬虫规则，暂时使用空数组
        setCrawlerRules([]);
      } catch (error) {
        console.error('加载爬虫规则失败:', error);
      }
    };
    loadCrawlerRules();
  }, []);

  const handleAdd = (websiteData: Omit<WebsiteConfig, 'id'>) => {
    onAdd(websiteData);
    setShowAddModal(false);
  };

  const handleAdvancedAdd = async (rule: CrawlerRule) => {
    try {
      await crawlerService.addCustomWebsite({
        websiteName: rule.websiteName,
        baseUrl: rule.baseUrl,
        searchUrlTemplate: rule.searchConfig.urlTemplate,
        selectors: {
          listContainer: rule.parseConfig.listSelectors.container,
          listItem: rule.parseConfig.listSelectors.item,
          listLink: rule.parseConfig.listSelectors.link,
          detailTitle: rule.parseConfig.detailSelectors.title,
          detailImages: rule.parseConfig.detailSelectors.images,
          detailDescription: rule.parseConfig.detailSelectors.description
        },
        antiDetection: {
          delay: rule.antiDetection.requestConfig.delay,
          useHeadlessBrowser: rule.antiDetection.useHeadlessBrowser
        }
      });
      setShowAdvancedModal(false);
      // 刷新网站列表
      window.location.reload();
    } catch (error) {
      console.error('添加自定义网站失败:', error);
    }
  };

  const handleEdit = (websiteData: WebsiteConfig) => {
    if (editingWebsite) {
      onEdit(editingWebsite.id, websiteData);
      setEditingWebsite(null);
    }
  };

  const handleAdvancedEdit = async (rule: CrawlerRule) => {
    try {
      if (editingCrawlerRule) {
        await crawlerService.updateCustomWebsite(editingCrawlerRule.id, rule);
        setEditingCrawlerRule(null);
        setShowAdvancedModal(false);
        // 刷新网站列表
        window.location.reload();
      }
    } catch (error) {
      console.error('更新自定义网站失败:', error);
    }
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    setDeleteConfirm(null);
  };

  const handleTestRule = async (rule: CrawlerRule, keyword: string) => {
    try {
      const result = await crawlerService.testWebsiteRule(rule.id, keyword);
      return {
        success: result.success,
        results: result.results.map(r => ({
          title: r.title,
          url: r.sourceUrl,
          image: r.previewImages[0]?.url
        })),
        errors: result.errors
      };
    } catch (error) {
      return {
        success: false,
        results: [],
        errors: [error instanceof Error ? error.message : '测试失败']
      };
    }
  };

  return (
    <div className={className}>
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-sketch-text mb-2">
              网站配置管理
            </h2>
            <div className="flex items-center gap-4 text-sm text-sketch-muted">
              <span>总计: {totalCount} 个网站</span>
              <Badge variant={activeCount > 0 ? 'success' : 'default'} size="sm">
                {activeCount} 个激活
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(true)}
              icon={<Icon name="plus" size="sm" />}
            >
              简单添加
            </Button>
            <Button
              onClick={() => setShowAdvancedModal(true)}
              icon={<Icon name="settings" size="sm" />}
            >
              高级配置
            </Button>
          </div>
        </div>

        <WebsiteList
          websites={websites}
          onEdit={setEditingWebsite}
          onDelete={setDeleteConfirm}
          onToggleActive={onToggleActive}
        />
      </Card>

      {/* 简单添加网站模态框 */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="简单添加网站"
        size="lg"
      >
        <WebsiteForm
          onSubmit={handleAdd}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* 高级爬虫配置模态框 */}
      <Modal
        open={showAdvancedModal}
        onClose={() => {
          setShowAdvancedModal(false);
          setEditingCrawlerRule(null);
        }}
        title={editingCrawlerRule ? "编辑爬虫规则" : "高级爬虫配置"}
        size="xl"
      >
        <AdvancedWebsiteForm
          initialData={editingCrawlerRule || undefined}
          onSubmit={editingCrawlerRule ? handleAdvancedEdit : handleAdvancedAdd}
          onCancel={() => {
            setShowAdvancedModal(false);
            setEditingCrawlerRule(null);
          }}
          onTest={handleTestRule}
        />
      </Modal>

      {/* 编辑网站模态框 */}
      <Modal
        open={!!editingWebsite}
        onClose={() => setEditingWebsite(null)}
        title="编辑网站配置"
        size="lg"
      >
        {editingWebsite && (
          <WebsiteForm
            initialData={editingWebsite}
            onSubmit={handleEdit}
            onCancel={() => setEditingWebsite(null)}
          />
        )}
      </Modal>

      {/* 删除确认模态框 */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="确认删除"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sketch-text">
            确定要删除这个网站配置吗？此操作无法撤销。
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
            >
              取消
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              删除
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};