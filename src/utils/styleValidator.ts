/**
 * 简笔画风格一致性验证工具
 */

interface StyleIssue {
  type: 'error' | 'warning' | 'info';
  element: string;
  message: string;
  suggestion?: string;
}

interface StyleValidationResult {
  passed: boolean;
  score: number; // 0-100
  issues: StyleIssue[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
}

/**
 * 简笔画风格验证器
 */
export class SketchStyleValidator {
  private issues: StyleIssue[] = [];

  /**
   * 验证颜色一致性
   */
  private validateColors(): void {
    const requiredColors = [
      '--sketch-primary',
      '--sketch-secondary',
      '--sketch-accent',
      '--sketch-background',
      '--sketch-text',
      '--sketch-muted',
      '--sketch-border'
    ];

    const rootStyles = getComputedStyle(document.documentElement);

    requiredColors.forEach(colorVar => {
      const value = rootStyles.getPropertyValue(colorVar).trim();
      if (!value) {
        this.issues.push({
          type: 'error',
          element: ':root',
          message: `缺少必需的颜色变量: ${colorVar}`,
          suggestion: `在CSS中定义 ${colorVar} 变量`
        });
      }
    });

    // 检查颜色对比度
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
    textElements.forEach((element, index) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;

      if (color === backgroundColor && color !== 'rgba(0, 0, 0, 0)') {
        this.issues.push({
          type: 'warning',
          element: `${element.tagName.toLowerCase()}[${index}]`,
          message: '文字颜色与背景色相同，可能影响可读性',
          suggestion: '调整文字颜色或背景色以提高对比度'
        });
      }
    });
  }

