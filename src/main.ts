import { createApp } from 'vue';
import App from './App.vue';
// import './style/element.scss';
import '@/style/config.scss';
import ElementPlus from 'element-plus';
// import 'element-plus/dist/index.css';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import plugins from './plugins';
import router from './router';
import store from './store';
import { componentIcon } from './utils/element-plus';

const app = createApp(App);
app.use(ElementPlus, { locale: zhCn });
app.use(router);
app.use(plugins);
app.use(store);
componentIcon(app);
app.mount('#app');
