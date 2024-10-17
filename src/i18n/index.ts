import { createI18n } from 'vue-i18n';
import zh from './zh';
import en from './en';

const language = (navigator.language || 'en').toLocaleLowerCase();
const i18n = createI18n({
    legacy: false,  // 没有该参数可能会报错
    locale: localStorage.getItem('db-lang') || language.split('-')[0] || 'zh',
    messages: {
        zh,
        en
    }
});
 
export default i18n;
