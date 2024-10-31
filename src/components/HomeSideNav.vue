<template>
    <el-menu
        :default-active="$route.path"
        router
        :collapse="isCollapse"
        style="min-width: 60px;"
        >

        <el-menu-item 
        v-for="item in menuList" 
        :key="item.path" 
        :index="item.path"
        :class="{active:item.path === $route.path, active1:$route.path.includes('/work') && item.path === '/project'}"
        style="justify-content:flex-start">
            <el-icon size="16" style="width: 16px;">
                <component :is="item.icon" style="width: 16px;height: 16px;"></component>
            </el-icon>
            <template #title>
                <p style="margin-left: 10px;">{{ $t(`message.${item.title}`)}}</p>
            </template>
        </el-menu-item>

    </el-menu>
</template>

<script lang="ts">
import { ref, reactive, toRefs, defineComponent, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
export default defineComponent({
    name: 'HomeSideNav',
    components: {},
    props: {
    },
    setup (props, context) 
    {
        const Router = useRouter();
        let data = reactive({
            isCollapse:false,
            menuList:[] as any
        });
        let methods = {
            handleChangeSize ()
            {
                if (window.innerWidth < 1100)
                {
                    if (data.isCollapse) return;
                    data.isCollapse = true;
                }
                else
                {
                    if (!data.isCollapse) return;
                    data.isCollapse = false;
                }
            }
        };
        let menuRoutes:any = Router.options.routes[1].children;
        let arr = menuRoutes.map((item:any, index) => 
        {
            let obj = null as any;
            if (index < 3)
            {
                obj = {
                    path:`/${item.path}`,
                    title:item.meta.title,
                    icon:item.meta.icon
                };
            }
            return obj;
        });
        data.menuList = arr.filter((item) => item !== null);
        const debounce = (fn, delay) =>  
        {
            let timer;
            return function () 
            {
                if (timer)  
                {
                    clearTimeout(timer);
                }
                timer = setTimeout(() => 
                {
                    fn();
                }, delay);
            };
        };
        const cancalDebounce = debounce(methods.handleChangeSize, 500);

        onMounted(() => 
        {
            window.addEventListener('resize', cancalDebounce);
            methods.handleChangeSize();
            
        });

        onBeforeUnmount(() => 
        {
            window.removeEventListener('resize', cancalDebounce);
        });
        
        return {
            ...toRefs(data),
            ...methods
        };
    }
});
</script>
<style lang='scss' scoped>

.el-menu {
    border-right:0 !important;
    box-shadow: 1px 0px 4px 4px var(--el-shadow-aside);
    z-index: 10;
}

.active {
    background-color:var(--el-menu-active-bg-color);
}

.active1 {
    background-color:var(--el-menu-active-bg-color);
}

:deep(.el-sub-menu) {
  display: grid;
}

</style>
