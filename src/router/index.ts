import { createRouter, createWebHashHistory, RouteRecordRaw, RouteLocationNormalized } from 'vue-router';
import cache from '@/utils/cache';

let router:any = null;
// const allowRoutes: = ['/login', '/price', '/home'];
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
            }
        ]
    }
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
    // {
    //     path:'/login',
    //     name:'login',
    //     component:() => import('@/views/login/index.vue'),
    //     meta:{ title:'登陆', keepAlive:false }
    // }
];

router = createRouter({
    history: createWebHashHistory(),
    routes
});

type Route = RouteLocationNormalized;
// 全局前置路由守卫
router.beforeEach((to:Route, from:Route, next:(value?:string)=>void):void =>
{
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
        next();
    }
    // if (to.path === 'work')
    // {
    //     if (to.query.id)
    //     {

    //     }
    // }
    // else
    // {
    //     next();
    // }
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
});

export default router;
