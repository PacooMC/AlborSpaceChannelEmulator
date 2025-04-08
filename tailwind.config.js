/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'albor-orange': '#F97316', // Primary accent
        'albor-glow': '#FACC15',   // Yellow-ish glow for sunrise/stars
        'albor-light-gray': '#E5E7EB', // Light gray text/UI
        'albor-dark-gray': '#6B7280', // Softer gray text/borders
        'albor-bg-dark': '#111827', // Gray-black bg elements (sidebars, cards)
        'albor-deep-space': '#0B0F19', // Deep background base
        'albor-star-white': 'rgba(255, 255, 255, 0.8)', // Slightly transparent white star
        'albor-star-orange': 'rgba(251, 146, 60, 0.6)', // Faint orange star (using albor-orange base)
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Keep Inter as requested
      },
      letterSpacing: {
        'widest-lg': '.2em', // Wider tracking for main titles
        widest: '.1em', // Standard wide tracking
      },
      backgroundImage: {
        // Combined starfield and sunrise gradient
        'space-background': `
          radial-gradient(ellipse at bottom, theme('colors.albor-orange') 1%, transparent 60%),
          radial-gradient(circle, theme('colors.albor-star-white') 0.5px, transparent 1px),
          radial-gradient(circle, theme('colors.albor-star-orange') 0.5px, transparent 1px),
          linear-gradient(to bottom, theme('colors.albor-deep-space'), theme('colors.albor-deep-space'))
        `,
      },
      backgroundSize: {
        'starfield-size-1': '50px 50px', // Density/size for white stars
        'starfield-size-2': '150px 150px', // Density/size for orange stars (more sparse)
        'sunrise-size': '150% 80%', // Size of the bottom glow
        'full': '100% 100%',
      },
      backgroundPosition: {
        'stars-1': '0 0',
        'stars-2': '25px 25px', // Offset orange stars
        'sunrise-pos': 'center bottom',
        'full-pos': '0 0',
      },
      boxShadow: {
        'glow-orange': '0 0 15px 5px rgba(249, 115, 22, 0.3)', // Soft orange glow shadow
      }
    },
  },
  plugins: [],
}
