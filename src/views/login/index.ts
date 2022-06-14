import { reactive, toRefs, onMounted, defineComponent, getCurrentInstance } from 'vue';
import {useStore} from 'vuex';
export default defineComponent({
    name:'login',
    components: {},
    props:{},
    emits:[],
    setup (props, context)
    {
        const { proxy }:any = getCurrentInstance();
        const store = useStore();

        let data = reactive({
            username:'',
            password:'',
            isChecked:false,
            loginLoading:false
        });

        const setData = (value:any) =>
        {
            proxy.$utils.cache.token.set(value.token);
            proxy.$utils.cache.uid.set(value._id);
            if (data.isChecked)
            {
                proxy.$utils.cache.un.set(data.username);
                proxy.$utils.cache.pwd.set(proxy.$utils.secret.Encrypt(data.password));
            }
            // proxy.$router.push('console');
        };

        interface userData {
            username?:string,
            password?:string
        }
        
        let methods = {
            // forgetPassword ()
            // {},
            login ()
            {
                let user:userData = {};
                user.username = data.username.trim();
                user.password = data.password.trim();
                let md5Password = proxy.$utils.secret.md5encode(user.password);
                if (user.username === '' || user.password === '')
                {
                    return proxy.$message.warning('账号密码未填写');
                }
                data.loginLoading = true;
                user.password = md5Password;
                proxy.$http.user.login({ user })
                    .then((res:any) =>
                    {
                        if (res.success) 
                        {
                            proxy.$message.success('登陆成功');
                            store.commit('user/setUserData', res.data);
                            setData(res.data);
                        }
                        data.loginLoading = false;
                        
                    })
                    .catch((err:any) => 
                    {
                        console.error(err);
                        data.loginLoading = false;
                    });

            }
        };
        
        onMounted(() => 
        {
            if (proxy.$utils.cache.un.get() && proxy.$utils.cache.pwd.get())
            {
                data.isChecked = true;
                data.username = proxy.$utils.cache.un.get();
                data.password = proxy.$utils.secret.Decrypt(proxy.$utils.cache.pwd.get());
            }
            
        });

        return {
            ...toRefs(data),
            ...methods
        };
    }
});