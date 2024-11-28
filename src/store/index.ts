import db from '@/utils/db';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';
import message from '@/utils/message';
import { formatTimeStamp, isArray } from '@/utils/utils';
import pindouMap from '@/config/pindou';
export const useEditSpaceStore = defineStore('editSpace', {
    state: () => 
    {
        return {
            currentProjectId:'',
            lang:'',
            themeValue:false,
            myColorList:[] as any,
            frameCopyData:null as any,
            colorModules:[] as any,
            isFullWork:false,
            projectList:[] as any,
            sort:'updateAt',
            pindouMaps:{} as any,
            clientDownloadLink:'null'
        };
    },
    getters: {
        getProjectListData:(state) =>
        {
            return () => 
            {
                return state.projectList;
            };
        }
    },
    actions: {
        batchSavePindouData (data, isUpdate = false)
        {
            const promises = [] as any;
            data.forEach((value, key) => 
            {
                // this.pindouMaps[key] = value;
                if (isUpdate)
                {
                    promises.push(this.editPindouData({ id:key, value }));
                }
                else
                {
                    promises.push(this.savePindouData({ id:key, value }));
                }
            });
            Promise.all(promises)
                .then(() => 
                {
                    // console.log('All promises resolved');
                    let arr = Object.keys(this.pindouMaps).map((key) => 
                    {
                        return {
                            value:key,
                            label:this.pindouMaps[key].label
                        };
                    });
                    cache.pindou.set(JSON.stringify(arr));
                    
                })
                .catch((error) => 
                {
                    console.error('Error:', error);
                });
        },
        getPindouData ()
        {
            db.findAllDB('pindou').then((res:any) => 
            {
                if (res.length)
                {
                    for (let i = 0; i < res.length; i++)
                    {
                        this.pindouMaps[res[i].id] = {
                            data:res[i].data.data || res[i].data,
                            label:res[i].data.label || res[i].id
                        };
                    }
                    let diffKeys = Array.from(pindouMap.keys()).filter((item) => 
                    {
                        return !this.pindouMaps[item];
                    });
                    if (diffKeys.length)
                    {
                        let maps = new Map();
                        diffKeys.forEach((key) => 
                        {
                            let value = pindouMap.get(key);
                            maps.set(key, value);
                        });
                        this.batchSavePindouData(maps, false);
                    }
                    if (!cache.forceUpdate.get())
                    {
                        // 强制更新数据
                        this.batchSavePindouData(pindouMap, true);
                        cache.forceUpdate.set('1');
                    }
                    let arr = Object.keys(this.pindouMaps).map((key) => 
                    {
                        return {
                            value:key,
                            label:this.pindouMaps[key].label
                        };
                    });
                    cache.pindou.set(JSON.stringify(arr));
                    
                }
                else
                {
                    this.batchSavePindouData(pindouMap, false);
                }
            }).catch((err) => 
            {
                console.error(err);
                // message.error('获取拼豆列表异常 - ' + err);
            });
        },
        savePindouData (data)
        {
            // 新增
            return new Promise((resolve, reject) => 
            {
                let obj = {} as any;
                if (isArray(data.value)) 
                {
                    obj.data = data.value;
                    obj.label = data.id;
                }
                else
                {
                    obj = data.value;
                }
                db.saveDB(data.id, obj, 'pindou').then((res) => 
                {
                    if (isArray(data.value))
                    {
                        this.pindouMaps[data.id] = {
                            data:data.value,
                            label:data.id
                        };
                    }
                    else
                    {
                        this.pindouMaps[data.id] = data.value;
                    }
                    resolve(res);
                }).catch((err) => 
                {
                    message.error('新增失败 - ' + err);
                    reject(err);
                });
            });
        },
        editPindouData (data)
        {
            // 编辑
            return new Promise((resolve, reject) => 
            {
                let obj = {} as any;
                if (isArray(data.value)) 
                {
                    obj.data = data.value;
                    obj.label = data.id;
                }
                else
                {
                    obj = data.value;
                }
                db.updateDB({ id:data.id, data:obj }, 'pindou').then((res) => 
                {
                    if (isArray(data.value))
                    {
                        this.pindouMaps[data.id] = {
                            data:data.value,
                            label:data.id
                        };
                    }
                    else
                    {
                        this.pindouMaps[data.id] = data.value;
                    }
                    resolve(res);
                }).catch((err) => 
                {
                    message.error('保存失败 - ' + err);
                    reject(err);
                });
            });
        },
        deletePindouById (id)
        {
            return new Promise((resolve, reject) => 
            {
                if (this.pindouMaps[id])
                {
                    // 更新数据
                    db.clearDB(id, 'pindou').then((res) => 
                    {
                        resolve(res);
                        delete this.pindouMaps[id];
                    }).catch((err) => 
                    {
                        message.error('删除失败 - ' + err);
                        reject(err);
                    });
                }
            });
        },
        setMyColorList (value)
        {
            this.myColorList = value;
        },
        saveProject (data)
        {
            return new Promise((resolve, reject) => 
            {
                let index = this.projectList.findIndex((v) => v.id === data.projectId);
                if (index >= 0)
                {
                    // 更新数据
                    db.updateDB({ id:data.projectId, data }).then((res) => 
                    {
                        // this.projectList[index].data = data;
                        let i = this.projectList.findIndex((v) => v.id === data.projectId);
                        let projectList = JSON.parse(JSON.stringify(this.projectList));
                        projectList[i].data = data;
                        this.projectList = this.sortProjectList(this.sort, projectList);
                        resolve(res);
                        console.log('更新数据了');
                        
                        // this.updateProjectTip();
                    }).catch((err) => 
                    {
                        console.log(err);
                        reject(err);
                    });
                }
                else
                {
                    db.saveDB(data.projectId, data).then((res) => 
                    {
                        // this.projectList.push({ id:data.projectId, data });
                        let projectList = JSON.parse(JSON.stringify(this.projectList));
                        projectList.push({ id:data.projectId, data });
                        this.projectList = this.sortProjectList(this.sort, projectList);
                        resolve(res);
                        console.log('新增数据了');
                        // this.updateProjectTip();
                    }).catch((err) => 
                    {
                        reject(err);
                    });
                }
            });
           
            // cache.project.set(JSON.stringify(this.projectList));
        },
        
        getProjectById (projectId)
        {
            let value = this.projectList.find((v) => v.id === projectId);
            return value && value.data;
        },
        saveProjectId (id)
        {
            this.currentProjectId = id;
            cache.currentProjectId.set(this.currentProjectId);
        },
        getProjectList ()
        {
            db.findAllDB().then((res:any) => 
            {
                if (res.length)
                {
                    // this.projectList = res;
                    this.projectList = this.updateProjectTip(res);
                    console.log('获取数据了');
                    // this.sortProjectList(this.sort);
                }
            }).catch((err) => 
            {
                console.error(err);
                message.error('获取项目列表异常 - ' + err);
            });
        },
        updateProjectTip (projectList)
        {
            for (let j = 0; j < projectList.length; j++)
            {
                let dif = new Date().getTime() - formatTimeStamp(projectList[j].data['updateAt']);
                if (formatTimeStamp(projectList[j].data['updateAt']) - formatTimeStamp(projectList[j].data['createAt']) === 0)
                {
                    projectList[j].data['tip'] = '新项目';
                }
                else if (dif > 0 && dif < 86400000 / 2)
                {
                    projectList[j].data['tip'] = '最近编辑';
                }
                else
                {
                    projectList[j].data['tip'] = '';
                }
            }
            return this.sortProjectList(this.sort, projectList);
        },
        deleteProjectById (projectId)
        {
            return new Promise((resolve, reject) => 
            {
                let index = this.projectList.findIndex((v) => v.id === projectId);
                if (index >= 0)
                {
                    this.projectList.splice(index, 1);
                    // 更新数据
                    db.clearDB(projectId).then((res) => 
                    {
                        resolve(res);
                    }).catch((err) => 
                    {
                        reject(err);
                    });
                }
            });
        },
        getCurrentProjectNameById ()
        {
            return this.getProjectById(this.currentProjectId).projectName;
        },
        sortProjectList (key, projectList)
        {
            // if (projectList.length <= 1) return projectList;
            for (let i = 0; i < projectList.length - 1; i++)
            {
                for (let j = 0; j < projectList.length - 1 - i; j++)
                {
                    if (projectList[j].data['isTop'] === projectList[j + 1].data['isTop'])
                    {
                        if (formatTimeStamp(projectList[j].data[key]) < formatTimeStamp(projectList[j + 1].data[key]))
                        {
                            let temp = projectList[j];
                            projectList[j] = projectList[j + 1];
                            projectList[j + 1] = temp;
                        }
                    }
                    else if (projectList[j].data['isTop'] < projectList[j + 1].data['isTop'])
                    {
                        let temp = projectList[j];
                        projectList[j] = projectList[j + 1];
                        projectList[j + 1] = temp;
                    }
                }
            }
            return projectList;
            // console.log(this.projectList);
            
        }
    }
});