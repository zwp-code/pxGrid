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
        // 导出图层
        
    }
});
export default {};
