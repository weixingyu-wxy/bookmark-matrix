// themes.js — 主题预设 (CSS variables 切换)
// 4 套主题, 持久化在 chrome.storage

(function (global) {
  'use strict';

  const THEMES = {
    midnight: {
      id: 'midnight',
      name: '深空',
      emoji: '🌌',
      desc: '默认 · 深色暖灰, 蓝紫点缀',
      vars: {
        dark: {
          '--bg': '#0A0A0F',
          '--bg-elev': '#15151B',
          '--bg-elev-2': '#1F1F27',
          '--border': '#2A2A33',
          '--text': '#F4F4F6',
          '--text-dim': '#A1A1AA',
          '--text-faint': '#71717A',
          '--accent': '#818CF8',     // indigo-400
          '--accent-2': '#A78BFA',   // violet-400
          '--success': '#34D399',    // emerald-400
          '--danger': '#F87171',     // red-400
          '--shadow-md': '0 4px 12px rgba(0, 0, 0, 0.4)',
          '--shadow-lg': '0 10px 30px rgba(0, 0, 0, 0.5)',
        },
        light: {
          '--bg': '#FAFAFA',
          '--bg-elev': '#FFFFFF',
          '--bg-elev-2': '#F4F4F5',
          '--border': '#E4E4E7',
          '--text': '#18181B',
          '--text-dim': '#71717A',
          '--text-faint': '#A1A1AA',
          '--accent': '#4F46E5',     // indigo-600
          '--accent-2': '#7C3AED',   // violet-600
          '--success': '#10B981',
          '--danger': '#DC2626',
          '--shadow-md': '0 4px 12px rgba(15, 23, 42, 0.06)',
          '--shadow-lg': '0 10px 30px rgba(15, 23, 42, 0.12)',
        },
      },
      // 分类色 (暗色用 400/500, 亮色用 500/600)
      categories: {
        dark: {
          ai: '#A78BFA', dev: '#60A5FA', learning: '#34D399', video: '#F87171',
          music: '#F472B6', shopping: '#FB923C', social: '#38BDF8', news: '#94A3B8',
          game: '#C084FC', cloud: '#22D3EE', mail: '#FBBF24', finance: '#2DD4BF',
          design: '#FB7185', map: '#A3E635', reading: '#818CF8', tools: '#A8A29E',
          archive: '#71717A', other: '#52525B',
        },
        light: {
          ai: '#7C3AED', dev: '#2563EB', learning: '#10B981', video: '#DC2626',
          music: '#DB2777', shopping: '#EA580C', social: '#0284C7', news: '#475569',
          game: '#9333EA', cloud: '#0891B2', mail: '#D97706', finance: '#0D9488',
          design: '#E11D48', map: '#65A30D', reading: '#4F46E5', tools: '#57534E',
          archive: '#52525B', other: '#404040',
        },
      },
    },

    minimal: {
      id: 'minimal',
      name: '极简',
      emoji: '◻️',
      desc: '纯黑白灰, 分类仅用色彩暗示',
      vars: {
        dark: {
          '--bg': '#000000',
          '--bg-elev': '#0A0A0A',
          '--bg-elev-2': '#141414',
          '--border': '#1F1F1F',
          '--text': '#FFFFFF',
          '--text-dim': '#A1A1A1',
          '--text-faint': '#6B6B6B',
          '--accent': '#FFFFFF',
          '--accent-2': '#D4D4D4',
          '--success': '#A3A3A3',
          '--danger': '#D4D4D4',
          '--shadow-md': '0 0 0 1px rgba(255,255,255,0.05)',
          '--shadow-lg': '0 0 0 1px rgba(255,255,255,0.1)',
        },
        light: {
          '--bg': '#FFFFFF',
          '--bg-elev': '#FFFFFF',
          '--bg-elev-2': '#F5F5F5',
          '--border': '#E5E5E5',
          '--text': '#000000',
          '--text-dim': '#525252',
          '--text-faint': '#A3A3A3',
          '--accent': '#000000',
          '--accent-2': '#404040',
          '--success': '#525252',
          '--danger': '#404040',
          '--shadow-md': '0 0 0 1px rgba(0,0,0,0.05)',
          '--shadow-lg': '0 0 0 1px rgba(0,0,0,0.1)',
        },
      },
      categories: {
        dark: {
          ai: '#FFFFFF', dev: '#E5E5E5', learning: '#D4D4D4', video: '#A3A3A3',
          music: '#FFFFFF', shopping: '#D4D4D4', social: '#FFFFFF', news: '#A3A3A3',
          game: '#E5E5E5', cloud: '#FFFFFF', mail: '#D4D4D4', finance: '#A3A3A3',
          design: '#FFFFFF', map: '#D4D4D4', reading: '#FFFFFF', tools: '#A3A3A3',
          archive: '#525252', other: '#404040',
        },
        light: {
          ai: '#000000', dev: '#1A1A1A', learning: '#333333', video: '#4D4D4D',
          music: '#000000', shopping: '#333333', social: '#000000', news: '#4D4D4D',
          game: '#1A1A1A', cloud: '#000000', mail: '#333333', finance: '#4D4D4D',
          design: '#000000', map: '#333333', reading: '#000000', tools: '#4D4D4D',
          archive: '#666666', other: '#7A7A7A',
        },
      },
    },

    cyber: {
      id: 'cyber',
      name: '赛博',
      emoji: '⚡',
      desc: '霓虹色, 暗背景, 亮青紫',
      vars: {
        dark: {
          '--bg': '#0B0F1A',
          '--bg-elev': '#131A2A',
          '--bg-elev-2': '#1B2438',
          '--border': '#1E2A45',
          '--text': '#E0F2FE',
          '--text-dim': '#7DD3FC',
          '--text-faint': '#475569',
          '--accent': '#22D3EE',     // cyan-400 霓虹
          '--accent-2': '#E879F9',   // fuchsia-400 霓虹
          '--success': '#4ADE80',
          '--danger': '#FB7185',
          '--shadow-md': '0 0 16px rgba(34, 211, 238, 0.15)',
          '--shadow-lg': '0 0 32px rgba(232, 121, 249, 0.2)',
        },
        // 赛博主题只支持暗色
        light: null,
      },
      categories: {
        dark: {
          ai: '#A855F7', dev: '#22D3EE', learning: '#4ADE80', video: '#FB7185',
          music: '#F472B6', shopping: '#FB923C', social: '#38BDF8', news: '#A78BFA',
          game: '#E879F9', cloud: '#67E8F9', mail: '#FACC15', finance: '#34D399',
          design: '#FB7185', map: '#A3E635', reading: '#818CF8', tools: '#94A3B8',
          archive: '#64748B', other: '#475569',
        },
        light: null,
      },
    },

    warm: {
      id: 'warm',
      name: '暖意',
      emoji: '🍂',
      desc: '暖色, 米色底, 橙红点缀',
      vars: {
        dark: {
          '--bg': '#1A1410',
          '--bg-elev': '#251C16',
          '--bg-elev-2': '#2F241B',
          '--border': '#3D2E22',
          '--text': '#FEF3E2',
          '--text-dim': '#D4A574',
          '--text-faint': '#8B6F47',
          '--accent': '#FB923C',     // orange-400
          '--accent-2': '#F472B6',   // pink-400
          '--success': '#84CC16',
          '--danger': '#EF4444',
          '--shadow-md': '0 4px 12px rgba(0, 0, 0, 0.4)',
          '--shadow-lg': '0 10px 30px rgba(0, 0, 0, 0.5)',
        },
        light: {
          '--bg': '#FEF7ED',         // orange-50
          '--bg-elev': '#FFFFFF',
          '--bg-elev-2': '#FED7AA', // orange-200
          '--border': '#FDBA74',     // orange-300
          '--text': '#431407',       // orange-950
          '--text-dim': '#9A3412',   // orange-800
          '--text-faint': '#C2410C', // orange-700
          '--accent': '#EA580C',     // orange-600
          '--accent-2': '#BE185D',   // pink-700
          '--success': '#65A30D',
          '--danger': '#B91C1C',
          '--shadow-md': '0 4px 12px rgba(154, 52, 18, 0.08)',
          '--shadow-lg': '0 10px 30px rgba(154, 52, 18, 0.15)',
        },
      },
      categories: {
        dark: {
          ai: '#F472B6', dev: '#FB923C', learning: '#FACC15', video: '#EF4444',
          music: '#FB7185', shopping: '#FDBA74', social: '#FB923C', news: '#A16207',
          game: '#F472B6', cloud: '#7DD3FC', mail: '#FBBF24', finance: '#84CC16',
          design: '#FB7185', map: '#A3E635', reading: '#FB923C', tools: '#D97706',
          archive: '#78716C', other: '#57534E',
        },
        light: {
          ai: '#BE185D', dev: '#C2410C', learning: '#854D0E', video: '#B91C1C',
          music: '#9F1239', shopping: '#9A3412', social: '#C2410C', news: '#78350F',
          game: '#86198F', cloud: '#0E7490', mail: '#92400E', finance: '#3F6212',
          design: '#BE123C', map: '#4D7C0F', reading: '#7C2D12', tools: '#44403C',
          archive: '#57534E', other: '#404040',
        },
      },
    },
  };

  // 默认主题
  const DEFAULT_THEME = 'midnight';

  // 应用主题 (root 是 document.documentElement)
  // mode: 'dark' | 'light'
  function applyTheme(themeId, mode) {
    const t = THEMES[themeId] || THEMES[DEFAULT_THEME];
    const vars = t.vars[mode];
    if (!vars) {
      // 主题不支持该模式, 用 midnight
      const fallback = mode === 'dark' ? 'midnight' : 'midnight';
      return applyTheme(fallback, mode);
    }
    const root = document.documentElement;
    Object.keys(vars).forEach(k => root.style.setProperty(k, vars[k]));
    return t;
  }

  // 同步分类色到 CATEGORIES (修改 CATEGORIES 中的 color)
  function syncCategoryColors(themeId, mode) {
    const t = THEMES[themeId] || THEMES[DEFAULT_THEME];
    const colors = t.categories[mode] || t.categories.dark;
    if (!colors || !global.BookmarkClassifier) return;
    Object.keys(colors).forEach(k => {
      if (global.BookmarkClassifier.CATEGORIES[k]) {
        global.BookmarkClassifier.CATEGORIES[k].color = colors[k];
      }
    });
  }

  function getThemeList() {
    return Object.keys(THEMES).map(k => ({
      id: k,
      name: THEMES[k].name,
      emoji: THEMES[k].emoji,
      desc: THEMES[k].desc,
      lightSupported: !!THEMES[k].vars.light,
    }));
  }

  function getTheme(id) {
    return THEMES[id] || THEMES[DEFAULT_THEME];
  }

  global.BookmarkThemes = {
    THEMES,
    DEFAULT_THEME,
    applyTheme,
    syncCategoryColors,
    getThemeList,
    getTheme,
  };
})(typeof window !== 'undefined' ? window : this);
