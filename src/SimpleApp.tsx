import React from 'react';

function SimpleApp() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    // 模拟搜索
    setTimeout(() => {
      setResults([
        {
          id: '1',
          title: '高质量3D模型 - ' + searchQuery,
          previewImage: 'https://via.placeholder.com/300x200?text=3D+Model',
          sourceWebsite: '魔顿网',
          price: 99,
          isFree: false
        },
        {
          id: '2', 
          title: '免费3D素材 - ' + searchQuery,
          previewImage: 'https://via.placeholder.com/300x200?text=Free+3D',
          sourceWebsite: 'CG资源网',
          price: 0,
          isFree: true
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 头部 */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            color: 'white', 
            marginBottom: '10px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            🎨 Find 3D
          </h1>
          <p style={{ 
            fontSize: '1.2rem', 
            color: 'rgba(255,255,255,0.9)',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
          }}>
            专为三维设计师打造的素材搜索平台
          </p>
        </div>

        {/* 搜索框 */}
        <div style={{ 
          background: 'white', 
          borderRadius: '15px', 
          padding: '30px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索3D素材..."
              style={{
                flex: 1,
                padding: '15px 20px',
                fontSize: '1.1rem',
                border: '2px solid #e1e5e9',
                borderRadius: '10px',
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                padding: '15px 30px',
                fontSize: '1.1rem',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s'
              }}
            >
              {loading ? '搜索中...' : '🔍 搜索'}
            </button>
          </div>
        </div>

        {/* 功能特色 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          {[
            { icon: '🔍', title: '多网站搜索', desc: '同时搜索魔顿网、CG资源网、书生CG资源站等多个平台' },
            { icon: '🎯', title: '统一结果展示', desc: '标准化显示预览图、价格、免费状态等关键信息' },
            { icon: '⚙️', title: '灵活配置', desc: '自定义搜索源和显示字段，个性化你的搜索体验' }
          ].map((feature, index) => (
            <div key={index} style={{
              background: 'white',
              borderRadius: '15px',
              padding: '25px',
              textAlign: 'center',
              boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>{feature.icon}</div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#333' }}>{feature.title}</h3>
              <p style={{ color: '#666', lineHeight: '1.5' }}>{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* 搜索结果 */}
        {results.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '30px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>搜索结果</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {results.map((result) => (
                <div key={result.id} style={{
                  border: '1px solid #e1e5e9',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  cursor: 'pointer'
                }}>
                  <img 
                    src={result.previewImage} 
                    alt={result.title}
                    style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '15px' }}>
                    <h3 style={{ marginBottom: '10px', color: '#333' }}>{result.title}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#666' }}>{result.sourceWebsite}</span>
                      <span style={{ 
                        color: result.isFree ? '#28a745' : '#007bff',
                        fontWeight: 'bold'
                      }}>
                        {result.isFree ? '免费' : `¥${result.price}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 底部信息 */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={{ 
            color: 'rgba(255,255,255,0.8)',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
          }}>
            简约设计 · 高效搜索 · 专业工具
          </p>
        </div>
      </div>
    </div>
  );
}

export default SimpleApp;