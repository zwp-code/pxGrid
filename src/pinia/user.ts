import { defineStore } from 'pinia';

interface userData {
    username?:string,
    password?:string
}

export const useUsersStore = defineStore('user', {
    state: () => 
    {
        return {
            userData:{
                username:'',
                password:''
            }
        };
    },
    getters: {
        getUserData: (state) =>
        {
            return state.userData;
        },
        getUserName: (state) =>
        {
            return state.userData.username;
        }
    },
    actions: {
        login (data:userData)
        {
            return new Promise((resolve, reject) => 
            {
                if (data.username === 'admin' && data.password === '123456')
                {
                    resolve(true);
                }
                else
                {
                    reject(new Error('账号密码错误'));
                }
            });
        }
        // save (data:userData)
        // {
        //     this.userData = data;
        // }
    }
});