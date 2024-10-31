<template>
    <el-config-provider :locale="locale">
        <div class="full-layout flex-column-center">
            <HomeHeader @changeLanguage="changeLanguage" @changeTheme="changeTheme"></HomeHeader>
            <el-container direction='horizontal' class="home-box">
                <HomeSideNav></HomeSideNav>
                <HomeRouter></HomeRouter>
            </el-container>
        </div>
        <teleport to='body'>
            <NoticeDialog v-if="noticeVisible" :visible="noticeVisible" :notice="notice" @close="noticeVisible=false"></NoticeDialog>
        </teleport>
    </el-config-provider>
</template>
  
<script lang="ts">
import { reactive, toRefs, onMounted, onBeforeUnmount, defineComponent, getCurrentInstance, ref, provide } from 'vue';
import HomeHeader from '@/components/HomeHeader.vue';
import HomeFooter from '@/components/HomeFooter.vue';
import HomeSideNav from '@/components/HomeSideNav.vue';
import HomeRouter from '@/components/HomeRouter.vue';
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import en from 'element-plus/dist/locale/en.mjs';
import { useEditSpaceStore } from '@/store';
import axios from 'axios';
import NoticeDialog from '@/components/dialog/NoticeDialog.vue';
import { useToggle } from '@vueuse/shared';
import { useDark } from '@vueuse/core';
export default defineComponent({
    name:'home',
    components: {
        ElConfigProvider,
        HomeHeader, 
        HomeFooter, 
        HomeSideNav, 
        HomeRouter,
        NoticeDialog
    },
    props:{},
    emits:[],
    setup (props, context)
    {
        const { proxy }:any = getCurrentInstance();
        const language = (navigator.language || 'en').toLocaleLowerCase();
        const editSpaceStore = useEditSpaceStore();
        let data = reactive({
            locale:zhCn,
            notice:{
                title:'',
                content:''
            },
            noticeVisible:false
        });

        const isDark = useDark({
            // 存储到localStorage/sessionStorage中的Key 根据自己的需求更改
            storageKey: 'px-theme',
            // 暗黑class名字
            valueDark: 'dark'
        });

        const isLight = useDark({
            // 存储到localStorage/sessionStorage中的Key 根据自己的需求更改
            storageKey: 'px-theme',
            // 高亮class名字
            valueLight: 'light'
        });

        const theme = useDark({
            // 存储到localStorage/sessionStorage中的Key 根据自己的需求更改
            storageKey: 'px-theme',
            // 暗黑class名字
            valueDark: 'dark',
            valueLight: 'light'
        });
        const toggleDark = useToggle(theme);

        const initTheme = () => 
        {
            let useThemeKey = window.localStorage.getItem('px-theme');
            if (useThemeKey)
            {
                if (useThemeKey === 'light' || useThemeKey === 'auto')
                {
                    useToggle(isLight);
                    editSpaceStore.themeValue = false;
                }
                else
                {
                    useToggle(isDark);
                    editSpaceStore.themeValue = true;
                }
            }
            else
            {
                useToggle(isLight);
                editSpaceStore.themeValue = false;
            }
        };

     
        let methods = {
            changeTheme ()
            {
                toggleDark();
                editSpaceStore.themeValue = !editSpaceStore.themeValue;
            },
            changeLanguage ()
            {
                if (localStorage.getItem('px-lang'))
                {
                    data.locale = localStorage.getItem('px-lang') === 'zh' ? zhCn : en;
                }
                else if (language.split('-')[0])
                {
                    data.locale = language.split('-')[0] === 'zh' ? zhCn : en;
                }
                else 
                {
                    data.locale = zhCn;
                }
                editSpaceStore.lang = localStorage.getItem('px-lang') || language.split('-')[0] || 'zh';
                localStorage.setItem('px-lang', editSpaceStore.lang);
                
            },
            getNoticeData ()
            {
                axios.get(`${import.meta.env.VITE_APP_API_URL}json/notice.json`)
                    .then((res) => 
                    {
                        if (res.data.length > 0)
                        {
                            data.noticeVisible = true;
                            data.notice = proxy.$utils.cache.lang.get() === 'zh' ? res.data[0] : res.data[1];
                        }

                    })
                    .catch((err) => 
                    {
                        // proxy.$message.error(err);
                        console.error(err);
                    });
            },
            getColorModules ()
            {
                axios.get(`${import.meta.env.VITE_APP_API_URL}json/color.json`)
                    .then((res) => 
                    {
                        editSpaceStore.colorModules = res.data;
                    })
                    .catch((err) => 
                    {
                        // proxy.$message.error(err);
                        console.error(err);
                    });
            },
            getProjectList ()
            {
                let projectData = proxy.$utils.cache.project.get();
                if (projectData)
                {
                    editSpaceStore.projectList = JSON.parse(projectData);
                    console.log(editSpaceStore.projectList);
                    
                }
            }
            
        };
        
        onMounted(() => 
        {
            window.onbeforeunload = function (e)
            {
                e.returnValue = '1111';
            };
            methods.changeLanguage();
            initTheme();
            // methods.getProjectList();
            methods.getColorModules();
            methods.getNoticeData();

        });

        return {
            ...toRefs(data),
            ...methods
        };
    }
});
</script>
  
<style lang='scss' scoped>

.home-box {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: auto;
    flex: 1;
    background-color: var(--el-bg-color);
}
  
</style>
  