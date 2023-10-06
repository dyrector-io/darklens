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
        'lens-error-red': '#ea5455',
        'lens-warning-orange': '#ff9f43',

        'lens-light-ring': '#404656',

        'lens-surface-0': '#CCF2FF', // lens-bright
        'lens-surface-1': '#B5D9E5', // lens-light-eased
        'lens-surface-2': '#768E96', // lens-light
        'lens-surface-3': '#677C84', // lens-bright-muted
        'lens-surface-3.5': '#3F4C51',
        'lens-surface-4': '#354044', // lens-medium-eased
        'lens-surface-5': '#2d383c', // lens-medium
        'lens-surface-6': '#192428', // lens-dark

        'lens-text-0': '#D5DFEA', // lens-bright
        'lens-text-1': '#C3C7CC', // lens-light-eased
        'lens-text-2': '#B5C6E2', // lens-light,
        'lens-text-3': '#4FB6EA', // lens-bright-muted
        'lens-text-4': '#3E758E', // lens-bright-muted
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

