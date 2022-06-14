import { createRouter, createWebHashHistory, RouteRecordRaw, RouteLocationNormalized } from 'vue-router';
import cache from '@/utils/cache';
// import { Menu, UserFilled, BellFilled, Histogram, Tools, Avatar, TrendCharts, UploadFilled} from '@element-plus/icons-vue';

let router:any = null;
// const allowRoutes: = ['/login', '/price', '/home'];
const routes:RouteRecordRaw[] = [
    {
        path:'/',
        redirect:'/home',
        component:() => import('@/views/home/index.vue')
    },
    {
        path:'/home',
        name:'home',
        component:() => import('@/views/home/index.vue'),
        meta:
        { title:'首页', keepAlive:true }
    },
    {
        path:'/login',
        name:'login',
        component:() => import('@/views/login/index.vue'),
        meta:{ title:'登陆', keepAlive:false }
    }
];

router = createRouter({
    history: createWebHashHistory(),
    routes
});

type Route = RouteLocationNormalized;
// 全局前置路由守卫
router.beforeEach((to:Route, from:Route, next:(value?:string)=>void):void =>
{
    let token = cache.token.get();
    if (token)
    {
        if (to.path === '/login')
        {
            next('/');
        }
        else
        {
            next();
        }
    }
    else
    {
        if (to.path === '/login')
        {
            next();
        }
        else
        {
            next('/login');
        }
        // if(allowRoutes.includes(to.path))
        // {
        //     next();
        // }
        // else
        // {
        //     next('/login');
        // }
    }
});

// 全局后置路由守卫
router.afterEach((to:Route) =>
{
    document.title = to.meta.title + '- 编程星球' || '编程 星球';
});

export default router;
