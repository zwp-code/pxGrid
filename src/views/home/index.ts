import { reactive, toRefs, onMounted, defineComponent, getCurrentInstance, computed, watch } from 'vue';
import { ElConfigProvider } from 'element-plus';
import { useI18n } from 'vue-i18n';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import en from 'element-plus/dist/locale/en.mjs';
import MyColorDialog from '@/components/dialog/MyColorDialog.vue';
import NoticeDialog from '@/components/dialog/NoticeDialog.vue';
import DonateDialog from '@/components/dialog/DonateDialog.vue';
import ExportDialog from '@/components/dialog/ExportDialog.vue';
import { useEditSpaceStore } from '@/store';
import fullScreen from '@/hooks/fullScreen';
import { copyText, downloadImage, exportImageForZip, extractRgbaValues, generateIamge, getOrderedRectangleCoordinates, hexToRgba, isHexColor, rgbaToHex, unique2DArray } from '@/utils/utils';
import axios from 'axios';
import { useToggle } from '@vueuse/shared';
import { useDark } from '@vueuse/core';
import { uuid } from 'vue-uuid';
import Worker from '@/utils/worker.js?worker';
export default defineComponent({
    name:'home',
    components: {
        ElConfigProvider,
        MyColorDialog,
        DonateDialog,
        NoticeDialog,
        ExportDialog
    },
    props:{},
    emits:[],
    setup (props, context)
    {
        const { proxy }:any = getCurrentInstance();
        const { locale: i18nLanguage } = useI18n();
        const editSpaceStore = useEditSpaceStore();
        const language = (navigator.language || 'zh').toLocaleLowerCase();
        let data = reactive({
            locale:en,
            bgCanvas:null as any,
            canvas:null as any,
            realCanvas:null as any,
            ctx1:null as any,
            ctx2:null as any,
            ctx3:null as any,
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

            drawRecord:[] as any, // 绘画信息 包括帧和图层信息
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
            myColor:'#ffffff',
            myColorGroup:1,
            isAddGroup:false,
            myGroupName:'',
            addMyColorVisible:false,
            editMyColorMask:null as any,

            currentDrawShape:'rect',
            currentDrawTransform:'hReverse',

            historyRecord:[] as any, // 绘画历史记录
            historyMaxLength:10,
            currentHistoryIndex:9,
            historyTimer:null as any,
            
            lastX:0,
            lastY:0,

            MyColorDialogVisible:false,
            donateVisible:false,
            noticeVisible:false,
            notice:{
                title:'',
                content:''
            },

            currentFrameIndex:0,
            currentLayerIndex:0,
            currentEditLayer:{
                index:-1,
                name:''
            },
            
            FrameTimer:null as any,
            maxFrame:10,
            maxLayer:8,
            exportVisible:false,
            exportLoaidng:false,

            loading:false,
            isSpace:false,
            isDragging:false,
            dragData:{
                x:0,
                y:0
            },

            canvasBeginPos:{
                x:0,
                y:0
            },

            AnimationFrameId_1:null as any
        });

        const isDark = useDark({
            // 存储到localStorage/sessionStorage中的Key 根据自己的需求更改
            storageKey: 'px-theme',
            // 暗黑class名字
            valueDark: 'dark'
        });

        const isLight = useDark({
            // 存储到localStorage/sessionStorage中的Key 根据自己的需求更改
            storageKey: 'px-theme',
            // 高亮class名字
            valueLight: 'light'
        });

        const theme = useDark({
            // 存储到localStorage/sessionStorage中的Key 根据自己的需求更改
            storageKey: 'px-theme',
            // 暗黑class名字
            valueDark: 'dark',
            valueLight: 'light'
        });
        const toggleDark = useToggle(theme);

        const initTheme = () => 
        {
            let useThemeKey = window.localStorage.getItem('px-theme');
            if (useThemeKey)
            {
                if (useThemeKey === 'light' || useThemeKey === 'auto')
                {
                    useToggle(isLight);
                    editSpaceStore.themeValue = false;
                }
                else
                {
                    useToggle(isDark);
                    editSpaceStore.themeValue = true;
                }
            }
            else
            {
                useToggle(isLight);
                editSpaceStore.themeValue = false;
            }
        };

        const computedApi = {
            requireIcon: computed(() => 
            {
                return (value) => 
                {
                    if (editSpaceStore.themeValue)
                    {
                        return new URL(`../../assets/light/${value}.png`, import.meta.url).href;
                    }
                    return new URL(`../../assets/dark/${value}.png`, import.meta.url).href;
                };
            }),
            requireShapeImg: computed(() => 
            {
                if (editSpaceStore.themeValue)
                {
                    return new URL(`../../assets/light/${data.currentDrawShape}.png`, import.meta.url).href;
                }
                return new URL(`../../assets/dark/${data.currentDrawShape}.png`, import.meta.url).href;
            }),
            requireTransformImg: computed(() => 
            {
                if (editSpaceStore.themeValue)
                {
                    return new URL(`../../assets/light/${data.currentDrawTransform}.png`, import.meta.url).href;
                }
                return new URL(`../../assets/dark/${data.currentDrawTransform}.png`, import.meta.url).href;
            }),
            requireVisibleImg: computed(() => 
            {
                return (value) => 
                {
                    if (value)
                    {
                        if (editSpaceStore.themeValue)
                        {
                            return new URL(`../../assets/light/visible.png`, import.meta.url).href;
                        }
                        return new URL(`../../assets/dark/visible.png`, import.meta.url).href;
                    }
                    if (editSpaceStore.themeValue)
                    {
                        return new URL(`../../assets/light/hidden.png`, import.meta.url).href;
                    }
                    return new URL(`../../assets/dark/hidden.png`, import.meta.url).href;
                };
            }),
            checkTheme: computed(() => 
            {
                return editSpaceStore.themeValue;
            })
        };
        
        let methods = {
            changeTheme ()
            {
                toggleDark();
                editSpaceStore.themeValue = !editSpaceStore.themeValue;
            },
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
                if (localStorage.getItem('px-lang'))
                {
                    data.locale = localStorage.getItem('px-lang') === 'zh' ? zhCn : en;
                }
                else if (language.split('-')[0])
                {
                    data.locale = language.split('-')[0] === 'zh' ? zhCn : en;
                }
                else 
                {
                    data.locale = zhCn;
                }
                editSpaceStore.lang = localStorage.getItem('px-lang') || language.split('-')[0] || 'zh';
                localStorage.setItem('px-lang', editSpaceStore.lang);
                
            },
            handleChangeTool (index)
            {
                if (index === 6)
                {
                    // 清空当前选择的图层绘画信息
                    // data.ctx1.clearRect(0, 0, data.canvas.width, data.canvas.height);
                    // data.drawRecord = [];
                    let layerArr = [] as any;
                    for (let i = 0; i < data.canvasHeight; i++) 
                    {
                        for (let j = 0; j < data.canvasWidth; j++) 
                        {
                            layerArr.push([j, i, '#00000000']);
                        }
                    }
                    data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData = layerArr;
                    methods.reDraw();
                    // methods.handleFrameImg(data.ctx1);
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
                // data.ctx1.clearRect(0, 0, data.canvas.width, data.canvas.height);
                methods.initCanvasRecord('scale');
                // methods.reDraw();
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
            initCanvasRecord (type)
            {
                // 初始化图层和帧数据
                if (type === 'init')
                {
                    // 首次初始化
                    
                    let layerArr = [] as any;
                    for (let i = 0; i < data.canvasHeight; i++) 
                    {
                        for (let j = 0; j < data.canvasWidth; j++) 
                        {
                            layerArr.push([j, i, '#00000000']);
                        }
                    }
                    data.drawRecord.push({
                        frameId:uuid.v1(), // 帧id
                        currentFrameImg:null as any, // 当前帧图片信息
                        layer:[ // 图层
                            {
                                layerId:uuid.v4(),
                                layerName:'图层1',
                                isRender:true, // 是否渲染
                                layerData:layerArr // 绘画信息
                            }
                        ]
                    });
                    methods.handleFrameImg(data.ctx2);
                }
                else if (type === 'scale')
                {
                    data.loading = true;
                    const worker = new Worker();
                    // 每个帧的图层都要进行比例调整
                    let layerOriginArr = [] as any;
                    for (let y = 0; y < data.canvasHeight; y++) 
                    {
                        for (let x = 0; x < data.canvasWidth; x++) 
                        {
                            layerOriginArr.push([x, y, '#00000000']);
                        }
                    }
                    worker.postMessage({originData:layerOriginArr, type:1, variables:JSON.parse(JSON.stringify(data.drawRecord))});
                    worker.onmessage = (event) => 
                    {
                        data.drawRecord = event.data;
                        data.loading = false;
                        console.log(data.drawRecord);
                        methods.reDraw();
                    };
                }
            },
            drawPixelArea (beginX = 0, beginY = 0)
            {
                // 绘制像素透明格子
                if (beginX === 0 && beginY === 0)
                {
                    beginX = data.canvasBeginPos.x;
                    beginY = data.canvasBeginPos.y;
                }
                data.drawAreaList = [];
                data.ctx2.clearRect(0, 0, data.bgCanvas.width, data.bgCanvas.height);
                data.ctx2.globalAlpha = 0.25;
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
                        let originX = i * px + beginX;
                        let originY = j * py + beginY;
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
                let currentLayerData = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData;
                for (let i = 0; i < currentLayerData.length; i++)
                {
                    if (currentLayerData[i][0] > data.canvasWidth || currentLayerData[i][1] > data.canvasHeight) return;
                    let gridX = (currentLayerData[i][0] * data.scale) + data.canvasBeginPos.x;
                    let gridY = (currentLayerData[i][1] * data.scale) + data.canvasBeginPos.y;
                    realCoords.push([gridX, gridY, currentLayerData[i][2]]);
                }
                if (transform === 'hReverse')
                {
                    for (let i = 0; i < currentLayerData.length; i++)
                    {
                        let newCol = (data.canvasWidth - 1) - currentLayerData[i][0];
                        currentLayerData[i][0] = newCol;
                    }
                }
                else if (transform === 'vReverse')
                {
                    for (let i = 0; i < currentLayerData.length; i++)
                    {
                        let newRow = (data.canvasHeight - 1) - currentLayerData[i][1];
                        currentLayerData[i][1] = newRow;
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
                        currentLayerData[i][0] = col;
                        currentLayerData[i][1] = row;
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
                        currentLayerData[i][0] = col;
                        currentLayerData[i][1] = row;
                    }
                }
                // data.ctx1.clearRect(0, 0, data.canvas.width, data.canvas.height);
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
                    // data.ctx1.clearRect(0, 0, data.canvas.width, data.canvas.height);
                    methods.drawPixelArea();
                    methods.reDraw(false);
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
                    if (data.isSpace)
                    {
                        data.isDragging = true;
                        let gridX = (col * data.scale) + data.canvasBeginPos.x;
                        let gridY = (row * data.scale) + data.canvasBeginPos.y;
                        data.dragData.x = gridX;
                        data.dragData.y = gridY;
                        return;
                    }
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
                        // const row = Math.floor((event.offsetY - data.drawAreaList[0][1]) / data.scale);
                        // const col = Math.floor((event.offsetX - data.drawAreaList[0][0]) / data.scale);
                        console.log(row, col);
                        let currentFrame = data.drawRecord[data.currentFrameIndex].layer;
                        for (let i = currentFrame.length - 1; i >= 0; i--)
                        {
                            for (let j = 0; j < currentFrame[i].layerData.length; j++)
                            {
                                if (currentFrame[i].layerData[j][0] === col && currentFrame[i].layerData[j][1] === row)
                                {
                                    if (currentFrame[i].layerData[j][2] !== '#00000000')
                                    {
                                        data.brushColor = currentFrame[i].layerData[j][2];
                                        break;
                                    }
                                }
                            }
                        }
                        
                    }
                    else if (data.currentTool === 3)
                    {
                        // 绘制形状
                        data.isDrawShape = true;
                        // const row = Math.floor((event.offsetY - data.drawAreaList[0][1]) / data.scale);
                        // const col = Math.floor((event.offsetX - data.drawAreaList[0][0]) / data.scale);
                        let gridX = (col * data.scale) + data.canvasBeginPos.x;
                        let gridY = (row * data.scale) + data.canvasBeginPos.y;
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
                    let currentLayerData = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData;
                    for (let i = 0; i < currentLayerData.length; i++)
                    {
                        if (currentLayerData[i][0] === col && currentLayerData[i][1] === row && currentLayerData[i][2] === color)
                        {
                            flag = true;
                            break;
                        }
                    }
                    return flag;
                };
                const setColor = (col, row, color) => 
                {
                    let currentLayerData = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData;
                    for (let i = 0; i < currentLayerData.length; i++)
                    {
                        if (currentLayerData[i][0] === col && currentLayerData[i][1] === row)
                        {
                            currentLayerData[i][2] = color;
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
                    // methods.reDraw(true, false);
                }
                methods.reDraw();
            },      
            draw (event) 
            {
                
                if (event.offsetX >= data.drawAreaList[0][0] && event.offsetX < data.drawAreaList[data.drawAreaList.length - 1][0] + data.scale && event.offsetY >= data.drawAreaList[0][1] && event.offsetY < data.drawAreaList[data.drawAreaList.length - 1][1] + data.scale)
                {
                    const row = Math.floor((event.offsetY - data.drawAreaList[0][1]) / data.scale);
                    const col = Math.floor((event.offsetX - data.drawAreaList[0][0]) / data.scale);
                    if (data.isSpace)
                    {
                        // 处理拖拽的逻辑
                        console.log('正在拖拽');
                        data.canvas.style.cursor = 'grabbing';
                        let gridX = (col * data.scale) + data.canvasBeginPos.x;
                        let gridY = (row * data.scale) + data.canvasBeginPos.y;
                        methods.startDrag(gridX, gridY);
                        return;
                    }
                    data.canvas.style.cursor = '';
                    methods.addCursorClass();
                    data.gridInfo = `[${col}, ${row}]`;
                    if (data.isDrawing)
                    {
                        methods.addDrawRecord([col, row, data.brushColor]);
                        if (data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].isRender)
                        {
                            let gridX = (col * data.scale) + data.canvasBeginPos.x;
                            let gridY = (row * data.scale) + data.canvasBeginPos.y;
                            data.ctx1.lineWidth = data.brushSize;
                            data.ctx1.strokeStyle = data.brushColor;
                            data.ctx1.lineCap = 'square';
                            data.ctx1.beginPath();
                            data.ctx1.lineTo(gridX + data.scale / 2, gridY + data.scale / 2);
                            data.ctx1.stroke();
                        }
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
                            if (data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].isRender)
                            {
                                let gridX = (col * data.scale) + data.canvasBeginPos.x;
                                let gridY = (row * data.scale) + data.canvasBeginPos.y;
                                let rectWidth = (gridX + data.scale / 2 - data.lastX);
                                let rectHeight = (gridY + data.scale / 2 - data.lastY);
                                methods.reDraw();
                                data.ctx1.beginPath();
                                if (gridY + data.scale / 2 === data.lastY && gridX + data.scale / 2 !== data.lastX)
                                {
                                    if (gridX + data.scale / 2 > data.lastX)
                                    {
                                        // 向右移动
                                        data.ctx1.rect(data.lastX - data.scale / 2, data.lastY, rectWidth + data.scale, rectHeight);
                                    }
                                    else
                                    {
                                        // 向左移动
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
                                        // 向上移动
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
                            }
                        }
                        else if (data.currentDrawShape === 'circle')
                        {
                            methods.addShapeList(col, row);
                            if (data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].isRender)
                            {
                                data.ctx1.fillStyle = data.brushColor;
                                let l = data.drawShapeList.length;
                                let startX = data.drawShapeList[0][0];
                                let startY = data.drawShapeList[0][1];
                                let endX = data.drawShapeList[l - 1][0];
                                let endY = data.drawShapeList[l - 1][1];
                                let arr = methods.drawCircle(startX, startY, endX, endY, data.brushSize);
                                console.log(arr);
                                
                                methods.reDraw();
                                for (let i = 0; i < arr.length; i++)
                                {
                                    if (arr[i][0] > data.canvasWidth || arr[i][1] > data.canvasHeight) return;
                                    let gridX = (arr[i][0] * data.scale) + data.canvasBeginPos.x;
                                    let gridY = (arr[i][1] * data.scale) + data.canvasBeginPos.y;
                                    data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                                }
                                
                            }
                            
                        }
                        else if (data.currentDrawShape === 'line')
                        {
                            methods.addShapeList(col, row);
                            if (data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].isRender)
                            {
                                let gridX = (col * data.scale) + data.canvasBeginPos.x;
                                let gridY = (row * data.scale) + data.canvasBeginPos.y;
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
                    
                }
                else
                {
                    // data.canvas.style.cursor = '';
                    data.canvas.classList = '';
                }
                
            },

            startDrag (targetX, targetY)
            {
                if (data.isDragging)
                {
                    const difX = targetX - data.dragData.x;
                    const difY = targetY - data.dragData.y;
                    console.log(difX, difY);
                    
                    let originX = data.drawAreaList[0][0];
                    let originY = data.drawAreaList[0][1];
                    let beginX = originX + difX;
                    let beginY = originY + difY;
                    
                    methods.drawPixelArea(beginX, beginY);
                    methods.reDraw(false, false, { x:beginX, y:beginY });
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
                return unique2DArray(pixels);

            },

            handleFrameImg (ctx, isAddHistory = true)
            {
                let beginX = data.drawAreaList[0][0];
                let beginY = data.drawAreaList[0][1];
                const imageData = ctx.getImageData(beginX, beginY, data.canvasWidth * data.scale, data.canvasHeight * data.scale);
                const dataURL = generateIamge(data.canvasWidth * data.scale, data.canvasHeight * data.scale, imageData);
                data.drawRecord[data.currentFrameIndex].currentFrameImg = dataURL;
                if (isAddHistory) methods.handleAddHistory();
            },
            addDrawRecord (value)
            {
                console.log(value);
                if (!isHexColor(value[2])) 
                {
                    value[2] = rgbaToHex(extractRgbaValues(value[2]));
                }
                else if (isHexColor(value[2]) && value[2].length < 9)
                {
                    value[2] = rgbaToHex(hexToRgba(value[2]));
                }
                let arr = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData;
                for (let v = 0; v < arr.length; v++)
                {
                    if (arr[v][0] === value[0] && arr[v][1] === value[1])
                    {
                        arr[v][2] = value[2];
                        break;
                    }
                }
                console.log(data.drawRecord);
                // 更新帧图片
                data.FrameTimer && clearTimeout(data.FrameTimer);
                data.FrameTimer = setTimeout(() => 
                {
                    methods.handleFrameImg(data.ctx1);
                }, 200);
                
            },

            removeDrawRecord (value)
            {
                console.log(value);
                let arr = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData;
                for (let v = 0; v < arr.length; v++)
                {
                    if (arr[v][0] === value[0] && arr[v][1] === value[1])
                    {
                        arr[v][2] = '#00000000';
                        break;
                    }
                }
                methods.reDraw();
            },

            reDraw (isRenderFrameImg = true, isAddHistory = true, beginPos = data.canvasBeginPos)
            {
                // 重新绘制内容
                let count = 0;
                data.ctx1.clearRect(0, 0, data.canvas.width, data.canvas.height);
                if (data.drawRecord.length - 1 < data.currentFrameIndex) data.currentFrameIndex = data.drawRecord.length - 1;
                let arr = data.drawRecord[data.currentFrameIndex].layer;
                for (let i = arr.length - 1; i >= 0; i--)
                {
                    // 从最后一项开始绘制
                    if (arr[i].isRender)
                    {
                        for (let v = 0; v < arr[i].layerData.length; v++)
                        {
                            if (arr[i].layerData[v][0] > data.canvasWidth || arr[i].layerData[v][1] > data.canvasHeight) continue;
                            if (arr[i].layerData[v][2] !== '#00000000') 
                            {
                                let gridX = (arr[i].layerData[v][0] * data.scale) + beginPos.x;
                                let gridY = (arr[i].layerData[v][1] * data.scale) + beginPos.y;
                                data.ctx1.fillStyle = arr[i].layerData[v][2];
                                data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                                count++;
                            }
                        }
                    }
                }
                if (isRenderFrameImg)
                {
                    if (count > 0) methods.handleFrameImg(data.ctx1, isAddHistory);
                    else methods.handleFrameImg(data.ctx2, isAddHistory);
                }
                
            },
          
            stop () 
            {
                data.isDrawing = false;
                data.isErasering = false;
                if (data.isDragging)
                {
                    data.isDragging = false;
                    data.canvasBeginPos.x = data.drawAreaList[0][0];
                    data.canvasBeginPos.y = data.drawAreaList[0][1];
                }
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
                    // methods.handleAddHistory();
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
                    else if (data.currentDrawShape === 'line') data.canvas.classList.add('brush-cursor');
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
            },
            handleLanguageCommand (command)
            {
                i18nLanguage.value = command;
                proxy.$utils.cache.lang.set(command);
                editSpaceStore.lang = command;
            },
            getNoticeData ()
            {
                axios.get(`${import.meta.env.VITE_APP_API_URL}json/notice.json`)
                    .then((res) => 
                    {
                        if (res.data.length > 0)
                        {
                            data.noticeVisible = true;
                            data.notice = proxy.$utils.cache.lang.get() === 'zh' ? res.data[0] : res.data[1];
                        }
                    })
                    .catch((err) => 
                    {
                        // proxy.$message.error(err);
                        console.error(err);
                    });
            },
            // 图层开始
            handleAddLayer ()
            {
                // 新建图层
                if (data.drawRecord[data.currentFrameIndex].layer.length > data.maxLayer) return proxy.$message.warning('图层达到上限');
                let layerArr = [] as any;
                for (let i = 0; i < data.canvasHeight; i++) 
                {
                    for (let j = 0; j < data.canvasWidth; j++) 
                    {
                        layerArr.push([j, i, '#00000000']);
                    }
                }
                let length = data.drawRecord[data.currentFrameIndex].layer.length;
                let obj = {
                    layerId:uuid.v4(),
                    layerName: `图层${length + 1}`,
                    isRender:true, // 是否渲染
                    layerData:layerArr // 绘画信息
                };
                data.drawRecord[data.currentFrameIndex].layer.unshift(obj);
                methods.handleAddHistory();
            },
            handleChangeLayer (index)
            {
                // 切换图层
                data.currentLayerIndex = index;
            },
            handleChangeLayerVisible (index)
            {
                let flag = data.drawRecord[data.currentFrameIndex].layer[index].isRender;
                data.drawRecord[data.currentFrameIndex].layer[index].isRender = !flag;
                methods.reDraw();
                // methods.handleAddHistory();
            },
            handleDeleteLayer (index)
            {
                data.drawRecord[data.currentFrameIndex].layer.splice(index, 1);
                data.currentLayerIndex = data.drawRecord[data.currentFrameIndex].layer.length - 1;
                methods.handleAddHistory();
                
            },
            handleCopyLayer (index)
            {
                let copyData = JSON.parse(JSON.stringify(data.drawRecord[data.currentFrameIndex].layer[index]));
                let length = data.drawRecord[data.currentFrameIndex].layer.length;
                copyData.layerId = uuid.v4();
                copyData.layerName = `图层${length + 1}`;
                data.drawRecord[data.currentFrameIndex].layer.unshift(copyData);
                methods.handleAddHistory();
            },
            handleDoubleClickLayer (index, layerName)
            {
                data.currentEditLayer.index = index;
                data.currentEditLayer.name = layerName;
                
            },
            handleEditLayerName ()
            {
                data.drawRecord[data.currentFrameIndex].layer[data.currentEditLayer.index].layerName = data.currentEditLayer.name;
                data.currentEditLayer = {
                    index: -1,
                    name:''
                };
                methods.handleAddHistory();
            },
            handleExportLayer (frameIndex, layerIndex, isDownload = true)
            {
                const imageData = data.drawRecord[frameIndex].layer[layerIndex].layerData;
                data.realCanvas.width = data.canvasWidth;
                data.realCanvas.height = data.canvasHeight;
                data.ctx3.clearRect(0, 0, data.canvasWidth, data.canvasHeight);
                console.log(imageData);
                
                for (let y = 0; y < data.canvasWidth; y++) 
                {
                    for (let x = 0; x < data.canvasHeight; x++) 
                    {
                        let color = '#00000000';
                        for (let i = 0; i < imageData.length; i++)
                        {
                            if (imageData[i][0] === y && imageData[i][1] === x && imageData[i][2] !== '#00000000')
                            {
                                color = imageData[i][2];
                            }
                        }
                        
                        // 在新的 canvas 上绘制缩小后的像素
                        data.ctx3.fillStyle = color;
                        data.ctx3.fillRect(y, x, 1, 1);
                    }
                }
                if (isDownload) downloadImage(data.realCanvas, `layer${layerIndex + 1}`);
            },
            // 图层结束

            // 帧开始
            handleAddFrame ()
            {
                if (data.drawRecord.length >= data.maxFrame) return proxy.$message.warning('帧达到上限');
                let layerArr = [] as any;
                for (let i = 0; i < data.canvasHeight; i++) 
                {
                    for (let j = 0; j < data.canvasWidth; j++) 
                    {
                        layerArr.push([j, i, '#00000000']);
                    }
                }
                let obj = {
                    frameId:uuid.v1(),
                    currentFrameImg:null as any,
                    layer:[
                        {
                            layerId:uuid.v4(),
                            layerName: '图层1',
                            isRender:true, // 是否渲染
                            layerData:layerArr // 绘画信息
                        }
                    ]
                };
                data.drawRecord.push(obj);
                methods.handleChangeFrame(data.drawRecord.length - 1);
                methods.handleFrameImg(data.ctx2);
            },
            handleChangeFrame (index)
            {
                data.currentFrameIndex = index;
                data.currentLayerIndex = 0;
                methods.reDraw(true, false);

            },
            handleCopyFrame (index)
            {
                if (data.drawRecord.length >= data.maxFrame) return proxy.$message.warning('帧达到上限');
                let copyData = JSON.parse(JSON.stringify(data.drawRecord[index]));
                copyData.frameId = uuid.v1();
                data.drawRecord.splice(index, 0, copyData);
                methods.handleChangeFrame(index + 1);
                methods.handleAddHistory();
            },
            handleDeleteFrame (index)
            {
                data.drawRecord.splice(index, 1);
                methods.handleChangeFrame(index - 1);
                methods.handleAddHistory();

            },
            handleExportFrame (index, isDownload = true)
            {
                const imageData = data.drawRecord[index].layer;
                data.realCanvas.width = data.canvasWidth;
                data.realCanvas.height = data.canvasHeight;
                data.ctx3.clearRect(0, 0, data.canvasWidth, data.canvasHeight);
                console.log(imageData);
                
                let layerArr = [] as any;
                for (let i = imageData.length - 1; i >= 0; i--)
                {
                    if (imageData[i].isRender)
                    {
                        for (let j = 0; j < imageData[i].layerData.length; j++)
                        {
                            layerArr.push(imageData[i].layerData[j]);
                        }
                    }
                }
                console.log(layerArr);
                
                for (let y = 0; y < data.canvasWidth; y++) 
                {
                    for (let x = 0; x < data.canvasHeight; x++) 
                    {
                        let color = '#00000000';
                        for (let i = 0; i < layerArr.length; i++)
                        {
                            if (layerArr[i][0] === y && layerArr[i][1] === x && layerArr[i][2] !== '#00000000')
                            {
                                color = layerArr[i][2];
                            }
                        }
                        
                        // 在新的 canvas 上绘制缩小后的像素
                        data.ctx3.fillStyle = color;
                        data.ctx3.fillRect(y, x, 1, 1);
                    }
                }
                if (isDownload) downloadImage(data.realCanvas, `frame${index + 1}`);
            },
            // 帧结束
            handleExport (type, filename)
            {
                data.exportLoaidng = true;
                // 根据不同类型导出
                if (type === 1)
                {
                    // 精灵图不区分图层，相当于导出每一帧的精灵图
                    const bigCanvas = document.createElement('canvas');
                    bigCanvas.width = data.canvasWidth * data.drawRecord.length;
                    bigCanvas.height = data.canvasHeight;
                    const bigCtx:any = bigCanvas.getContext('2d');
                    data.realCanvas.width = data.canvasWidth;
                    data.realCanvas.height = data.canvasHeight;
                    for (let i = 0; i < data.drawRecord.length; i++)
                    {
                        methods.handleExportFrame(i, false);
                        bigCtx.drawImage(data.realCanvas, i * data.canvasWidth, 0);
                    }
                    downloadImage(bigCanvas, filename);
                }
                else if (type === 2)
                {
                    let maxLayer = 0; // 最大图层
                    let canavsData = [] as any; // 每个帧图层的image数据
                    let canavsUrlData = [] as any;  // 合并后的image数据
                    // 精灵图区分图层，每一个帧里的图层会单独导出为精灵图
                    for (let i = 0; i < data.drawRecord.length; i++)
                    {
                        canavsData[i] = [];
                        let currentFrameLayerLength = data.drawRecord[i].layer.length; // 当前帧的图层长度
                        if (maxLayer < currentFrameLayerLength)
                        {
                            maxLayer = currentFrameLayerLength;
                        }
                        let count = 0;
                        for (let j = currentFrameLayerLength - 1; j >= 0; j--)
                        {
                            methods.handleExportLayer(i, j, false);
                            canavsData[i][count] = data.ctx3.getImageData(0, 0, data.canvasWidth, data.canvasHeight);
                            count++;
                        }
                    }
                    for (let l = 0; l < maxLayer; l++)
                    {
                        const bigCanvas = document.createElement('canvas');
                        bigCanvas.width = data.canvasWidth * data.drawRecord.length;
                        bigCanvas.height = data.canvasHeight;
                        const bigCtx:any = bigCanvas.getContext('2d');
                        for (let i = 0; i < canavsData.length; i++)
                        {
                            if (canavsData[i][l])
                            {
                                let newCanvas = document.createElement('canvas');
                                newCanvas.width = data.canvasWidth;
                                newCanvas.height = data.canvasHeight;
                                let newCtx:any = newCanvas.getContext('2d');
                                newCtx.putImageData(canavsData[i][l], 0, 0);
                                bigCtx.drawImage(newCanvas, i * data.canvasWidth, 0);
                                continue;
                            }
                        }
                        canavsUrlData.push(bigCanvas.toDataURL('image/png'));
                    }
                    exportImageForZip(`${filename}`, canavsUrlData);
                }
                else if (type === 3)
                {
                    // 单张图
                    let canavsUrlData = [] as any;
                    for (let i = 0; i < data.drawRecord.length; i++)
                    {
                        methods.handleExportFrame(i, false);
                        canavsUrlData.push(data.realCanvas.toDataURL('image/png'));
                    }
                    exportImageForZip(`${filename}`, canavsUrlData);
                }
                else if (type === 4)
                {
                    let canavsUrlData = [] as any;  // 合并后的image数据
                    // 精灵图区分图层，每一个帧里的图层会单独导出为精灵图
                    for (let i = 0; i < data.drawRecord.length; i++)
                    {
                        let currentFrameLayerLength = data.drawRecord[i].layer.length; // 当前帧的图层长度
                        for (let j = currentFrameLayerLength - 1; j >= 0; j--)
                        {
                            methods.handleExportLayer(i, j, false);
                            canavsUrlData.push(data.realCanvas.toDataURL('image/png'));
                        }
                    }
                    
                    exportImageForZip(`${filename}`, canavsUrlData);
                }
                data.exportLoaidng = false;
            },
            handleAddHistory ()
            {
                console.log('执行一次');
                
                // 添加操作历史
                if (data.historyRecord.length >= data.historyMaxLength)
                {
                    data.historyRecord.shift();
                }
                while (data.currentHistoryIndex < data.historyRecord.length - 1)
                {
                    data.historyRecord.pop();
                    console.log(1111);
                    
                }
                console.log(JSON.parse(JSON.stringify(data.historyRecord)));
                
                data.historyRecord.push({
                    hid:uuid.v1(),
                    record:JSON.parse(JSON.stringify(data.drawRecord))
                });

                console.log(JSON.parse(JSON.stringify(data.historyRecord)));
                
                data.currentHistoryIndex = data.historyRecord.length - 1;
                if (data.currentHistoryIndex < 0) data.currentHistoryIndex = 0;
            },
            handleRevoke ()
            {
                // 撤销操作
                data.currentHistoryIndex = data.currentHistoryIndex - 1;
                if (data.currentHistoryIndex <= 0) data.currentHistoryIndex = 0;
                console.log(data.currentHistoryIndex);
                
                data.drawRecord = JSON.parse(JSON.stringify(data.historyRecord[data.currentHistoryIndex].record));
                methods.reDraw(true, false);
            },
            handleRecover ()
            {
                // 恢复操作
                data.currentHistoryIndex = data.currentHistoryIndex + 1;
                if (data.currentHistoryIndex >= data.historyRecord.length - 1) data.currentHistoryIndex = data.historyRecord.length - 1;
                data.drawRecord = JSON.parse(JSON.stringify(data.historyRecord[data.currentHistoryIndex].record));
                methods.reDraw(true, false);
            },
            addKeyBoardEvent ()
            {
                document.addEventListener('keydown', function (event) 
                {
                    if (event.key === ' ')
                    {
                        data.isSpace = true;
                        data.canvas.style.cursor = 'grabbing';
                        return;
                    }
                    if (event.altKey && event.key === 'z') 
                    {
                        methods.handleRevoke();
                    } 
                    else if (event.altKey && event.key === 'x') 
                    {
                        methods.handleRecover();
                    }
                    else if (event.altKey && event.key === 'q') 
                    {
                        // 切换画笔
                        methods.handleChangeTool(0);

                    }
                    else if (event.altKey && event.key === 'w') 
                    {
                        // 切换橡皮
                        methods.handleChangeTool(1);
                    }
                    else if (event.altKey && event.key === 'a') 
                    {
                        // 切换吸管工具
                        event.preventDefault();
                        methods.handleChangeTool(2);
                    }
                    else if (event.altKey && event.key === 's') 
                    {
                        // 切换油漆桶
                        methods.handleChangeTool(4);
                    }
                    else if (event.altKey && event.key === 'r') 
                    {
                        // 清空当前画布
                        methods.handleChangeTool(6);
                        
                    }
                    data.canvas.className = '';
                    methods.addCursorClass();
                });

                document.addEventListener('keyup', function (event) 
                {
                    if (event.key === ' ')
                    {
                        data.isSpace = false;
                        data.canvas.style.cursor = '';
                    }
                });
            },
            handleResizeWindow ()
            {
                window.addEventListener('resize', function () 
                {
                    const pixelBox = document.querySelector('.pixelBox');
                    data.canvas.width = pixelBox?.clientWidth;
                    data.canvas.height = pixelBox?.clientHeight;
                    data.bgCanvas.width = pixelBox?.clientWidth;
                    data.bgCanvas.height = pixelBox?.clientHeight;
                    data.canvasBeginPos.x = ((data.bgCanvas.width / 2) - data.canvasWidth * data.scale / 2);
                    data.canvasBeginPos.y = ((data.bgCanvas.height / 2) - data.canvasHeight * data.scale / 2);
                    methods.drawPixelArea();
                    methods.reDraw(false, false);
                });
            }
        };

        // watch(data.drawRecord, (newValue, oldValue) => 
        // {
        //     methods.handleAddHistory();
        // }, { deep: true });
        
        onMounted(() => 
        {
            window.onbeforeunload = function (e)
            {
                e.returnValue = '1111';
            };
            initTheme();
            methods.changeLanguage();
            methods.getMyColorList();
            const pixelBox = document.querySelector('.pixelBox');
            data.canvas = document.getElementById('Canvas');
            data.bgCanvas = document.getElementById('PixelCanvas');
            data.realCanvas = document.getElementById('RealCanvas');
            data.canvas.width = pixelBox?.clientWidth;
            data.canvas.height = pixelBox?.clientHeight;
            data.bgCanvas.width = pixelBox?.clientWidth;
            data.bgCanvas.height = pixelBox?.clientHeight;
            data.ctx1 = data.canvas.getContext('2d');
            data.ctx2 = data.bgCanvas.getContext('2d');
            data.ctx3 = data.realCanvas.getContext('2d');
            methods.computeScale();
            data.canvasBeginPos.x = ((data.bgCanvas.width / 2) - data.canvasWidth * data.scale / 2);
            data.canvasBeginPos.y = ((data.bgCanvas.height / 2) - data.canvasHeight * data.scale / 2);
            console.log(data.canvasBeginPos.x, data.canvasBeginPos.y);
            
            methods.drawPixelArea();
            methods.initCanvasRecord('init');
            methods.startDrawing();
            methods.getNoticeData();
            methods.addKeyBoardEvent();
            methods.handleResizeWindow();
        });

        return {
            ...toRefs(data),
            ...methods,
            ...computedApi,
            copyText,
            ...fullScreen()
        };
    }
});