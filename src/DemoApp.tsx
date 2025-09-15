import React, { useState } from 'react';
import { SmartResultCardDemo } from './components/results/SmartResultCardDemo';
import { CrawlerTaskDemo } from './components/crawler/CrawlerTaskDemo';
import { SmartCacheDemo } from './components/cache/SmartCacheDemo';
import { Button, Icon } from './components/ui';

function DemoApp() {
  const [activeDemo, setActiveDemo] = useState<'result-card' | 'crawler-task' | 'smart-cache'>('crawler-task');

  const handleBackToMain = () => {
    window.close();
    // 如果无法关闭窗口，则跳转回主页
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  return (
    <div className="min-h-screen bg-sketch-background">
      {/* 导航栏 */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-sketch-border">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-sketch-text">
                🎨 Find 3D - 组件演示
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant={activeDemo === 'crawler-task' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setActiveDemo('crawler-task')}
                >
                  🚀 任务调度
                </Button>
                <Button
                  variant={activeDemo === 'smart-cache' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setActiveDemo('smart-cache')}
                >
                  🗄️ 智能缓存
                </Button>
                <Button
                  variant={activeDemo === 'result-card' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setActiveDemo('result-card')}
                >
                  🎯 结果卡片
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToMain}
                icon={<Icon name="arrow-left" size="sm" />}
              >
                返回主页
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 演示内容 */}
      <div className="max-w-7xl mx-auto">
        {activeDemo === 'crawler-task' && <CrawlerTaskDemo />}
        {activeDemo === 'smart-cache' && <SmartCacheDemo />}
        {activeDemo === 'result-card' && <SmartResultCardDemo />}
      </div>

      {/* 底部信息 */}
      <div className="text-center py-8">
        <p className="text-sm text-sketch-muted">
          {activeDemo === 'crawler-task' ? '爬虫任务调度和监控演示' : 
           activeDemo === 'smart-cache' ? '智能缓存管理演示' : 
           '智能结果卡片组件演示'} - Find 3D 项目
        </p>
      </div>
    </div>
  );
}

export default DemoApp;