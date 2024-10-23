
import { hexToRgba, rgbaToHex } from '@/utils/utils';
import { getCurrentInstance, reactive, toRefs } from 'vue';
// 处理全屏
function useFilter () 
{
    const { proxy }:any = getCurrentInstance();
    const data = reactive({

    });
    
    const methods = {
        handleFilter (value, layerData, callback)
        {
            if (value === 1)
            {
                // 黑白
                methods.transformBlackAndWhite(layerData, callback);
                
            }
            else if (value === 2)
            {
                methods.transformReverse(layerData, callback);
            }
            else if (value === 3)
            {
                methods.transformBGRA(layerData, callback);
            }
        },
        transformBlackAndWhite (layerData, callback)
        {
            for (let i = 0; i < layerData.length; i++)
            {
                if (layerData[i][2] === '#00000000') continue;
                let rgba = hexToRgba(layerData[i][2]);
                let avg = (rgba[0] + rgba[1] + rgba[2]) / 3;
                rgba[0] = avg;
                rgba[1] = avg;
                rgba[2] = avg;
                let hexStr = rgbaToHex(rgba);
                layerData[i][2] = hexStr;
            }
            callback();
        },
        transformReverse (layerData, callback)
        {
            for (let i = 0; i < layerData.length; i++)
            {
                if (layerData[i][2] === '#00000000') continue;
                let rgba = hexToRgba(layerData[i][2]);
                rgba[0] = 255 - rgba[0];
                rgba[1] = 255 - rgba[1];
                rgba[2] = 255 - rgba[2];
                let hexStr = rgbaToHex(rgba);
                layerData[i][2] = hexStr;
            }
            callback();
        },
        transformBGRA (layerData, callback)
        {
            for (let i = 0; i < layerData.length; i++)
            {
                if (layerData[i][2] === '#00000000') continue;
                let rgba = hexToRgba(layerData[i][2]);
                console.log(rgba);
                let r = rgba[0];
                let b = rgba[2];
                rgba[0] = b;
                rgba[2] = r;

                console.log(rgba);
                let hexStr = rgbaToHex(rgba);
                layerData[i][2] = hexStr;
            }
            callback();
        }
    };
    return { ...methods, ...toRefs(data) };
}

export default useFilter;