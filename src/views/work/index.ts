import { reactive, toRefs, onMounted, defineComponent, getCurrentInstance, computed, watch, onDeactivated, onActivated, onBeforeUnmount } from 'vue';
import MyColorDialog from '@/components/dialog/MyColorDialog.vue';
import PreviewAnimDialog from '@/components/dialog/PreviewAnimDialog.vue';
import ReplaceColorDialog from '@/components/dialog/ReplaceColorDialog.vue';
import ExportDialog from '@/components/dialog/ExportDialog.vue';
import { useEditSpaceStore } from '@/store';
import { copyText, downloadImage, exportImageForZip, extractRgbaValues, formatTime, generateIamge, getOrderedRectangleCoordinates, hexToRgba, isHexColor, removeNullArray, removeNullFrom2DArray, rgbaToHex, unique2DArray } from '@/utils/utils';
import axios from 'axios';
import { uuid } from 'vue-uuid';
import Worker from '@/utils/worker.js?worker';
import useDrag from '@/hooks/useDrag';
import useFilter from '@/hooks/useFilter';
import FileSaver from 'file-saver';
import { ElMessageBox } from 'element-plus';
import iconSvg from '@/assets/svg/icon.js';
export default defineComponent({
    name:'work',
    components: {
        MyColorDialog,
        ExportDialog,
        PreviewAnimDialog,
        ReplaceColorDialog
    },
    props:{},
    emits:[],
    setup (props, context)
    {
        const { proxy }:any = getCurrentInstance();
        const useFilterHooks = useFilter();
        const editSpaceStore = useEditSpaceStore();
        let data = reactive({
            projectData:{
                projectName:'',
                projectId:'',
                updateAt:'',
                createAt:'',
                desc:'',
                width:'',
                height:'',
                frameImg:'',
                data:null,
                isTop:0,
                tip:''
            } as any,
            emptyColor:'#00000000',
            bgCanvas:null as any,
            canvas:null as any,
            realCanvas:null as any,
            ctx1:null as any,
            ctx2:null as any,
            ctx3:null as any,
            isDrawing:false,
            isErasering:false,
            isDrawShape:false,
            isMoving:false,
            isSelecting:false,
            isCopy:false,
            shapeFillColor:'#000000ff',
            brushColor:'#000000ff',
            brushSize:10,
            canvasWidth:32,
            canvasHeight:32,
            scale:1,
            isCheckedRatio:true,
            isShowReferenceLine:false,
            widthHeightRatio:1,
            drawAreaList:[] as any,
            currentTool:0,

            drawRecord:[] as any, // 绘画信息 包括帧和图层信息
            drawShapeList:[] as any,
            gridInfo:'[]',
            myColorList:proxy.$config.colorList,
            myColor:'#ffffffff',
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

            // MyColorDialogVisible:false,
            donateVisible:false,
            noticeVisible:false,
            notice:{
                title:'',
                content:''
            },

            currentFrameIndex:0,
            currentLayerIndex:0,
            currentFrameId:0,
            currentLayerId:0,
            currentFrameLayerVisible:true,
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
            isShift:false,
            isDragging:false,
            dragData:{
                x:0,
                y:0
            },

            canvasBeginPos:{
                x:0,
                y:0,
                centerX:0,
                centerY:0
            },

            moveData:{
                x:0,
                y:0,
                centerX:0,
                centerY:0,
                list:[] as any
            },

            selectData:{
                x:-1,
                y:-1,
                originList:[] as any, // 原始有像素的数据
                selectList:[] as any, // 选择的数据
                copyList:[] as any // 复制的数据
            },
            previewLoading:false,
            selectActiveColor:'#3c8bfb8f',
            isExpandColorSelector:true,
            colorStatList:[] as any,

            worker:null as any,
            isExportProject:false,
            AnimationFrameId_1:null as any,
            zIndex:{
                max:13,
                min:8
            },
            isSaveProject:true
        });


        const computedApi = {
            requireIcon: computed(() => 
            {
                return (value) => 
                {
                    // return iconSvg[value];
                    if (editSpaceStore.themeValue)
                    {
                        return new URL(`../../assets/light/${value}.png`, import.meta.url).href;
                    }
                    return new URL(`../../assets/dark/${value}.png`, import.meta.url).href;
                };
            }),
            requireShapeImg: computed(() => 
            {
                // return iconSvg[data.currentDrawShape];
                if (editSpaceStore.themeValue)
                {
                    return new URL(`../../assets/light/${data.currentDrawShape}.png`, import.meta.url).href;
                }
                return new URL(`../../assets/dark/${data.currentDrawShape}.png`, import.meta.url).href;
            }),
            requireTransformImg: computed(() => 
            {
                // return iconSvg[data.currentDrawTransform];
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
                        // return iconSvg['eye'];
                        if (editSpaceStore.themeValue)
                        {
                            return new URL(`../../assets/light/visible.png`, import.meta.url).href;
                        }
                        return new URL(`../../assets/dark/visible.png`, import.meta.url).href;
                    }
                    // return iconSvg['eyeClose'];
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
            }),
            checkzIndex: computed(() =>  
            {
                let style = {
                    zIndex:0
                };
                if (editSpaceStore.isFullWork)
                {
                    style.zIndex = data.zIndex.max;
                }
                else
                {
                    style.zIndex = data.zIndex.min;
                }
                return style;
            })
        };
        
        let methods = {
            handleSaveProject ()
            {
                // 保存到indexdb
                data.loading = true;
                data.isSaveProject = true;
                data.projectData.updateAt = formatTime();
                data.projectData.height = data.canvasHeight;
                data.projectData.width = data.canvasWidth;
                data.projectData.tip = '最近编辑';
                data.projectData.data = methods.compressDrawRecordData();
                data.projectData.frameImg = '@';
                // data.projectData.frameImg = methods.getCurrentFrameImg()
                editSpaceStore.saveProject(data.projectData).then((res) => 
                {
                    if (res) 
                    {
                        proxy.$message.success(proxy.$t('message.saveSucceeded'));
                        data.loading = false;
                    }
                }).catch((err) => 
                {
                    console.log(err);
                    proxy.$message.error(proxy.$t('message.saveFailed'));
                    data.loading = false;
                });
            },
            handleBack ()
            {
                if (data.isSaveProject)
                {
                    editSpaceStore.saveProjectId('0');
                    return proxy.$router.replace('/project');
                }
                ElMessageBox.confirm(
                    '项目未保存，是否离开该页面？',
                    '提 示',
                    {
                        confirmButtonText: '确 认',
                        cancelButtonText: '取 消',
                        type: 'warning'
                    }
                )
                    .then(() => 
                    {
                        editSpaceStore.saveProjectId('0');
                        proxy.$router.replace('/project');
                    })
                    .catch(() => 
                    {
                        //
                    });
            },
            handleScreenFull ()
            {
                editSpaceStore.isFullWork = !editSpaceStore.isFullWork;
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
                    data.isAddGroup = false;
                    data.myGroupName = '';
                    data.myColorGroup = data.myColorList.length;
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
                editSpaceStore.setMyColorList(data.myColorList);
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
                editSpaceStore.setMyColorList(data.myColorList);
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
                            layerArr.push([j, i, data.emptyColor]);
                        }
                    }
                    data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData = layerArr;
                    methods.handleCancelSelect();
                    methods.reDraw();
                    // methods.handleFrameImg(data.ctx1);
                    return;
                }
                data.currentTool = index;
            },
            handleChangeCanvasSize (e, key)
            {
                if (e < 6 || e > 70) 
                {
                    data[key] = e < 6 ? 6 : e > 70 ? 70 : data[key];
                    proxy.$message.warning('画布不能小于6或大于70像素');
                }
                else
                {
                    data[key] = Number(e);
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
                console.log(data.canvasHeight, data.canvasWidth);
                
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
                            layerArr.push([j, i, data.emptyColor]);
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
                    // const worker = new Worker();
                    // 每个帧的图层都要进行比例调整
                    let layerOriginArr = [] as any;
                    for (let y = 0; y < data.canvasHeight; y++) 
                    {
                        for (let x = 0; x < data.canvasWidth; x++) 
                        {
                            layerOriginArr.push([x, y, data.emptyColor]);
                        }
                    }
                    data.worker.postMessage({originData:layerOriginArr, type:1, variables:JSON.parse(JSON.stringify(data.drawRecord))});
                    data.worker.onmessage = (event) => 
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
                    data.canvasBeginPos.centerX = data.canvasBeginPos.x + data.scale * data.canvasWidth / 2;
                    data.canvasBeginPos.centerY = data.canvasBeginPos.y + data.scale * data.canvasHeight / 2;
                }
                data.drawAreaList = [];
                data.ctx2.clearRect(0, 0, data.bgCanvas.width, data.bgCanvas.height);
                data.ctx2.globalAlpha = 0.25;
                for (let i = 0; i < data.canvasHeight; i++) 
                {
                    for (let j = 0; j < data.canvasWidth; j++) 
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
                        let originX = j * px + beginX;
                        let originY = i * py + beginY;
                        data.ctx2.fillRect(originX, originY, px, py);
                        data.drawAreaList.push([originX, originY]);
                        // data.drawRecord.push([i, j, data.emptyColor]);
                        
                    }
                }
                if (data.isShowReferenceLine)
                {
                    // 绘制参考线
                    data.ctx2.globalAlpha = 0.5;
                    data.ctx2.lineWidth = 2;
                    data.ctx2.strokeStyle = editSpaceStore.themeValue ? 'white' : 'black';
                    data.ctx2.beginPath();
                    data.ctx2.setLineDash([5, 3]);
                    data.ctx2.moveTo(beginX + (data.canvasWidth * data.scale) / 2, beginY);
                    data.ctx2.lineTo(beginX + (data.canvasWidth * data.scale) / 2, beginY + data.canvasHeight * data.scale);
                    data.ctx2.stroke();

                    data.ctx2.beginPath();
                    data.ctx2.moveTo(beginX, beginY + (data.canvasHeight * data.scale) / 2);
                    data.ctx2.lineTo(beginX + data.canvasWidth * data.scale, beginY + (data.canvasHeight * data.scale) / 2);
                    data.ctx2.stroke();
                }
                // 更新帧预览;
                // const imageData = data.ctx2.getImageData(beginX, beginY, data.canvasWidth * data.scale, data.canvasHeight * data.scale);
                // const dataURL = generateIamge(data.canvasWidth * data.scale, data.canvasHeight * data.scale, imageData);
                // data.projectData.frameImg = dataURL;
                // await editSpaceStore.saveProject(data.projectData);
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
                let centerX = data.canvasBeginPos.x + data.canvasWidth * data.scale / 2;
                let centerY = data.canvasBeginPos.y + data.canvasHeight * data.scale / 2;
                let currentLayerData1 = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData;
                let currentLayerData2 = JSON.parse(JSON.stringify(currentLayerData1));
                if (data.selectData.selectList.length)
                {
                    let currentSelectData = data.selectData.selectList;
                    for (let i = 0; i < currentSelectData.length; i++)
                    {
                        if (currentSelectData[i][0] > data.canvasWidth || currentSelectData[i][1] > data.canvasHeight) return;
                        let gridX = (currentSelectData[i][0] * data.scale) + data.canvasBeginPos.x;
                        let gridY = (currentSelectData[i][1] * data.scale) + data.canvasBeginPos.y;
                        realCoords.push([gridX, gridY, currentSelectData[i][2]]);
                    }
                }
                else
                {
                    for (let i = 0; i < currentLayerData2.length; i++)
                    {
                        if (currentLayerData2[i][0] > data.canvasWidth || currentLayerData2[i][1] > data.canvasHeight) return;
                        let gridX = (currentLayerData2[i][0] * data.scale) + data.canvasBeginPos.x;
                        let gridY = (currentLayerData2[i][1] * data.scale) + data.canvasBeginPos.y;
                        realCoords.push([gridX, gridY, currentLayerData2[i][2]]);
                    }
                }
                if (transform === 'hReverse')
                {
                    for (let i = 0; i < realCoords.length; i++)
                    {
                        // let newCol = (data.canvasWidth - 1) - currentLayerData[i][0];
                        // currentLayerData[i][0] = newCol;
                        if (realCoords[i][2] === data.emptyColor) continue;
                        let beginX = realCoords[i][0];
                        let beginY = realCoords[i][1];
                        let endX = centerX + (centerX - realCoords[i][0] - data.scale);
                        let endY = beginY;
                        const beginRow = Math.floor((beginY - data.drawAreaList[0][1]) / data.scale);
                        const beginCol = Math.floor((beginX - data.drawAreaList[0][0]) / data.scale);
                        const row = Math.floor((endY - data.drawAreaList[0][1]) / data.scale);
                        const col = Math.floor((endX - data.drawAreaList[0][0]) / data.scale);
                        let beginIndex = beginCol + beginRow * data.canvasWidth;
                        let endIndex = col + row * data.canvasWidth;
                        if (currentLayerData1[endIndex][2] === data.emptyColor)
                        {
                            currentLayerData2[endIndex][2] = realCoords[i][2];
                            currentLayerData2[beginIndex][2] = data.emptyColor;
                        }
                        else
                        {
                            currentLayerData2[endIndex][2] = realCoords[i][2];
                            currentLayerData2[beginIndex][2] = currentLayerData1[endIndex][2];
                        }
                        if (data.selectData.selectList.length)
                        {
                            data.selectData.selectList[i][0] = col;
                            data.selectData.selectList[i][1] = row;
                        }
                    }
                }
                else if (transform === 'vReverse')
                {
                    for (let i = 0; i < realCoords.length; i++)
                    {
                        // let newRow = (data.canvasHeight - 1) - currentLayerData[i][1];
                        // currentLayerData[i][1] = newRow;
                        if (realCoords[i][2] === data.emptyColor) continue;
                        let beginX = realCoords[i][0];
                        let beginY = realCoords[i][1];
                        let endX = beginX;
                        let endY = centerY + (centerY - realCoords[i][1] - data.scale);
                        const beginRow = Math.floor((beginY - data.drawAreaList[0][1]) / data.scale);
                        const beginCol = Math.floor((beginX - data.drawAreaList[0][0]) / data.scale);
                        const row = Math.floor((endY - data.drawAreaList[0][1]) / data.scale);
                        const col = Math.floor((endX - data.drawAreaList[0][0]) / data.scale);
                        let beginIndex = beginCol + beginRow * data.canvasWidth;
                        let endIndex = col + row * data.canvasWidth;
                        if (currentLayerData1[endIndex][2] === data.emptyColor)
                        {
                            currentLayerData2[endIndex][2] = realCoords[i][2];
                            currentLayerData2[beginIndex][2] = data.emptyColor;
                        }
                        else
                        {
                            currentLayerData2[endIndex][2] = realCoords[i][2];
                            currentLayerData2[beginIndex][2] = currentLayerData1[endIndex][2];
                        }
                        if (data.selectData.selectList.length)
                        {
                            data.selectData.selectList[i][0] = col;
                            data.selectData.selectList[i][1] = row;
                        }
                        // currentLayerData[beginIndex][2] = data.emptyColor;
                        // currentLayerData[endIndex][2] = realCoords[i][2];
                    }
                }
                else if (transform === 'ssz')
                {
                    for (let i = 0; i < realCoords.length; i++)
                    {
                        if (realCoords[i][2] === data.emptyColor) continue;
                        let relativeX = realCoords[i][0] - centerX;
                        let relativeY = realCoords[i][1] - centerY;
                        let rotateX = -relativeY;
                        let rotateY = relativeX;
                        let endX = rotateX + centerX - data.scale;
                        let endY = rotateY + centerY;
                        
                        // let circleX = realCoords[i][0] + data.scale / 2;
                        // let circleY = realCoords[i][1] + data.scale / 2;
                        // let relativeX = circleX - centerX;
                        // let relativeY = circleY - centerY;
                        // let rotateX = -relativeY;
                        // let rotateY = relativeX;
                        // let endX = rotateX + centerX;
                        // let endY = rotateY + centerY;

                        // console.log(relativeX, relativeY, endX, endY);
                        
                        const beginRow = Math.floor((realCoords[i][1] - data.drawAreaList[0][1]) / data.scale);
                        const beginCol = Math.floor((realCoords[i][0] - data.drawAreaList[0][0]) / data.scale);
                        const row = Math.floor((endY - data.drawAreaList[0][1]) / data.scale);
                        const col = Math.floor((endX - data.drawAreaList[0][0]) / data.scale);
                        // currentLayerData[i][0] = col;
                        // currentLayerData[i][1] = row;
                        let endIndex = col + row * data.canvasWidth;
                        let beginIndex = beginCol + beginRow * data.canvasWidth;
                        if (currentLayerData1[endIndex][2] === data.emptyColor)
                        {
                            currentLayerData2[endIndex][2] = realCoords[i][2];
                            currentLayerData2[beginIndex][2] = data.emptyColor;
                        }
                        else
                        {
                            currentLayerData2[endIndex][2] = realCoords[i][2];
                            currentLayerData2[beginIndex][2] = currentLayerData1[endIndex][2];
                        }
                        if (data.selectData.selectList.length)
                        {
                            data.selectData.selectList[i][0] = col;
                            data.selectData.selectList[i][1] = row;
                        }
                        // currentLayerData[beginIndex][2] = data.emptyColor;
                        // currentLayerData[endIndex][2] = realCoords[i][2];
                    }
                }
                else if (transform === 'nsz')
                {
                    for (let i = 0; i < realCoords.length; i++)
                    {
                        if (realCoords[i][2] === data.emptyColor) continue;
                        let relativeX = realCoords[i][0] - centerX;
                        let relativeY = realCoords[i][1] - centerY;
                        let rotateX = relativeY;
                        let rotateY = -relativeX;
                        let endX = rotateX + centerX;
                        let endY = rotateY + centerY - data.scale;

                        const beginRow = Math.floor((realCoords[i][1] - data.drawAreaList[0][1]) / data.scale);
                        const beginCol = Math.floor((realCoords[i][0] - data.drawAreaList[0][0]) / data.scale);
                        const row = Math.floor((endY - data.drawAreaList[0][1]) / data.scale);
                        const col = Math.floor((endX - data.drawAreaList[0][0]) / data.scale);
                        // currentLayerData[i][0] = col;
                        // currentLayerData[i][1] = row;
                        let endIndex = col + row * data.canvasWidth;
                        let beginIndex = beginCol + beginRow * data.canvasWidth;
                        if (currentLayerData1[endIndex][2] === data.emptyColor)
                        {
                            currentLayerData2[endIndex][2] = realCoords[i][2];
                            currentLayerData2[beginIndex][2] = data.emptyColor;
                        }
                        else
                        {
                            currentLayerData2[endIndex][2] = realCoords[i][2];
                            currentLayerData2[beginIndex][2] = currentLayerData1[endIndex][2];
                        }
                        if (data.selectData.selectList.length)
                        {
                            data.selectData.selectList[i][0] = col;
                            data.selectData.selectList[i][1] = row;
                        }
                        // currentLayerData[beginIndex][2] = data.emptyColor;
                        // currentLayerData[endIndex][2] = realCoords[i][2];
                    }
                }
                // let newArr:any = [];
                // for (let i = 0; i < data.canvasHeight; i++) 
                // {
                //     let arr:any = [];
                //     for (let j = 0; j < data.canvasWidth; j++) 
                //     {
                //         arr.unshift(currentLayerData[j + i * data.canvasHeight]);
                //     }
                //     newArr = [...newArr, ...arr];
                // }
                data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData = currentLayerData2;

                // console.log(newArr);
                
                // data.ctx1.clearRect(0, 0, data.canvas.width, data.canvas.height);
                methods.reDraw();
            },
            handleWheelEvent (event)
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
            },
            startDrawing () 
            {
                data.canvas.addEventListener('mousedown', methods.start);
                data.canvas.addEventListener('mousemove', methods.draw);
                data.canvas.addEventListener('mouseup', methods.stop);
                data.canvas.addEventListener('mouseout', methods.leave);
                data.canvas.addEventListener('wheel', methods.handleWheelEvent);
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
                        if (data.selectData.selectList.length)
                        {
                            return proxy.$message.warning('请先取消选中区域');
                        }
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
                        if (data.selectData.selectList.length)
                        {
                            return proxy.$message.warning('请先取消选中区域');
                        }
                        data.isErasering = true;
                        methods.removeDrawRecord([col, row]);
                    }
                    else if (data.currentTool === 2)
                    {
                        console.log(row, col);
                        let currentFrame = data.drawRecord[data.currentFrameIndex].layer;
                        // for (let i = currentFrame.length - 1; i >= 0; i--)
                        let index = col + row * data.canvasWidth;
                        for (let i = 0; i < currentFrame.length; i++)
                        {
                            if (currentFrame[i].isRender)
                            {
                                if (currentFrame[i].layerData[index][2] !== data.emptyColor) 
                                {
                                    data.brushColor = currentFrame[i].layerData[index][2];
                                    if (proxy.$refs.ReplaceColorDialog.dialogVisible)
                                    {
                                        proxy.$refs.ReplaceColorDialog.handleUpdate(data.brushColor);
                                    }
                                    break;
                                }
                                else
                                {
                                    continue;
                                }
                            }
                            // for (let j = 0; j < currentFrame[i].layerData.length; j++)
                            // {
                                
                            //     if (currentFrame[i].layerData[j][0] === col && currentFrame[i].layerData[j][1] === row)
                            //     {
                            //         if (currentFrame[i].layerData[j][2] !== data.emptyColor)
                            //         {
                            //             data.brushColor = currentFrame[i].layerData[j][2];
                            //             break;
                            //         }
                            //     }
                            // }
                        }
                        
                    }
                    else if (data.currentTool === 3)
                    {
                        if (data.selectData.selectList.length)
                        {
                            return proxy.$message.warning('请先取消选中区域');
                        }
                        // 绘制形状
                        data.isDrawShape = true;
                        let gridX = (col * data.scale) + data.canvasBeginPos.x;
                        let gridY = (row * data.scale) + data.canvasBeginPos.y;
                        data.lastX = gridX + data.scale / 2;
                        data.lastY = gridY + data.scale / 2;

                        // methods.addShapeList(col, row);
                    }
                    else if (data.currentTool === 4)
                    {
                        let replacementColor = isHexColor(data.brushColor) ? rgbaToHex(hexToRgba(data.brushColor)) : rgbaToHex(extractRgbaValues(data.brushColor));
                        if (data.selectData.selectList.length)
                        {
                            // let replacementColor = isHexColor(data.brushColor) ? rgbaToHex(hexToRgba(data.brushColor)) : rgbaToHex(extractRgbaValues(data.brushColor));
                            methods.handleReplaceColor(replacementColor);
                            return;
                        }
                        const targetColor = data.ctx1.getImageData(event.offsetX, event.offsetY, 1, 1).data;
                        // console.log(data.drawRecord);
                        // let replacementColor = isHexColor(data.brushColor) ? rgbaToHex(hexToRgba(data.brushColor)) : rgbaToHex(extractRgbaValues(data.brushColor));
                        // console.log(replacementColor);
                        console.log(data.brushColor, replacementColor);
                        methods.fillChunk(col, row, rgbaToHex(targetColor), replacementColor);

                    }
                    else if (data.currentTool === 7)
                    {
                        if (data.selectData.selectList.length)
                        {
                            return proxy.$message.warning('请先取消选中区域');
                        }
                        if (!data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].isRender) return;
                        // 获取可移动的坐标数组和记录初始点击的行列号
                        data.isMoving = true;
                        data.moveData.x = col;
                        data.moveData.y = row;
                        data.moveData.list = JSON.parse(JSON.stringify(removeNullArray(data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData.map((item) => 
                        {
                            if (item[2] !== data.emptyColor) 
                            {
                                return item;
                            }
                            return null;
                        }))));
                        
                        
                        console.log(data.moveData);
                        
                    }
                    else if (data.currentTool === 8)
                    {
                        if (!data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].isRender) return;
                        data.isSelecting = true;
                        
                        data.selectData.x = col;
                        data.selectData.y = row;
                        data.selectData.originList = JSON.parse(JSON.stringify(removeNullArray(data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData.map((item) => 
                        {
                            if (item[2] !== data.emptyColor) 
                            {
                                return item;
                            }
                            return null;
                        }))));
                        methods.draw(event); 
                        // let value = data.selectData.originList.find((item) => item[0] === col && item[1] === row);
                        // if (value) 
                        // {
                        // if (data.isShift) return;
                        // let flag = data.selectData.selectList.findIndex((item) => item[0] === col && item[1] === row); 
                        // if (flag >= 0) 
                        // {
                        //     let arr = data.selectData.selectList[flag];
                        //     let gridX = (arr[0] * data.scale) + data.canvasBeginPos.x;
                        //     let gridY = (arr[1] * data.scale) + data.canvasBeginPos.y;
                        //     data.ctx1.fillStyle = arr[2];
                        //     data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                        //     data.selectData.selectList.splice(flag, 1);
                        //     // data.selectData.selectList.push([data.selectData.x, data.selectData.y, value[2]]);
                        //     // methods.draw(event); 
                        // }
                        // else
                        // {
                        //     methods.draw(event); 
                        // }
                        // }
                    }
                }
            },
            handleReplaceColor (replacementColor)
            {
                // 替换颜色
                for (let i = 0; i < data.selectData.selectList.length; i++)
                {
                    data.selectData.selectList[i][2] = replacementColor;
                    let col = data.selectData.selectList[i][0];
                    let row = data.selectData.selectList[i][1];
                    let index = col + row * data.canvasHeight;
                    data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData[index][2] = replacementColor;
                }
                methods.reDraw();
            },

            fillChunk (x, y, targetColor, replacementColor)
            {
                console.log(targetColor, replacementColor, data.drawRecord);
                if (targetColor === replacementColor) return;
                const stack = [[x, y]];
                const isSameColor = (col, row, color) =>
                {
                    let flag = false;
                    let currentLayerData = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData;
                    // for (let i = 0; i < currentLayerData.length; i++)
                    // {
                        
                    //     if (currentLayerData[i][0] === col && currentLayerData[i][1] === row && currentLayerData[i][2] === color)
                    //     {
                    //         flag = true;
                    //         break;
                    //     }
                    // }
                    if (col >= 0 && col < data.canvasWidth && row >= 0 && row < data.canvasHeight)
                    {
                        let index = col + row * data.canvasWidth;
                        // console.log(col, row, index);
                        
                        if (currentLayerData[index][2] === color) flag = true;
                    }
                    
                    return flag;
                };
                const setColor = (col, row, color) => 
                {
                    let currentLayerData = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData;
                    // for (let i = 0; i < currentLayerData.length; i++)
                    // {
                    //     if (currentLayerData[i][0] === col && currentLayerData[i][1] === row)
                    //     {
                    //         currentLayerData[i][2] = color;
                    //         break;
                    //     }
                    // }
                    if (col >= 0 && col < data.canvasWidth && row >= 0 && row < data.canvasHeight)
                    {
                        let index = col + row * data.canvasWidth;
                        currentLayerData[index][2] = color;
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
                    if (data.isShift && data.isMoving && data.isSelecting)
                    {
                        data.canvas.style.cursor = 'move';
                    }
                    else
                    {
                        data.canvas.style.cursor = '';
                        methods.addCursorClass();
                    }
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
                                methods.reDraw(false, false);
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
                                // console.log(arr);
                                methods.reDraw(false);
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
                            // if (gridX + data.scale / 2 === data.lastX || gridY +  data.scale / 2 === data.lastY)
                            // {
                            if (data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].isRender)
                            {
                                data.ctx1.fillStyle = data.brushColor;
                                // let gridX = (col * data.scale) + data.canvasBeginPos.x;
                                // let gridY = (row * data.scale) + data.canvasBeginPos.y;
                                let l = data.drawShapeList.length;
                                let startX = data.drawShapeList[0][0];
                                let startY = data.drawShapeList[0][1];
                                let endX = data.drawShapeList[l - 1][0];
                                let endY = data.drawShapeList[l - 1][1];
                                let arr = methods.drawLine(startX, startY, endX, endY);
                                // console.log(arr);
                                methods.reDraw(false);
                                for (let i = 0; i < arr.length; i++)
                                {
                                    if (arr[i][0] > data.canvasWidth || arr[i][1] > data.canvasHeight) return;
                                    let gridX = (arr[i][0] * data.scale) + data.canvasBeginPos.x;
                                    let gridY = (arr[i][1] * data.scale) + data.canvasBeginPos.y;
                                    data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                                }
                            }
                            // }
                            
                        }
                    }
                    if (data.isMoving && !data.isSelecting)
                    {
                        // if (!data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].isRender) return;
                        let difX = col - data.moveData.x;
                        let difY = row - data.moveData.y;
                        
                        for (let i = 0; i < data.moveData.list.length; i++)
                        {
                            data.moveData.list[i][0] += difX;
                            data.moveData.list[i][1] += difY;
                        }
                        
                        console.log(data.moveData);
                        data.moveData.x = col;
                        data.moveData.y = row;
                        // data.ctx1.clearRect(0, 0, data.canvas.width, data.canvas.height);
                        methods.reDraw(false, false, data.canvasBeginPos, false);
                        let maxX = data.moveData.list[0][0];
                        let minX = data.moveData.list[0][0];
                        let maxY = data.moveData.list[0][1];
                        let minY = data.moveData.list[0][1];
                        for (let i = 0; i < data.moveData.list.length; i++)
                        {
                            if (data.moveData.list[i][0] >= data.canvasWidth || data.moveData.list[i][1] >= data.canvasHeight || data.moveData.list[i][0] < 0 || data.moveData.list[i][1] < 0) continue;
                            let gridX = (data.moveData.list[i][0] * data.scale) + data.canvasBeginPos.x;
                            let gridY = (data.moveData.list[i][1] * data.scale) + data.canvasBeginPos.y;
                            data.ctx1.fillStyle = data.moveData.list[i][2];
                            data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                            const x = data.moveData.list[i][0];
                            const y = data.moveData.list[i][1];

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
                        let realmaxX = (maxX * data.scale) + data.canvasBeginPos.x + data.scale;
                        let realminX = (minX * data.scale) + data.canvasBeginPos.x;
                        let realmaxY = (maxY * data.scale) + data.canvasBeginPos.y + data.scale;
                        let realminY = (minY * data.scale) + data.canvasBeginPos.y;
                        let centerX = (realmaxX - realminX) / 2 + realminX;
                        let centerY = (realmaxY - realminY) / 2 + realminY;
                        // let canvasCenterX = data.canvasBeginPos.x + data.scale * data.canvasWidth / 2;
                        // let canvasCenterY = data.canvasBeginPos.y + data.scale * data.canvasHeight / 2;
                        data.ctx2.globalAlpha = 0.8;
                        data.ctx2.lineWidth = 3;
                        data.ctx2.strokeStyle = '#ffaf02ff';
                        data.ctx2.setLineDash([5, 3]);
                        let thresholdX = Math.abs(centerX - data.canvasBeginPos.centerX);
                        let thresholdY = Math.abs(centerY - data.canvasBeginPos.centerY);
                        if (thresholdX >= 0 && thresholdX <= data.scale / 2)
                        {
                            data.ctx2.beginPath();
                            data.ctx2.moveTo(data.canvasBeginPos.centerX, data.canvasBeginPos.y);
                            data.ctx2.lineTo(data.canvasBeginPos.centerX, data.canvasBeginPos.y + data.canvasHeight * data.scale);
                            data.ctx2.stroke();
                        }
                        
                        if (thresholdY >= 0 && thresholdY <= data.scale / 2)
                        {
                            data.ctx2.beginPath();
                            data.ctx2.moveTo(data.canvasBeginPos.x, data.canvasBeginPos.centerY);
                            data.ctx2.lineTo(data.canvasBeginPos.x + data.canvasWidth * data.scale, data.canvasBeginPos.centerY);
                            data.ctx2.stroke();
                        }

                        if (thresholdX > data.scale / 2  || thresholdY > data.scale / 2)
                        {
                            methods.drawPixelArea();
                            if (thresholdX >= 0 && thresholdX <= data.scale / 2)
                            {
                                data.ctx2.globalAlpha = 0.8;
                                data.ctx2.beginPath();
                                data.ctx2.moveTo(data.canvasBeginPos.centerX, data.canvasBeginPos.y);
                                data.ctx2.lineTo(data.canvasBeginPos.centerX, data.canvasBeginPos.y + data.canvasHeight * data.scale);
                                data.ctx2.stroke();
                            }
                            if (thresholdY >= 0 && thresholdY <= data.scale / 2)
                            {
                                data.ctx2.globalAlpha = 0.8;
                                data.ctx2.beginPath();
                                data.ctx2.moveTo(data.canvasBeginPos.x, data.canvasBeginPos.centerY);
                                data.ctx2.lineTo(data.canvasBeginPos.x + data.canvasWidth * data.scale, data.canvasBeginPos.centerY);
                                data.ctx2.stroke();
                            }
                        }
                        
                    }
                    if (data.isSelecting)
                    {
                        if (data.isMoving)
                        {
                            data.moveData.x = data.selectData.x;
                            data.moveData.y = data.selectData.y;
                            data.moveData.list = JSON.parse(JSON.stringify(data.selectData.selectList));
                            let difX = col - data.moveData.x;
                            let difY = row - data.moveData.y;
                            console.log(col, row, data.moveData.x, data.moveData.y);
                            
                            console.log(difX, difY);
                            
                            for (let i = 0; i < data.moveData.list.length; i++)
                            {
                                data.moveData.list[i][0] += difX;
                                data.moveData.list[i][1] += difY;
                            }
                            data.moveData.x = col;
                            data.moveData.y = row;
                            console.log(data.moveData.x, data.moveData.y, data.selectData.x, data.selectData.y);
                            data.ctx1.clearRect(0, 0, data.canvas.width, data.canvas.height);
                            for (let i = 0; i < data.selectData.originList.length; i++)
                            {
                                if (data.selectData.originList[i][0] >= data.canvasWidth || data.selectData.originList[i][1] >= data.canvasHeight || data.selectData.originList[i][0] < 0 || data.selectData.originList[i][1] < 0) continue;
                                if (!data.selectData.copyList.length)
                                {
                                    if (data.selectData.selectList.find((item) => data.selectData.originList[i][0] === item[0] && data.selectData.originList[i][1] === item[1])) continue;
                                }
                                let gridX = (data.selectData.originList[i][0] * data.scale) + data.canvasBeginPos.x;
                                let gridY = (data.selectData.originList[i][1] * data.scale) + data.canvasBeginPos.y;
                                data.ctx1.fillStyle = data.selectData.originList[i][2];
                                data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                            }
                            console.log(data.moveData.list);
                            for (let i = 0; i < data.moveData.list.length; i++)
                            {
                                if (data.moveData.list[i][0] >= data.canvasWidth || data.moveData.list[i][1] >= data.canvasHeight || data.moveData.list[i][0] < 0 || data.moveData.list[i][1] < 0) continue;
                                let gridX = (data.moveData.list[i][0] * data.scale) + data.canvasBeginPos.x;
                                let gridY = (data.moveData.list[i][1] * data.scale) + data.canvasBeginPos.y;
                                data.ctx1.fillStyle = data.moveData.list[i][2];
                                data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                                data.ctx1.fillStyle = data.selectActiveColor;
                                data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                                const centerX = gridX + data.scale / 2;
                                const centerY = gridY + data.scale / 2;
                                // 绘制圆点
                                data.ctx1.beginPath();
                                data.ctx1.arc(centerX, centerY, 5, 0, 2 * Math.PI);
                                data.ctx1.fillStyle = '#3c8bfbff';
                                data.ctx1.fill();
                            }
                            return;
                        }
                        let value = data.selectData.originList.find((item) => item[0] === col && item[1] === row);
                        if (value)
                        {
                            data.selectData.x = col;
                            data.selectData.y = row;
                            
                            let flag = data.selectData.selectList.findIndex((v) =>
                            {
                                return v[0] === data.selectData.x && v[1] === data.selectData.y;
                            }); 
                            if (flag < 0) 
                            {
                                data.selectData.selectList.push([data.selectData.x, data.selectData.y, value[2]]);
                                for (let i = 0; i < data.selectData.selectList.length; i++)
                                {
                                    if (data.selectData.selectList[i][0] >= data.canvasWidth || data.selectData.selectList[i][1] >= data.canvasHeight || data.selectData.selectList[i][0] < 0 || data.selectData.selectList[i][1] < 0) continue;
                                    let gridX = (data.selectData.selectList[i][0] * data.scale) + data.canvasBeginPos.x;
                                    let gridY = (data.selectData.selectList[i][1] * data.scale) + data.canvasBeginPos.y;
                                    data.ctx1.fillStyle = data.selectData.selectList[i][2];
                                    data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                                    data.ctx1.fillStyle = data.selectActiveColor;
                                    data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                                    const centerX = gridX + data.scale / 2;
                                    const centerY = gridY + data.scale / 2;
                                    // 绘制圆点
                                    data.ctx1.beginPath();
                                    data.ctx1.arc(centerX, centerY, 5, 0, 2 * Math.PI);
                                    data.ctx1.fillStyle = '#3c8bfbff';
                                    data.ctx1.fill();
                                }
                            }
                            // else
                            // {
                            //     let arr = data.selectData.selectList[flag];
                            //     let gridX = (arr[0] * data.scale) + data.canvasBeginPos.x;
                            //     let gridY = (arr[1] * data.scale) + data.canvasBeginPos.y;
                            //     data.ctx1.fillStyle = arr[2];
                            //     data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                            //     data.selectData.selectList.splice(flag, 1);
                            // }
                        }
                    }
                    
                }
                else
                {
                    // data.canvas.style.cursor = '';
                    data.canvas.classList = '';
                }
                
            },
            handleSelect (value)
            {
                // if (value === 'move')
                // {
                //     if (data.selectData.selectList.length)
                //     {
                //         data.isMoving = true;
                //         data.isShift = true;
                //     }
                // }
                // else
                // {
                //     //
                // }
            },

            handleCancelSelect ()
            {
                // for (let i = 0; i < data.selectData.selectList.length; i++)
                // {
                //     if (data.selectData.selectList[i][0] >= data.canvasWidth || data.selectData.selectList[i][1] >= data.canvasHeight || data.selectData.selectList[i][0] < 0 || data.selectData.selectList[i][1] < 0) continue;
                //     let gridX = (data.selectData.selectList[i][0] * data.scale) + data.canvasBeginPos.x;
                //     let gridY = (data.selectData.selectList[i][1] * data.scale) + data.canvasBeginPos.y;
                //     data.ctx1.fillStyle = data.selectData.selectList[i][2];
                //     data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                // }
                if (data.selectData.selectList.length)
                {
                    data.selectData.selectList = [];
                    data.selectData.copyList = [];
                    data.isMoving = false;
                    data.isSelecting = false;
                    methods.reDraw(true, false);
                }
            },

            handleRemoveSelect ()
            {
                if (!data.selectData.selectList.length) return;
                for (let i = 0; i < data.selectData.selectList.length; i++)
                {
                    if (data.selectData.selectList[i][0] >= data.canvasWidth || data.selectData.selectList[i][1] >= data.canvasHeight || data.selectData.selectList[i][0] < 0 || data.selectData.selectList[i][1] < 0) continue;
                    let gridX = (data.selectData.selectList[i][0] * data.scale) + data.canvasBeginPos.x;
                    let gridY = (data.selectData.selectList[i][1] * data.scale) + data.canvasBeginPos.y;
                    data.ctx1.fillStyle = data.selectData.selectList[i][2];
                    data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                    methods.removeDrawRecord([data.selectData.selectList[i][0], data.selectData.selectList[i][1]], false);
                }
                data.selectData.selectList = [];
                data.selectData.copyList = [];
                data.isMoving = false;
                data.isSelecting = false;
                methods.reDraw();
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
                    let centerX = beginX + data.scale * data.canvasWidth / 2;
                    
                    let centerY = beginY + data.scale * data.canvasHeight / 2;
                    
                    methods.drawPixelArea(beginX, beginY);
                    methods.reDraw(false, false, { x:beginX, y:beginY, centerX, centerY });
                    // methods.reDrawSelectData({ x:beginX, y:beginY });
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

            drawLine (x1, y1, x2, y2)
            {
                const dx = Math.abs(x2 - x1);
                const sx = x1 < x2 ? 1 : -1;
                const dy = -Math.abs(y2 - y1);
                const sy = y1 < y2 ? 1 : -1;
                let e2, er = dx + dy,
                    end = false;
                let arr:any = [];
                while (!end) 
                {
                    if (x1 >= 0 && x1 <= data.canvasWidth && y1 >= 0 && y1 <= data.canvasHeight) 
                    {
                        arr.push([x1, y1]);
                    }
                    if (x1 === x2 && y1 === y2) 
                    {
                        end = true;
                    } 
                    else 
                    {
                        e2 = 2 * er;
                        if (e2 > dy) 
                        {
                            er += dy;
                            x1 += sx;
                        }
                        if (e2 < dx) 
                        {
                            er += dx;
                            y1 += sy;
                        }
                    }
                }
                console.log(arr);
                return unique2DArray(arr);
                
            },

            drawRect (x1, y1, x2, y2)
            {
                let xl = Math.abs(x1 - x2);
                let yl = Math.abs(y1 - y2);
                let arr = [] as any;
                if (yl <= 1)
                {
                    // 中间不为空
                    for (let i = 0; i < (yl + 1); i++)
                    {
                        for (let j = 0; j < (xl + 1); j++)
                        {
                            let htx, hty;
                            if (x1 > x2)
                            {
                                htx = x1 - j;
                                hty = y1 - i;
                                arr.push([htx, hty]);
                            }
                            else
                            {
                                htx = x1 + j;
                                hty = y1 + i;
                                arr.push([htx, hty]);
                            }
                        }
                        
                    }
                }
                else 
                {
                    // 中间为空
                    for (let i = 0; i <= xl; i++)
                    {
                        let htx, hty, hbx, hby;
                        if (x1 > x2)
                        {
                            htx = x1 - i;
                            hty = y1;
                            arr.push([htx, hty]);
                            hbx = x2 + i;
                            hby = y2;
                            arr.push([hbx, hby]);
                        }
                        else
                        {
                            htx = x1 + i;
                            hty = y1;
                            arr.push([htx, hty]);
                            hbx = x2 - i;
                            hby = y2;
                            arr.push([hbx, hby]);
                        }
                    }
                    for (let i = 0; i <= yl; i++)
                    {
                        let htx, hty, hbx, hby;
                        if (y1 > y2)
                        {
                            htx = x1;
                            hty = y1 - i;
                            arr.push([htx, hty]);
                            hbx = x2;
                            hby = y2 + i;
                            arr.push([hbx, hby]);
                        }
                        else
                        {
                            htx = x1;
                            hty = y1 + i;
                            arr.push([htx, hty]);
                            hbx = x2;
                            hby = y2 - i;
                            arr.push([hbx, hby]);
                        }
                    }

                }
                return unique2DArray(arr);
            },

            drawFillRect (x1, y1, x2, y2)
            {
                let xl = Math.abs(x1 - x2);
                let yl = Math.abs(y1 - y2);
                let arr = [] as any;
                if (yl <= 1)
                {
                    // 中间不为空
                    for (let i = 0; i < (yl + 1); i++)
                    {
                        for (let j = 0; j < (xl + 1); j++)
                        {
                            let htx, hty;
                            if (x1 > x2)
                            {
                                htx = x1 - j;
                                hty = y1 - i;
                                arr.push([htx, hty, data.brushColor]);
                            }
                            else
                            {
                                htx = x1 + j;
                                hty = y1 + i;
                                arr.push([htx, hty, data.brushColor]);
                            }
                        }
                        
                    }
                }
                else 
                {
                    for (let i = 0; i < (yl + 1); i++)
                    {
                        for (let j = 0; j < (xl + 1); j++)
                        {
                            let htx, hty;
                            if (x1 > x2)
                            {
                                htx = x1 - j;
                                hty = y1 - i;
                                arr.push([htx, hty, data.shapeFillColor]);
                            }
                            else
                            {
                                htx = x1 + j;
                                hty = y1 + i;
                                arr.push([htx, hty, data.shapeFillColor]);
                            }
                        }
                    }
                    // 中间为空
                    for (let i = 0; i <= xl; i++)
                    {
                        let htx, hty, hbx, hby;
                        if (x1 > x2)
                        {
                            htx = x1 - i;
                            hty = y1;
                            arr.push([htx, hty, data.brushColor]);
                            hbx = x2 + i;
                            hby = y2;
                            arr.push([hbx, hby, data.brushColor]);
                        }
                        else
                        {
                            htx = x1 + i;
                            hty = y1;
                            arr.push([htx, hty, data.brushColor]);
                            hbx = x2 - i;
                            hby = y2;
                            arr.push([hbx, hby, data.brushColor]);
                        }
                    }
                    for (let i = 0; i <= yl; i++)
                    {
                        let htx, hty, hbx, hby;
                        if (y1 > y2)
                        {
                            htx = x1;
                            hty = y1 - i;
                            arr.push([htx, hty, data.brushColor]);
                            hbx = x2;
                            hby = y2 + i;
                            arr.push([hbx, hby, data.brushColor]);
                        }
                        else
                        {
                            htx = x1;
                            hty = y1 + i;
                            arr.push([htx, hty, data.brushColor]);
                            hbx = x2;
                            hby = y2 - i;
                            arr.push([hbx, hby, data.brushColor]);
                        }
                    }

                }
                return unique2DArray(arr);
            },

            handleFrameImg (ctx, isAddHistory = true)
            {
                let beginX = data.drawAreaList[0][0];
                let beginY = data.drawAreaList[0][1];
                const imageData = ctx.getImageData(beginX, beginY, data.canvasWidth * data.scale, data.canvasHeight * data.scale);
                const dataURL = generateIamge(data.canvasWidth * data.scale, data.canvasHeight * data.scale, imageData);
                data.drawRecord[data.currentFrameIndex].currentFrameImg = dataURL;
                // 处理当前帧的颜色统计
                data.worker.postMessage({
                    type:3,
                    currentFrameData:JSON.parse(JSON.stringify(data.drawRecord[data.currentFrameIndex].layer))
                });
                data.worker.onmessage = (event) => 
                {
                    data.colorStatList = event.data;
                };
                if (isAddHistory) methods.handleAddHistory();
            },

            // handleRenderAllFrameImg (ctx)
            // {
            //     let beginX = data.drawAreaList[0][0];
            //     let beginY = data.drawAreaList[0][1];
            //     const imageData = ctx.getImageData(beginX, beginY, data.canvasWidth * data.scale, data.canvasHeight * data.scale);
            //     const dataURL = generateIamge(data.canvasWidth * data.scale, data.canvasHeight * data.scale, imageData);
            //     data.drawRecord[data.currentFrameIndex].currentFrameImg = dataURL;
            // },

            addDrawRecord (value, isUpdate = true)
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
                if (isUpdate)
                {
                    // 更新帧图片
                    data.FrameTimer && clearTimeout(data.FrameTimer);
                    data.FrameTimer = setTimeout(() => 
                    {
                        methods.handleFrameImg(data.ctx1);
                    }, 200);
                }
                
            },

            removeDrawRecord (value, isRedraw = true)
            {
                let arr = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData;
                console.log(data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData);
                
                let index = value[0] + value[1] * data.canvasHeight;
                if (arr[index][2] === data.emptyColor) return;
                arr[index][2] = data.emptyColor;
                // for (let v = 0; v < arr.length; v++)
                // {
                //     if (arr[v][0] === value[0] && arr[v][1] === value[1])
                //     {
                //         arr[v][2] = data.emptyColor;
                //         break;
                //     }
                // }
                if (isRedraw) methods.reDraw();
            },

            reDraw (isRenderFrameImg = true, isAddHistory = true, beginPos = data.canvasBeginPos, isSelfRender = true)
            {
                // 重新绘制内容
                console.log(data.drawRecord);
                
                let count = 0;
                data.ctx1.clearRect(0, 0, data.canvas.width, data.canvas.height);
                if (data.drawRecord.length - 1 < data.currentFrameIndex) data.currentFrameIndex = data.drawRecord.length - 1;
                let arr = data.drawRecord[data.currentFrameIndex].layer;
                let currentLayerId = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerId;
                for (let i = arr.length - 1; i >= 0; i--)
                {
                    // 从最后一项开始绘制
                    if (!isSelfRender && arr[i].layerId === currentLayerId) continue;
                    if (arr[i].isRender)
                    {
                        for (let v = 0; v < arr[i].layerData.length; v++)
                        {
                            if (arr[i].layerData[v][0] >= data.canvasWidth || arr[i].layerData[v][1] >= data.canvasHeight || arr[i].layerData[v][0] < 0 || arr[i].layerData[v][1] < 0) continue;
                            if (arr[i].layerData[v][2] !== data.emptyColor) 
                            {
                                let gridX = (arr[i].layerData[v][0] * data.scale) + beginPos.x;
                                let gridY = (arr[i].layerData[v][1] * data.scale) + beginPos.y;
                                data.ctx1.fillStyle = arr[i].layerData[v][2];
                                data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                                count++;
                            }
                        }
                        methods.reDrawSelectData(beginPos);
                    }
                }
                // methods.reDrawSelectData(beginPos);
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
                if (data.isMoving && !data.isSelecting)
                {
                    let layerData = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData;
                    for (let i = 0; i < layerData.length; i++)
                    {
                        let findData = data.moveData.list.find((item) => item[0] === layerData[i][0] && item[1] === layerData[i][1]);
                        if (findData)
                        {
                            layerData[i][2] = findData[2];
                        }
                        else
                        {
                            layerData[i][2] = data.emptyColor;
                        }
                    }
                    data.moveData.list = [];
                    data.isMoving = false;
                    methods.reDraw();
                    
                }
                if (data.isSelecting)
                {
                    if (!data.isMoving)
                    {
                        // 没有移动
                        data.isSelecting = false;
                        return;
                    }
                    // 有移动
                    let layerData = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData;
                    for (let i = 0; i < layerData.length; i++)
                    {
                        let findData = data.selectData.selectList.find((item) => item[0] === layerData[i][0] && item[1] === layerData[i][1]);
                        if (findData)
                        {
                            layerData[i][2] = data.selectData.copyList.length ? findData[2] : data.emptyColor;
                        }
                        let findData1 = data.moveData.list.find((item) => item[0] === layerData[i][0] && item[1] === layerData[i][1]);
                        if (findData1)
                        {
                            layerData[i][2] = findData1[2];
                        }
                    }
                    data.selectData.selectList = JSON.parse(JSON.stringify(data.moveData.list));
                    data.selectData.copyList = [];
                    data.isSelecting = false;
                    data.isMoving = false;
                    methods.reDraw();
                }
                methods.saveShapeData();
            },
            leave ()
            {
                methods.stop();
                data.canvas.className = '';
            },
            reDrawSelectData (beginPos = data.canvasBeginPos)
            {
                if (!data.selectData.selectList.length) return;
                for (let i = 0; i < data.selectData.selectList.length; i++)
                {
                    if (data.selectData.selectList[i][0] >= data.canvasWidth || data.selectData.selectList[i][1] >= data.canvasHeight || data.selectData.selectList[i][0] < 0 || data.selectData.selectList[i][1] < 0) continue;
                    let gridX = (data.selectData.selectList[i][0] * data.scale) + beginPos.x;
                    let gridY = (data.selectData.selectList[i][1] * data.scale) + beginPos.y;
                    data.ctx1.fillStyle = data.selectActiveColor;
                    data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                    const centerX = gridX + data.scale / 2;
                    const centerY = gridY + data.scale / 2;
                    // 绘制圆点
                    data.ctx1.beginPath();
                    data.ctx1.arc(centerX, centerY, 5, 0, 2 * Math.PI);
                    data.ctx1.fillStyle = '#3c8bfbff';
                    data.ctx1.fill();
                }
            },
            saveShapeData ()
            {
                
                if (data.isDrawShape && data.drawShapeList.length)
                {
                    if (data.currentDrawShape === 'circle')
                    {
                        let l = data.drawShapeList.length;
                        let startX = data.drawShapeList[0][0];
                        let startY = data.drawShapeList[0][1];
                        let endX = data.drawShapeList[l - 1][0];
                        let endY = data.drawShapeList[l - 1][1];
                        let arr = methods.drawCircle(startX, startY, endX, endY, data.brushSize);
                        for (let i = 0; i < arr.length; i++)
                        {
                            methods.addDrawRecord([arr[i][0], arr[i][1], data.brushColor], false);
                        }
                    }
                    else if (data.currentDrawShape === 'rect')
                    {
                        let l = data.drawShapeList.length;
                        let startX = data.drawShapeList[0][0];
                        let startY = data.drawShapeList[0][1];
                        let endX = data.drawShapeList[l - 1][0];
                        let endY = data.drawShapeList[l - 1][1];
                        let arr = methods.drawRect(startX, startY, endX, endY);
                        for (let i = 0; i < arr.length; i++)
                        {
                            methods.addDrawRecord([arr[i][0], arr[i][1], data.brushColor], false);
                        }
                        
                    }
                    else if (data.currentDrawShape === 'fillRect')
                    {
                        let l = data.drawShapeList.length;
                        let startX = data.drawShapeList[0][0];
                        let startY = data.drawShapeList[0][1];
                        let endX = data.drawShapeList[l - 1][0];
                        let endY = data.drawShapeList[l - 1][1];
                        let arr = methods.drawFillRect(startX, startY, endX, endY);
                        for (let i = 0; i < arr.length; i++)
                        {
                            methods.addDrawRecord([arr[i][0], arr[i][1], arr[i][2]], false);
                        }
                       
                    }
                    else if (data.currentDrawShape === 'line')
                    {
                        let l = data.drawShapeList.length;
                        let startX = data.drawShapeList[0][0];
                        let startY = data.drawShapeList[0][1];
                        let endX = data.drawShapeList[l - 1][0];
                        let endY = data.drawShapeList[l - 1][1];
                        let arr = methods.drawLine(startX, startY, endX, endY);
                        for (let i = 0; i < arr.length; i++)
                        {
                            methods.addDrawRecord([arr[i][0], arr[i][1], data.brushColor], false);
                        }
                    }
                    methods.reDraw();
                    data.drawShapeList = [];
                    data.isDrawShape = false;
                }
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
                else if (data.currentTool === 7) data.canvas.classList.add('move-cursor');
                else if (data.currentTool === 8) data.canvas.classList.add('select-cursor');
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
            handleSaveColor (isAuto = false)
            {
                // 保存颜色
                if (isAuto)
                {
                    data.myColor = data.brushColor;
                    methods.handleAddColor();
                    return;
                }
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
                if (data.canvasWidth > data.canvasHeight) data.scale = Math.max(1, (data.canvas.width / data.canvasWidth / 2) * 2);
                else data.scale = Math.max(1, (data.canvas.height / data.canvasHeight / 2) * 2);
                data.scale = Math.round(data.scale);
                console.log(data.scale);
                data.brushSize = data.scale;
                
            },
            getMyColorList ()
            {
                let colorList = proxy.$utils.cache.mycolor.get();
                console.log(colorList);
                
                if (colorList && JSON.parse(colorList).length)
                {
                    data.myColorList = JSON.parse(colorList);
                    editSpaceStore.setMyColorList(data.myColorList);
                }
                else
                {
                    proxy.$utils.cache.mycolor.set(JSON.stringify(data.myColorList));
                    editSpaceStore.setMyColorList(data.myColorList);
                }
            },
            // getColorModules ()
            // {
            //     axios.get(`${import.meta.env.VITE_APP_API_URL}json/color.json`)
            //         .then((res) => 
            //         {
            //             editSpaceStore.colorModules = res.data;
            //         })
            //         .catch((err) => 
            //         {
            //             // proxy.$message.error(err);
            //             console.error(err);
            //         });
            // },
            // 图层开始
            handleAddLayer ()
            {
                // 新建图层
                if (data.drawRecord[data.currentFrameIndex].layer.length > data.maxLayer) return proxy.$message.warning('图层数量达到上限');
                let layerArr = [] as any;
                for (let i = 0; i < data.canvasHeight; i++) 
                {
                    for (let j = 0; j < data.canvasWidth; j++) 
                    {
                        layerArr.push([j, i, data.emptyColor]);
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
                if (index < 0)
                {
                    for (let i = 0; i < data.drawRecord[data.currentFrameIndex].layer.length; i++)
                    {
                        data.drawRecord[data.currentFrameIndex].layer[i].isRender = !data.currentFrameLayerVisible;
                    }
                    data.currentFrameLayerVisible = !data.currentFrameLayerVisible;
                    methods.reDraw();
                    return;
                }
                let flag = data.drawRecord[data.currentFrameIndex].layer[index].isRender;
                data.drawRecord[data.currentFrameIndex].layer[index].isRender = !flag;
                methods.reDraw(true, false);
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
                // const worker = new Worker();
                // worker.postMessage({type:2, variables:JSON.parse(JSON.stringify(imageData)), width:data.canvasWidth, height:data.canvasHeight});
                // worker.onmessage = (event) => 
                // {
                //     let colorList = event.data;
                //     for (let y = 0; y < data.canvasHeight; y++) 
                //     {
                //         for (let x = 0; x < data.canvasWidth; x++) 
                //         {
                //             let color = data.emptyColor;
                //             // for (let i = 0; i < imageData.length; i++)
                //             // {
                //             //     if (imageData[i][0] === y && imageData[i][1] === x && imageData[i][2] !== data.emptyColor)
                //             //     {
                //             //         color = imageData[i][2];
                //             //         break;
                //             //     }
                //             // }
                            
                //             // 在新的 canvas 上绘制缩小后的像素
                //             data.ctx3.fillStyle = colorList[x + y];
                //             data.ctx3.fillRect(y, x, 1, 1);
                //         }
                //     }
                //     if (isDownload) downloadImage(data.realCanvas, `layer${layerIndex + 1}`);
                // };
                for (let y = 0; y < data.canvasHeight; y++) 
                {
                    for (let x = 0; x < data.canvasWidth; x++) 
                    {
                        let color = imageData[x + (y * data.canvasWidth)][2];
                        
                        // 在新的 canvas 上绘制缩小后的像素
                        data.ctx3.fillStyle = color;
                        data.ctx3.fillRect(x, y, 1, 1);
                    }
                }
                if (isDownload) downloadImage(data.realCanvas, `layer${layerIndex + 1}`);
                
            },
            handleImportLayer ()
            {
                // 导入图片资源，需要保证图片大小与画布大小一致
                const input:any = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/png';
                input.addEventListener('change', function () 
                {
                    const file = input.files[0];
                    if (file) 
                    {
                        // const reader = new FileReader();
                        // reader.onload = function (e) 
                        // {
                        //     console.log(file, e);
                        // };
                        // reader.readAsDataURL(file);
                        data.loading = true;
                        const img = new Image();
                        const url = URL.createObjectURL(file);
                        img.src = url;
                        img.onload = function () 
                        {
                            console.log('图片宽度:', img.width);
                            console.log('图片高度:', img.height);
                            if (img.width > data.canvasWidth || img.height > data.canvasHeight)
                            {
                                data.loading = false;
                                URL.revokeObjectURL(url);
                                return proxy.$message.warning('导入图片尺寸须小于等于画布大小');
                            }
                            methods.handleTransfromPngToPixel(img, url);
                        };
                    }
                });
                document.body.appendChild(input);
                input.click();
                document.body.removeChild(input);
            },
            handleTransfromPngToPixel (img, url)
            {
                const imgCanvas = document.createElement('canvas');
                imgCanvas.width = data.canvasWidth;
                imgCanvas.height = data.canvasHeight;
                const imgCtx:any = imgCanvas.getContext('2d');
                imgCtx.drawImage(img, 0, 0);
                const imageData = imgCtx.getImageData(0, 0, imgCanvas.width, imgCanvas.height);
                console.log(imageData);
                
                // 图片转换为像素数据
                // const worker = new Worker();
                data.worker.postMessage({
                    type:2, 
                    variables:imageData.data, 
                    currentLayerData:JSON.parse(JSON.stringify(data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData))
                });
                data.worker.onmessage = (event) => 
                {
                    URL.revokeObjectURL(url);
                    data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData = event.data;
                    data.loading = false;
                    methods.reDraw();
                };
            },
            // 图层结束

            // 帧开始
            handleAddFrame ()
            {
                if (data.drawRecord.length >= data.maxFrame) return proxy.$message.warning('帧数量达到上限');
                let layerArr = [] as any;
                for (let i = 0; i < data.canvasHeight; i++) 
                {
                    for (let j = 0; j < data.canvasWidth; j++) 
                    {
                        layerArr.push([j, i, data.emptyColor]);
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
                data.selectData.selectList = [];
                data.currentFrameIndex = index;
                data.currentLayerIndex = 0;
                methods.reDraw(true, false);

            },
            handleCopyFrame (index, type = 'copy')
            {
                if (type === 'copyData')
                {
                    editSpaceStore.frameCopyData = JSON.parse(JSON.stringify(data.drawRecord[index]));
                    proxy.$message.success('复制成功');

                }
                else if (type === 'pasteData')
                {
                    if (!editSpaceStore.frameCopyData) return proxy.$message.warning('数据不存在');
                    let pasteData = editSpaceStore.frameCopyData;
                    if (pasteData.frameId === data.drawRecord[index].frameId) 
                    {
                        data.drawRecord[index] = pasteData;
                    }
                    else
                    {
                        data.drawRecord[index].currentFrameImg = pasteData.currentFrameImg;
                        data.drawRecord[index].layer = pasteData.layer;
                    }
                    proxy.$message.success('粘贴成功');
                    methods.reDraw(true, true);

                }
                else if (type === 'copy')
                {
                    if (data.drawRecord.length >= data.maxFrame) return proxy.$message.warning('帧数量达到上限');
                    let copyData = JSON.parse(JSON.stringify(data.drawRecord[index]));
                    copyData.frameId = uuid.v1();
                    data.drawRecord.splice(index, 0, copyData);
                    methods.handleChangeFrame(index + 1);
                    methods.handleAddHistory();
                }
            },
            handleDeleteFrame (index)
            {
                data.drawRecord.splice(index, 1);
                methods.handleChangeFrame(index - 1);
                methods.handleAddHistory();

            },
            handleExportFrame (index, isDownload = true, scale = 1)
            {
                const imageData = data.drawRecord[index].layer;
                data.realCanvas.width = data.canvasWidth * scale;
                data.realCanvas.height = data.canvasHeight * scale;
                data.ctx3.clearRect(0, 0, data.canvasWidth, data.canvasHeight);
                console.log(imageData);
                
                // let layerArr = [] as any;
                for (let i = imageData.length - 1; i >= 0; i--)
                {
                    if (imageData[i].isRender)
                    {
                        // for (let j = 0; j < imageData[i].layerData.length; j++)
                        // {
                        //     layerArr.push(imageData[i].layerData[j]);
                        // }
                        for (let y = 0; y < data.canvasHeight; y++) 
                        {
                            for (let x = 0; x < data.canvasWidth; x++) 
                            {
                                let color = imageData[i].layerData[x + (y * data.canvasWidth)][2];
                                
                                // 在新的 canvas 上绘制缩小后的像素
                                data.ctx3.fillStyle = color;
                                data.ctx3.fillRect(x * scale, y * scale, scale, scale);
                            }
                        }
                    }
                }
                
                // for (let y = 0; y < data.canvasHeight; y++) 
                // {
                //     for (let x = 0; x < data.canvasWidth; x++) 
                //     {
                //         let color = layerArr[x + (y * data.canvasWidth)][2];
                        
                //         // 在新的 canvas 上绘制缩小后的像素
                //         data.ctx3.fillStyle = color;
                //         data.ctx3.fillRect(x * scale, y * scale, scale, scale);
                //     }
                // }
                if (isDownload) downloadImage(data.realCanvas, `frame${index + 1}`);
            },
            compressDrawRecordData ()
            {
                let compressValue = JSON.parse(JSON.stringify(data.drawRecord));
                for (let i = 0; i < compressValue.length; i++)
                {
                    // compressValue[i].currentFrameImg = '';
                    for (let j = 0; j < compressValue[i].layer.length; j++)
                    {
                        for (let k = 0; k < compressValue[i].layer[j].layerData.length; k++)
                        {
                            if (compressValue[i].layer[j].layerData[k][2] === '#00000000')
                            {
                                compressValue[i].layer[j].layerData[k][2] = '#';
                            }
                        }
                    }
                }
                return compressValue;
            },
            handleExportProject (filename)
            {
                // 导出项目为json文件
                data.exportLoaidng = true;
                let fileData = {
                    ...data.projectData,
                    // projectId:data.projectData.projectId,
                    // projectName:data.projectData.projectName,
                    width:data.canvasWidth,
                    height:data.canvasHeight,
                    data:null
                };
                console.log(fileData);
                
                fileData.data = methods.compressDrawRecordData();
                fileData.frameImg = data.drawRecord[0].currentFrameImg;
                const d = JSON.stringify(fileData);
                const blob = new Blob([d], {type: ''});
                FileSaver.saveAs(blob, `${filename}.json`);
                proxy.$message.success('导出成功');
                data.exportLoaidng = false;
            },
            handleImportProject ()
            {
                const input:any = document.createElement('input');
                input.type = 'file';
                input.accept = 'application/json';
                input.addEventListener('change', function () 
                {
                    const file = input.files[0];
                    if (file) 
                    {
                        data.loading = true;
                        const reader = new FileReader();
                        reader.onload = function (e:any) 
                        {
                            console.log(e.target.result);
                            
                            const jsonData = JSON.parse(e.target.result);
                            data.worker.postMessage({
                                type:4, 
                                variables:jsonData.data
                            });
                            data.projectData.projectId = jsonData.projectId;
                            data.projectData.projectName = jsonData.projectName;
                            data.projectData.updateAt = jsonData.updateAt;
                            data.projectData.createAt = jsonData.createAt;
                            data.projectData.desc = jsonData.desc;
                            data.projectData.frameImg = jsonData.frameImg;
                            data.canvasWidth = jsonData.width;
                            data.canvasHeight = jsonData.height;
                            data.historyRecord = [];
                            methods.computeScale();
                            data.canvasBeginPos.x = ((data.bgCanvas.width / 2) - data.canvasWidth * data.scale / 2);
                            data.canvasBeginPos.y = ((data.bgCanvas.height / 2) - data.canvasHeight * data.scale / 2);
                            methods.drawPixelArea();
                            data.worker.onmessage = (event) => 
                            {
                                data.drawRecord = event.data;
                                methods.reDraw();
                                data.loading = false;
                            };
                        };
                        reader.readAsText(file);
                        
                    }
                });
                document.body.appendChild(input);
                input.click();
                document.body.removeChild(input);
            },
            // 帧结束
            handleExport (type, filename, isBack = false, scale = 1)
            {
                if (!isBack) data.exportLoaidng = true;
                if (data.isExportProject)
                {
                    methods.handleExportProject(filename);
                    return;
                }
                // 根据不同类型导出
                if (type === 1)
                {
                    // 精灵图不区分图层，相当于导出每一帧的精灵图
                    const bigCanvas = document.createElement('canvas');
                    bigCanvas.width = data.canvasWidth * scale * data.drawRecord.length;
                    bigCanvas.height = data.canvasHeight * scale;
                    const bigCtx:any = bigCanvas.getContext('2d');
                    data.realCanvas.width = data.canvasWidth * scale;
                    data.realCanvas.height = data.canvasHeight * scale;
                    for (let i = 0; i < data.drawRecord.length; i++)
                    {
                        methods.handleExportFrame(i, false, scale);
                        bigCtx.drawImage(data.realCanvas, i * data.canvasWidth * scale, 0);
                    }
                    if (isBack) return bigCanvas.toDataURL('image/png');
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
                
                data.historyRecord.push({
                    hid:uuid.v1(),
                    record:JSON.parse(JSON.stringify(data.drawRecord))
                });
                data.isSaveProject = false;

                console.log(data.historyRecord);
                
                data.currentHistoryIndex = data.historyRecord.length - 1;
                if (data.currentHistoryIndex < 0) data.currentHistoryIndex = 0;
            },
            handleRevoke ()
            {
                // 撤销操作
                data.currentHistoryIndex = data.currentHistoryIndex - 1;
                if (data.currentHistoryIndex < 0) proxy.$message.warning('暂无更多记录');
                if (data.currentHistoryIndex <= 0) 
                {
                    data.currentHistoryIndex = 0;
                }
                console.log(data.currentHistoryIndex);
                
                data.drawRecord = JSON.parse(JSON.stringify(data.historyRecord[data.currentHistoryIndex].record));
                methods.reDraw(true, false);
            },
            handleRecover ()
            {
                // 恢复操作
                data.currentHistoryIndex = data.currentHistoryIndex + 1;
                if (data.currentHistoryIndex > data.historyRecord.length - 1) proxy.$message.warning('暂无更多记录');
                if (data.currentHistoryIndex >= data.historyRecord.length - 1) 
                {
                    data.currentHistoryIndex = data.historyRecord.length - 1;
                }
                data.drawRecord = JSON.parse(JSON.stringify(data.historyRecord[data.currentHistoryIndex].record));
                methods.reDraw(true, false);
            },
            handleOpenMyColorDialog ()
            {
                proxy.$refs.MyColorDialog.handleOpen();
            },
            handleOpenReplaceColorDialog ()
            {
                proxy.$refs.ReplaceColorDialog.handleOpen();
            },
            handleOpenPreviewDialog ()
            {
                data.previewLoading = true;
                let scale = 6; // 放大倍数
                // methods.handleExport(1, '1111', false, scale);
                const imgUrl = methods.handleExport(1, '', true, scale);
                proxy.$refs.PreviewAnimDialog.handleOpen({
                    imgUrl, 
                    width:data.canvasWidth * scale, 
                    height:data.canvasHeight * scale,
                    frame:data.drawRecord.length
                });
                data.previewLoading = false;
            },
            handlekeyBoardEvent (event)
            {
                if (event.key === ' ')
                {
                    event.preventDefault();
                    data.isSpace = true;
                    // data.canvas.style.cursor = 'grabbing';
                    return;
                }
                if (event.shiftKey && data.isSelecting && data.selectData.selectList.length)
                {
                    data.isShift = true;
                    data.isMoving = true;
                    data.canvas.style.cursor = 'move';
                    return;
                }
                if (event.altKey && event.key === 'c' && data.selectData.selectList.length)
                {
                    methods.handleCopySelectData();
                    console.log('复制成功');
                }
                else if (event.altKey && event.key === 'z') 
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
                else if (event.altKey && event.key === 'b') 
                {
                    // 切换油漆桶
                    methods.handleChangeTool(4);
                }
                else if (event.altKey && event.key === 'm') 
                {
                    methods.handleChangeTool(7);
                }
                else if (event.altKey && event.key === 's')
                {
                    methods.handleSaveColor(true);
                }
                else if (event.altKey && event.key === 't')
                {
                    methods.handleOpenReplaceColorDialog();
                }
                else if (event.ctrlKey && event.altKey && event.key === 'c')
                {
                    event.preventDefault(); 
                    methods.handleCopyColor();
                }
                else if (event.altKey && event.key === 'r') 
                {
                    methods.handleChangeTool(6);
                }
                else if (event.altKey && event.key === 'v') 
                {
                    // methods.handleChangeTool(8);

                }
                else if (event.altKey && event.key === 'g') 
                {
                    proxy.$refs.MyColorDialog.handleOpen();
                }
                else if (event.altKey && event.key === 'h') 
                {
                    methods.handleChangeTool(3);
                    methods.drawShape('rect');
                }
                else if (event.altKey && event.key === 'j') 
                {
                    methods.handleChangeTool(3);
                    methods.drawShape('circle');
                }
                else if (event.altKey && event.key === 'k') 
                {
                    methods.handleChangeTool(3);
                    methods.drawShape('line');
                }
                else if (event.altKey && event.key === 'l') 
                {
                    methods.handleChangeTool(3);
                    methods.drawShape('fillRect');
                }
                else if (event.altKey && event.key === 'n') 
                {
                    methods.handleCancelSelect();
                }
                else if (event.altKey && event.key === 'd') 
                {
                    event.preventDefault();
                    methods.handleRemoveSelect();
                    // methods.handleChangeTool(8);
                }
                else if (event.altKey && event.key === 'e') 
                {
                    event.preventDefault();
                    methods.handleChangeTool(8);
                }
                else if (event.ctrlKey && event.key === 'ArrowUp')
                {
                    // 水平翻转
                    event.preventDefault();
                    methods.drawTransform('hReverse');
                }
                else if (event.ctrlKey && event.key === 'ArrowDown')
                {
                    event.preventDefault();
                    methods.drawTransform('vReverse');
                }
                else if (event.ctrlKey && event.key === 'ArrowLeft')
                {
                    event.preventDefault();
                    methods.drawTransform('nsz');
                }
                else if (event.ctrlKey && event.key === 'ArrowRight')
                {
                    event.preventDefault();
                    methods.drawTransform('ssz');
                }
                else if (event.ctrlKey && event.key === 's')
                {
                    event.preventDefault();
                    methods.handleSaveProject();
                }
                else if (event.ctrlKey && event.key === 'p')
                {
                    event.preventDefault();
                    data.exportVisible = true;
                    data.isExportProject = true;
                }
                else if (event.ctrlKey && event.key === 'i')
                {
                    event.preventDefault(); 
                    data.exportVisible = true;
                    data.isExportProject = false;
                }
                else if (event.key === 'ArrowUp')
                {
                    // 切换图层
                    if (data.currentLayerIndex <= 0)
                    {
                        data.currentLayerIndex = 0;
                    }
                    else
                    {
                        data.currentLayerIndex--;
                    }
                }
                else if (event.key === 'ArrowDown')
                {
                    // 切换图层
                    if (data.currentLayerIndex >= data.drawRecord[data.currentFrameIndex].layer.length - 1)
                    {
                        data.currentLayerIndex = data.drawRecord[data.currentFrameIndex].layer.length - 1;
                    }
                    else
                    {
                        data.currentLayerIndex++;
                    }
                }
                else if (event.key === 'ArrowLeft')
                {
                    // 切换帧
                    if (data.currentFrameIndex <= 0)
                    {
                        data.currentFrameIndex = 0;
                    }
                    else
                    {
                        data.currentFrameIndex--;
                    }
                    methods.handleChangeFrame(data.currentFrameIndex);
                }
                else if (event.key === 'ArrowRight')
                {
                    // 切换帧
                    if (data.currentFrameIndex >= data.drawRecord.length - 1)
                    {
                        data.currentFrameIndex = data.drawRecord.length - 1;
                    }
                    else
                    {
                        data.currentFrameIndex++;
                    }
                    methods.handleChangeFrame(data.currentFrameIndex);
                }
                data.canvas.className = '';
                methods.addCursorClass();
            },
            handleKeyUpEvent (event)
            {
                if (event.key === ' ')
                {
                    data.isSpace = false;
                    data.canvas.style.cursor = '';
                }
                if (event.shiftKey && data.isSelecting && data.selectData.selectList.length)
                {
                    data.isShift = false;
                    data.isMoving = false;
                    data.canvas.style.cursor = '';
                }
            },
            addKeyBoardEvent ()
            {
                document.addEventListener('keydown', methods.handlekeyBoardEvent);
                document.addEventListener('keyup', methods.handleKeyUpEvent);
            },
            handleResizeWindowEvent (event)
            {
                const pixelBox = document.querySelector('.pixelBox');
                data.canvas.width = pixelBox?.clientWidth;
                data.canvas.height = pixelBox?.clientHeight;
                data.bgCanvas.width = pixelBox?.clientWidth;
                data.bgCanvas.height = pixelBox?.clientHeight;
                data.canvasBeginPos.x = ((data.bgCanvas.width / 2) - data.canvasWidth * data.scale / 2);
                data.canvasBeginPos.y = ((data.bgCanvas.height / 2) - data.canvasHeight * data.scale / 2);
                data.canvasBeginPos.centerX = data.canvasBeginPos.x + data.scale * data.canvasWidth / 2;
                data.canvasBeginPos.centerY = data.canvasBeginPos.y + data.scale * data.canvasHeight / 2;
                // methods.computeScale();
                methods.drawPixelArea();
                methods.reDraw(false, false);
            },
            handleResizeWindow ()
            {
                window.addEventListener('resize', methods.handleResizeWindowEvent);
            },
            onDragLayerEnd (event, node)
            {
                let dom = proxy.$refs[node];
                let currentNodes:any = Array.from(dom.children);
                let newArr = [] as any;
                let currentLayerData = data.drawRecord[data.currentFrameIndex].layer;
                for (let i = 0; i < currentNodes.length; i++)
                {
                    let key = currentNodes[i].dataset.key;
                    let layerData = currentLayerData.find((item) => item.layerId === key);
                    newArr.push(layerData);
                }
                data.drawRecord[data.currentFrameIndex].layer = newArr;
                methods.reDraw();
                
            },
            onDragFrameEnd (event, node)
            {
                let dom = proxy.$refs[node];
                let currentNodes:any = Array.from(dom.children);
                let newArr = [] as any;
                let currentFrameData = data.drawRecord;
                for (let i = 0; i < currentNodes.length - 1; i++)
                {
                    let key = currentNodes[i].dataset.key;
                    let frameData = currentFrameData.find((item) => item.frameId === key);
                    newArr.push(frameData);
                }
                data.drawRecord = newArr;
                methods.handleChangeFrame(data.currentFrameIndex);
                
            },
            handleCopySelectData ()
            {
                data.selectData.copyList = JSON.parse(JSON.stringify(data.selectData.selectList));
                proxy.$message.success('复制成功');
            },
            handleFilter (value)
            {
                useFilterHooks.handleFilter(value, data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData, data.selectData, data.canvasWidth, data.canvasHeight, methods.reDraw);
            },
            handleExpand ()
            {
                data.isExpandColorSelector = !data.isExpandColorSelector;
                let dom = document.querySelector('.colorSelector') as HTMLDivElement;
                let dom1:any = document.querySelector('.back-icon');
                if (data.isExpandColorSelector)
                {
                    // 展开
                    dom.style.transform = 'translateX(0)';
                    dom1.children[0].style.transform = 'rotate(0deg)';
                }
                else
                {
                    // 折叠
                    dom.style.transform = 'translateX(100%)';
                    dom1.children[0].style.transform = 'rotate(180deg)';
                }
            },
            handleTransformColorAsHex (color)
            {
                return isHexColor(color) ? rgbaToHex(hexToRgba(color)) : rgbaToHex(extractRgbaValues(color));
            },
            handleConfirmReplaceColor (value, callback)
            {
                let replaceColor = methods.handleTransformColorAsHex(value.replaceColor);
                let newColor = methods.handleTransformColorAsHex(value.newColor);
                if (value.type === 1)
                {
                    console.log('更新当前图层颜色');
                    let currentLayerData = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData;
                    for (let i = 0; i < currentLayerData.length; i += 2)
                    {

                        if (i + 1 < currentLayerData.length)
                        {
                            if (currentLayerData[i][2] === replaceColor)
                            {
                                currentLayerData[i][2] = newColor;
                            }

                            if (currentLayerData[i + 1][2] === replaceColor)
                            {
                                currentLayerData[i + 1][2] = newColor;
                            }
                        }
                    }
                    
                }
                else if (value.type === 2)
                {
                    console.log('更新所有图层颜色');
                    let currentLayerData = data.drawRecord[data.currentFrameIndex].layer;
                    for (let i = 0; i < currentLayerData.length; i++)
                    {
                        for (let j = 0; j < currentLayerData[i].layerData.length; j += 2)
                        {
                            if (j + 1 < currentLayerData[i].layerData.length)
                            {
                                if (currentLayerData[i].layerData[j][2] === replaceColor)
                                {
                                    currentLayerData[i].layerData[j][2] = newColor;
                                }

                                if (currentLayerData[i].layerData[j + 1][2] === replaceColor)
                                {
                                    currentLayerData[i].layerData[j + 1][2] = newColor;
                                }
                            }
                        }
                        
                    }
                }
                callback();
                methods.reDraw();
            },
            handleResetCanvas ()
            {
                methods.computeScale();
                methods.handleResizeWindowEvent('');
            },
            handleInitData ()
            {
                data.historyRecord = [];
                data.currentFrameIndex = 0;
                data.currentLayerIndex = 0;
                data.currentFrameId = 0;
                data.currentLayerId = 0;
                data.shapeFillColor = '#000000ff';
                data.brushColor = '#000000ff';
                data.isCheckedRatio = true;
                data.isShowReferenceLine = false;
                data.widthHeightRatio = 1;
                data.currentTool = 0;
            },
            handleReadProjectData ()
            {
                // 效验id是否为项目id
                let projectId = proxy.$route.params.projectId;
                let projectData = JSON.parse(JSON.stringify(editSpaceStore.getProjectById(projectId)));
                
                if (projectData)
                {
                    // 读取indexdb下的数据
                    if (editSpaceStore.currentProjectId !== projectData.projectId)
                    {
                        methods.handleInitData();
                        data.loading = true;
                        data.projectData.projectId = projectData.projectId;
                        data.projectData.projectName = projectData.projectName;
                        data.projectData.updateAt = projectData.updateAt;
                        data.projectData.createAt = projectData.createAt;
                        data.projectData.desc = projectData.desc;
                        data.canvasWidth = projectData.width;
                        data.canvasHeight = projectData.height;
                        data.projectData.frameImg = projectData.frameImg;
                        data.projectData.tip = projectData.tip;
                        data.projectData.isTop = projectData.isTop;
                        data.projectData.data = projectData.data;
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
                        data.canvasBeginPos.centerX = data.canvasBeginPos.x + data.scale * data.canvasWidth / 2;
                        data.canvasBeginPos.centerY = data.canvasBeginPos.y + data.scale * data.canvasHeight / 2;
                        console.log(data.canvasBeginPos, data.scale);
                        
                        methods.drawPixelArea();
                        methods.startDrawing();
                        methods.addKeyBoardEvent();
                        methods.handleResizeWindow();
                        console.log(data.projectData.data);
                        
                        if (data.projectData.data)
                        {
                            data.worker.postMessage({
                                type:4, 
                                variables:JSON.parse(JSON.stringify(projectData.data))
                            });
                            data.worker.onmessage = (event) => 
                            {
                                data.drawRecord = event.data;
                                editSpaceStore.saveProjectId(data.projectData.projectId);
                                methods.reDraw();
                                // methods.handleRenderAllFrameImg(data.ctx1);
                                data.loading = false;
                            };
                        }
                        else
                        {
                            editSpaceStore.saveProjectId(data.projectData.projectId);
                            data.drawRecord = [];
                            methods.initCanvasRecord('init');
                            data.loading = false;
                        }
                    }
                }
                else
                {
                    proxy.$message.error('项目不存在');
                    editSpaceStore.saveProjectId('0');
                    proxy.$router.replace('/project');
                }
            }
        };

        watch(() => data.isShowReferenceLine, (newValue, oldValue) => 
        {
            methods.drawPixelArea();
            methods.reDraw(false);
        });

        // watch(() => data.drawRecord, (newValue, oldValue) => 
        // {
        //     data.isSaveProject = false;
        // }, { deep:true });
        
        onMounted(() => 
        {
            data.worker = new Worker();
            console.log(data.worker);
            
        });

        onActivated(() =>
        {
            methods.handleReadProjectData();
            if (data.canvas)
            {
                methods.startDrawing();
                methods.addKeyBoardEvent();
                methods.handleResizeWindow();
            }
        });

        onDeactivated(() => 
        {
            if (data.canvas)
            {
                data.canvas.removeEventListener('mousedown', methods.start);
                data.canvas.removeEventListener('mousemove', methods.draw);
                data.canvas.removeEventListener('mouseup', methods.stop);
                data.canvas.removeEventListener('mouseout', methods.leave);
                data.canvas.removeEventListener('wheel', methods.handleWheelEvent);
                document.removeEventListener('keydown', methods.handlekeyBoardEvent);
                document.removeEventListener('keyup', methods.handleKeyUpEvent);
                window.removeEventListener('resize', methods.handleResizeWindowEvent);
                proxy.$refs.ReplaceColorDialog.handleClose();
                proxy.$refs.MyColorDialog.handleClose();
                proxy.$refs.PreviewAnimDialog.handleClose();
            }
        });

        onBeforeUnmount(() => 
        {
            console.log(1111);
            editSpaceStore.saveProjectId('0');
        });

        return {
            ...toRefs(data),
            ...methods,
            ...computedApi,
            copyText,
            ...useDrag()
        };
    }
});