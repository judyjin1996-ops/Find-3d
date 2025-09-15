import React from 'react';
import { Card, Button, Icon, Modal, Badge } from '../ui';
import { WebsiteForm } from './WebsiteForm';
import { WebsiteList } from './WebsiteList';
import type { WebsiteConfig } from '../../types';

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
  const [editingWebsite, setEditingWebsite] = React.useState<WebsiteConfig | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);

  const activeCount = websites.filter(w => w.isActive).length;
  const totalCount = websites.length;

  const handleAdd = (websiteData: Omit<WebsiteConfig, 'id'>) => {
    onAdd(websiteData);
    setShowAddModal(false);
  };

  const handleEdit = (websiteData: WebsiteConfig) => {
    if (editingWebsite) {
      onEdit(editingWebsite.id, websiteData);
      setEditingWebsite(null);
    }
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    setDeleteConfirm(null);
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
          
          <Button
            onClick={() => setShowAddModal(true)}
            icon={<Icon name="plus" size="sm" />}
          >
            添加网站
          </Button>
        </div>

        <WebsiteList
          websites={websites}
          onEdit={setEditingWebsite}
          onDelete={setDeleteConfirm}
          onToggleActive={onToggleActive}
        />
      </Card>

      {/* 添加网站模态框 */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="添加新网站"
        size="lg"
      >
        <WebsiteForm
          onSubmit={handleAdd}
          onCancel={() => setShowAddModal(false)}
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