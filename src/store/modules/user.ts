import cache from '@/utils/cache';
// import http from '@/http';

interface UserState {
    isConnect:boolean,
    isLogin:boolean,
    userData:null
}

const state:UserState = {
    isConnect:false,
    isLogin:false,
    userData:null
};
const mutations = {
    loginOut (state:UserState)
    {
        // 退出登录
        cache.token.remove();
        state.isLogin = false;
        window.location.reload();
    },
    setUserData (state:UserState, userData:any)
    {
        // 缓存用户数据
        state.isLogin = true;
        state.userData = userData;
    },
    handleConnect (state:UserState)
    {
        state.isConnect = true;
    }
};
const actions = {
    async getUserData ({commit}:any)
    {
        // 判断是否登录
        // if(cache.token.get())
        // {
        //     try 
        //     {
        //         const res = await http.user.getUserData();
        //         if(res.success)
        //         {
        //             commit('setUserData', res.data);
        //         }
        //     } 
        //     catch (err) 
        //     {
        //         // commit('handleConnect');
        //         commit('loginOut');
        //     }
        // }
        commit('handleConnect');
    },
    async updateUserData ({commit}:any, value:any)
    {
        // const res = await http.user.updateUserData(value);
        // if(res.success)
        // {
        //     commit('setUserData', res.data);
        // }
        // return res;
    }
};

export default {
    namespaced: true,
    state,
    mutations,
    actions
};