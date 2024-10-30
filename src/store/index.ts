import cache from '@/utils/cache';
import { defineStore } from 'pinia';

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
            projectList:[] as any
        };
    },
    actions: {
        setMyColorList (value)
        {
            this.myColorList = value;
        },
        saveProject (data)
        {
            let flag = this.projectList.findIndex((v) => v.projectId === data.projectId);
            if (flag >= 0)
            {
                this.projectList[flag] = data;
            }
            else
            {
                this.projectList.push(data);
            }
            cache.project.set(JSON.stringify(this.projectList));
        },
        saveProjectId (id)
        {
            this.currentProjectId = id;
            cache.currentProjectId.set(this.currentProjectId);
        }
    }
});