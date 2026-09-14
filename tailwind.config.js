/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ---- 未来科幻风：深色底 + 霓虹强调 ----
        // 与 seeing-single-cell（浅色 + 生物绿）彻底区分
        void:   '#05070D',   // 页面底色（近黑，带冷蓝）
        panel:  '#0A101E',   // 卡片 / 面板
        raised: '#101828',   // 悬浮层 / 代码块
        line:   '#1B2740',   // 1px 分隔线、边框
        fg: {
          DEFAULT: '#E6EDF7',  // 主文字
          muted:   '#8A9BB8',  // 次要文字
          dim:     '#5A6B85',  // 微弱文字 / 标签
        },
        // 霓虹强调色
        neon: '#22D3EE',
        // 三个焦点模型的语义色（全站固定，勿改）
        k3:   '#A78BFA',   // Kimi K3        —— 紫
        v4:   '#22D3EE',   // V4.1 Flash     —— 青
        qwen: '#FB923C',   // Qwen3.8        —— 橙
      },
      fontFamily: {
        sans: ['Inter', '"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      letterSpacing: {
        wider2: '0.18em',
      },
      boxShadow: {
        // 霓虹发光
        glow:        '0 0 0 1px rgba(34,211,238,0.25), 0 0 24px -6px rgba(34,211,238,0.45)',
        'glow-k3':   '0 0 0 1px rgba(167,139,250,0.25), 0 0 24px -6px rgba(167,139,250,0.45)',
        'glow-v4':   '0 0 0 1px rgba(34,211,238,0.25), 0 0 24px -6px rgba(34,211,238,0.45)',
        'glow-qwen': '0 0 0 1px rgba(251,146,60,0.25), 0 0 24px -6px rgba(251,146,60,0.45)',
      },
      backgroundImage: {
        // 工业网格底纹
        'grid-fade':
          'linear-gradient(to right, rgba(120,160,255,0.055) 1px, transparent 1px),' +
          'linear-gradient(to bottom, rgba(120,160,255,0.055) 1px, transparent 1px)',
        // 顶部光晕
        'aurora':
          'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,211,238,0.16), transparent 60%),' +
          'radial-gradient(ellipse 60% 40% at 85% 0%, rgba(167,139,250,0.12), transparent 60%),' +
          'radial-gradient(ellipse 50% 40% at 10% 0%, rgba(251,146,60,0.08), transparent 60%)',
        'accent-bar': 'linear-gradient(90deg, #A78BFA 0%, #22D3EE 50%, #FB923C 100%)',
      },
      backgroundSize: {
        grid: '44px 44px',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'blink':      'blink 1.1s steps(1) infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan':       'scan 8s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 49%':   { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
