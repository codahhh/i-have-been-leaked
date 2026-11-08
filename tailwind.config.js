/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#08090C',
        surface: '#101217',
        card: '#151820',
        rail: '#1B1F29',
        line: '#242832',
        'line-soft': '#1D222B',
        ink: '#F5F5F5',
        muted: '#9298A5',
        faint: '#7E8796',
        brand: '#EF4444',
        'brand-deep': '#B91C1C',
        ok: '#22C55E',
        warn: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      letterSpacing: {
        tighter: '-0.03em',
        tightest: '-0.045em',
      },
      maxWidth: {
        shell: '1100px',
      },
      borderRadius: {
        xl2: '1.125rem',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fade: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        sweep: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(320%)' },
        },
        shimmer: {
          '0%': { opacity: '0.35' },
          '50%': { opacity: '0.75' },
          '100%': { opacity: '0.35' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.45', transform: 'scale(0.85)' },
        },
      },
      animation: {
        rise: 'rise 420ms cubic-bezier(0.16, 1, 0.3, 1) both',
        fade: 'fade 300ms ease-out both',
        sweep: 'sweep 1.4s cubic-bezier(0.45, 0, 0.55, 1) infinite',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        pulseDot: 'pulseDot 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
