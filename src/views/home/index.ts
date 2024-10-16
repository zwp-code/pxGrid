import { reactive, toRefs, onMounted, defineComponent, getCurrentInstance, computed } from 'vue';
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import en from 'element-plus/dist/locale/en.mjs';
import { copyText, extractRgbaValues, getOrderedRectangleCoordinates, hexToRgba, isHexColor, rgbaToHex, unique2DArray } from '@/utils/utils';
export default defineComponent({
    name:'home',
    components: {
        ElConfigProvider
    },
    props:{},
    emits:[],
    setup (props, context)
    {
        const { proxy }:any = getCurrentInstance();
        const language = (navigator.language || 'en').toLocaleLowerCase();
        let data = reactive({
            locale:en,
            bgCanvas:null as any,
            canvas:null as any,
            ctx1:null as any,
            ctx2:null as any,
            isDrawing:false,
            isErasering:false,
            isDrawShape:false,
            shapeFillColor:'#000000ff',
            brushColor:'#000000ff',
            brushSize:10,
            canvasWidth:12,
            canvasHeight:12,
            scale:1,
            isCheckedRatio:true,
            widthHeightRatio:1,
            drawAreaList:[] as any,
            currentTool:0,

            drawRecord:[] as any,
            drawShapeList:[] as any,
            gridInfo:'[]',
            myColorList:[
                {
                    id:1,
                    groupName:'常用颜色',
                    list:[
                        '#000000', '#ffffff'
                    ]
                }
            ],
            myColor:'#fff',
            myColorGroup:1,
            isAddGroup:false,
            myGroupName:'',
            addMyColorVisible:false,
            editMyColorMask:null as any,
            currentDrawShape:'rect',
            currentDrawTransform:'hReverse',

            historyRecord:[] as any,
            historyMaxLength:10,
            
            lastX:0,
            lastY:0,
            AnimationFrameId_1:null as any
        });

        const computedApi = {
            requireShapeImg: computed(() => 
            {
                return new URL(`../../assets/${data.currentDrawShape}.png`, import.meta.url).href;
            }),
            requireTransformImg: computed(() => 
            {
                return new URL(`../../assets/${data.currentDrawTransform}.png`, import.meta.url).href;
            })
        };
        
        let methods = {
            addColorGroup ()
            {
                if (data.myGroupName !== '')
                {
                    data.myColorList.push({
                        id:data.myColorList.length + 1,
                        groupName:data.myGroupName,
                        list:[]
                    });
                }
            },
            handleAddColor ()
            {
                data.myColorList.forEach((item) => 
                {
                    if (data.editMyColorMask)
                    {
                        if (item.id === data.editMyColorMask.id && data.editMyColorMask.id === data.myColorGroup)
                        {
                            // let index = item.list.findIndex((item) => item === data.editMyColorMask.value)
                            item.list[data.editMyColorMask.index] = data.myColor;
                        }
                        else if (item.id === data.editMyColorMask.id && data.editMyColorMask.id !== data.myColorGroup)
                        {
                            // let index = item.list.findIndex((item) => item === data.editMyColorMask.value)
                            item.list.splice(data.editMyColorMask.index, 1);
                            for (let i = 0; i < data.myColorList.length; i++)
                            {
                                if (data.myColorGroup === data.myColorList[i].id)
                                {
                                    data.myColorList[i].list.push(data.myColor);
                                    break;
                                }
                            }
                        }
                    }
                    else
                    {
                        if (item.id === Number(data.myColorGroup))
                        {
                            item.list.push(data.myColor);
                        }
                    }
                    
                });
                proxy.$utils.cache.mycolor.set(JSON.stringify(data.myColorList));
                data.addMyColorVisible = false;
            },
            handleEditMyColor (value, id, index)
            {
                data.addMyColorVisible = true;
                data.editMyColorMask = {
                    id,
                    value,
                    index
                };
                data.myColor = value;
            },
            handleDeleteMyColor (value, id)
            {
                data.myColorList.forEach((item) => 
                {
                    if (item.id === id)
                    {
                        item.list.splice(value, 1);
                    }
                });
                proxy.$utils.cache.mycolor.set(JSON.stringify(data.myColorList));
            },
            changeLanguage ()
            {
                if (localStorage.getItem('db-lang'))
                {
                    data.locale = localStorage.getItem('db-lang') === 'zh' ? zhCn : en;
                }
                else if (language.split('-')[0])
                {
                    data.locale = language.split('-')[0] === 'zh' ? zhCn : en;
                }
                else 
                {
                    data.locale = en;
                }
                // editSpaceStore.lang = localStorage.getItem('db-lang') || language.split('-')[0] || 'en';
                // localStorage.setItem('db-lang', editSpaceStore.lang);
                // console.log(editSpaceStore.lang);
                
            },
            handleChangeTool (index)
            {
                if (index === 6)
                {
                    data.ctx1.clearRect(0, 0, data.canvas.width, data.canvas.height);
                    data.drawRecord = [];
                    return;
                }
                data.currentTool = index;
            },
            handleChangeCanvasSize (e, key)
            {
                if (e < 6 || e > 128) 
                {
                    data[key] = e < 6 ? 6 : e > 128 ? 128 : data[key];
                    proxy.$message.warning('不能小于6或大于128');
                }
                if (data.isCheckedRatio)
                {
                    // 如果选择了保持横纵比
                    if (key === 'canvasWidth')
                    {
                        data.canvasHeight = parseInt(data[key] / data.widthHeightRatio);
                    }
                    else
                    {
                        data.canvasWidth = parseInt(data[key] / data.widthHeightRatio);
                    }
                }
                methods.computeScale();
                methods.drawPixelArea();
                data.ctx1.clearRect(0, 0, data.canvas.width, data.canvas.height);
                methods.initCanvasRecord();
                methods.reDraw();
            },
            handleChangeRatio (e)
            {
                if (e)
                {
                    data.widthHeightRatio = data.canvasWidth / data.canvasHeight;
                    // else if (data.canvasWidth < data.canvasHeight) data.widthHeightRatio = data.canvasHeight / data.canvasWidth | 0;
                    // else data.widthHeightRatio = 1;
                    console.log(data.widthHeightRatio);
                    
                }
            },
            handleChangeColor (value)
            {
                data.brushColor = value;
            },
            initCanvasRecord ()
            {
                let arr = [] as any;
                for (let i = 0; i < data.canvasHeight; i++) 
                {
                    for (let j = 0; j < data.canvasWidth; j++) 
                    {
                        arr.push([j, i, '#00000000']);
                    }
                }
                if (data.drawRecord.length)
                {
                    for (let i = 0; i < arr.length; i++)
                    {
                        for (let j = 0; j < data.drawRecord.length; j++)
                        {
                            if (arr[i][0] === data.drawRecord[j][0] && arr[i][1] === data.drawRecord[j][1]) 
                            {
                                arr[i][2] = data.drawRecord[j][2];
                                break;
                            }
                        }
                    }
                    data.drawRecord = arr;
                }
                else
                {
                    data.drawRecord = arr;
                }
            },
            drawPixelArea ()
            {
                // 绘制像素透明格子
                data.drawAreaList = [];
                data.ctx2.clearRect(0, 0, data.bgCanvas.width, data.bgCanvas.height);
                data.ctx2.globalAlpha = 0.5;
                for (let i = 0; i < data.canvasWidth; i++) 
                {
                    for (let j = 0; j < data.canvasHeight; j++) 
                    {
                        if ((i + j) % 2 === 0) 
                        {
                        // 深色格子
                            data.ctx2.fillStyle = 'rgba(0, 0, 0, 0.5)';
                        } 
                        else 
                        {
                        // 浅色格子
                            data.ctx2.fillStyle = 'rgba(100, 100, 100, 0.5)';
                        }
                        let px = data.scale;
                        let py = data.scale;
                        let originX = (i * px + data.bgCanvas.width / 2) - data.canvasWidth * px / 2;
                        let originY = (j * py + data.bgCanvas.height / 2) - data.canvasHeight * py / 2;
                        data.ctx2.fillRect(originX, originY, px, py);
                        data.drawAreaList.push([originX, originY]);

                        // data.drawRecord.push([i, j, '#00000000']);
                        
                    }
                }
                // console.log(data.drawRecord);
                // if (data.drawAreaList.length >= data.canvasWidth * data.canvasHeight) cancelAnimationFrame(data.AnimationFrameId_1);
            },
            drawLoop () 
            {
                methods.drawPixelArea();
                data.AnimationFrameId_1 = requestAnimationFrame(methods.drawLoop);
            },
            drawShape (shape)
            {
                data.currentDrawShape = shape;
            },
            drawTransform (transform)
            {
                data.currentDrawTransform = transform;
                let realCoords = [] as any;
                let centerX = data.canvas.width / 2;
                let centerY = data.canvas.height / 2;
                for (let i = 0; i < data.drawRecord.length; i++)
                {
                    if (data.drawRecord[i][0] > data.canvasWidth || data.drawRecord[i][1] > data.canvasHeight) return;
                    let gridX = (data.drawRecord[i][0] * data.scale + data.canvas.width / 2) - data.canvasWidth * data.scale / 2;
                    let gridY = (data.drawRecord[i][1] * data.scale + data.canvas.height / 2) - data.canvasHeight * data.scale / 2;
                    realCoords.push([gridX, gridY, data.drawRecord[i][2]]);
                }
                if (transform === 'hReverse')
                {
                    for (let i = 0; i < data.drawRecord.length; i++)
                    {
                        let newCol = (data.canvasWidth - 1) - data.drawRecord[i][0];
                        data.drawRecord[i][0] = newCol;
                    }
                }
                else if (transform === 'vReverse')
                {
                    for (let i = 0; i < data.drawRecord.length; i++)
                    {
                        let newRow = (data.canvasHeight - 1) - data.drawRecord[i][1];
                        data.drawRecord[i][1] = newRow;
                    }
                }
                else if (transform === 'ssz')
                {
                    for (let i = 0; i < realCoords.length; i++)
                    {
                        let relativeX = realCoords[i][0] - centerX;
                        let relativeY = realCoords[i][1] - centerY;
                        let rotateX = -relativeY;
                        let rotateY = relativeX;
                        let endX = rotateX + centerX - data.scale;
                        let endY = rotateY + centerY;
                        console.log(relativeX, relativeY, endX, endY);
                        
                        const row = Math.floor((endY - data.drawAreaList[0][1]) / data.scale);
                        const col = Math.floor((endX - data.drawAreaList[0][0]) / data.scale);
                        data.drawRecord[i][0] = col;
                        data.drawRecord[i][1] = row;
                    }
                }
                else if (transform === 'nsz')
                {
                    for (let i = 0; i < realCoords.length; i++)
                    {
                        let relativeX = realCoords[i][0] - centerX;
                        let relativeY = realCoords[i][1] - centerY;
                        let rotateX = relativeY;
                        let rotateY = -relativeX;
                        let endX = rotateX + centerX;
                        let endY = rotateY + centerY - data.scale;
                        console.log(relativeX, relativeY, endX, endY);
                        
                        const row = Math.floor((endY - data.drawAreaList[0][1]) / data.scale);
                        const col = Math.floor((endX - data.drawAreaList[0][0]) / data.scale);
                        data.drawRecord[i][0] = col;
                        data.drawRecord[i][1] = row;
                    }
                }
                data.ctx1.clearRect(0, 0, data.canvas.width, data.canvas.height);
                methods.reDraw();
            },
            startDrawing () 
            {
                data.canvas.addEventListener('mousedown', methods.start);
                data.canvas.addEventListener('mousemove', methods.draw);
                data.canvas.addEventListener('mouseup', methods.stop);
                data.canvas.addEventListener('mouseout', methods.leave);
                data.canvas.addEventListener('wheel', function (event) 
                {
                    event.preventDefault();
                    console.log(event);
                    const delta = event.deltaY > 0 ? -0.5 : 0.5;
                    data.scale += delta;
                    data.scale = Math.max(1, data.scale);
                    console.log(data.scale);
                    data.brushSize = data.scale;
                    data.ctx1.clearRect(0, 0, data.canvas.width, data.canvas.height);
                    methods.drawPixelArea();
                    methods.reDraw();
                });
            },

            start (event) 
            {
                // 判断是否在可绘画区域
                if (event.offsetX >= data.drawAreaList[0][0] && event.offsetX < data.drawAreaList[data.drawAreaList.length - 1][0] + data.scale && 
                    event.offsetY >= data.drawAreaList[0][1] && event.offsetY < data.drawAreaList[data.drawAreaList.length - 1][1] + data.scale)
                {
                    methods.stop();
                    const row = Math.floor((event.offsetY - data.drawAreaList[0][1]) / data.scale);
                    const col = Math.floor((event.offsetX - data.drawAreaList[0][0]) / data.scale);
                    if (data.currentTool === 0) 
                    {
                        data.isDrawing = true;
                        methods.draw(event);
                        // const row = Math.floor((event.offsetY - data.drawAreaList[0][1]) / data.scale);
                        // const col = Math.floor((event.offsetX - data.drawAreaList[0][0]) / data.scale);
                        // let gridX = (col * data.scale + data.canvas.width / 2) - data.canvasWidth * data.scale / 2;
                        // let gridY = (row * data.scale + data.canvas.height / 2) - data.canvasHeight * data.scale / 2;
                        // data.lastX = gridX + data.scale / 2;
                        // data.lastY = gridY + data.scale / 2;
                        // data.ctx1.beginPath();
                        // data.ctx1.moveTo(gridX + data.scale / 2, gridY + data.scale / 2);
                    }
                    else if (data.currentTool === 1) 
                    {
                        data.isErasering = true;
                        methods.removeDrawRecord([col, row]);
                    }
                    else if (data.currentTool === 2)
                    {
                        if (!data.drawRecord.length) return;
                        // const row = Math.floor((event.offsetY - data.drawAreaList[0][1]) / data.scale);
                        // const col = Math.floor((event.offsetX - data.drawAreaList[0][0]) / data.scale);
                        console.log(row, col);
                        for (let i = 0; i < data.drawRecord.length; i++)
                        {
                            if (data.drawRecord[i][0] === col && data.drawRecord[i][1] === row)
                            {
                                data.brushColor = data.drawRecord[i][2];
                                break;
                            }
                        }
                        
                    }
                    else if (data.currentTool === 3)
                    {
                        // 绘制形状
                        data.isDrawShape = true;
                        // const row = Math.floor((event.offsetY - data.drawAreaList[0][1]) / data.scale);
                        // const col = Math.floor((event.offsetX - data.drawAreaList[0][0]) / data.scale);
                        let gridX = (col * data.scale + data.canvas.width / 2) - data.canvasWidth * data.scale / 2;
                        let gridY = (row * data.scale + data.canvas.height / 2) - data.canvasHeight * data.scale / 2;
                        data.lastX = gridX + data.scale / 2;
                        data.lastY = gridY + data.scale / 2;

                        // methods.addShapeList(col, row);
                    }
                    else if (data.currentTool === 4)
                    {
                        const targetColor = data.ctx1.getImageData(event.offsetX, event.offsetY, 1, 1).data;
                        // const row = Math.floor((event.offsetY - data.drawAreaList[0][1]) / data.scale);
                        // const col = Math.floor((event.offsetX - data.drawAreaList[0][0]) / data.scale);
                        console.log(data.drawRecord);
                        let replacementColor = isHexColor(data.brushColor) ? rgbaToHex(hexToRgba(data.brushColor)) : rgbaToHex(extractRgbaValues(data.brushColor));
                        console.log(replacementColor);
                        
                        methods.fillChunk(col, row, rgbaToHex(targetColor), replacementColor);

                    }
                }
            },

            fillChunk (x, y, targetColor, replacementColor)
            {
                console.log(targetColor, replacementColor);
                
                const stack = [[x, y]];
                const isSameColor = (col, row, color) =>
                {
                    let flag = false;
                    for (let i = 0; i < data.drawRecord.length; i++)
                    {
                        if (data.drawRecord[i][0] === col && data.drawRecord[i][1] === row && data.drawRecord[i][2] === color)
                        {
                            flag = true;
                            break;
                        }
                    }
                    return flag;
                };
                const setColor = (col, row, color) => 
                {
                    for (let i = 0; i < data.drawRecord.length; i++)
                    {
                        if (data.drawRecord[i][0] === col && data.drawRecord[i][1] === row)
                        {
                            console.log(color);
                            
                            data.drawRecord[i][2] = color;
                            break;
                        }
                    }
                };
                while (stack.length > 0) 
                {
                    const [x, y]:any = stack.pop();
                    if (isSameColor(x, y, targetColor)) 
                    {
                        setColor(x, y, replacementColor);
                        if (x > 0)
                        {
                            // 左方
                            stack.push([x - 1, y]);
                        }

                        if (x < data.canvasWidth - 1) 
                        {
                            stack.push([x + 1, y]);
                        }

                        if (y > 0) 
                        {
                            stack.push([x, y - 1]);
                        }

                        if (x < data.canvasHeight - 1) 
                        {
                            stack.push([x, y + 1]);
                        }
                    }
                    // data.ctx1.clearRect(0, 0, data.canvas.width, data.canvas.height);
                    methods.reDraw();
                }
            },      
            draw (event) 
            {
                methods.addCursorClass();
                // if (!data.isDrawing && !data.isErasering) return;
                if (event.offsetX >= data.drawAreaList[0][0] && event.offsetX < data.drawAreaList[data.drawAreaList.length - 1][0] + data.scale && event.offsetY >= data.drawAreaList[0][1] && event.offsetY < data.drawAreaList[data.drawAreaList.length - 1][1] + data.scale)
                {
                    const row = Math.floor((event.offsetY - data.drawAreaList[0][1]) / data.scale);
                    const col = Math.floor((event.offsetX - data.drawAreaList[0][0]) / data.scale);
                    data.gridInfo = `[${col}, ${row}]`;
                    if (data.isDrawing) 
                    {
                        // console.log(event.offsetX, event.offsetY);
                        
                        // console.log((col * data.scale + data.canvas.width / 2) - data.canvasWidth * data.scale / 2, 
                        //     (row * data.scale + data.canvas.height / 2) - data.canvasHeight * data.scale / 2);
                        let gridX = (col * data.scale + data.canvas.width / 2) - data.canvasWidth * data.scale / 2;
                        let gridY = (row * data.scale + data.canvas.height / 2) - data.canvasHeight * data.scale / 2;
                        // data.ctx1.globalAlpha = 1;
                        // data.ctx1.save();
                        data.ctx1.lineWidth = data.brushSize;
                        // data.ctx1.save();
                        // data.ctx1.globalCompositeOperation = data.currentTool === 1 ? 'destination-out' : 'source-over';
                        data.ctx1.strokeStyle = data.brushColor;
                        data.ctx1.lineCap = 'square';
                        data.ctx1.beginPath();
                        // data.ctx1.moveTo(data.lastX, data.lastY);
                        data.ctx1.lineTo(gridX + data.scale / 2, gridY + data.scale / 2);

                        data.ctx1.stroke();
                        // data.lastX = gridX + data.scale / 2;
                        // data.lastY = gridY + data.scale / 2;
                        // requestAnimationFrame(methods.draw);
                        methods.addDrawRecord([col, row, data.brushColor]);
                    }
                    if (data.isErasering)
                    {
                        methods.removeDrawRecord([col, row]);
                    }
                    if (data.isDrawShape)
                    {
                        data.ctx1.globalAlpha = 1;
                        data.ctx1.strokeStyle = data.brushColor;
                        data.ctx1.lineWidth = data.brushSize;
                        data.ctx1.lineCap = 'square';
                        
                        if (data.currentDrawShape === 'rect' || data.currentDrawShape === 'fillRect')
                        {
                            methods.addShapeList(col, row);
                            let gridX = (col * data.scale + data.canvas.width / 2) - data.canvasWidth * data.scale / 2;
                            let gridY = (row * data.scale + data.canvas.height / 2) - data.canvasHeight * data.scale / 2;
                            let rectWidth = (gridX + data.scale / 2 - data.lastX);
                            let rectHeight = (gridY + data.scale / 2 - data.lastY); 

                            data.ctx1.clearRect(0, 0, data.canvas.width, data.canvas.height);
                            methods.reDraw();
                            data.ctx1.beginPath();
                            console.log(gridX, gridY, data.lastX, data.lastY, rectWidth, rectHeight);
                            // data.ctx1.rect(140.5, 140.5, 0, 0);
                            // data.ctx1.rect(140.5, 130, 0, 0);
                            // data.ctx1.rect(140.5, 130, 0, 21);
                            // data.ctx1.rect(140.5, 140.5, 0, 31.5);
                            // data.ctx1.rect(140.5, 130, 0, 42);
                            if (gridY + data.scale / 2 === data.lastY && gridX + data.scale / 2 !== data.lastX)
                            {
                                if (gridX + data.scale / 2 > data.lastX)
                                {
                                    // 向右移动
                                    data.ctx1.rect(data.lastX - data.scale / 2, data.lastY, rectWidth + data.scale, rectHeight);
                                }
                                else
                                {
                                    data.ctx1.rect(data.lastX + data.scale / 2, data.lastY, rectWidth - data.scale, rectHeight);
                                }
                            }
                            else if (gridX + data.scale / 2 === data.lastX && gridY + data.scale / 2 !== data.lastY)
                            {
                                if (gridY + data.scale / 2 > data.lastY)
                                {
                                    // 向下移动
                                    data.ctx1.rect(data.lastX, data.lastY - data.scale / 2, rectWidth, rectHeight + data.scale);
                                }
                                else
                                {
                                    data.ctx1.rect(data.lastX, data.lastY + data.scale / 2, rectWidth, rectHeight - data.scale);
                                }
                            }
                            else if (gridX + data.scale / 2 === data.lastX && gridY + data.scale / 2 === data.lastY)
                            {
                                data.ctx1.rect(data.lastX, data.lastY, rectWidth, rectHeight);
                            }
                            else
                            {
                                data.ctx1.rect(data.lastX, data.lastY, rectWidth, rectHeight);
                            }
                            if (data.currentDrawShape === 'fillRect')
                            {
                                data.ctx1.fillStyle = data.shapeFillColor;
                                data.ctx1.fill();
                            }
                            data.ctx1.stroke();
                            // data.ctx1.globalCompositeOperation = 'source-over';
                            // data.ctx1.fillRect(data.lastX - data.scale / 2, data.lastY - data.scale / 2, rectWidth, rectHeight);
                            // // 画框
                            // data.ctx1.globalCompositeOperation = 'destination-out';
                            // data.ctx1.fillRect(data.lastX, data.lastY, rectWidth, rectHeight);
                            // // methods.reDraw();
                            // // //描边
                            // data.ctx1.globalCompositeOperation = 'source-over';
                            // // if (rectWidth === 0) rectWidth += data.scale / 2;
                            // // if (rectHeight === 0) rectHeight += data.scale / 2;
                            // if (rectWidth === 0) rectHeight += data.scale / 2;
                            // if (rectHeight === 0) rectWidth += data.scale / 2;
                            // data.ctx1.moveTo(data.lastX, data.lastY);
                            // data.ctx1.lineTo(data.lastX + rectWidth, data.lastY);
                            // data.ctx1.lineTo(data.lastX + rectWidth, data.lastY + rectHeight);
                            // data.ctx1.lineTo(data.lastX, data.lastY + rectHeight);
                            // data.ctx1.lineTo(data.lastX, data.lastY);
                            // data.ctx1.rect(data.lastX, data.lastY, rectWidth, rectHeight);
                            // data.ctx1.stroke();
                            // methods.saveShapeData();
                            // data.ctx1.closePath();
                            // console.log(data.lastX, data.lastY);
                            
                            // console.log(rectWidth, rectHeight);
                        }
                        else if (data.currentDrawShape === 'circle')
                        {
                            methods.addShapeList(col, row);
                            let l = data.drawShapeList.length;
                            let startX = data.drawShapeList[0][0];
                            let startY = data.drawShapeList[0][1];
                            let endX = data.drawShapeList[l - 1][0];
                            let endY = data.drawShapeList[l - 1][1];
                            let arr = methods.drawCircle(startX, startY, endX, endY, data.brushSize);
                            data.ctx1.clearRect(0, 0, data.canvas.width, data.canvas.height);
                            methods.reDraw();
                            for (let i = 0; i < arr.length; i++)
                            {
                                if (arr[i][0] > data.canvasWidth || arr[i][1] > data.canvasHeight) return;
                                let gridX = (arr[i][0] * data.scale + data.canvas.width / 2) - data.canvasWidth * data.scale / 2;
                                let gridY = (arr[i][1] * data.scale + data.canvas.height / 2) - data.canvasHeight * data.scale / 2;
                                data.ctx1.fillStyle = arr[i][2];
                                data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                            }
                            
                        }
                        else if (data.currentDrawShape === 'line')
                        {
                            methods.addShapeList(col, row);
                            let gridX = (col * data.scale + data.canvas.width / 2) - data.canvasWidth * data.scale / 2;
                            let gridY = (row * data.scale + data.canvas.height / 2) - data.canvasHeight * data.scale / 2;
                            if (gridX + data.scale / 2 === data.lastX || gridY +  data.scale / 2 === data.lastY)
                            {
                                data.ctx1.beginPath();
                                data.ctx1.moveTo(data.lastX, data.lastY);
                                data.ctx1.lineTo(gridX + data.scale / 2, gridY +  data.scale / 2);
                                data.ctx1.stroke();
                            }
                        }
                    }
                    
                }
                
            },
            addShapeList (col, row)
            {
                let flag = false;
                for (let i = 0; i < data.drawShapeList.length; i++)
                {
                    if (data.drawShapeList[i][0] === col && data.drawShapeList[i][1] === row)
                    {
                        flag = true;
                        break;
                    }
                }
                if (!flag) data.drawShapeList.push([col, row]);
            },

            drawCircle (x0, y0, x1, y1, penSize)
            {
                let coords = getOrderedRectangleCoordinates(x0, y0, x1, y1);
                let pixels = [] as any;
                let xC = Math.round((coords.x0 + coords.x1) / 2);
                let yC = Math.round((coords.y0 + coords.y1) / 2);
                let evenX = (coords.x0 + coords.x1) % 2;
                let evenY = (coords.y0 + coords.y1) % 2;
                let rX = coords.x1 - xC;
                let rY = coords.y1 - yC;

                let x;
                let y;
                let angle;
                let r;

                for (x = coords.x0 ; x <= xC ; x++) 
                {
                    angle = Math.acos((x - xC) / rX);
                    y = Math.round(rY * Math.sin(angle) + yC);
                    pixels.push([x - evenX, y]);
                    pixels.push([x - evenX, 2 * yC - y - evenY]);
                    pixels.push([2 * xC - x, y]);
                    pixels.push([2 * xC - x, 2 * yC - y - evenY]);
                }
                for (y = coords.y0 ; y <= yC ; y++) 
                {
                    angle = Math.asin((y - yC) / rY);
                    x = Math.round(rX * Math.cos(angle) + xC);
                    pixels.push([x, y - evenY]);
                    pixels.push([2 * xC - x - evenX, y - evenY]);
                    pixels.push([x, 2 * yC - y]);
                    pixels.push([2 * xC - x - evenX, 2 * yC - y]);
                }
                // console.log(pixels);
                
                // const uniqueSet = new Set(pixels.map((item) => JSON.stringify(item)));
                // const uniqueArr = Array.from(uniqueSet).map((item:any) => JSON.parse(item));
                return unique2DArray(pixels);

            },
            addDrawRecord (value)
            {
                let flag = false;
                console.log(value);
                
                if (!isHexColor(value[2])) 
                {
                    value[2] = rgbaToHex(extractRgbaValues(value[2]));
                }
                else if (isHexColor(value[2]) && value[2].length < 9)
                {
                    value[2] = rgbaToHex(hexToRgba(value[2]));
                }
                for (let i = 0; i < data.drawRecord.length; i++)
                {
                    if (data.drawRecord[i][0] === value[0] && data.drawRecord[i][1] === value[1])
                    {
                        data.drawRecord[i][2] = value[2];
                        flag = true;
                        break;
                    }
                }
                if (!flag) data.drawRecord.push(value);
            },

            removeDrawRecord (value)
            {
                console.log(value);
                for (let i = 0; i < data.drawRecord.length; i++)
                {
                    if (data.drawRecord[i][0] === value[0] && data.drawRecord[i][1] === value[1])
                    {
                        data.drawRecord[i][2] = '#00000000';
                        break;
                    }
                }
                data.ctx1.clearRect(0, 0, data.canvas.width, data.canvas.height);
                methods.reDraw();
                // let index = data.drawRecord.findIndex((element) => 
                // {
                //     return element[0] === value[0] && element[1] === value[1];
                // });
                // if (index >= 0)
                // {
                //     data.drawRecord.splice(index, 1);
                //     setTimeout(() => 
                //     {
                //         data.ctx1.clearRect(0, 0, data.canvas.width, data.canvas.height);
                //         // methods.drawPixelArea();
                //         methods.reDraw();
                //     }, 80);
                // }
            },

            reDraw ()
            {
                // 重新绘制内容
                if (!data.drawRecord.length) return;
                // console.log(data.drawRecord);
                // data.ctx1.restore();
                // data.ctx1.clearRect(0, 0, data.canvas.width, data.canvas.height);
                for (let i = 0; i < data.drawRecord.length; i++)
                {
                    if (data.drawRecord[i][0] > data.canvasWidth || data.drawRecord[i][1] > data.canvasHeight) continue;
                    if (data.drawRecord[i][2] !== '#00000000') 
                    {
                        let gridX = (data.drawRecord[i][0] * data.scale + data.canvas.width / 2) - data.canvasWidth * data.scale / 2;
                        let gridY = (data.drawRecord[i][1] * data.scale + data.canvas.height / 2) - data.canvasHeight * data.scale / 2;
                        data.ctx1.fillStyle = data.drawRecord[i][2];
                        data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                    }
                }
                
            },
          
            stop () 
            {
                data.isDrawing = false;
                data.isErasering = false;
                methods.saveShapeData();
            },
            leave ()
            {
                methods.stop();
                data.canvas.className = '';
            },
            saveShapeData ()
            {
                if (data.isDrawShape && data.currentDrawShape === 'circle' && data.drawShapeList.length)
                {
                    let l = data.drawShapeList.length;
                    let startX = data.drawShapeList[0][0];
                    let startY = data.drawShapeList[0][1];
                    let endX = data.drawShapeList[l - 1][0];
                    let endY = data.drawShapeList[l - 1][1];
                    let arr = methods.drawCircle(startX, startY, endX, endY, data.brushSize);
                    for (let i = 0; i < arr.length; i++)
                    {
                        methods.addDrawRecord([arr[i][0], arr[i][1], data.brushColor]);
                    }
                }
                else if (data.isDrawShape && data.currentDrawShape === 'rect' && data.drawShapeList.length)
                {
                    let xl = Math.abs(data.drawShapeList[0][0] - data.drawShapeList[data.drawShapeList.length - 1][0]);
                    let yl = Math.abs(data.drawShapeList[0][1] - data.drawShapeList[data.drawShapeList.length - 1][1]);
                    if (xl === 0 || yl === 0)
                    {
                        for (let i = 0; i < data.drawShapeList.length; i++)
                        {
                            methods.addDrawRecord([data.drawShapeList[i][0], data.drawShapeList[i][1], data.brushColor]);
                        }
                        data.drawShapeList = [];
                        data.isDrawShape = false;
                    }
                    else
                    {
                        for (let i = 0; i <= xl; i++)
                        {
                            let htx, hty, hbx, hby;
                            if (data.drawShapeList[0][0] > data.drawShapeList[data.drawShapeList.length - 1][0])
                            {
                                htx = data.drawShapeList[0][0] - i;
                                hty = data.drawShapeList[0][1];
                                methods.addDrawRecord([htx, hty, data.brushColor]);
                                hbx = data.drawShapeList[data.drawShapeList.length - 1][0] + i;
                                hby = data.drawShapeList[data.drawShapeList.length - 1][1];
                                methods.addDrawRecord([hbx, hby, data.brushColor]);
                            }
                            else
                            {
                                htx = data.drawShapeList[0][0] + i;
                                hty = data.drawShapeList[0][1];
                                methods.addDrawRecord([htx, hty, data.brushColor]);
                                hbx = data.drawShapeList[data.drawShapeList.length - 1][0] - i;
                                hby = data.drawShapeList[data.drawShapeList.length - 1][1];
                                methods.addDrawRecord([hbx, hby, data.brushColor]);
                            }
                        }
                        for (let i = 0; i <= yl; i++)
                        {
                            let htx, hty, hbx, hby;
                            if (data.drawShapeList[0][1] > data.drawShapeList[data.drawShapeList.length - 1][1])
                            {
                                htx = data.drawShapeList[0][0];
                                hty = data.drawShapeList[0][1] - i;
                                methods.addDrawRecord([htx, hty, data.brushColor]);
                                hbx = data.drawShapeList[data.drawShapeList.length - 1][0];
                                hby = data.drawShapeList[data.drawShapeList.length - 1][1] + i;
                                methods.addDrawRecord([hbx, hby, data.brushColor]);
                            }
                            else
                            {
                                htx = data.drawShapeList[0][0];
                                hty = data.drawShapeList[0][1] + i;
                                methods.addDrawRecord([htx, hty, data.brushColor]);
                                hbx = data.drawShapeList[data.drawShapeList.length - 1][0];
                                hby = data.drawShapeList[data.drawShapeList.length - 1][1] - i;
                                methods.addDrawRecord([hbx, hby, data.brushColor]);
                            }
                        }
                    }
                    
                }
                else if (data.isDrawShape && data.currentDrawShape === 'fillRect' && data.drawShapeList.length)
                {
                    let xl = Math.abs(data.drawShapeList[0][0] - data.drawShapeList[data.drawShapeList.length - 1][0]);
                    let yl = Math.abs(data.drawShapeList[0][1] - data.drawShapeList[data.drawShapeList.length - 1][1]);
                    if (xl === 0 || yl === 0)
                    {
                        for (let i = 0; i < data.drawShapeList.length; i++)
                        {
                            methods.addDrawRecord([data.drawShapeList[i][0], data.drawShapeList[i][1], data.brushColor]);
                        }
                    }
                    else
                    {
                        for (let i = 0; i < (yl + 1); i++)
                        {
                            for (let y = 0; y < (xl + 1); y++)
                            {
                                let htx, hty;
                                if (data.drawShapeList[0][0] > data.drawShapeList[data.drawShapeList.length - 1][0])
                                {
                                    htx = data.drawShapeList[0][0] - y;
                                    hty = data.drawShapeList[0][1] - i;
                                    methods.addDrawRecord([htx, hty, data.brushColor]);
                                }
                                else
                                {
                                    htx = data.drawShapeList[0][0] + y;
                                    hty = data.drawShapeList[0][1] + i;
                                    methods.addDrawRecord([htx, hty, data.brushColor]);
                                }
                            }
                            
                        }
                    }
                }
                data.drawShapeList = [];
                data.isDrawShape = false;
            },
            addCursorClass ()
            {
                if (data.currentTool === 0) data.canvas.classList.add('brush-cursor');
                else if (data.currentTool === 1) data.canvas.classList.add('eraser-cursor');
                else if (data.currentTool === 2) data.canvas.classList.add('straw-cursor');
                else if (data.currentTool === 3)
                {
                    if (data.currentDrawShape.toLowerCase().indexOf('rect') !== -1) data.canvas.classList.add('rect-cursor');
                    else if (data.currentDrawShape.toLowerCase().indexOf('circle') !== -1) data.canvas.classList.add('circle-cursor');
                }
                else if (data.currentTool === 4) data.canvas.classList.add('bucket-cursor');
            },
            handleCopyColor ()
            {
                if (isHexColor(data.brushColor))
                {
                    copyText(data.brushColor);
                    return;
                }
                copyText(rgbaToHex(extractRgbaValues(data.brushColor)));
            },
            handleSaveColor ()
            {
                // 保存颜色
                data.addMyColorVisible = true;
                data.myColor = data.brushColor;

            },
            exportPng ()
            {
                const link = document.createElement('a');
                link.download = 'image.png';
                link.href = data.canvas.toDataURL('image/png');
                link.click();
            },
            computeScale ()
            {
                if (data.canvasWidth > data.canvasHeight) data.scale = Math.max(1, (data.canvas.width / data.canvasWidth / 2));
                else data.scale = Math.max(1, (data.canvas.height / data.canvasHeight / 2));
                data.scale = Math.round(data.scale);
                console.log(data.scale);
                data.brushSize = data.scale;
                
            },
            getMyColorList ()
            {
                let colorList = proxy.$utils.cache.mycolor.get();
                if (colorList)
                {
                    data.myColorList = JSON.parse(colorList);
                }
                else
                {
                    proxy.$utils.cache.mycolor.set(JSON.stringify(data.myColorList));
                }
            }
        };
        
        onMounted(() => 
        {
            window.onbeforeunload = function (e)
            {
                e.returnValue = '1111';
            };
            methods.changeLanguage();
            methods.getMyColorList();
            data.canvas = document.getElementById('Canvas');
            // let parentBox = document.querySelector('.pixelBox');
            // data.canvas.width = parentBox?.clientWidth;
            // data.canvas.height = parentBox?.clientHeight;
            data.bgCanvas = document.getElementById('PixelCanvas');
            data.ctx1 = data.canvas.getContext('2d');
            data.ctx2 = data.bgCanvas.getContext('2d');
            methods.computeScale();
            methods.drawPixelArea();
            methods.initCanvasRecord();
            methods.startDrawing();
            // data.scaleX = Math.max(1, (data.canvas.width / data.canvasWidth / 2));
            // data.scaleY = Math.max(1, (data.canvas.height / data.canvasHeight / 2));
            // if (data.canvasHeight === data.canvasWidth) data.scaleY = data.scaleX;

            // console.log(data.canvas.width, data.canvas.height, data.scaleX, data.scaleY);
            
            // data.ctx2 = data.canvas.getContext('2d');
            
        });

        return {
            ...toRefs(data),
            ...methods,
            ...computedApi
        };
    }
});