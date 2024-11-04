import config from '@/config';
// import http from '@/http';
import utils from '@/utils';
// import { ElMessage } from 'element-plus';
import Zdb from '../../packages/zdb-js/src/Zdb.js';
import message from '../utils/message';
import iconSvg from '@/assets/svg/icon';
import db from '@/config/db';

export default {
    install (app:any)
    {
        app.config.globalProperties.$config = config;
        // app.config.globalProperties.$http = http;
        app.config.globalProperties.$utils = utils; 
        app.config.globalProperties.$message = message;
        // app.config.globalProperties.$iconSvg = iconSvg;
        // app.config.globalProperties.$zdb = Zdb(db);
    }
};