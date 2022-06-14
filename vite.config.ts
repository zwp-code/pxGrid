import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import eslintPlugin from 'vite-plugin-eslint';
import { resolve } from 'path';
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
    base: './',
    plugins: [
        vue(),
        eslintPlugin({
            include: ['src/**/*.js', 'src/**/*.vue', 'src/*.js', 'src/*.vue', 'src/**/*.ts'],
            exclude: ['./node_modules/**'],
            cache: false
        }),
        viteCompression({
            verbose: true,
            disable: false,
            threshold: 10240,
            algorithm: 'gzip',
            ext: '.gz'
        })
    ],
    resolve: {
        alias:{
            '@': resolve(__dirname, 'src')
        }
    },
    css: {
        // css预处理器
        preprocessorOptions: {
            scss: {
                additionalData: `@use "./src/style/element.scss" as *;`
            }
        }
    },
    build: {
        target: 'modules',
        outDir: 'dist',
        assetsDir: 'assets',
        minify: 'terser',
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
            output: {
                chunkFileNames: 'static/js/[name]-[hash].js',
                entryFileNames: 'static/js/[name]-[hash].js',
                assetFileNames: 'static/[ext]/[name]-[hash].[ext]'
            }
        },
        // 清除打印和debug
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        }
    },
    server: {
        host: '0.0.0.0',
        port: 8088,
        cors: true,
        open: true,
        hmr: true,
        proxy: {
            // 选项写法
            '/api': {
                target: 'http://jsonplaceholder.typicode.com',
                changeOrigin: true
                // rewrite: (path) => path.replace(/^\/api/, '')
            }
        }
    }
});
