// const plugin = require('tw-elements/plugin');

module.exports = {
  content: [
    "./components/**/*.{ts,tsx,js,jsx}",
    "./pages/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'grayskull': "url('/bg.png')",
      },
      fontFamily: {
        // DotGothic16: ["DotGothic16"],
        // CarroisGothicSC: ["Carrois Gothic SC"],
        CarroisGothic: ["Carrois Gothic"],
        DotGothic16: ["DotGothic16"],
        PathwayGothicOne: ["Pathway Gothic One"],
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
}
