module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/elements/**/*.{js,ts,jsx,tsx}',
    './src/hooks/**/*.{js,ts,jsx,tsx}',
    './src/utils.ts',
  ],
  mode: 'jit',
  theme: {
    extend: {
      colors: {
        'lens-turquoise': '#00d0bf',
        'lens-green': '#28c76f',
        'lens-purple': '#540ba7',
        'lens-purple-light': '#e1ccf8',
        'lens-violet': '#a78bfa',
        'lens-red': '#d33833',
        'lens-bright': '#d0d2d6',
        'lens-bright-muted': '#676d7d',
        'lens-light': '#7783a3',
        'lens-light-eased': '#b4b7bd',
        'lens-light-grey': '#3b4253',
        'lens-light-grey-muted': '#404656',
        'lens-lens-medium-eased': '#343d55',
        'lens-medium': '#283046',
        'lens-medium-eased': '#343d55',
        'lens-dark': '#161d31',
        'lens-error-red': '#ea5455',
        'lens-warning-orange': '#ff9f43',
      },
      width: {
        128: '32rem',
      },
      height: {
        128: '32rem',
      },
      maxHeight: {
        128: '32rem',
      },
      boxShadow: {
        modal: '0 0 20px 5px rgb(0 0 0 / 0.25)',
        topbar: '0px 3px 8px rgba(0, 0, 0, 0.24)',
      },
      fontFamily: {
        poppins: 'Poppins, sans-serif',
        roboto: 'Roboto Mono, sans-serif',
      },
      animation: {
        fade: 'fade-out forwards 3s ease-out',
      },
      keyframes: theme => ({
        'fade-out': {
          '0%': { opacity: theme('opacity.100') },
          '100%': { opacity: theme('opacity.0') },
        },
      }),
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}

