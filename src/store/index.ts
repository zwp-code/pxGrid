import { defineStore } from 'pinia';

export const useEditSpaceStore = defineStore('editSpace', {
    state: () => 
    {
        return {
            lang:'',
            themeValue:false,
            myColorList:[] as any,
            frameCopyData:null as any
        };
    },
    actions: {
        setMyColorList (value)
        {
            this.myColorList = value;
        }
    }
});