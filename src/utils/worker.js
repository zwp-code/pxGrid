import { rgbaToHex } from '@/utils/utils';

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
            let index = i / 4;
            transformTable[index][2] = rgbaToHex(rgba);
        }
        return postMessage(transformTable);

    }
});
export default {};
