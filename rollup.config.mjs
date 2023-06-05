import terser from '@rollup/plugin-terser'
import resolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/index.min.js',
      format: 'cjs',
      plugins: [terser()],
    },
  ],
  plugins: [resolve(), babel({babelHelpers: 'bundled'})],
}
