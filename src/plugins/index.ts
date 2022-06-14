// import config from '@/config';
// import http from '@/http';
import utils from '@/utils';
// import { ElMessage } from 'element-plus';
import message from '../utils/message';


export default {
    install (app:any)
    {
        // app.config.globalProperties.$config = config;
        // app.config.globalProperties.$http = http;
        app.config.globalProperties.$utils = utils; 
        app.config.globalProperties.$message = message;
    }
};