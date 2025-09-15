import type { WebsiteConfig } from '../types';

// 默认的三维素材网站配置
export const defaultWebsites: WebsiteConfig[] = [
  {
    id: 'modown',
    name: '魔顿网',
    baseUrl: 'http://www.modown.cn',
    searchEndpoint: '/search',
    isActive: true,
    searchParams: {
      queryParam: 'q',
      limitParam: 'limit',
      formatParam: 'format'
    },
    resultMapping: {
      titlePath: 'title',
      imagePath: 'thumbnail',
      urlPath: 'url',
      pricePath: 'price',
      freePath: 'is_free'
    },
    rateLimit: {
      requestsPerMinute: 60,
      concurrent: 3
    }
  },
  {
    id: 'cgown',
    name: 'CG资源网',
    baseUrl: 'https://www.cgown.com',
    searchEndpoint: '/api/search',
    isActive: true,
    searchParams: {
      queryParam: 'keyword',
      limitParam: 'pagesize',
      formatParam: 'type'
    },
    resultMapping: {
      titlePath: 'name',
      imagePath: 'preview_image',
      urlPath: 'detail_url',
      pricePath: 'price_info',
      freePath: 'free_flag'
    },
    rateLimit: {
      requestsPerMinute: 30,
      concurrent: 2
    }
  },
  {
    id: 'c4dsky',
    name: '书生CG资源站',
    baseUrl: 'https://c4dsky.com',
    searchEndpoint: '/search',
    isActive: true,
    searchParams: {
      queryParam: 'search',
      limitParam: 'num',
      formatParam: 'output'
    },
    resultMapping: {
      titlePath: 'post_title',
      imagePath: 'featured_image',
      urlPath: 'permalink',
      pricePath: 'download_price',
      freePath: 'is_free_download'
    },
    rateLimit: {
      requestsPerMinute: 45,
      concurrent: 2
    }
  }
];

// 获取默认网站配置
export const getDefaultWebsites = (): WebsiteConfig[] => {
  return [...defaultWebsites];
};

// 根据ID获取网站配置
export const getWebsiteById = (id: string): WebsiteConfig | undefined => {
  return defaultWebsites.find(website => website.id === id);
};

// 获取激活的网站配置
export const getActiveWebsites = (): WebsiteConfig[] => {
  return defaultWebsites.filter(website => website.isActive);
};