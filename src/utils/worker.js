import { rgbaToHex, colorDistance, hexToRgba } from '@/utils/utils';
import pindouMap from '@/config/pindou';
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
        return postMessage(colorStatList);
    }
    else if (data.type === 4)
    {
        // 导入项目
        let dataTable = data.variables;
        for (let i = 0; i < dataTable.length; i++)
        {
            for (let j = 0; j < dataTable[i].layer.length; j++)
            {
                for (let k = 0; k < dataTable[i].layer[j].layerData.length; k++)
                {
                    if (dataTable[i].layer[j].layerData[k][2] === '#')
                    {
                        dataTable[i].layer[j].layerData[k][2] = '#00000000';
                    }
                }
            }
        }
        return postMessage(dataTable);
    }
    else if (data.type === 5)
    {
        // 计算拖拽图形的中心位置真实坐标
        let dataTable = data.variables;
        let scale = data.scale;
        let canvasBeginPos = data.canvasBeginPos;
        let pos = {
            centerX:0,
            centerY:0
        };
        
        let maxX = dataTable[0][0];
        let minX = dataTable[0][0];
        let maxY = dataTable[0][1];
        let minY = dataTable[0][1];
        for (let i = 0; i < dataTable.length; i++)
        {
            const x = dataTable[i][0];
            const y = dataTable[i][1];

            // 更新最小和最大的x值
            if (x < minX) 
            {
                minX = x;
            }
            if (x > maxX) 
            {
                maxX = x;
            }

            // 更新最小和最大的y值
            if (y < minY) 
            {
                minY = y;
            }
            if (y > maxY) 
            {
                maxY = y;
            }
        }
        console.log(maxX, maxY, minX, minY);
        maxX = (maxX * scale) + canvasBeginPos.x;
        minX = (minX * scale) + canvasBeginPos.x;
        maxY = (maxY * scale) + canvasBeginPos.y;
        minY = (minY * scale) + canvasBeginPos.y;
        pos.centerX = (maxX - minX) / 2 + minX;
        pos.centerY = (maxY - minY) / 2 + minY;
        return postMessage(pos);
    }
    else if (data.type === 6)
    {
        // 处理拼豆的转换
        let variables = data.variables;
        let currentPindouColorList = pindouMap.get(data.currentPindouBrand);
        let similarColorCache = new Map();
        let colorStatList = new Map();
        const findSimilarColor = (r, g, b, a) => 
        {
            let hex = rgbaToHex([r, g, b, a]);
            if (similarColorCache.has(hex)) 
            {
                return similarColorCache.get(hex);
            }
            let minDistance = 584970;// 最小色差值（初始值为纯黑和纯白的色差，使用colorDistance(0,0,0,255,255,255)计算而得）
            let minColor = null;// 最小值对应的颜色组
            for (let object of currentPindouColorList) 
            {
                let rgba = hexToRgba(object.color);
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
            // 每个图层的像素都要进行转换
            for (let j = 0; j < variables[i].layerData.length; j++)
            {
                if (variables[i].layerData[j][2] === '#00000000') continue;
                let rgba = hexToRgba(variables[i].layerData[j][2]);
                let replaceColorObj = findSimilarColor(rgba[0], rgba[1], rgba[2], rgba[3]);
                variables[i].layerData[j][2] = '#' + replaceColorObj.color + 'ff';
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
        // 颜色统计
        return postMessage({ variables, colorStatList });

    }
});
export default {};
