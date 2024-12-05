import { rgbaToHex, colorDistance, hexToRgba, isArray } from '@/utils/utils';
// import pindouMap from '@/config/pindou';
import cache from '@/utils/cache';
addEventListener('message', (e) => 
{
    const { data } = e;

    if (data.type === 1)
    {
        let dataTable = data.variables;
        for (let i = 0; i < dataTable.length; i++)
        {
            for (let v = 0; v < dataTable[i].layer.length; v++)
            {
                let layerArr = JSON.parse(JSON.stringify(data.originData));
                
                for (let k = 0; k < layerArr.length; k++)
                {
                    let index1 = dataTable[i].layer[v].layerData.findIndex((value) => value[0] === layerArr[k][0] && value[1] === layerArr[k][1]);
                    // let index2 = dataTable[i].layer[v].layerData.findIndex((value) => value[0] === layerArr[k + 1][0] && value[1] === layerArr[k + 1][1]);
                    // let index3 = dataTable[i].layer[v].layerData.findIndex((value) => value[0] === layerArr[k + 2][0] && value[1] === layerArr[k + 2][1]);
                    // let index4 = dataTable[i].layer[v].layerData.findIndex((value) => value[0] === layerArr[k + 3][0] && value[1] === layerArr[k + 3][1]);
                    if (index1 >= 0)
                    {
                        layerArr[k][2] = dataTable[i].layer[v].layerData[index1][2];
                    }
                }
                dataTable[i].layer[v].layerData = layerArr;
            }
        }
        return postMessage(dataTable);
    }
    else if (data.type === 2)
    {
        // 导入图层 图片转换为像素数据
        let dataTable = data.variables;
        let transformTable = data.currentLayerData;
        for (let i = 0; i < dataTable.length; i += 4)
        {
            let rgba = [];
            rgba[0] = dataTable[i];
            rgba[1] = dataTable[i + 1];
            rgba[2] = dataTable[i + 2];
            rgba[3] = dataTable[i + 3];
            let hexStr = rgbaToHex(rgba);
            if (hexStr !== '#00000000') 
            {
                let index = i / 4;
                transformTable[index][2] = hexStr;
            }
        }
        return postMessage(transformTable);

    }
    else if (data.type === 3)
    {
        // 统计当前帧的颜色
        let dataTable = data.currentFrameData;
        let colorStatList = [];
        for (let i = 0; i < dataTable.length; i++)
        {
            if (dataTable[i].isRender)
            {
                for (let j = 0; j < dataTable[i].layerData.length; j++)
                {
                    let color = dataTable[i].layerData[j][2];
                    if (color === '#00000000') continue;
                    if (!colorStatList.includes(color))
                    {
                        colorStatList.push(color);
                    }
                }
            }
            
        }
        return postMessage(colorStatList);
    }
    else if (data.type === 4)
    {
        // 导入项目
        let dataTable = data.variables;
        let canvasWidth = data.canvasWidth;
        for (let i = 0; i < dataTable.length; i++)
        {
            for (let j = 0; j < dataTable[i].layer.length; j++)
            {
                for (let k = 0; k < dataTable[i].layer[j].layerData.length; k++)
                {
                    if (isArray(dataTable[i].layer[j].layerData[k]) && dataTable[i].layer[j].layerData[k].length > 1)
                    {
                        if (dataTable[i].layer[j].layerData[k][2] === '#')
                        {
                            dataTable[i].layer[j].layerData[k][2] = '#00000000';
                        }
                    }
                    else
                    {
                        if (isArray(dataTable[i].layer[j].layerData[k]))
                        {
                            let col = k % canvasWidth;
                            let row = Math.floor(k / canvasWidth);
                            let color = dataTable[i].layer[j].layerData[k][0];
                            dataTable[i].layer[j].layerData[k][0] = col;
                            dataTable[i].layer[j].layerData[k][1] = row;
                            dataTable[i].layer[j].layerData[k][2] = color === '' || color === '#' ? '#00000000' : color;
                        }
                        else
                        {
                            let col = k % canvasWidth;
                            let row = Math.floor(k / canvasWidth);
                            let color = dataTable[i].layer[j].layerData[k];
                            dataTable[i].layer[j].layerData[k] = [];
                            dataTable[i].layer[j].layerData[k][0] = col;
                            dataTable[i].layer[j].layerData[k][1] = row;
                            dataTable[i].layer[j].layerData[k][2] = color == 0 ? '#00000000' : color;
                        }

                    }
                }
            }
        }
        return postMessage(dataTable);
    }
    else if (data.type === 5)
    {
        // 图层透明度转换
        let dataTable = data.variables;
        let targetAlpha = data.targetAlpha;
        for (let i = 0; i < dataTable.length; i++)
        {
            if (dataTable[i][2] === '#00000000') continue;
            let rgba = hexToRgba(dataTable[i][2]);
            let r = rgba[0];
            let g = rgba[1];
            let b = rgba[2];
            let a = (targetAlpha / 100);
            let hexStr = rgbaToHex([r, g, b, a]);
            dataTable[i][2] = hexStr;
        }
        
        return postMessage(dataTable);
    }
    else if (data.type === 6)
    {
        // 处理拼豆的转换
        let variables = data.variables;
        let currentPindouColorList = Array.from(data.currentPindouBrandColorList);
        // if (!currentPindouColorList) 
        // {
        //     let customMap = JSON.parse(cache.customPindou.get());
        //     currentPindouColorList = customMap[data.currentPindouBrand];
        // }
        let similarColorCache = new Map();
        let colorStatList = new Map();
        const findSimilarColor = (r, g, b, a) => 
        {
            let hex = rgbaToHex([r, g, b, a]);
            if (similarColorCache.has(hex)) 
            {
                return similarColorCache.get(hex);
            }
            let minDistance = 584970;// 584970最小色差值（初始值为纯黑和纯白的色差，使用colorDistance(0,0,0,255,255,255)计算而得）
            let minColor = null;// 最小值对应的颜色组
            for (let object of currentPindouColorList) 
            {
                let rgba = hexToRgba(object.color);
                // console.log(object.color);
                let distance = colorDistance(rgba[0], rgba[1], rgba[2], r, g, b);
                if (distance === 0) 
                { // 颜色相等直接返回
                    similarColorCache.set(hex, object); // 写入缓存
                    return object;
                }
                if (distance < minDistance) 
                {
                    minDistance = distance;
                    minColor = object;
                }
            }
            return minColor;
        };
        for (let i = 0; i < variables.length; i++)
        {
            // 每个图层的像素都要进行转换,隐藏的不更改
            if (!variables[i].isRender) continue;
            for (let j = 0; j < variables[i].layerData.length; j++)
            {
                if (variables[i].layerData[j][2] === '#00000000') continue;
                let rgba = hexToRgba(variables[i].layerData[j][2]);
                let replaceColorObj = findSimilarColor(rgba[0], rgba[1], rgba[2], rgba[3]);
                if (replaceColorObj)
                {
                    variables[i].layerData[j][2] = '#' + String(replaceColorObj.color).toLowerCase() + 'ff';
                    variables[i].layerData[j][3] = replaceColorObj.name;
                    if (colorStatList.has(replaceColorObj.name))
                    {
                        let arr = colorStatList.get(replaceColorObj.name);
                        let count = arr[1] + 1;
                        colorStatList.set(replaceColorObj.name, [variables[i].layerData[j][2], count]);
                    }
                    else
                    {
                        colorStatList.set(replaceColorObj.name, [variables[i].layerData[j][2], 1]);
                    }
                }
            }
        }
        // 颜色统计
        return postMessage({ variables, colorStatList });

    }
});
export default {};
