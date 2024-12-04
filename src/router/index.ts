import { createRouter, createWebHashHistory, RouteRecordRaw, RouteLocationNormalized, createWebHistory } from 'vue-router';
import cache from '@/utils/cache';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

let router:any = null;
const allowRoutes = ['/home', '/about', '/project', '/module', '/pindou', '/work', '/preview', '/404'];
const routes:RouteRecordRaw[] = [
    {
        path:'/home',
        redirect:'/',
        component:() => import('@/views/index.vue')
    },
    {
        path:'/',
        name:'home',
        redirect:'about',
        component:() => import('@/views/index.vue'),
        meta:{ title:'home', keepAlive:true },
        children:[
            {
                path:'about',
                name:'about',
                meta:{ title:'about', icon:'Compass' },
                component:() => import('@/views/about/index.vue')
            },
            {
                path:'project',
                name:'project',
                meta:{ title:'project', icon:'Files' },
                component:() => import('@/views/project/index.vue')
            },
            {
                path:'module',
                name:'module',
                meta:{ title:'moduleShop', icon:'House' },
                component:() => import('@/views/module/index.vue')
            },
            {
                path:'pindou',
                name:'pindou',
                meta:{ title:'pindouShop', icon:'Orange' },
                component:() => import('@/views/pindou/index.vue')
            },
            // {
            //     path:'feedback',
            //     name:'feedback',
            //     meta:{ title:'feedback', icon:'MessageBox' },
            //     component:() => import('@/views/feedback/index.vue')
            // },
            {
                path:'work/:projectId',
                name:'work',
                meta:{ title:'工作台' },
                component:() => import('@/views/work/index.vue')
            },
            {
                path:'preview/:projectId',
                name:'preview',
                meta:{ title:'预览项目' },
                component:() => import('@/views/preview/index.vue')
            }
        ]
    },
    // {
    //     path:'/',
    //     redirect:'/home',
    //     component:() => import('@/views/home/index.vue')
    // },
    // {
    //     path:'/home',
    //     name:'home',
    //     component:() => import('@/views/home/index.vue'),
    //     meta:
    //     { title:'首页', keepAlive:true }
    // }
    {
        path:'/404',
        name:'404',
        component:() => import('@/views/404/index.vue'),
        meta:{ title:'404' }
    }
];

router = createRouter({
    history: createWebHistory(),
    routes
});

type Route = RouteLocationNormalized;
// 全局前置路由守卫
router.beforeEach((to:Route, from:Route, next:(value?:string)=>void):void =>
{
    NProgress.start();
    if (to.path.includes('project'))
    {
        let id = cache.currentProjectId.get();
        if (id && id != 0)
        {
            next(`/work/${id}`);
        }
        else
        {
            next();
        }
    }
    else
    {
        if (!allowRoutes.find((item) => to.path === item))
        {
            next('/404');
        }
        else
        {
            next();
        }
    }
    // let token = cache.token.get();
    // if (token)
    // {
    //     if (to.path === '/login')
    //     {
    //         next('/');
    //     }
    //     else
    //     {
    //         next();
    //     }
    // }
    // else
    // {
    //     if (to.path === '/login')
    //     {
    //         next();
    //     }
    //     else
    //     {
    //         next('/login');
    //     }
    //     // if(allowRoutes.includes(to.path))
    //     // {
    //     //     next();
    //     // }
    //     // else
    //     // {
    //     //     next('/login');
    //     // }
    // }
});

// 全局后置路由守卫
router.afterEach((to:Route) =>
{
    document.title = '像素格子';
    NProgress.done();
});

export default router;
