
// Initialize Mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: "default",
  securityLevel: "loose",
});

// Progress bar functionality
class ModernPresentationManager {
  constructor() {
    this.currentSlide = 0;
    this.slides = document.querySelectorAll(".slide-container");
    this.totalSlides = this.slides.length;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateProgress();
    this.enforceAspectRatio();
    this.initializeAnimations();
  }

  setupEventListeners() {
    window.addEventListener("scroll", () => this.updateProgress());
    window.addEventListener("resize", () => this.enforceAspectRatio());

    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        this.nextSlide();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        this.previousSlide();
      }
    });
  }

  updateProgress() {
    const scrollTop =
      window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min((scrollTop / documentHeight) * 100, 100);

    const progressBar = document.getElementById("progress-bar");
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
  }

  enforceAspectRatio() {
    const containers = document.querySelectorAll(".slide-container");
    containers.forEach((container) => {
      const containerWidth = container.offsetWidth;
      const expectedHeight = containerWidth * (9 / 16);
      if (Math.abs(container.offsetHeight - expectedHeight) > 1) {
        container.style.height = `${expectedHeight}px`;
      }
    });
  }

  initializeAnimations() {
    // Intersection Observer for animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.1 }
    );

    document
      .querySelectorAll(".modern-card, .insight-card")
      .forEach((el) => {
        el.style.opacity = "0";
        el.style.transform = "translateY(30px)";
        el.style.transition = "all 0.8s cubic-bezier(0.23, 1, 0.32, 1)";
        observer.observe(el);
      });
  }

  scrollToSlide(index) {
    const targetSlide = this.slides[index];
    if (targetSlide) {
      targetSlide.scrollIntoView({ behavior: "smooth", block: "start" });
      this.currentSlide = index;
    }
  }

  nextSlide() {
    const nextIndex = Math.min(
      this.currentSlide + 1,
      this.totalSlides - 1
    );
    this.scrollToSlide(nextIndex);
  }

  previousSlide() {
    const prevIndex = Math.max(this.currentSlide - 1, 0);
    this.scrollToSlide(prevIndex);
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.presentationManager = new ModernPresentationManager();
});

// 高度な表示領域検出と自動調整
class TableAutoSizer {
  constructor(tableElement) {
    this.table = tableElement;
    this.originalFontSize = window.getComputedStyle(tableElement).fontSize;
    this.minFontSize = 0.625; // 最小フォントサイズ（rem）
    this.observer = null;
    this.resizeTimeout = null;
  }
  
