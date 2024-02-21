/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'push_button': '0 4px #0050AB',
        'push_button_2': '0 2px #0050AB',
      },
    },
  },
  plugins: [],
}

