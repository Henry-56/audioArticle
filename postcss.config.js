export default {
    plugins: {
        '@tailwindcss/postcss': {},
        autoprefixer: {}, // Autoprefixer is optional but often good to keep just in case, though @tailwindcss/postcss handles much of it. Actually, for v4, it is recommended to just use the new plugin or install it separately. I'll include it as per standard PostCSS setups unless specifically told not to.
    },
}
