<template>
    <el-menu
        :default-active="$route.path"
        router
        :collapse="isCollapse"
        style="min-width: 60px;position: relative;"
        :class="{ 'web-gray': checkDate('公祭日') }"
        >

        <el-menu-item 
        v-for="item in menuList" 
        :key="item.path" 
        :index="item.path"
        :class="{active:item.path === $route.path, active1:$route.path.includes('/work') && item.path === '/project'}"
        style="justify-content:center">
            <el-icon size="16" style="width: 16px;">
                <component :is="item.icon" style="width: 16px;height: 16px;"></component>
            </el-icon>
            <!-- <i v-html="$iconSvg[item.icon]" style="width:18px;height:18px" class="el-icon"></i> -->
            <template #title>
                <p style="margin-left: 10px;">{{ $t(`message.${item.title}`)}}</p>
            </template>
        </el-menu-item>
        <div class="collapseIcon flex-center" @click="isCollapse=!isCollapse">
            <el-icon v-if="isCollapse"><DArrowRight /></el-icon>
            <el-icon v-else><DArrowLeft /></el-icon>
        </div>
        <div class="static-santa-claus" v-show="!isCollapse && checkDate('圣诞')">
            <lottie-player src="/lottie/圣诞老人2.json"  background="transparent"  speed="1"  style="width: 100px; height: 100px;" loop autoplay></lottie-player>
        </div>
    </el-menu>
    <teleport to="body">
        <div class="move-santa-claus" v-if="checkDate('圣诞')">
            <lottie-player src="/lottie/圣诞老人1.json"  background="transparent"  speed="1"  style="width: 150px; height: 150px;" loop autoplay></lottie-player>
        </div>
    </teleport>
</template>

<script lang="ts">
import { ref, reactive, toRefs, defineComponent, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { checkDate } from '@/utils/utils';
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
            if (index < 4)
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
            ...methods,
            checkDate
        };
    }
});
</script>
<style lang='scss' scoped>

.el-menu {
    border-right:0 !important;
    box-shadow: 1px 0px 4px 4px var(--el-shadow-aside);
    z-index: 10;

    :deep(.el-menu-item .el-menu-tooltip__trigger) {
        display: flex;
        align-items: center;
        justify-content: center;
    }

}
.collapseIcon {
    width: 30px;
    height: 30px;
    position: absolute;
    bottom: 15px;
    left: 50%;
    transform: translateX(-15px);
    background: var(--el-menu-active-bg-color);
    box-shadow: 0px 0px 6px 3px var(--el-shadow-aside);
    border-radius: 5px;
    cursor: pointer;
    transition: all .3s;

    &:hover {
        background: var(--el-menu-hover-bg-color);
    }
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
