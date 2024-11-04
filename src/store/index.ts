import db from '@/utils/db';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';
import message from '@/utils/message';
import { formatTimeStamp } from '@/utils/utils';
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
            sort:'updateAt'
        };
    },
    actions: {
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
                        let projectList = JSON.parse(JSON.stringify(this.projectList));
                        projectList[index].data = data;
                        this.projectList = this.sortProjectList(this.sort, projectList);
                        resolve(res);
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
                    // console.log(JSON.parse(JSON.stringify(this.projectList)));
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