  /**
   * 验证字体一致性
   */
  private validateFonts(): void {
    const elements = document.querySelectorAll('*');
    const fontFamilies = new Set<string>();

    elements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const fontFamily = styles.fontFamily;
      if (fontFamily && fontFamily !== 'inherit') {
        fontFamilies.add(fontFamily);
      }
    });

    if (fontFamilies.size > 3) {
      this.issues.push({
        type: 'warning',
        element: 'global',
        message: `使用了过多的字体族 (${fontFamilies.size}个)`,
        suggestion: '简笔画风格建议使用1-2种字体族以保持一致性'
      });
    }

    // 检查是否使用了简笔画字体类
    const sketchFontElements = document.querySelectorAll('.font-sketch');
    if (sketchFontElements.length === 0) {
      this.issues.push({
        type: 'info',
        element: 'global',
        message: '未发现使用 .font-sketch 类的元素',
        suggestion: '考虑为主要文本元素添加简笔画字体类'
      });
    }
  }

  /**
   * 验证间距一致性
   */
  private validateSpacing(): void {
    const spacingClasses = [
      'sketch-spacing-sm',
      'sketch-spacing-md', 
      'sketch-spacing-lg'
    ];

    let hasSpacingClasses = false;
    spacingClasses.forEach(className => {
      const elements = document.querySelectorAll(`.${className}`);
      if (elements.length > 0) {
        hasSpacingClasses = true;
      }
    });

    if (!hasSpacingClasses) {
      this.issues.push({
        type: 'info',
        element: 'global',
        message: '未发现使用简笔画间距类',
        suggestion: '使用 sketch-spacing-* 类来保持间距一致性'
      });
    }

    // 检查内联样式的间距
    const elementsWithInlineSpacing = document.querySelectorAll('[style*="margin"], [style*="padding"]');
    if (elementsWithInlineSpacing.length > 5) {
      this.issues.push({
        type: 'warning',
        element: 'global',
        message: `发现 ${elementsWithInlineSpacing.length} 个使用内联间距样式的元素`,
        suggestion: '使用CSS类而不是内联样式来保持一致性'
      });
    }
  }

  /**
   * 验证组件样式一致性
   */
  private validateComponents(): void {
    const requiredComponentClasses = [
      'sketch-card',
      'sketch-button',
      'sketch-input'
    ];

    requiredComponentClasses.forEach(className => {
      const elements = document.querySelectorAll(`.${className}`);
      if (elements.length === 0) {
        this.issues.push({
          type: 'warning',
          element: 'global',
          message: `未发现使用 .${className} 类的元素`,
          suggestion: `为相应的组件添加 ${className} 类以保持风格一致`
        });
      }
    });

    // 检查按钮样式一致性
    const buttons = document.querySelectorAll('button');
    let inconsistentButtons = 0;

    buttons.forEach(button => {
      const hasSketchClass = button.classList.contains('sketch-button');
      const styles = window.getComputedStyle(button);
      const borderRadius = styles.borderRadius;

      if (!hasSketchClass && borderRadius === '0px') {
        inconsistentButtons++;
      }
    });

    if (inconsistentButtons > 0) {
      this.issues.push({
        type: 'warning',
        element: 'button',
        message: `发现 ${inconsistentButtons} 个可能不符合简笔画风格的按钮`,
        suggestion: '为按钮添加适当的圆角和简笔画样式类'
      });
    }
  }

  /**
   * 验证图标一致性
   */
  private validateIcons(): void {
    const iconElements = document.querySelectorAll('[class*="icon"], svg, .icon');
    const iconSizes = new Set<string>();

    iconElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const width = styles.width;
      const height = styles.height;
      iconSizes.add(`${width}x${height}`);
    });

    if (iconSizes.size > 5) {
      this.issues.push({
        type: 'info',
        element: 'icons',
        message: `图标使用了 ${iconSizes.size} 种不同的尺寸`,
        suggestion: '简笔画风格建议使用统一的图标尺寸系统'
      });
    }
  }

  /**
   * 验证动画一致性
   */
  private validateAnimations(): void {
    const animatedElements = document.querySelectorAll('[style*="transition"], [class*="animate"], [class*="transition"]');
    const transitionDurations = new Set<string>();

    animatedElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const transition = styles.transition;
      if (transition && transition !== 'none') {
        // 提取持续时间
        const durationMatch = transition.match(/(\d+(?:\.\d+)?s)/);
        if (durationMatch) {
          transitionDurations.add(durationMatch[1]);
        }
      }
    });

    if (transitionDurations.size > 3) {
      this.issues.push({
        type: 'info',
        element: 'animations',
        message: `动画使用了 ${transitionDurations.size} 种不同的持续时间`,
        suggestion: '建议使用统一的动画持续时间（如 0.2s, 0.3s, 0.5s）'
      });
    }
  }

  /**
   * 验证响应式设计
   */
  private validateResponsive(): void {
    const responsiveClasses = [
      'sm:', 'md:', 'lg:', 'xl:', '2xl:',
      'mobile-', 'tablet-', 'desktop-'
    ];

    let hasResponsiveClasses = false;
    responsiveClasses.forEach(prefix => {
      const elements = document.querySelectorAll(`[class*="${prefix}"]`);
      if (elements.length > 0) {
        hasResponsiveClasses = true;
      }
    });

    if (!hasResponsiveClasses) {
      this.issues.push({
        type: 'warning',
        element: 'global',
        message: '未发现响应式设计类',
        suggestion: '添加响应式类以确保在不同设备上的一致体验'
      });
    }

    // 检查视口配置
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      this.issues.push({
        type: 'error',
        element: 'head',
        message: '缺少视口meta标签',
        suggestion: '添加 <meta name="viewport" content="width=device-width, initial-scale=1">'
      });
    }
  }

  /**
   * 运行完整验证
   */
  validate(): StyleValidationResult {
    this.issues = []; // 重置问题列表

    // 运行所有验证
    this.validateColors();
    this.validateFonts();
    this.validateSpacing();
    this.validateComponents();
    this.validateIcons();
    this.validateAnimations();
    this.validateResponsive();

    // 计算分数
    const errors = this.issues.filter(issue => issue.type === 'error').length;
    const warnings = this.issues.filter(issue => issue.type === 'warning').length;
    const infos = this.issues.filter(issue => issue.type === 'info').length;

    // 分数计算：错误-10分，警告-5分，信息-1分
    const deductions = errors * 10 + warnings * 5 + infos * 1;
    const score = Math.max(0, 100 - deductions);
    const passed = errors === 0 && warnings <= 2;

    return {
      passed,
      score,
      issues: this.issues,
      summary: {
        errors,
        warnings,
        infos
      }
    };
  }

  /**
   * 生成验证报告
   */
  generateReport(result: StyleValidationResult): string {
    let report = '# 简笔画风格一致性验证报告\n\n';
    
    report += `## 总体评分: ${result.score}/100 ${result.passed ? '✅' : '❌'}\n\n`;
    
    report += `## 问题摘要\n`;
    report += `- 错误: ${result.summary.errors}\n`;
    report += `- 警告: ${result.summary.warnings}\n`;
    report += `- 信息: ${result.summary.infos}\n\n`;

    if (result.issues.length > 0) {
      report += `## 详细问题\n\n`;
      
      const groupedIssues = {
        error: result.issues.filter(i => i.type === 'error'),
        warning: result.issues.filter(i => i.type === 'warning'),
        info: result.issues.filter(i => i.type === 'info')
      };

      Object.entries(groupedIssues).forEach(([type, issues]) => {
        if (issues.length > 0) {
          const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
          report += `### ${icon} ${type.toUpperCase()}\n\n`;
          
          issues.forEach((issue, index) => {
            report += `${index + 1}. **${issue.element}**: ${issue.message}\n`;
            if (issue.suggestion) {
              report += `   - 建议: ${issue.suggestion}\n`;
            }
            report += '\n';
          });
        }
      });
    } else {
      report += `## 🎉 恭喜！没有发现风格一致性问题\n\n`;
    }

    report += `## 验证时间\n`;
    report += `${new Date().toLocaleString()}\n`;

    return report;
  }
}

/**
 * 快速验证简笔画风格
 */
export const validateSketchStyle = (): StyleValidationResult => {
  const validator = new SketchStyleValidator();
  return validator.validate();
};

/**
 * 生成风格验证报告
 */
export const generateStyleReport = (): string => {
  const validator = new SketchStyleValidator();
  const result = validator.validate();
  return validator.generateReport(result);
};

export default SketchStyleValidator;