
import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'
export default {
    input: './main.js',
    output: {
        file: 'dist/gif.js',
        format: 'umd',
        name: 'Gif',
        sourcemap: true
    },
    plugins: [
        babel({
            exclude: 'node_modules/**'
        }),
        terser()
    ]
}