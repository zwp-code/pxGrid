import { defineStore } from 'pinia';

export const useEditSpaceStore = defineStore('editSpace', {
    state: () => 
    {
        return {
            lang:'',
            themeValue:false
        };
    },
    actions: {
    }
});