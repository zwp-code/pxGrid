import { getCurrentInstance } from 'vue';

// 处理拖拽
function useDrag () 
{
    const { proxy }:any = getCurrentInstance();
    const data = {
        draging:null as any, // 被拖拽的对象
        target:null as any, // 目标对象
        timer:null as any,
        folderTarget:null as any,
        flag:true
    };
    
    const methods = {
        onDragStart (event)
        {
            data.draging = event.target;
            event.dataTransfer.effectAllowed = 'move';
            // if (data.draging.getAttribute('data-folder'))
            // {
            //     appStore.dragOutApp = [data.draging.getAttribute('data-folder'), data.draging.getAttribute('data-key')];
            // }
        },
        onDragOver (event, node)
        {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            data.target = event.target;

            // if (appStore.dragOutApp && node === 'appBoxNode')
            // {
            //     if (!appStore.drapOutFlag)
            //     {
            //         appStore.drapOutFlag = true;
            //         console.log('应用被拖出来了');
            //     }
            //     return;
            // }
    
            let targetTop = event.target.getBoundingClientRect().top;
            let dragingTop = data.draging.getBoundingClientRect().top;
            if (data.target.dataset.node === 'LI' && data.target !== data.draging) 
            {
                if (data.target && data.target.animated) return;
                // if (data.target.getAttribute('is-folder') && !data.draging.getAttribute('is-folder'))
                // {
                //     if (data.folderTarget !== data.target) 
                //     {
                //         data.flag = true;
                //     }
                //     if (data.flag) 
                //     {
                //         console.log('遇到文件夹');
                //         data.flag = false;
                //         data.target.style.transition = 'transform .3s';
                //         data.target.style.transform = 'scale(1.1)';
                //         data.folderTarget = data.target;
                //     }
                //     return;
                // }
                // data.folderTarget = null;

                if (methods._index(data.draging, node) < methods._index(data.target, node))
                {
                    data.target.parentNode.insertBefore(data.draging, data.target.nextSibling);
                }
                else
                {
                    data.target.parentNode.insertBefore(data.draging, data.target);
                }
                methods._anim(targetTop, data.target);
                methods._anim(dragingTop, data.draging);
            }
            // else if (data.target.nodeName === 'LI' && data.target === data.draging)
            // {
            //     data.folderTarget = null;
            // }
            // if (appStore.dragOutApp && node === 'appBoxNode')
            // {
            //     if (!appStore.drapOutFlag)
            //     {
            //         appStore.drapOutFlag = true;
            //         console.log('应用被拖出来了');
            //     }
            // }
            
        },
        _anim (startPos, dom)
        {
            let offset = startPos - dom.getBoundingClientRect().top;
            dom.style.transition = 'none';
            // dom.style.transition = 'transform .3s';
            dom.style.transform = `translateY(${offset}px)`;

            // 触发重绘
            // dom.offsetWidth;
            // 触发重绘
            // setTimeout(() => 
            // {
            //     dom.style.transition = 'transform .3s';
            //     dom.style.transform = '';
            // }, 0);
            clearTimeout(dom.animated);

            dom.animated = setTimeout(() =>
            {
                dom.style.transition = '';
                dom.style.transform = '';
                dom.animated = false;
            }, 300);
        },
        // async onDragEnd (event, node, folderData) 
        // {
        //     // let newsData = userStore.settingsConfig.newsFollowList;
        //     // let newsRealData = userStore.mineFollowNewsList;
        //     // data.timer && clearTimeout(data.timer);
        //     // if (data.folderTarget)
        //     // {
        //     //     data.draging.remove();
        //     //     data.folderTarget.style.transition = '';
        //     //     data.folderTarget.style.transform = '';
                
        //     //     let dragId = data.draging.getAttribute('data-key');
        //     //     let folderId = data.folderTarget.getAttribute('data-key');
        //     //     let dragData = appData.find((item) => item.id === dragId);
        //     //     let folderIndex = appData.findIndex((item) => item.id === folderId);
        //     //     if (folderIndex >= 0)
        //     //     {
        //     //         appData[folderIndex]['children'].push(dragData);
        //     //     }
        //     //     data.folderTarget = null;
        //     //     data.flag = true;
        //     // }
        //     // 更新排序缓存
        //     let dom = proxy.$refs[node];
        //     let currentNodes = Array.from(dom.children);
        //     // if (folderData)
        //     // {   
        //     //     appData = folderData.children;
        //     //     if (appStore.drapOutFlag)
        //     //     {
        //     //         // 从文件夹里移出app
        //     //         let [folderId, appId] = appStore.dragOutApp;
        //     //         appStore.appData.forEach((item) => 
        //     //         {
        //     //             if (item.id === folderId)
        //     //             {
        //     //                 let value = item.children.find((i) => appId === i.id);
        //     //                 let index = item.children.findIndex((i) => appId === i.id);
        //     //                 appStore.appData.push(value);
        //     //                 if (index >= 0) item.children.splice(index, 1);
        //     //             }
        //     //         });
        //     //         appStore.drapOutFlag = false;
        //     //     }
        //     //     else
        //     //     {
        //     //         let newAppData = methods.getSortAppData(currentNodes, appData);
        //     //         appStore.appData.forEach((item) => 
        //     //         {
        //     //             if (item.id === folderData.id)
        //     //             {
        //     //                 item.children = newAppData;
        //     //             }
        //     //         });
        //     //     }
        //     // }
        //     // else
        //     // {
        //     // let newNewsData = methods.getSortNewsData(currentNodes, newsRealData);
        //     // userStore.mineFollowNewsList = newNewsData;
        //     // userStore.settingsConfig.newsFollowList = newNewsData.map((item) => item.id);
        //     // // }
        //     // data.timer = setTimeout(async () => 
        //     // {
        //     //     try
        //     //     {
        //     //         await userStore.updateUserData({ 'settingsConfig': userStore.settingsConfig });
        //     //     }
        //     //     catch (err:any)
        //     //     {
        //     //         proxy.$message.error('同步失败');
        //     //         console.error('同步设置失败' + err.message);
        //     //     }
        //     // }, 3000);
        // },
        _index (el, node)
        {
            let dom = proxy.$refs[node];
            let domData = Array.from(dom.children);
            return domData.findIndex((i:any) => i.getAttribute('data-key') === el.getAttribute('data-key'));
        }
        // getSortNewsData (currentNodes, newsData)
        // {
        //     return currentNodes.map((i:any, index) =>
        //     {
        //         let item = newsData.find((value) => 
        //         {
        //             return value.id === i.getAttribute('data-key');
        //         });
        //         return item;
        //     });
        // }
    };
    return { ...methods };
}

export default useDrag;
