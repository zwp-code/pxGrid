import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import eslintPlugin from 'vite-plugin-eslint';
import { resolve } from 'path';
import viteCompression from 'vite-plugin-compression';
import requireTransform from 'vite-plugin-require-transform';
import OptimizationPersist from 'vite-plugin-optimize-persist';
import PkgConfig from 'vite-plugin-package-config';

export default defineConfig(({ command, mode }) => 
{
    loadEnv(mode, process.cwd());
    return {
        // base: '../',
        base: '/',
        define: {
            'process.env': {
                // 'VUE_APP_API_URL':'http://192.168.1.7:5001',
                // 'VUE_APP_WS_URL':'ws://192.168.0.29:5000'
            }
        },
        // optimizeDeps: {
        //     include: ['linked-dep']
        // },
        plugins: [
            vue(),
            PkgConfig(),
            OptimizationPersist(),
            requireTransform({
                fileRegex:/.ts$|.js$|.vue$/
            //   fileRegex:/.js$|.jsx$|.vue$/
            }),
            eslintPlugin({
                include: ['src/**/*.js', 'src/**/*.vue', 'src/*.js', 'src/*.vue', 'src/**/*.ts'],
                exclude: ['./node_modules/**', './src/components/xpCalendars/utils/**'],
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
                '@': resolve(__dirname, 'src'),
                '$': resolve(__dirname, 'packages')
            }
        },
        css: {
            // css预处理器
            preprocessorOptions: {
                scss: {
                    additionalData: `@use './src/style/element.scss' as *;`
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
            commonjsOptions: {
                include: []
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
            hmr: true
            // https: {
            //     // 主要是下面两行的配置文件，不要忘记引入 fs 和 path 两个对象
            //     cert: fs.readFileSync(path.join(__dirname, 'src/ssl/cert.crt')),
            //     key: fs.readFileSync(path.join(__dirname, 'src/ssl/cert.key'))
            // }
            // proxy: {
            //     // 选项写法
            //     '/xp/api': {
            //         // target: 'http://192.168.0.29:5001',
            //         target:'http://localhost:5001',
            //         // target: 'http://192.168.1.7:5001',
            //         changeOrigin: true
            //         // rewrite: (path) => path.replace(/^\/api/, '')
            //     }
            // }
        }
        // optimizeDeps: {
        //     include: [
        //         'element-plus/es',
        //         'element-plus/es/components/config-provider/style/css',
        //         'element-plus/es/components/container/style/css',
        //         'element-plus/es/components/main/style/css',
        //         'element-plus/es/components/header/style/css',
        //         'element-plus/es/components/date-picker/style/css',
        //         'element-plus/es/components/drawer/style/css',
        //         'element-plus/es/components/image/style/css',
        //         'element-plus/es/components/image/style/css',
        //         'element-plus/es/components/table/style/css',
        //         'element-plus/es/components/table-column/style/css',
        //         'element-plus/es/components/input/style/css',
        //         'element-plus/es/components/dropdown/style/css',
        //         'element-plus/es/components/popover/style/css',
        //         'element-plus/es/components/dropdown-item/style/css',
        //         'element-plus/es/components/dropdown-menu/style/css',
        //         'element-plus/es/components/pagination/style/css',
        //         'element-plus/es/components/scrollbar/style/css',
        //         'element-plus/es/components/dialog/style/css',
        //         'element-plus/es/components/loading/style/css',
        //         'element-plus/es/components/tabs/style/css',
        //         'element-plus/es/components/tab-pane/style/css',
        //         'element-plus/es/components/select/style/css',
        //         'element-plus/es/components/option/style/css',
        //         'vue',
        //         'pinia',
        //         'sass',
        //         'vue-router',
        //         'axios'
        //     ]
        // }
    };
});
