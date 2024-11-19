import { createApp } from 'vue';
import plugins from './plugins';
import App from './App.vue';
import '@/style/config.scss';
import ElementPlus from 'element-plus';
import 'element-plus/theme-chalk/dark/css-vars.css';
import './style/dark/css-vars.css';
// import 'element-plus/dist/index.css';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import en from 'element-plus/dist/locale/en.mjs';
import { componentIcon } from './utils/element-plus';
import { createPinia } from 'pinia';
import i18n from '@/i18n';
import router from './router';
const pinia = createPinia();


const app = createApp(App);
app.use(ElementPlus);
app.use(pinia);
app.use(router);
app.use(plugins);
app.use(i18n);
componentIcon(app);
app.mount('#app');