  init() {
    // 初期調整
    this.adjustSize();
    
    // ResizeObserverで動的に監視
    if (window.ResizeObserver) {
      this.observer = new ResizeObserver(() => {
        // デバウンス処理
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
          this.adjustSize();
        }, 100);
      });
      this.observer.observe(this.table.closest('.slide-container'));
    }
    
    // 内容変更も監視
    this.observeContentChanges();
    
    // 印刷処理のセットアップ
    this.setupPrintHandling();
  }
  
  adjustSize() {
    const metrics = this.calculateMetrics();
    
    if (metrics.needsAdjustment) {
      this.applyAdjustments(metrics);
    }
  }
  
  calculateMetrics() {
    const container = this.table.closest('.modern-card');
    const slideContent = this.table.closest('.slide-content');
    
    // 各要素の高さを取得
    const containerRect = container.getBoundingClientRect();
    const slideRect = slideContent.getBoundingClientRect();
    const tableRect = this.table.getBoundingClientRect();
    
    // ヘッダーとフッターの高さを考慮
    const sectionHeader = slideContent.querySelector('.section-header');
    const analysisCard = slideContent.querySelector('.modern-card:last-child');
    const pageNumber = slideContent.querySelector('.page-number');
    
    const headerHeight = sectionHeader ? sectionHeader.offsetHeight : 0;
    const analysisHeight = analysisCard && analysisCard !== container ? analysisCard.offsetHeight : 0;
    const pageNumberHeight = pageNumber ? pageNumber.offsetHeight : 0;
    const padding = 120; // パディングとマージンの合計
    
    // 行の情報を取得
    const rows = this.table.querySelectorAll('tbody tr');
    const rowCount = rows.length;
    const headerRow = this.table.querySelector('thead tr');
    const headerHeight2 = headerRow ? headerRow.offsetHeight : 0;
    const avgRowHeight = rowCount > 0 ? (tableRect.height - headerHeight2) / rowCount : 0;
    
    // テキストの長さを考慮
    let maxTextLength = 0;
    this.table.querySelectorAll('td').forEach(cell => {
      maxTextLength = Math.max(maxTextLength, cell.textContent.length);
    });
    
    // 利用可能な高さを計算
    const availableHeight = slideRect.height - headerHeight - analysisHeight - pageNumberHeight - padding;
    
    // ページタイプの判定
    const isFirstPage = this.table.getAttribute('data-page') === '1' || 
                        this.table.closest('#slide-data-table-main') !== null;
    const isLastPage = this.table.getAttribute('data-last-page') === 'true' || 
                      slideContent.querySelector('.modern-card:last-child .analysis-point') !== null;
    
    return {
      rowCount,
      avgRowHeight,
      maxTextLength,
      tableHeight: tableRect.height,
      availableHeight,
      isFirstPage,
      isLastPage,
      needsAdjustment: tableRect.height > availableHeight || rowCount >= 10,
      overflowRatio: tableRect.height / availableHeight
    };
  }
  
  applyAdjustments(metrics) {
    // 固定フォントサイズ（行数に関わらず一定）
    let fontSize = 0.8; // 80%固定
    
    // オーバーフロー率に基づく調整のみ（極端な場合のみ）
    if (metrics.overflowRatio > 2.0) {
      fontSize *= 0.9;
    }
    
    // テキスト長に基づく調整（極端に長い場合のみ）
    if (metrics.maxTextLength > 100) {
      fontSize *= 0.95;
    }
    
    // 最小サイズの制限
    fontSize = Math.max(fontSize, 0.7);
    
    // スタイルを適用（重要: !importantを追加して印刷時も維持）
    this.table.style.setProperty('font-size', fontSize + 'rem', 'important');
    
    // パディングも固定
    const padding = '0.5rem 0.75rem';
    this.table.querySelectorAll('th, td').forEach(cell => {
      cell.style.setProperty('padding', padding, 'important');
    });
    
    // クラスを追加
    this.table.classList.add('auto-sized');
    this.table.classList.add('print-optimized'); // 印刷最適化クラスを追加
    
    // 印刷用の属性を設定
    this.table.setAttribute('data-print-font-size', fontSize);
    this.table.setAttribute('data-print-padding', padding);
    
    // コンテナにスクロールが必要な場合
    const scrollContainer = this.table.closest('.table-scroll-container');
    if (scrollContainer && metrics.overflowRatio > 1.1) {
      scrollContainer.style.maxHeight = metrics.availableHeight + 'px';
    }
    
    // 印刷プレビュー用のスタイルシートを動的に作成
    this.createPrintStyles(fontSize, padding);
  }
  
  createPrintStyles(fontSize, padding) {
    const tableId = this.table.id || 'table-' + Math.random().toString(36).substr(2, 9);
    if (!this.table.id) this.table.id = tableId;
    
    // 既存の印刷スタイルを削除
    const existingStyle = document.getElementById(`print-style-${tableId}`);
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // 新しい印刷スタイルを作成
    const printStyle = document.createElement('style');
    printStyle.id = `print-style-${tableId}`;
    printStyle.textContent = `
      @media print {
        #${tableId} {
          font-size: ${fontSize}rem !important;
        }
        #${tableId} th,
        #${tableId} td {
          padding: ${padding} !important;
        }
      }
    `;
    document.head.appendChild(printStyle);
  }
  
  setupPrintHandling() {
    // 印刷前の処理
    window.addEventListener('beforeprint', () => {
      // 現在の調整値を保持
      const currentFontSize = this.table.style.fontSize;
      const currentPadding = this.table.querySelector('td')?.style.padding;
      
      // 印刷用属性として保存
      this.table.setAttribute('data-print-ready', 'true');
      
      // スクロールコンテナの高さを解除
      const scrollContainer = this.table.closest('.table-scroll-container');
      if (scrollContainer) {
        scrollContainer.style.setProperty('max-height', 'none', 'important');
        scrollContainer.style.setProperty('overflow', 'visible', 'important');
      }
    });
    
    // 印刷後の処理
    window.addEventListener('afterprint', () => {
      // スクロールコンテナの高さを復元
      const scrollContainer = this.table.closest('.table-scroll-container');
      if (scrollContainer) {
        const metrics = this.calculateMetrics();
        if (metrics.overflowRatio > 1.1) {
          scrollContainer.style.maxHeight = metrics.availableHeight + 'px';
          scrollContainer.style.overflow = 'auto';
        }
      }
    });
  }
  
  observeContentChanges() {
    // MutationObserverで内容の変更を監視
    const observer = new MutationObserver(() => {
      // デバウンス処理
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.adjustSize();
      }, 100);
    });
    
    observer.observe(this.table, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
  
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    clearTimeout(this.resizeTimeout);
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.presentationManager = new ModernPresentationManager();
  
  // データテーブルの自動サイズ調整を初期化
  document.querySelectorAll('.data-table').forEach(table => {
    const autoSizer = new TableAutoSizer(table);
    autoSizer.init();
    
    // グローバルに保存（後でアクセスできるように）
    if (!window.tableAutoSizers) {
      window.tableAutoSizers = [];
    }
    window.tableAutoSizers.push(autoSizer);
  });
});
