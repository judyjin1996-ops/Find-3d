import React from 'react';
import { Card, Button, Icon, Badge, Tooltip } from '../ui';
import type { WebsiteConfig } from '../../types';

interface WebsiteListProps {
  websites: WebsiteConfig[];
  onEdit: (website: WebsiteConfig) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
}

export const WebsiteList: React.FC<WebsiteListProps> = ({
  websites,
  onEdit,
  onDelete,
  onToggleActive
}) => {
  if (websites.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon name="settings" size="xl" className="mx-auto mb-4 text-sketch-muted opacity-50" />
        <h3 className="text-lg font-medium text-sketch-text mb-2">
          暂无网站配置
        </h3>
        <p className="text-sketch-muted">
          点击"添加网站"按钮来配置第一个搜索网站
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {websites.map((website) => (
        <Card
          key={website.id}
          variant="outlined"
          className="hover:shadow-sketch-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {/* 网站状态指示器 */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    website.isActive ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                <Badge
                  variant={website.isActive ? 'success' : 'default'}
                  size="sm"
                >
                  {website.isActive ? '激活' : '禁用'}
                </Badge>
              </div>

              {/* 网站信息 */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-sketch-text">
                    {website.name}
                  </h3>
                  <Tooltip content={website.baseUrl}>
                    <Icon name="external-link" size="sm" className="text-sketch-muted" />
                  </Tooltip>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-sketch-muted">
                  <span>
                    <Icon name="search" size="xs" className="inline mr-1" />
                    {website.searchEndpoint}
                  </span>
                  <span>
                    限制: {website.rateLimit.requestsPerMinute}/分钟
                  </span>
                  <span>
                    并发: {website.rateLimit.concurrent}
                  </span>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              <Tooltip content={website.isActive ? '禁用网站' : '激活网站'}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleActive(website.id)}
                  icon={
                    <Icon 
                      name={website.isActive ? 'eye-off' : 'eye'} 
                      size="sm" 
                    />
                  }
                />
              </Tooltip>

              <Tooltip content="编辑配置">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(website)}
                  icon={<Icon name="edit" size="sm" />}
                />
              </Tooltip>

              <Tooltip content="删除网站">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(website.id)}
                  icon={<Icon name="trash" size="sm" className="text-red-500" />}
                />
              </Tooltip>
            </div>
          </div>

          {/* 详细配置信息 */}
          <div className="mt-4 pt-4 border-t border-sketch-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-sketch-text mb-2">搜索参数</h4>
                <div className="space-y-1 text-sketch-muted">
                  <div>查询参数: {website.searchParams.queryParam}</div>
                  {website.searchParams.limitParam && (
                    <div>限制参数: {website.searchParams.limitParam}</div>
                  )}
                  {website.searchParams.formatParam && (
                    <div>格式参数: {website.searchParams.formatParam}</div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sketch-text mb-2">结果映射</h4>
                <div className="space-y-1 text-sketch-muted">
                  <div>标题: {website.resultMapping.titlePath}</div>
                  <div>图片: {website.resultMapping.imagePath}</div>
                  <div>链接: {website.resultMapping.urlPath}</div>
                  {website.resultMapping.pricePath && (
                    <div>价格: {website.resultMapping.pricePath}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};