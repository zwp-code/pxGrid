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
                        this.projectList[index].data = data;
                        resolve(res);
                        this.sortProjectList(this.sort);
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
                        this.projectList.push({ id:data.projectId, data });
                        resolve(res);
                        this.sortProjectList(this.sort);
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
                    this.sortProjectList(this.sort);
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
                let dif = formatTimeStamp(projectList[j].data['updateAt']) - formatTimeStamp(projectList[j].data['createAt']);
                if (dif === 0)
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
            return projectList;
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
        sortProjectList (key)
        {
            if (this.projectList.length <= 1) return;
            for (let j = 0; j < this.projectList.length; j++)
            {
                if (j + 1 >= this.projectList.length) break;
                if (this.projectList[j].data['isTop'] === this.projectList[j + 1].data['isTop'])
                {
                    if (formatTimeStamp(this.projectList[j].data[key]) < formatTimeStamp(this.projectList[j + 1].data[key]))
                    {
                        let temp = this.projectList[j];
                        this.projectList[j] = this.projectList[j + 1];
                        this.projectList[j + 1] = temp;
                    }
                }
                else if (this.projectList[j].data['isTop'] < this.projectList[j + 1].data['isTop'])
                {
                    let temp = this.projectList[j];
                    this.projectList[j] = this.projectList[j + 1];
                    this.projectList[j + 1] = temp;
                }
            }
        }
    }
});