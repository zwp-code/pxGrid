import { createStore } from 'vuex';
import user from '@/store/modules/user';
// import app from '@/store/modules/app';


export default createStore({
    modules: {
        user
        // app
    }
});
