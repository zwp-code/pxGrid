import { createI18n } from 'vue-i18n';
import zh from './zh';
import en from './en';

// const language = (navigator.language || 'en').toLocaleLowerCase();
const language = 'zh';
const i18n = createI18n({
    legacy: false,  // 没有该参数可能会报错
    // locale: localStorage.getItem('px-lang') || language.split('-')[0] || 'zh',
    locale: localStorage.getItem('px-lang') || language,
    messages: {
        zh,
        en
    }
});
 
export default i18n;
