import { reactive, toRefs, onMounted, defineComponent, getCurrentInstance } from 'vue';
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import en from 'element-plus/dist/locale/en.mjs';
import { copyText, extractRgbaValues, isHexColor, rgbaToHex } from '@/utils/utils';
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
            brushColor:'#000000',
            brushSize:10,
            canvasWidth:12,
            canvasHeight:12,
            scale:1,
            isCheckedRatio:true,
            widthHeightRatio:1,
            drawAreaList:[] as any,
            currentTool:0,

            drawRecord:[] as any,
            gridInfo:'[]',
            myColorList:[
                {
                    id:1,
                    groupName:'常用颜色',
                    list:[
                        '#000', '#fff'
                    ]
                }
            ],
            myColor:'#fff',
            myColorGroup:1,
            isAddGroup:false,
            myGroupName:'',
            addMyColorVisible:false,

            lastX:0,
            lastY:0,
            AnimationFrameId_1:null as any
        });
        
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
                    if (item.id === Number(data.myColorGroup))
                    {
                        item.list.push(data.myColor);
                    }
                });
                proxy.$utils.cache.mycolor.set(JSON.stringify(data.myColorList));
                data.addMyColorVisible = false;
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
                data.currentTool = index;
                // if (data.currentTool === 0)
                // {
                //     // 画笔
                //     data.canvas.style.cursor = 'pointer';

                // }
                // else if (data.currentTool === 1)
                // {
                //     // 橡皮擦

                // }
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
            drawPixelArea ()
            {
                // 绘制像素透明格子
                data.drawAreaList = [];
                data.ctx1.clearRect(0, 0, data.canvas.width, data.canvas.height);
                data.ctx1.globalAlpha = 0.5;
                for (let i = 0; i < data.canvasWidth; i++) 
                {
                    for (let j = 0; j < data.canvasHeight; j++) 
                    {
                        if ((i + j) % 2 === 0) 
                        {
                        // 深色格子
                            data.ctx1.fillStyle = 'rgba(0, 0, 0, 0.5)';
                        } 
                        else 
                        {
                        // 浅色格子
                            data.ctx1.fillStyle = 'rgba(100, 100, 100, 0.5)';
                        }
                        let px = data.scale;
                        let py = data.scale;
                        let originX = (i * px + data.canvas.width / 2) - data.canvasWidth * px / 2;
                        let originY = (j * py + data.canvas.height / 2) - data.canvasHeight * py / 2;
                        data.ctx1.fillRect(originX, originY, px, py);
                        data.drawAreaList.push([originX, originY]);
                    }
                }
                // if (data.drawAreaList.length >= data.canvasWidth * data.canvasHeight) cancelAnimationFrame(data.AnimationFrameId_1);
            },
            drawLoop () 
            {
                methods.drawPixelArea();
                data.AnimationFrameId_1 = requestAnimationFrame(methods.drawLoop);
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
                    
                    // data.ctx1.setTransform(data.scale, 0, 0, data.scale, 0, 0);
                    // data.ctx1.clearRect(0, 0, data.canvas.width, data.canvas.height);
                    methods.drawPixelArea();
                    // methods.drawLoop();
                    methods.reDraw();
                    // const delta = event.deltaY > 0? -0.1 : 0.1;
                    // scale += delta;
                    // scale = Math.max(0.1, scale);
                    // data.ctx1.setTransform(1.2, 0, 0, 1.2, 0, 0);
                    // data.ctx2.setTransform(1.2, 0, 0, 1.2, 0, 0);
                });
            },

            start (event) 
            {
                // 判断是否在可绘画区域
                if (event.offsetX >= data.drawAreaList[0][0] && event.offsetX < data.drawAreaList[data.drawAreaList.length - 1][0] + data.scale && 
                    event.offsetY >= data.drawAreaList[0][1] && event.offsetY < data.drawAreaList[data.drawAreaList.length - 1][1] + data.scale)
                {
                    methods.stop();
                    if (data.currentTool === 0) 
                    {
                        data.isDrawing = true;
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
                    }
                    else if (data.currentTool === 2)
                    {
                        if (!data.drawRecord.length) return;
                        const row = Math.floor((event.offsetY - data.drawAreaList[0][1]) / data.scale);
                        const col = Math.floor((event.offsetX - data.drawAreaList[0][0]) / data.scale);
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
                        data.ctx1.globalAlpha = 1;
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
                        requestAnimationFrame(methods.draw);
                        methods.addDrawRecord([col, row, data.brushColor]);
                    }
                    if (data.isErasering)
                    {
                        methods.removeDrawRecord([col, row]);
                    }
                    
                }
                
            },
            addDrawRecord (value)
            {
                let flag = false;
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
                
                let index = data.drawRecord.findIndex((element) => 
                {
                    return element[0] === value[0] && element[1] === value[1];
                });
                if (index >= 0)
                {
                    data.drawRecord.splice(index, 1);
                    setTimeout(() => 
                    {
                        methods.drawPixelArea();
                        methods.reDraw();
                    }, 100);
                }
            },

            reDraw ()
            {
                // 重新绘制内容
                if (!data.drawRecord.length) return;
                console.log(data.drawRecord);
                for (let i = 0; i < data.drawRecord.length; i++)
                {
                    if (data.drawRecord[i][0] > data.canvasWidth || data.drawRecord[i][1] > data.canvasHeight) return;
                    let gridX = (data.drawRecord[i][0] * data.scale + data.canvas.width / 2) - data.canvasWidth * data.scale / 2;
                    let gridY = (data.drawRecord[i][1] * data.scale + data.canvas.height / 2) - data.canvasHeight * data.scale / 2;
                    data.ctx1.fillStyle = data.drawRecord[i][2];
                    data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                }
                
            },
          
            stop () 
            {
                data.isDrawing = false;
                data.isErasering = false;
            },
            leave ()
            {
                methods.stop();
                data.canvas.className = '';
            },
            addCursorClass ()
            {
                if (data.currentTool === 0) data.canvas.classList.add('brush-cursor');
                else if (data.currentTool === 1) data.canvas.classList.add('eraser-cursor');
                else if (data.currentTool === 2) data.canvas.classList.add('straw-cursor');
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
            // data.canvas = document.getElementById('PixelCanvas');
            data.ctx1 = data.canvas.getContext('2d');
            methods.computeScale();
            // data.scaleX = Math.max(1, (data.canvas.width / data.canvasWidth / 2));
            // data.scaleY = Math.max(1, (data.canvas.height / data.canvasHeight / 2));
            // if (data.canvasHeight === data.canvasWidth) data.scaleY = data.scaleX;

            // console.log(data.canvas.width, data.canvas.height, data.scaleX, data.scaleY);
            
            // data.ctx2 = data.canvas.getContext('2d');
            methods.drawPixelArea();
            methods.startDrawing();
            
        });

        return {
            ...toRefs(data),
            ...methods
        };
    }
});