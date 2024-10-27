
import { hexToRgba, rgbaToHex } from '@/utils/utils';
import { getCurrentInstance, reactive, toRefs } from 'vue';
// 处理全屏
function useFilter () 
{
    const { proxy }:any = getCurrentInstance();
    const data = reactive({
        canvasWidth:0,
        canvasHeight:0
    });
    
    const methods = {
        handleFilter (value, layerData, selectData, width, height, callback)
        {
            data.canvasHeight = height;
            data.canvasWidth = width;
            if (value === 1)
            {
                // 黑白
                methods.transformBlackAndWhite(layerData, selectData.selectList, callback);
                
            }
            else if (value === 2)
            {
                methods.transformReverse(layerData, selectData.selectList, callback);
            }
            else if (value === 3)
            {
                methods.transformBGRA(layerData, selectData.selectList, callback);
            }
        },
        transformBlackAndWhite (layerData, selectList, callback)
        {
            let currentList = selectList.length > 0 ? selectList : layerData;
            for (let i = 0; i < currentList.length; i++)
            {
                if (currentList[i][2] === '#00000000') continue;
                let rgba = hexToRgba(currentList[i][2]);
                let avg = (rgba[0] + rgba[1] + rgba[2]) / 3;
                rgba[0] = avg;
                rgba[1] = avg;
                rgba[2] = avg;
                let hexStr = rgbaToHex(rgba);
                currentList[i][2] = hexStr;
                if (selectList.length)
                {
                    let index = currentList[i][0] + currentList[i][1] * data.canvasHeight;
                    layerData[index][2] = hexStr;
                }
            }
            callback();
        },
        transformReverse (layerData, selectList,  callback)
        {
            let currentList = selectList.length > 0 ? selectList : layerData;
            for (let i = 0; i < currentList.length; i++)
            {
                if (currentList[i][2] === '#00000000') continue;
                let rgba = hexToRgba(currentList[i][2]);
                rgba[0] = 255 - rgba[0];
                rgba[1] = 255 - rgba[1];
                rgba[2] = 255 - rgba[2];
                let hexStr = rgbaToHex(rgba);
                currentList[i][2] = hexStr;
                if (selectList.length)
                {
                    let index = currentList[i][0] + currentList[i][1] * data.canvasHeight;
                    layerData[index][2] = hexStr;
                }
            }
            callback();
        },
        transformBGRA (layerData, selectList, callback)
        {
            let currentList = selectList.length > 0 ? selectList : layerData;
            for (let i = 0; i < currentList.length; i++)
            {
                if (currentList[i][2] === '#00000000') continue;
                let rgba = hexToRgba(currentList[i][2]);
                console.log(rgba);
                let r = rgba[0];
                let b = rgba[2];
                rgba[0] = b;
                rgba[2] = r;

                console.log(rgba);
                let hexStr = rgbaToHex(rgba);
                currentList[i][2] = hexStr;
                if (selectList.length)
                {
                    let index = currentList[i][0] + currentList[i][1] * data.canvasHeight;
                    layerData[index][2] = hexStr;
                }
            }
            callback();
        }
    };
    return { ...methods };
}

export default useFilter;