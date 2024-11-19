import { reactive, toRefs, onMounted, defineComponent, getCurrentInstance, computed, watch, onDeactivated, onActivated, onBeforeUnmount } from 'vue';
import MyColorDialog from '@/components/dialog/MyColorDialog.vue';
import PreviewAnimDialog from '@/components/dialog/PreviewAnimDialog.vue';
import ReplaceColorDialog from '@/components/dialog/ReplaceColorDialog.vue';
import ExportDialog from '@/components/dialog/ExportDialog.vue';
import LayerMenu from '@/components/menu/LayerMenu.vue';
import { useEditSpaceStore } from '@/store';
import { blobToBase64, copyText, downloadIamgeByUrl, downloadImage, downloadImageByDataURL, exportImageForZip, extractRgbaValues, formatTime, generateIamge, getFontColor, getOrderedRectangleCoordinates, hexToRgba, isHexColor, measureTextHeight, nearestNeighborColorZoom, nearestNeighborCoordZoom, removeNullArray, removeNullFrom2DArray, rgbaToHex, unique2DArray } from '@/utils/utils';
import axios from 'axios';
import { uuid } from 'vue-uuid';
import Worker from '@/utils/worker.js?worker';
import useDrag from '@/hooks/useDrag';
import useFilter from '@/hooks/useFilter';
import FileSaver from 'file-saver';
import { ElMessageBox } from 'element-plus';
import PindouDialog from '@/components/dialog/PindouDialog.vue';
import gifshot from 'gifshot-plus';
import GIF from '@dhdbstjr98/gif.js';
export default defineComponent({
    name:'work',
    components: {
        MyColorDialog,
        ExportDialog,
        PreviewAnimDialog,
        ReplaceColorDialog,
        PindouDialog,
        LayerMenu
    },
    props:{},
    emits:[],
    setup (props, context)
    {
        const { proxy }:any = getCurrentInstance();
        const useFilterHooks = useFilter();
        const editSpaceStore = useEditSpaceStore();
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pica = require('pica')();
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
            isScale:false,
            shapeFillColor:'#000000ff',
            brushColor:'#000000ff',
            brushSize:1,
            eraserSize:1,
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
            maxFrame:12,
            maxLayer:30,
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
                selectLayerId:0,
                x:-1,
                y:-1,
                originList:[] as any, // 原始有像素的数据
                selectList:[] as any, // 选择的数据
                copyList:[] as any // 复制的数据
            },
            selectType:'select', // 选择类型
            previewLoading:false,
            selectActiveColor:'#3c8bfb8f', // 选区选中的颜色
            isExpandColorSelector:true, // 是否展开颜色选择器
            colorStatList:[] as any, // 颜色统计列表

            worker:null as any,
            isExportProject:false,
            AnimationFrameId_1:null as any,
            zIndex:{
                max:13,
                min:8
            },
            isSaveProject:true, // 是否保存
            pinDouMode:false, // 拼豆预览模式
            pinDouDrawMode:false, // 拼豆绘画模式
            pinDouData:null as any, // 拼豆数据

            tolerance:0, // 容差，适用于油漆桶和魔棒工具
            curvature:4, // 曲线 曲率
            curveType:{
                isPress:false,
                pressKey:'0'
            }, // 曲线类型
            curveEndPos:[] as any, // 曲线最后的位置
            isHorizontal:false, // 是否水平对称
            isVertical:false, // 是否垂直对称
            isCenter:false, // 是否中心对称
            drawList:[] as any,

            LayerMenu:{
                visible:false,
                top:0,
                left:0,
                contextData:null
            }, // 右键菜单
            selectLayerList:[] as any, // 选择的图层
            pindouHighlight:null as any, // 拼豆高亮显示
            isHidePindouMode:false, // 是否隐藏拼豆模式
            pindouBrand:'mard', // 拼豆品牌 色卡
            isScaling:false, // 是否缩放
            scaleWhitePointPos:[] as any,
            scaleAreaData:null as any,
            // scaleMatrixData:[] as any, // 缩放的图像矩阵
            scaleRatio:0, // 每次拖动递增1
            emptyLayerData:[] as any, // 空模板
            exportStyleOptions:{
                isShowGrid:false,
                gridBackgroundColor:'#ffffffff'
            }

            
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
            requireSelectImg: computed(() => 
            {
                if (editSpaceStore.themeValue)
                {
                    return new URL(`../../assets/light/${data.selectType}.png`, import.meta.url).href;
                }
                return new URL(`../../assets/dark/${data.selectType}.png`, import.meta.url).href;
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
            handleChangeBrushColor (value)
            {
                let color = value;
                if (color.length <= 6 && color.slice(0, 1) !== '#')
                {
                    color = `#${color}ff`.toLowerCase();
                }
                data.brushColor = color;
            },
            handleSaveProject ()
            {
                if (data.isScaling) methods.handleCancelScale();
                // 保存到indexdb
                data.loading = true;
                data.isSaveProject = true;
                data.projectData.updateAt = formatTime();
                data.projectData.height = data.canvasHeight;
                data.projectData.width = data.canvasWidth;
                data.projectData.tip = '最近编辑';
                data.projectData.data = methods.compressDrawRecordData();
                if (data.drawRecord[0].currentFrameImg === '') data.projectData.frameImg = '';
                else data.projectData.frameImg = '@';
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
                    data.pinDouMode = false;
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
                        data.pinDouMode = false;
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
                if (data.pinDouMode) return proxy.$message.warning('请先退出拼豆预览模式');
                if (data.isScaling) methods.handleCancelScale();
                if (index === 6)
                {
                    // 清空当前选择的图层绘画信息
                    // data.emptyLayerData = [] as any;
                    // for (let i = 0; i < data.canvasHeight; i++) 
                    // {
                    //     for (let j = 0; j < data.canvasWidth; j++) 
                    //     {
                    //         layerArr.push([j, i, data.emptyColor]);
                    //     }
                    // }
                    data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData = JSON.parse(JSON.stringify(data.emptyLayerData));
                    methods.handleCancelSelect();
                    methods.reDraw();
                    return;
                }
                else if (index === 5)
                {
                    methods.handlePindouMode('preview');
                }
                data.currentTool = index;
            },
            handlePindouMode (mode)
            {
                if (data.selectData.selectList.length) return proxy.$message.warning('请先取消选中区域');
                if (data.isScaling) methods.handleCancelScale();
                if (!data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].isRender) return proxy.$message.warning('请将图层设置显示状态');
                if (mode === 'preview') 
                {
                    if (data.pinDouDrawMode) return proxy.$message.warning('请先退出拼豆绘图模式');
                    data.currentTool = 5;
                    data.loading = true;
                    methods.handlePindouEvent();
                }
                else
                {
                    if (data.pinDouMode) return proxy.$message.warning('请先退出拼豆预览模式');
                    if (data.isHidePindouMode)
                    {
                        methods.handleShowPindou();
                        return;
                    }
                    data.pinDouDrawMode = true;
                    proxy.$refs.PindouDialog.handleOpen(mode);
                }
            },
            handleShowPindou ()
            {
                data.isHidePindouMode = false;
                proxy.$refs.PindouDialog.handleShow();
            },
            handlePindouEvent (brand = data.pindouBrand)
            {
                data.worker.postMessage({
                    type:6,
                    // currentPindouBrand:brand,
                    currentPindouBrandColorList:JSON.parse(JSON.stringify(editSpaceStore.pindouMaps[brand].data || editSpaceStore.pindouMaps[brand])),
                    variables:JSON.parse(JSON.stringify(data.drawRecord[data.currentFrameIndex].layer))
                });
                data.worker.onmessage = (event) => 
                {
                    data.pinDouData = event.data;
                    console.log(data.pinDouData);
                    methods.handleDrawPindou(data.ctx1);
                    data.pinDouMode = true;
                    data.pindouBrand = brand;
                    proxy.$refs.PindouDialog.handleOpen(event.data);
                    methods.handleCancelKeyboardEvent();
                };
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
                methods.handleInitEmptyLayer();
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
                                currentLayerImg:methods.handleGridImg(),
                                isRender:true, // 是否渲染
                                layerData:layerArr // 绘画信息
                            }
                        ]
                    });
                    // methods.handleFrameImg(data.ctx2);
                }
                else if (type === 'scale')
                {
                    data.loading = true;
                    // const worker = new Worker();
                    // 每个帧的图层都要进行比例调整
                    let layerOriginArr = JSON.parse(JSON.stringify(data.emptyLayerData));
                    // for (let y = 0; y < data.canvasHeight; y++) 
                    // {
                    //     for (let x = 0; x < data.canvasWidth; x++) 
                    //     {
                    //         layerOriginArr.push([x, y, data.emptyColor]);
                    //     }
                    // }
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
                methods.handleDrawReferenceLine(beginX, beginY);
                // methods.drawScaleFrame();
            },
            handleDrawReferenceLine (beginX, beginY)
            {
                if (data.isShowReferenceLine)
                {
                    // 绘制参考线
                    data.ctx2.globalAlpha = 0.5;
                    data.ctx2.lineWidth = 2;
                    data.ctx2.strokeStyle = editSpaceStore.themeValue ? 'white' : 'black';
                    data.ctx2.beginPath();
                    data.ctx2.setLineDash([5, 3]);
                    data.ctx2.moveTo(beginX + (data.canvasWidth * data.scale) / 2, 0);
                    data.ctx2.lineTo(beginX + (data.canvasWidth * data.scale) / 2, data.bgCanvas.height);
                    data.ctx2.stroke();

                    data.ctx2.beginPath();
                    data.ctx2.moveTo(0, beginY + (data.canvasHeight * data.scale) / 2);
                    data.ctx2.lineTo(data.bgCanvas.width, beginY + (data.canvasHeight * data.scale) / 2);
                    data.ctx2.stroke();
                }
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
            getCurrentLayerData (frameIndex = data.currentFrameIndex, layerIndex = data.currentLayerIndex)
            {
                return data.drawRecord[frameIndex].layer[layerIndex].layerData;
            },
            getCurrentLayerId (frameIndex = data.currentFrameIndex, layerIndex = data.currentLayerIndex)
            {
                return data.drawRecord[frameIndex].layer[layerIndex].layerId;
            },
            getCurrentFrameId (frameIndex = data.currentFrameIndex)
            {
                return data.drawRecord[frameIndex].frameId;
            },
            drawScaleFrame ()
            {
                // 绘制缩放框
                if (!data.isScaling) return;
                // data.scaleMatrixData = [];
                let rectWidth = 0;
                let rectHeight = 0;
                let currentLayerData = JSON.parse(JSON.stringify(methods.getCurrentLayerData()));
                let minX = Infinity;
                let minY = Infinity; 
                let maxX = -Infinity; 
                let maxY = -Infinity;
                // let originArr = [] as any;
                for (let i = 0; i < currentLayerData.length; i++)
                {
                    if (currentLayerData[i][2] === data.emptyColor) continue;
                    const x = currentLayerData[i][0];
                    const y = currentLayerData[i][1];
                    // 更新最小和最大的x值
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    // 更新最小和最大的y值
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
                if (minX === Infinity) minX = 0;
                if (minY === Infinity) minY = 0;
                if (maxX === -Infinity) maxX = 0;
                if (maxY === -Infinity) maxY = 0;
                console.log(minX, minY, maxX, maxY);
                if (minX + minY + maxX + maxY === 0) 
                {
                    data.isScaling = false;
                    console.log(data.historyRecord);
                    
                    return proxy.$message.warning('图像为空');
                }
                let realmaxX = (maxX * data.scale) + data.canvasBeginPos.x + data.scale;
                let realminX = (minX * data.scale) + data.canvasBeginPos.x;
                let realmaxY = (maxY * data.scale) + data.canvasBeginPos.y + data.scale;
                let realminY = (minY * data.scale) + data.canvasBeginPos.y;
                rectWidth = realmaxX - realminX;
                rectHeight = realmaxY - realminY;
                console.log(rectWidth, rectHeight);
                data.scaleAreaData = {};
                data.scaleAreaData = {
                    minX,
                    maxX,
                    minY,
                    maxY,
                    realmaxX,
                    realminX,
                    realmaxY,
                    realminY,
                    originArr:[],
                    colorMaxtrix:[],
                    coordMaxtrix:[],
                    isRight:false,
                    isLeft:false,
                    isTop:false,
                    isBottom:false

                };
                methods.handleDrawScaleFrame(realminX - 5, realminY - 5, realmaxX + 5, realmaxY + 5);
                // 获取截取的像素区域数据
                for (let i = 0; i < currentLayerData.length; i++)
                {
                    if (currentLayerData[i][0] <= data.scaleAreaData.maxX && currentLayerData[i][0] >= data.scaleAreaData.minX && currentLayerData[i][1] <= data.scaleAreaData.maxY && currentLayerData[i][1] >= data.scaleAreaData.minY)
                    {
                        data.scaleAreaData.originArr.push(currentLayerData[i]);
                    }
                }
                
                let originGridWidth = (data.scaleAreaData.maxX - data.scaleAreaData.minX) + 1;
                let originGridHeight = (data.scaleAreaData.maxY - data.scaleAreaData.minY) + 1;
                
                for (let y = 0; y < originGridHeight; y++)
                {
                    let coordRowArr = [] as any;
                    let colorRowArr = [] as any;
                    for (let x = 0; x < originGridWidth; x++)
                    {
                        let index = x + y * originGridWidth;
                        coordRowArr.push([data.scaleAreaData.originArr[index][0], data.scaleAreaData.originArr[index][1]]);
                        colorRowArr.push([data.scaleAreaData.originArr[index][2]]);
                    }
                    data.scaleAreaData.colorMaxtrix.push(colorRowArr);
                    data.scaleAreaData.coordMaxtrix.push(coordRowArr);
                }
                // console.log(data.scaleAreaData);
                // let scaledCoordMap = nearestNeighborCoordZoom(data.scaleAreaData, data.scaleRatio + 1);
                // let scaledColorMap = nearestNeighborColorZoom(data.scaleAreaData, data.scaleRatio + 1);
                // console.log(scaledCoordMap, scaledColorMap);
                
            },
            handleDrawScaleFrame (minX, minY, maxX, maxY, isRedraw = true)
            {
                if (isRedraw) methods.drawPixelArea();
                data.ctx2.strokeStyle = 'blue';
                data.ctx2.fillStyle = 'white';
                data.ctx2.globalAlpha = 0.9;
                data.ctx2.lineWidth = 2;
                data.ctx2.beginPath();
                data.ctx2.moveTo(minX, minY);
                data.ctx2.lineTo(maxX, minY);
                data.ctx2.stroke();
                data.ctx2.beginPath();
                data.ctx2.moveTo(minX, minY);
                data.ctx2.lineTo(minX, maxY);
                data.ctx2.stroke();
                data.ctx2.beginPath();
                data.ctx2.moveTo(minX, maxY);
                data.ctx2.lineTo(maxX, maxY);
                data.ctx2.stroke();
                data.ctx2.beginPath();
                data.ctx2.moveTo(maxX, maxY);
                data.ctx2.lineTo(maxX, minY);
                data.ctx2.stroke();

                data.scaleWhitePointPos = [
                    // [minX - 4, minY - 4],
                    // [maxX - 4, minY - 4],
                    // [minX - 4, maxY - 4],
                    [maxX - 4, maxY - 4]
                ];

                // 绘制白点
                // data.ctx2.beginPath();
                // data.ctx2.rect(minX - 4, minY - 4, 8, 8);
                // data.ctx2.fill();
                // data.ctx2.stroke();

                // data.ctx2.beginPath();
                // data.ctx2.rect(((maxX - minX) / 2) + minX - 4, minY - 4, 8, 8);
                // data.ctx2.fill();
                // data.ctx2.stroke();

                // data.ctx2.beginPath();
                // data.ctx2.rect(maxX - 4, minY - 4, 8, 8);
                // data.ctx2.fill();
                // data.ctx2.stroke();

                // data.ctx2.beginPath();
                // data.ctx2.rect(minX - 4, ((maxY - minY) / 2) + minY - 4, 8, 8);
                // data.ctx2.fill();
                // data.ctx2.stroke();

                // data.ctx2.beginPath();
                // data.ctx2.rect(((maxX - minX) / 2) + minX - 4, ((maxY - minY) / 2) + minY - 4, 8, 8);
                // data.ctx2.fill();
                // data.ctx2.stroke();

                // data.ctx2.beginPath();
                // data.ctx2.rect(maxX - 4, ((maxY - minY) / 2) + minY - 4, 8, 8);
                // data.ctx2.fill();
                // data.ctx2.stroke();

                // data.ctx2.beginPath();
                // data.ctx2.rect(minX - 4, maxY - 4, 8, 8);
                // data.ctx2.fill();
                // data.ctx2.stroke();

                // data.ctx2.beginPath();
                // data.ctx2.rect(((maxX - minX) / 2) + minX - 4, maxY - 4, 8, 8);
                // data.ctx2.fill();
                // data.ctx2.stroke();

                data.ctx2.beginPath();
                data.ctx2.rect(maxX - 4, maxY - 4, 8, 8);
                data.ctx2.fill();
                data.ctx2.stroke();
            },
            handleFinishScale ()
            {
                // 重置回原来的图像
                let scaledCoordMap = nearestNeighborCoordZoom(data.scaleAreaData, data.scaleRatio);
                let scaledColorMap = nearestNeighborColorZoom(data.scaleAreaData, data.scaleRatio);
                if (data.scaleRatio < 0)
                {
                    // 清空当前图层
                    data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData = JSON.parse(JSON.stringify(data.emptyLayerData));
                }
                for (let y = 0; y < scaledCoordMap.length; y++)
                {
                    for (let x = 0; x < scaledCoordMap[y].length; x++)
                    {
                        methods.addDrawRecord([scaledCoordMap[y][x][0], scaledCoordMap[y][x][1], scaledColorMap[y][x][0]]);
                    }
                }
                data.isScaling = false;
                data.scaleAreaData = null;
                data.scaleRatio = 0;
                methods.handleChangeTool(0);
                methods.drawPixelArea();
                methods.reDraw();
            },
            handleCancelScale ()
            {
                data.isScaling = false;
                data.scaleAreaData = null;
                methods.handleChangeTool(0);
                methods.drawPixelArea();
                methods.reDraw(false);
            },
            drawTransform (transform)
            {
                if (data.isScaling && transform !== 'scale') methods.handleCancelScale();
                if (data.isScaling && transform === 'scale') return;
                data.currentDrawTransform = transform;
                if (transform === 'scale') 
                {
                    if (data.selectData.selectList.length) return proxy.$message.warning('请先取消选中区域');
                    methods.handleChangeTool(9);
                    data.isScaling = true;
                    methods.drawScaleFrame();
                    return;
                }
                let realCoords = [] as any;
                // let centerX = data.canvasBeginPos.x + data.canvasWidth * data.scale / 2;
                // let centerY = data.canvasBeginPos.y + data.canvasHeight * data.scale / 2;
                let centerX = data.canvasBeginPos.centerX;
                let centerY = data.canvasBeginPos.centerY;
                let currentLayerData1 = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex];
                let currentLayerData2 = JSON.parse(JSON.stringify(currentLayerData1.layerData));
                if (data.selectData.selectList.length)
                {
                    let currentSelectData = data.selectData.selectList;
                    for (let i = 0; i < currentSelectData.length; i++)
                    {
                        if (currentSelectData[i][0] >= data.canvasWidth || currentSelectData[i][1] >= data.canvasHeight || currentSelectData[i][0] < 0 || currentSelectData[i][1] < 0) return;
                        let gridX = (currentSelectData[i][0] * data.scale) + data.canvasBeginPos.x;
                        let gridY = (currentSelectData[i][1] * data.scale) + data.canvasBeginPos.y;
                        realCoords.push([gridX, gridY, currentSelectData[i][2]]);
                    }
                }
                else
                {
                    for (let i = 0; i < currentLayerData2.length; i++)
                    {
                        if (currentLayerData2[i][0] >= data.canvasWidth || currentLayerData2[i][1] >= data.canvasHeight || currentLayerData2[i][0] < 0 || currentLayerData2[i][1] < 0) return;
                        let gridX = (currentLayerData2[i][0] * data.scale) + data.canvasBeginPos.x;
                        let gridY = (currentLayerData2[i][1] * data.scale) + data.canvasBeginPos.y;
                        realCoords.push([gridX, gridY, currentLayerData2[i][2]]);
                    }
                }
                if (transform === 'hReverse')
                {
                    for (let i = 0; i < realCoords.length; i++)
                    {
                        // if (realCoords[i][2] === data.emptyColor) continue;
                        let beginX = realCoords[i][0];
                        let beginY = realCoords[i][1];
                        let endX = centerX + (centerX - realCoords[i][0] - data.scale);
                        let endY = beginY;
                        // const beginRow = Math.floor((beginY - data.drawAreaList[0][1]) / data.scale);
                        // const beginCol = Math.floor((beginX - data.drawAreaList[0][0]) / data.scale);
                        // const row = Math.floor((endY - data.drawAreaList[0][1]) / data.scale);
                        // const col = Math.floor((endX - data.drawAreaList[0][0]) / data.scale);
                        // let beginIndex = beginCol + beginRow * data.canvasWidth;
                        // let endIndex = col + row * data.canvasWidth;
                        // if (currentLayerData1[endIndex][2] === data.emptyColor)
                        // {
                        //     currentLayerData2[endIndex][2] = realCoords[i][2];
                        //     currentLayerData2[beginIndex][2] = data.emptyColor;
                        // }
                        // else
                        // {
                        //     currentLayerData2[endIndex][2] = realCoords[i][2];
                        //     currentLayerData2[beginIndex][2] = currentLayerData1[endIndex][2];
                        // }
                        // let col = (data.canvasWidth - 1) - currentLayerData2[i][0];
                        // let row = currentLayerData2[i][1];
                        // currentLayerData2[i][0] = col;
                        if (data.selectData.selectList.length && data.selectData.selectLayerId === currentLayerData1.layerId)
                        {
                            const beginRow = Math.floor((beginY - data.drawAreaList[0][1]) / data.scale);
                            const beginCol = Math.floor((beginX - data.drawAreaList[0][0]) / data.scale);
                            const row = Math.floor((endY - data.drawAreaList[0][1]) / data.scale);
                            const col = Math.floor((endX - data.drawAreaList[0][0]) / data.scale);
                            let beginIndex = beginCol + beginRow * data.canvasWidth;
                            let endIndex = col + row * data.canvasWidth;
                            currentLayerData2[endIndex][2] = realCoords[i][2];
                            currentLayerData2[beginIndex][2] = data.emptyColor;
                            data.selectData.selectList[i][0] = col;
                            data.selectData.selectList[i][1] = row;
                        }
                        else
                        {
                            let col = (data.canvasWidth - 1) - currentLayerData2[i][0];
                            // let row = currentLayerData2[i][1];
                            currentLayerData2[i][0] = col;
                        }
                    }
                }
                else if (transform === 'vReverse')
                {
                    for (let i = 0; i < realCoords.length; i++)
                    {
                        // if (realCoords[i][2] === data.emptyColor) continue;
                        let beginX = realCoords[i][0];
                        let beginY = realCoords[i][1];
                        let endX = beginX;
                        let endY = centerY + (centerY - realCoords[i][1] - data.scale);
                        // const beginRow = Math.floor((beginY - data.drawAreaList[0][1]) / data.scale);
                        // const beginCol = Math.floor((beginX - data.drawAreaList[0][0]) / data.scale);
                        // const row = Math.floor((endY - data.drawAreaList[0][1]) / data.scale);
                        // const col = Math.floor((endX - data.drawAreaList[0][0]) / data.scale);
                        // let beginIndex = beginCol + beginRow * data.canvasWidth;
                        // let endIndex = col + row * data.canvasWidth;
                        // if (currentLayerData1[endIndex][2] === data.emptyColor)
                        // {
                        //     currentLayerData2[endIndex][2] = realCoords[i][2];
                        //     currentLayerData2[beginIndex][2] = data.emptyColor;
                        // }
                        // else
                        // {
                        //     currentLayerData2[endIndex][2] = realCoords[i][2];
                        //     currentLayerData2[beginIndex][2] = currentLayerData1[endIndex][2];
                        // }
                        
                        if (data.selectData.selectList.length && data.selectData.selectLayerId === currentLayerData1.layerId)
                        {
                            const beginRow = Math.floor((beginY - data.drawAreaList[0][1]) / data.scale);
                            const beginCol = Math.floor((beginX - data.drawAreaList[0][0]) / data.scale);
                            const row = Math.floor((endY - data.drawAreaList[0][1]) / data.scale);
                            const col = Math.floor((endX - data.drawAreaList[0][0]) / data.scale);
                            let beginIndex = beginCol + beginRow * data.canvasWidth;
                            let endIndex = col + row * data.canvasWidth;
                            currentLayerData2[endIndex][2] = realCoords[i][2];
                            currentLayerData2[beginIndex][2] = data.emptyColor;
                            data.selectData.selectList[i][0] = col;
                            data.selectData.selectList[i][1] = row;
                        }
                        else
                        {
                            let row = (data.canvasHeight - 1) - currentLayerData2[i][1];
                            // let col = currentLayerData2[i][0];
                            currentLayerData2[i][1] = row;
                        }
                    }
                }
                else if (transform === 'ssz')
                {
                    for (let i = 0; i < realCoords.length; i++)
                    {
                        // const beginRow = Math.floor((realCoords[i][1] - data.drawAreaList[0][1]) / data.scale);
                        // const beginCol = Math.floor((realCoords[i][0] - data.drawAreaList[0][0]) / data.scale);
                        // let beginIndex = beginCol + beginRow * data.canvasWidth;
                        // if (realCoords[i][2] === data.emptyColor) 
                        // {
                        //     // emptyArr[i] = [currentLayerData2[beginIndex][0], currentLayerData2[beginIndex][1], realCoords[i][2]];
                        //     continue;
                        // }
                        let relativeX = realCoords[i][0] - centerX;
                        let relativeY = realCoords[i][1] - centerY;
                        let rotateX = -relativeY;
                        let rotateY = relativeX;
                        let endX = rotateX + centerX - data.scale;
                        let endY = rotateY + centerY;
                        
                        const beginRow = Math.floor((realCoords[i][1] - data.drawAreaList[0][1]) / data.scale);
                        const beginCol = Math.floor((realCoords[i][0] - data.drawAreaList[0][0]) / data.scale);
                        const row = Math.floor((endY - data.drawAreaList[0][1]) / data.scale);
                        const col = Math.floor((endX - data.drawAreaList[0][0]) / data.scale);
                        // let endIndex = col + row * data.canvasWidth;

                        // emptyArr[endIndex] = [col, row, realCoords[i][2]];

                        // let beginIndex = beginCol + beginRow * data.canvasWidth;
                        // if (currentLayerData1[endIndex][2] === data.emptyColor)
                        // {
                        //     currentLayerData2[endIndex][2] = realCoords[i][2];
                        //     currentLayerData2[beginIndex][2] = data.emptyColor;
                        // }
                        // else
                        // {
                        //     currentLayerData2[endIndex][2] = realCoords[i][2];
                        //     currentLayerData2[beginIndex][2] = currentLayerData1[endIndex][2];
                        // }
                        // currentLayerData2[i][0] = col;
                        // currentLayerData2[i][1] = row;
                        
                        // console.log(beginCol, beginRow, col, row);
                        
                        if (data.selectData.selectList.length && data.selectData.selectLayerId === currentLayerData1.layerId)
                        {
                            let beginIndex = beginCol + beginRow * data.canvasWidth;
                            let endIndex = col + row * data.canvasWidth;
                            currentLayerData2[endIndex][2] = realCoords[i][2];
                            currentLayerData2[beginIndex][2] = data.emptyColor;
                            data.selectData.selectList[i][0] = col;
                            data.selectData.selectList[i][1] = row;
                        }
                        else
                        {
                            currentLayerData2[i][0] = col;
                            currentLayerData2[i][1] = row;
                        }
                    }
                }
                else if (transform === 'nsz')
                {
                    for (let i = 0; i < realCoords.length; i++)
                    {
                        // if (realCoords[i][2] === data.emptyColor) continue;
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
                        // currentLayerData2[i][0] = col;
                        // currentLayerData2[i][1] = row;
                        // let endIndex = col + row * data.canvasWidth;
                        // let beginIndex = beginCol + beginRow * data.canvasWidth;
                        // if (currentLayerData1[endIndex][2] === data.emptyColor)
                        // {
                        //     currentLayerData2[endIndex][2] = realCoords[i][2];
                        //     currentLayerData2[beginIndex][2] = data.emptyColor;
                        // }
                        // else
                        // {
                        //     currentLayerData2[endIndex][2] = realCoords[i][2];
                        //     currentLayerData2[beginIndex][2] = currentLayerData1[endIndex][2];
                        // }
                        if (data.selectData.selectList.length && data.selectData.selectLayerId === currentLayerData1.layerId)
                        {
                            let beginIndex = beginCol + beginRow * data.canvasWidth;
                            let endIndex = col + row * data.canvasWidth;
                            currentLayerData2[endIndex][2] = realCoords[i][2];
                            currentLayerData2[beginIndex][2] = data.emptyColor;
                            data.selectData.selectList[i][0] = col;
                            data.selectData.selectList[i][1] = row;
                        }
                        else
                        {
                            currentLayerData2[i][0] = col;
                            currentLayerData2[i][1] = row;
                        }
                    }
                }
                // 进行排序
                currentLayerData2.sort((a, b) => 
                {
                    if (a[1] < b[1]) 
                    {
                        return -1;
                    } 
                    else if (a[1] > b[1]) 
                    {
                        return 1;
                    } 
                    return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0);
                });
                
                data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData = currentLayerData2;
                methods.reDraw();
            },

            drawTransformSymmetric ()
            {
                let arr = []  as any;
                for (let i = 0; i < data.drawList.length; i++)
                {
                    if (data.isHorizontal)
                    {
                        let newX = (data.canvasWidth - 1) - data.drawList[i][0];
                        let newY = data.drawList[i][1];
                        arr.push([newX, newY, data.drawList[i][2]]);
                    }
                    else if (data.isVertical)
                    {
                        let newX = data.drawList[i][0];
                        let newY = (data.canvasHeight - 1) - data.drawList[i][1];
                        arr.push([newX, newY, data.drawList[i][2]]);
                    }
                    else if (data.isCenter)
                    {
                        let gridX = (data.drawList[i][0] * data.scale) + data.canvasBeginPos.x;
                        let gridY = (data.drawList[i][1] * data.scale) + data.canvasBeginPos.y;
                        let newX = 2 * data.canvasBeginPos.centerX - (gridX + data.scale / 2);
                        let newY = 2 * data.canvasBeginPos.centerY - (gridY + data.scale / 2);
                        let col1 = Math.floor((newX - data.canvasBeginPos.x) / data.scale);
                        let row1 = Math.floor((newY - data.canvasBeginPos.y) / data.scale);
                        arr.push([col1, row1, data.drawList[i][2]]);
                    }
                }
                
                for (let j = 0; j < arr.length; j++)
                {
                    methods.addDrawRecord([arr[j][0], arr[j][1], arr[j][2]]);
                }
            },
            handleChangeBrushSymmetric (e, symmetric)
            {
                // 画笔对称
                if (symmetric === 'isHorizontal' && data[symmetric])
                {
                    data.isVertical = false;
                    data.isCenter = false;
                }
                else if (symmetric === 'isCenter' && data[symmetric])
                {
                    data.isVertical = false;
                    data.isHorizontal = false;
                }
                else if (symmetric === 'isVertical' && data[symmetric])
                {
                    data.isHorizontal = false;
                    data.isCenter = false;
                }
            },
            handleWheelEvent (event)
            {
                event.preventDefault();
                // console.log(event);
                const delta = event.deltaY > 0 ? -1 : 1;
                data.scale += delta;
                data.scale = Math.max(1, data.scale);
                console.log(data.scale);
                // data.brushSize = data.scale;
                // data.ctx1.clearRect(0, 0, data.canvas.width, data.canvas.height);
                methods.handleResizeDraw();
            },
            handleResizeCanvas (delta)
            {
                data.scale += delta;
                data.scale = Math.max(1, data.scale);
                methods.handleResizeDraw();
            },
            handleResizeDraw ()
            {
                methods.drawPixelArea();
                if (data.isScaling)
                {
                    methods.handleScaleFrame();
                }
                else
                {
                    if (data.pinDouMode) 
                    {
                        methods.handleDrawPindou(data.ctx1);
                    }
                    else
                    {
                        methods.reDraw(false);
                    }
                }
            },
            startDrawing () 
            {
                data.canvas.addEventListener('mousedown', methods.start);
                data.canvas.addEventListener('mousemove', methods.draw);
                data.canvas.addEventListener('mouseup', methods.stop);

                data.canvas.addEventListener('touchstart', methods.mobileStart);
                data.canvas.addEventListener('touchmove', methods.mobileDraw);
                data.canvas.addEventListener('touchend', methods.stop);

                data.canvas.addEventListener('mouseout', methods.leave);
                data.canvas.addEventListener('wheel', methods.handleWheelEvent);
            },
            mobileStart (event)
            {
                console.log(event);
                
                let obj = {
                    offsetX:event.touches[0].clientX - data.canvas.getBoundingClientRect().left,
                    offsetY:event.touches[0].clientY - data.canvas.getBoundingClientRect().top
                };
                methods.start(obj);
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
                        methods.draw(event);
                        // methods.removeDrawRecord([col, row]);
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
                            }
                        }
                        
                    }
                    else if (data.currentTool === 3)
                    {
                        if (data.selectData.selectList.length)
                        {
                            return proxy.$message.warning('请先取消选中区域');
                        }
                        if (data.isScaling) methods.handleCancelScale();
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
                    else if (data.currentTool === 5 && data.pinDouMode)
                    {
                        // 选择拼豆
                        let index = col + row * data.canvasWidth;
                        let arr = data.pinDouData.variables;
                        for (let i = 0; i < arr.length; i++)
                        {
                            if (arr[i].isRender)
                            {
                                if (arr[i].layerData[index][2] !== data.emptyColor) 
                                {
                                    let obj = {
                                        name:arr[i].layerData[index][3],
                                        color:arr[i].layerData[index][2],
                                        col,
                                        row
                                    };
                                    proxy.$refs.PindouDialog.selectedObj = obj;
                                    break;
                                }
                            }
                        }
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
                    else if (data.currentTool === 8 && data.selectType === 'select')
                    {
                        if (data.isScaling) methods.handleCancelScale();
                        let currentLayerData = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex];
                        if (!currentLayerData.isRender) return;
                        if (data.selectData.selectLayerId !== currentLayerData.layerId)
                        {
                            // console.log('11111');
                            
                            if (currentLayerData.layerData[col + row * data.canvasWidth][2] !== data.emptyColor)
                            {
                                // console.log('取消了');
                                methods.handleCancelSelect();
                                data.selectData.selectLayerId = currentLayerData.layerId;
                            }
                        }
                        data.isSelecting = true;
                        data.selectData.x = col;
                        data.selectData.y = row;
                        data.selectData.originList = JSON.parse(JSON.stringify(removeNullArray(currentLayerData.layerData.map((item) => 
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
                    else if (data.currentTool === 8 && data.selectType === 'quickSelect')
                    {
                        // 快速选择
                        let currentLayerData = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex];
                        if (!currentLayerData.isRender) return;
                        if (data.selectData.selectLayerId !== currentLayerData.layerId)
                        {
                            if (currentLayerData.layerData[col + row * data.canvasWidth][2] !== data.emptyColor)
                            {
                                methods.handleCancelSelect();
                                data.selectData.selectLayerId = currentLayerData.layerId;
                            }
                        }
                        data.isSelecting = true;
                        data.selectData.x = col;
                        data.selectData.y = row;
                        data.selectData.originList = JSON.parse(JSON.stringify(removeNullArray(currentLayerData.layerData.map((item) => 
                        {
                            if (item[2] !== data.emptyColor) 
                            {
                                return item;
                            }
                            return null;
                        }))));
                        const targetColor = data.ctx1.getImageData(event.offsetX, event.offsetY, 1, 1).data;                       
                        methods.fillChunkSelect(col, row, rgbaToHex(targetColor));
                    }
                    else if (data.currentTool === 9 && data.isScaling)
                    {
                        if (!data.scaleAreaData) return;
                        data.lastX = event.offsetX;
                        data.lastY = event.offsetY;
                        data.isScale = true;
                        // if (Math.abs(event.offsetX - data.scaleWhitePointPos[0][0]) <= 10 && Math.abs(event.offsetY - data.scaleWhitePointPos[0][1]) <= 10) 
                        // {
                        //     // 左上
                        // }
                        // else if (Math.abs(event.offsetX - data.scaleWhitePointPos[1][0]) <= 10 && Math.abs(event.offsetY - data.scaleWhitePointPos[1][1]) <= 10) 
                        // {
                        //     // 右上
                        // }
                        // else if (Math.abs(event.offsetX - data.scaleWhitePointPos[2][0]) <= 10 && Math.abs(event.offsetY - data.scaleWhitePointPos[2][1]) <= 10)
                        // {
                        //     // 左下
                        // }
                        // else if (Math.abs(event.offsetX - data.scaleWhitePointPos[3][0]) <= 10 && Math.abs(event.offsetY - data.scaleWhitePointPos[3][1]) <= 10) 
                        // {
                        //     // 右下
                        //     data.scaleAreaData.isRight = true;
                        //     data.scaleAreaData.isBottom = true;
                            
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
                    let index = col + row * data.canvasWidth;
                    data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData[index][2] = replacementColor;
                }
                methods.reDraw();
            },

            handleReplacePindouColor (value, callback)
            {
                // let replaceColor = methods.handleTransformColorAsHex(value.originObj.color);
                // let newColor = methods.handleTransformColorAsHex(value.replaceObj.color);
                let newColor = rgbaToHex(hexToRgba(value.replaceObj.color));
                let arr = data.pinDouData.variables;
                if (value.type === 1)
                {
                    console.log('更新当前像素颜色');
                    for (let i = arr.length - 1; i >= 0; i--)
                    {
                        if (arr[i].isRender)
                        {
                            for (let j = 0; j < arr[i].layerData.length; j += 2)
                            {
                                if (arr[i].layerData[j][0] === value.originObj.col && arr[i].layerData[j][1] === value.originObj.row && arr[i].layerData[j][3])
                                {
                                    arr[i].layerData[j][2] = newColor;
                                    arr[i].layerData[j][3] = value.replaceObj.name;
                                    break;
                                }
                                if (j + 1 < arr[i].layerData.length)
                                {
                                    if (arr[i].layerData[j + 1][0] === value.originObj.col && arr[i].layerData[j + 1][1] === value.originObj.row && arr[i].layerData[j + 1][3])
                                    {
                                        arr[i].layerData[j + 1][2] = newColor;
                                        arr[i].layerData[j + 1][3] = value.replaceObj.name;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    
                    
                }
                else if (value.type === 2)
                {
                    console.log('更新所有像素颜色');
                    for (let i = arr.length - 1; i >= 0; i--)
                    {
                        if (arr[i].isRender)
                        {
                            for (let j = 0; j < arr[i].layerData.length; j += 2)
                            {
                                if (arr[i].layerData[j][3] && arr[i].layerData[j][3] === value.originObj.name)
                                {
                                    arr[i].layerData[j][2] = newColor;
                                    arr[i].layerData[j][3] = value.replaceObj.name;
                                }
                                if (j + 1 < arr[i].layerData.length)
                                {
                                    if (arr[i].layerData[j + 1][3] && arr[i].layerData[j + 1][3] === value.originObj.name)
                                    {
                                        arr[i].layerData[j + 1][2] = newColor;
                                        arr[i].layerData[j + 1][3] = value.replaceObj.name;
                                    }
                                }
                            }
                        }
                    }
                }
                callback();
                methods.handleDrawPindou(data.ctx1);
            },

            fillChunk (x, y, targetColor, replacementColor)
            {
                console.log(targetColor, replacementColor, data.drawRecord);
                if (targetColor === replacementColor) return;
                const stack = [[x, y]];
                let seeked = [] as any;
                let currentLayerData = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData;
                const isSameColor = (col, row, color) =>
                {
                    // let currentLayerData = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData;
                    if (col >= 0 && col < data.canvasWidth && row >= 0 && row < data.canvasHeight)
                    {
                        let index = col + row * data.canvasWidth;
                        if (data.tolerance === 0) 
                        {
                            return currentLayerData[index][2] === color;
                        }
                        let rgbaColor1 = hexToRgba(currentLayerData[index][2]);
                        let rgbaColor2 = hexToRgba(color);
                        const diffR = Math.abs(rgbaColor1[0] - rgbaColor2[0]);
                        const diffG = Math.abs(rgbaColor1[1] - rgbaColor2[1]);
                        const diffB = Math.abs(rgbaColor1[2] - rgbaColor2[2]);
                        const diffA = Math.abs(rgbaColor1[3] - rgbaColor2[3]);
                        return diffR + diffG + diffB + diffA <= data.tolerance;
                    }
                };
                const setColor = (col, row, color) => 
                {
                    // let currentLayerData = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData;
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
                        seeked.push([x, y]);
                        if (x > 0)
                        {
                            // 左方
                            if (!seeked.find((v) => v[0] === x - 1 && v[1] === y))
                            {
                                stack.push([x - 1, y]);
                            }
                        }

                        if (x < data.canvasWidth - 1) 
                        {
                            if (!seeked.find((v) => v[0] === x + 1 && v[1] === y))
                            {
                                stack.push([x + 1, y]);
                            }
                        }

                        if (y > 0) 
                        {
                            if (!seeked.find((v) => v[0] === x && v[1] === y - 1))
                            {
                                stack.push([x, y - 1]);
                            }
                        }

                        if (x < data.canvasHeight - 1) 
                        {
                            if (!seeked.find((v) => v[0] === x && v[1] === y + 1))
                            {
                                stack.push([x, y + 1]);
                            }
                        }
                    }
                    // methods.reDraw(true, false);
                }
                methods.reDraw();
            },
            fillChunkSelect (x, y, targetColor)
            {
                console.log(targetColor);
                
                if (targetColor === data.emptyColor) return;
                if (data.selectData.selectList.find((item) => item[0] === x && item[1] === y)) return;
                const stack = [[x, y]];
                let seeked = [] as any;
                let currentLayerData = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData;
                // console.log(currentLayerData);
                
                const isSameColor = (col, row, color) =>
                {
                    
                    if (col >= 0 && col < data.canvasWidth && row >= 0 && row < data.canvasHeight)
                    {
                        let index = col + row * data.canvasWidth;
                        if (currentLayerData[index][2] === data.emptyColor) return false;
                        
                        if (data.tolerance === 0) return currentLayerData[index][2] === color;
                        
                        let rgbaColor1 = hexToRgba(currentLayerData[index][2]);
                        let rgbaColor2 = hexToRgba(color);
                        const diffR = Math.abs(rgbaColor1[0] - rgbaColor2[0]);
                        const diffG = Math.abs(rgbaColor1[1] - rgbaColor2[1]);
                        const diffB = Math.abs(rgbaColor1[2] - rgbaColor2[2]);
                        const diffA = Math.abs(rgbaColor1[3] - rgbaColor2[3]);
                        return diffR + diffG + diffB + diffA <= data.tolerance;
                    }
                };
                const setData = (col, row) => 
                {
                    // let currentLayerData = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData;
                    if (col >= 0 && col < data.canvasWidth && row >= 0 && row < data.canvasHeight)
                    {
                        // console.log(col, row);
                        
                        let index = col + row * data.canvasWidth;
                        let color1 = currentLayerData[index][2];
                        data.selectData.selectList.push([col, row, color1]);
                    }
                };
                // let count = 20;
                while (stack.length > 0) 
                {
                    // console.log(JSON.parse(JSON.stringify(stack)));
                    
                    const [x, y]:any = stack.pop();
                    // count--;
                    
                    if (isSameColor(x, y, targetColor)) 
                    {
                        setData(x, y);
                        seeked.push([x, y]);
                        if (x > 0)
                        {
                            // 左方
                            if (!seeked.find((v) => v[0] === x - 1 && v[1] === y))
                            {
                                stack.push([x - 1, y]);
                            }
                        }

                        if (x < data.canvasWidth - 1) 
                        {
                            if (!seeked.find((v) => v[0] === x + 1 && v[1] === y))
                            {
                                stack.push([x + 1, y]);
                            }
                        }

                        if (y > 0) 
                        {
                            if (!seeked.find((v) => v[0] === x && v[1] === y - 1))
                            {
                                stack.push([x, y - 1]);
                            }
                        }

                        if (x < data.canvasHeight - 1) 
                        {
                            if (!seeked.find((v) => v[0] === x && v[1] === y + 1))
                            {
                                stack.push([x, y + 1]);
                            }
                        }
                    }
                    // methods.reDraw(true, false);
                }
                methods.reDrawSelectData();
            },
            handleChangeMouseStyle (event)
            {
                // 更改鼠标样式
                if (!event) return;
                if (!data.scaleWhitePointPos.length) return;
                // if (Math.abs(event.offsetX - data.scaleWhitePointPos[0][0]) <= 10 && Math.abs(event.offsetY - data.scaleWhitePointPos[0][1]) <= 10) data.canvas.style.cursor = 'nw-resize';
                // else if (Math.abs(event.offsetX - data.scaleWhitePointPos[1][0]) <= 10 && Math.abs(event.offsetY - data.scaleWhitePointPos[1][1]) <= 10) data.canvas.style.cursor = 'ne-resize';
                // else if (Math.abs(event.offsetX - data.scaleWhitePointPos[2][0]) <= 10 && Math.abs(event.offsetY - data.scaleWhitePointPos[2][1]) <= 10) data.canvas.style.cursor = 'sw-resize';
                if (Math.abs(event.offsetX - data.scaleWhitePointPos[0][0]) <= 10 && Math.abs(event.offsetY - data.scaleWhitePointPos[0][1]) <= 10) 
                {
                    data.canvas.style.cursor = 'se-resize';
                    data.scaleAreaData.cursor = 'se-resize';
                }
            },
            draw (event) 
            {
                if (event.offsetX >= data.drawAreaList[0][0] && event.offsetX < data.drawAreaList[data.drawAreaList.length - 1][0] + data.scale && event.offsetY >= data.drawAreaList[0][1] && event.offsetY < data.drawAreaList[data.drawAreaList.length - 1][1] + data.scale)
                {
                    const row = Math.floor((event.offsetY - data.drawAreaList[0][1]) / data.scale);
                    const col = Math.floor((event.offsetX - data.drawAreaList[0][0]) / data.scale);
                    // console.log(col, row);
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
                        methods.addCursorClass(event);
                    }
                    data.gridInfo = `[${col}, ${row}]`;
                    if (data.isDrawing)
                    {
                        
                        let gridX = (col * data.scale) + data.canvasBeginPos.x;
                        let gridY = (row * data.scale) + data.canvasBeginPos.y;
                        console.log(col, row, gridX, gridY);
                        for (let i = 0; i < data.brushSize; i++)
                        {
                            let y = gridY + (data.scale) * i;
                            for (let j = 0; j < data.brushSize; j++)
                            {
                                let x = gridX + (data.scale) * j;
                                let col1 = Math.floor((x - data.canvasBeginPos.x) / data.scale);
                                let row1 = Math.floor((y - data.canvasBeginPos.y) / data.scale);
                                if (col1 < data.canvasWidth && row1 < data.canvasHeight)
                                {
                                    methods.addDrawRecord([col1, row1, data.brushColor]);
                                }
                            }
                        }
                        // methods.addDrawRecord([col, row, data.brushColor]);
                        if (data.isHorizontal || data.isVertical || data.isCenter)
                        {
                            for (let i = 0; i < data.brushSize; i++)
                            {
                                let y = gridY + (data.scale) * i;
                                for (let j = 0; j < data.brushSize; j++)
                                {
                                    let x = gridX + (data.scale) * j;
                                    let col1 = Math.floor((x - data.canvasBeginPos.x) / data.scale);
                                    let row1 = Math.floor((y - data.canvasBeginPos.y) / data.scale);
                                    if (col1 < data.canvasWidth && row1 < data.canvasHeight)
                                    {
                                        methods.addDrawList(col1, row1, data.brushColor);
                                    }
                                }
                            }
                            // let symmetric = data.isHorizontal ? 'hReverse' : 'vReverse';
                            methods.drawTransformSymmetric();
                        }
                        if (data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].isRender)
                        {
                            // let gridX = (col * data.scale) + data.canvasBeginPos.x;
                            // let gridY = (row * data.scale) + data.canvasBeginPos.y;
                            // data.ctx1.lineWidth = data.scale * data.brushSize;
                            // data.ctx1.strokeStyle = data.brushColor;
                            // data.ctx1.lineCap = 'square';
                            // data.ctx1.beginPath();
                            // // data.ctx1.lineTo(gridX + data.scale / 2, gridY + data.scale / 2);
                            // let x = gridX + (data.scale / 2) * data.brushSize;
                            // let y = gridY + (data.scale / 2) * data.brushSize;
                            // if (x >= data.canvasWidth * data.scale)
                            // {
                            //     x = gridX;
                            // }
                            // if (y >= data.canvasHeight * data.scale)
                            // {
                            //     y = gridY;
                            // }
                            // data.ctx1.lineTo(x, y);
                            // data.ctx1.stroke();
                            methods.reDraw(false);
                        }
                    }
                    if (data.isErasering)
                    {
                        let gridX = (col * data.scale) + data.canvasBeginPos.x;
                        let gridY = (row * data.scale) + data.canvasBeginPos.y;
                        for (let i = 0; i < data.eraserSize; i++)
                        {
                            let y = gridY + (data.scale) * i;
                            for (let j = 0; j < data.eraserSize; j++)
                            {
                                let x = gridX + (data.scale) * j;
                                let col1 = Math.floor((x - data.canvasBeginPos.x) / data.scale);
                                let row1 = Math.floor((y - data.canvasBeginPos.y) / data.scale);
                                if (col1 < data.canvasWidth && row1 < data.canvasHeight)
                                {
                                    methods.removeDrawRecord([col1, row1]);
                                }
                            }
                        }
                        // methods.removeDrawRecord([col, row]);
                    }
                    if (data.isDrawShape)
                    {
                        data.ctx1.globalAlpha = 1;
                        data.ctx1.strokeStyle = data.brushColor;
                        data.ctx1.lineWidth = data.scale;
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
                                methods.reDraw(false);
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
                                // data.ctx1.fillStyle = data.brushColor;
                                // let l = data.drawShapeList.length;
                                let startX = data.drawShapeList[0][0];
                                let startY = data.drawShapeList[0][1];
                                let endX = col;
                                let endY = row;
                                let arr = methods.drawCircle(startX, startY, endX, endY, data.scale);
                                // console.log(arr);
                                methods.reDraw(false);
                                for (let i = 0; i < arr.length; i++)
                                {
                                    if (arr[i][0] > data.canvasWidth || arr[i][1] > data.canvasHeight || arr[i][0] < 0 || arr[i][1] < 0) return;
                                    let gridX = (arr[i][0] * data.scale) + data.canvasBeginPos.x;
                                    let gridY = (arr[i][1] * data.scale) + data.canvasBeginPos.y;
                                    data.ctx1.fillStyle = data.brushColor;
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
                                // data.ctx1.fillStyle = data.brushColor;
                                // let gridX = (col * data.scale) + data.canvasBeginPos.x;
                                // let gridY = (row * data.scale) + data.canvasBeginPos.y;
                                // let l = data.drawShapeList.length;
                                let startX = data.drawShapeList[0][0];
                                let startY = data.drawShapeList[0][1];
                                let endX = col;
                                let endY = row;
                                let arr = methods.drawLine(startX, startY, endX, endY);
                                // console.log(arr);
                                methods.reDraw(false);
                                for (let i = 0; i < arr.length; i++)
                                {
                                    if (arr[i][0] > data.canvasWidth || arr[i][1] > data.canvasHeight || arr[i][0] < 0 || arr[i][1] < 0) return;
                                    let gridX = (arr[i][0] * data.scale) + data.canvasBeginPos.x;
                                    let gridY = (arr[i][1] * data.scale) + data.canvasBeginPos.y;
                                    data.ctx1.fillStyle = data.brushColor;
                                    data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                                }
                            }
                            // }
                            
                        }
                        else if (data.currentDrawShape === 'curve' && data.curveType.isPress)
                        {
                            methods.addShapeList(col, row);
                            if (data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].isRender)
                            {
                                let startX = data.drawShapeList[0][0];
                                let startY = data.drawShapeList[0][1];
                                let endX = col;
                                let endY = row;
                                if (startX === endX && startY === endY) return;
                                if (startX === endX || startY === endY)
                                {
                                    let centerX = 0;
                                    let centerY = 0;
                                    let numSteps = 0;
                                    if (startX === endX && ['3', '4'].includes(data.curveType.pressKey))
                                    {
                                        // centerX = Math.round(startX - data.curvature) || 0;
                                        centerY = Math.round(Math.min(startY, endY) + Math.abs(endY - startY) / 2);
                                        
                                        if (data.curveType.pressKey === '3')
                                        {
                                            // 左
                                            centerX = Math.round(startX - data.curvature) <= 0 ? 0 : Math.round(startX - data.curvature);
                                        }
                                        else if (data.curveType.pressKey === '4')
                                        {
                                            centerX = Math.round(startX + data.curvature) >= data.canvasWidth ? data.canvasWidth : Math.round(startX + data.curvature);
                                        }
                                        // numSteps = Math.round(Math.abs(endY - startY) + Math.abs(centerX - startX));
                                        // console.log(centerX, centerY, startX, startY, endX, endY);
                                        numSteps = Math.abs(endY - startY);
                                    }
                                    else if (startY === endY && ['1', '2'].includes(data.curveType.pressKey))
                                    {
                                        centerX = Math.round(Math.abs(endX - startX) / 2 + Math.min(startX, endX));
                                        if (data.curveType.pressKey === '1')
                                        {
                                            // 上
                                            centerY = Math.round(startY - data.curvature) <= 0 ? 0 : Math.round(startY - data.curvature); 
                                        }
                                        else if (data.curveType.pressKey === '2')
                                        {
                                            centerY = Math.round(startY + data.curvature) >= data.canvasHeight ? data.canvasHeight : Math.round(startY + data.curvature); 
                                        }
                                        // console.log(centerX, centerY, startX, startY, endX, endY);
                                        // centerY = Math.round(startY - data.curvature) || 0; 
                                        
                                        // numSteps = Math.round(Math.abs(endX - startX) + Math.abs(centerY - startY));
                                        numSteps = Math.abs(endX - startX);
                                        
                                    }
                                    if (centerX === 0 && centerY === 0) return;
                                    let arr = methods.drawCurve({x:startX, y:startY}, {x:centerX, y:centerY}, {x:endX, y:endY}, 20 + numSteps);
                                    // console.log(arr);
                                    data.curveEndPos = [endX, endY];
                                    methods.reDraw(false);
                                    for (let i = 0; i < arr.length; i++)
                                    {
                                        if (arr[i][0] > data.canvasWidth || arr[i][1] > data.canvasHeight) return;
                                        let gridX = (arr[i][0] * data.scale) + data.canvasBeginPos.x;
                                        let gridY = (arr[i][1] * data.scale) + data.canvasBeginPos.y;
                                        data.ctx1.fillStyle = data.brushColor;
                                        data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                                    }
                                }
                                
                            }
                        }
                    }
                    if (data.isMoving && !data.isSelecting && data.moveData.list.length)
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
                            data.ctx2.moveTo(data.canvasBeginPos.centerX, 0);
                            data.ctx2.lineTo(data.canvasBeginPos.centerX, data.bgCanvas.height);
                            data.ctx2.stroke();
                        }
                        
                        if (thresholdY >= 0 && thresholdY <= data.scale / 2)
                        {
                            data.ctx2.beginPath();
                            data.ctx2.moveTo(0, data.canvasBeginPos.centerY);
                            data.ctx2.lineTo(data.bgCanvas.width, data.canvasBeginPos.centerY);
                            data.ctx2.stroke();
                        }

                        if (thresholdX > data.scale / 2  || thresholdY > data.scale / 2)
                        {
                            methods.drawPixelArea();
                            if (thresholdX >= 0 && thresholdX <= data.scale / 2)
                            {
                                data.ctx2.globalAlpha = 0.8;
                                data.ctx2.beginPath();
                                data.ctx2.moveTo(data.canvasBeginPos.centerX, 0);
                                data.ctx2.lineTo(data.canvasBeginPos.centerX, data.bgCanvas.height);
                                data.ctx2.stroke();
                            }
                            if (thresholdY >= 0 && thresholdY <= data.scale / 2)
                            {
                                data.ctx2.globalAlpha = 0.8;
                                data.ctx2.beginPath();
                                data.ctx2.moveTo(0, data.canvasBeginPos.centerY);
                                data.ctx2.lineTo(data.bgCanvas.width, data.canvasBeginPos.centerY);
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
                            // data.ctx1.clearRect(0, 0, data.canvas.width, data.canvas.height);
                            methods.reDraw(false, false, data.canvasBeginPos, false); // 绘制其他图层
                            for (let i = 0; i < data.selectData.originList.length; i++) // 绘制当前图层
                            {
                                if (data.selectData.originList[i][0] >= data.canvasWidth || data.selectData.originList[i][1] >= data.canvasHeight || data.selectData.originList[i][0] < 0 || data.selectData.originList[i][1] < 0) continue;
                                if (!data.selectData.copyList.length)
                                {
                                    if (data.selectData.selectList.find((item) => data.selectData.originList[i][0] === item[0] && data.selectData.originList[i][1] === item[1])) 
                                    {
                                        continue;
                                    }
                                }
                                let gridX = (data.selectData.originList[i][0] * data.scale) + data.canvasBeginPos.x;
                                let gridY = (data.selectData.originList[i][1] * data.scale) + data.canvasBeginPos.y;
                                data.ctx1.fillStyle = data.selectData.originList[i][2];
                                data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                            }
                            console.log(data.moveData.list);
                            for (let i = 0; i < data.moveData.list.length; i++) // 绘制选择移动的图层
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
                                methods.reDrawSelectData();
                                // for (let i = 0; i < data.selectData.selectList.length; i++)
                                // {
                                //     if (data.selectData.selectList[i][0] >= data.canvasWidth || data.selectData.selectList[i][1] >= data.canvasHeight || data.selectData.selectList[i][0] < 0 || data.selectData.selectList[i][1] < 0) continue;
                                //     let gridX = (data.selectData.selectList[i][0] * data.scale) + data.canvasBeginPos.x;
                                //     let gridY = (data.selectData.selectList[i][1] * data.scale) + data.canvasBeginPos.y;
                                //     data.ctx1.fillStyle = data.selectData.selectList[i][2];
                                //     data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                                //     data.ctx1.fillStyle = data.selectActiveColor;
                                //     data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                                //     const centerX = gridX + data.scale / 2;
                                //     const centerY = gridY + data.scale / 2;
                                //     // 绘制圆点
                                //     data.ctx1.beginPath();
                                //     data.ctx1.arc(centerX, centerY, 5, 0, 2 * Math.PI);
                                //     data.ctx1.fillStyle = '#3c8bfbff';
                                //     data.ctx1.fill();
                                // }
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
                    if (data.isScale)
                    {
                        data.canvas.style.cursor = data.scaleAreaData.cursor;
                        const dx = event.offsetX - data.lastX;
                        const dy = event.offsetY - data.lastY;
                        // console.log(dx, dy);
                        
                        if ((dx >= data.scale - 5 && dy >= data.scale - 5) || (dx <= -data.scale + 5 && dy <= -data.scale + 5))
                        {
                            if (dx >= data.scale - 5 || dy >= data.scale - 5) data.scaleRatio = data.scaleRatio += 1;
                            else if (dx <= -data.scale + 5 || dy <= -data.scale + 5) data.scaleRatio = data.scaleRatio -= 1;
                            data.lastX = event.offsetX;
                            data.lastY = event.offsetY;
                            if (data.scaleAreaData.coordMaxtrix.length + data.scaleRatio === 0) data.scaleRatio += 1;
                            console.log(data.scaleRatio);
                            
                            let scaledCoordMap = nearestNeighborCoordZoom(data.scaleAreaData, data.scaleRatio);
                            let scaledColorMap = nearestNeighborColorZoom(data.scaleAreaData, data.scaleRatio);
                            console.log(scaledCoordMap, scaledColorMap);
                            data.scaleAreaData.scaledCoordMap = scaledCoordMap;
                            data.scaleAreaData.scaledColorMap = scaledColorMap;
                            methods.reDraw(false, false, data.canvasBeginPos, false);
                            for (let y = 0; y < scaledCoordMap.length; y++)
                            {
                                for (let x = 0; x < scaledCoordMap[y].length; x++)
                                {
                                    let gridX = (scaledCoordMap[y][x][0] * data.scale) + data.canvasBeginPos.x;
                                    let gridY = (scaledCoordMap[y][x][1] * data.scale) + data.canvasBeginPos.y;
                                    data.ctx1.fillStyle = scaledColorMap[y][x][0];
                                    data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                                    // scaledCoordMap[y][x][2] = scaledColorMap[y][x][0];
                                    // methods.addDrawRecord([scaledCoordMap[y][x][0], scaledCoordMap[y][x][1], scaledColorMap[y][x][0]]);
                                }
                            }
                            let realmaxX = ((data.scaleAreaData.maxX + data.scaleRatio) * data.scale) + data.canvasBeginPos.x + data.scale;
                            let realminX = (data.scaleAreaData.minX * data.scale) + data.canvasBeginPos.x;
                            let realmaxY = ((data.scaleAreaData.maxY + data.scaleRatio) * data.scale) + data.canvasBeginPos.y + data.scale;
                            let realminY = (data.scaleAreaData.minY * data.scale) + data.canvasBeginPos.y;
                            methods.drawPixelArea();
                            console.log(data.scaleRatio, data.scaleAreaData, realmaxX, realmaxY);
                            methods.handleDrawScaleFrame(realminX - 5, realminY - 5, realmaxX + 5, realmaxY + 5);
                        }
                        // console.log(data.scaleRatio);
                    }
                    
                }
                else
                {
                    // data.canvas.style.cursor = '';
                    data.canvas.classList = '';
                    if (data.isScaling) methods.handleChangeMouseStyle(event);
                }
                
            },

            mobileDraw (event)
            {
                let obj = {
                    offsetX:event.touches[0].clientX - data.canvas.getBoundingClientRect().left,
                    offsetY:event.touches[0].clientY - data.canvas.getBoundingClientRect().top
                };
                methods.draw(obj);
            },

            // handleDrawSelect
            // handleSelect (value)
            // {
            //     // if (value === 'move')
            //     // {
            //     //     if (data.selectData.selectList.length)
            //     //     {
            //     //         data.isMoving = true;
            //     //         data.isShift = true;
            //     //     }
            //     // }
            //     // else
            //     // {
            //     //     //
            //     // }
            // },

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
                    data.selectData.selectLayerId = 0;
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
                    if (data.isScaling)
                    {
                        methods.handleScaleFrame({ x:beginX, y:beginY, centerX, centerY });
                    }
                    else
                    {
                        if (data.pinDouMode) 
                        {
                            methods.handleDrawPindou(data.ctx1, { x:beginX, y:beginY, centerX, centerY });
                        }
                        else
                        {
                            methods.reDraw(false, false, { x:beginX, y:beginY, centerX, centerY });
                        }
                    }
                    // methods.reDrawSelectData({ x:beginX, y:beginY });
                }
                
            },
            handleScaleFrame (canvasBeginPos = data.canvasBeginPos)
            {
                if (data.isScaling)
                {
                    if (data.scaleAreaData.scaledCoordMap)
                    {
                        methods.reDraw(false, false, canvasBeginPos, false);
                        for (let y = 0; y < data.scaleAreaData.scaledCoordMap.length; y++)
                        {
                            for (let x = 0; x < data.scaleAreaData.scaledCoordMap[y].length; x++)
                            {
                                let gridX = (data.scaleAreaData.scaledCoordMap[y][x][0] * data.scale) + canvasBeginPos.x;
                                let gridY = (data.scaleAreaData.scaledCoordMap[y][x][1] * data.scale) + canvasBeginPos.y;
                                data.ctx1.fillStyle = data.scaleAreaData.scaledColorMap[y][x][0];
                                data.ctx1.fillRect(gridX, gridY, data.scale, data.scale);
                            }
                        }
                    }
                    else
                    {
                        methods.reDraw(false, false, canvasBeginPos);
                    }
                    let realmaxX = ((data.scaleAreaData.maxX + data.scaleRatio) * data.scale) + canvasBeginPos.x + data.scale;
                    let realminX = (data.scaleAreaData.minX * data.scale) + canvasBeginPos.x;
                    let realmaxY = ((data.scaleAreaData.maxY + data.scaleRatio) * data.scale) + canvasBeginPos.y + data.scale;
                    let realminY = (data.scaleAreaData.minY * data.scale) + canvasBeginPos.y;
                    methods.handleDrawScaleFrame(realminX - 5, realminY - 5, realmaxX + 5, realmaxY + 5, false);
                }
            },
            addDrawList (col, row, brushColor)
            {
                let flag = false;
                for (let i = 0; i < data.drawList.length; i++)
                {
                    if (data.drawList[i][0] === col && data.drawList[i][1] === row)
                    {
                        flag = true;
                        break;
                    }
                }
                if (!flag) data.drawList.push([col, row, brushColor]);
            },
            addShapeList (col, row)
            {
                data.drawShapeList.push([col, row]);
                // let flag = false;
                // for (let i = 0; i < data.drawShapeList.length; i++)
                // {
                //     if (data.drawShapeList[i][0] === col && data.drawShapeList[i][1] === row)
                //     {
                //         flag = true;
                //         break;
                //     }
                // }
                // if (!flag) data.drawShapeList.push([col, row]);
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

            drawCurve (P0, P1, P2, numPoints) 
            {
                // console.log(numPoints);
                const points = [] as any;
                for (let i = 0; i <= numPoints; i++) 
                {
                    let t = i / numPoints;
                    let x = Math.round(Math.pow(1 - t, 2) * P0.x + 2 * t * (1 - t) * P1.x + Math.pow(t, 2) * P2.x);
                    let y = Math.round(Math.pow(1 - t, 2) * P0.y + 2 * t * (1 - t) * P1.y + Math.pow(t, 2) * P2.y);
                    
                    points.push([x, y]);
                }
                let arr = unique2DArray(points);
                arr = arr.filter((item) => 
                {
                    return item[0] >= 0 && item[1] >= 0;
                });
                return arr;
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
            handleLayerImg ()
            {
                let scale = 1;
                if (data.canvasWidth > data.canvasHeight) scale = Math.floor(Math.max(1, 40 / data.canvasWidth));
                else scale = Math.floor(Math.max(1, 40 / data.canvasHeight));
                let layerData = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData;
                let isEmpty = 0;
                data.realCanvas.width = data.canvasWidth * scale;
                data.realCanvas.height = data.canvasHeight * scale;
                data.ctx3.clearRect(0, 0, data.realCanvas.width, data.realCanvas.height);
                data.ctx3.globalAlpha = 1;
                for (let y = 0; y < data.canvasHeight; y++) 
                {
                    for (let x = 0; x < data.canvasWidth; x++) 
                    {
                        let color = layerData[x + (y * data.canvasWidth)][2];
                        if (color === data.emptyColor) isEmpty++;
                        data.ctx3.fillStyle = color;
                        data.ctx3.fillRect(x * scale, y * scale, scale, scale);
                    }
                }
                if (isEmpty >= data.canvasHeight * data.canvasWidth) 
                {
                    data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].currentLayerImg = methods.handleGridImg();
                    return;
                }
                data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].currentLayerImg = data.realCanvas.toDataURL('image/png');
            },

            handleGridImg ()
            {
                data.realCanvas.width = 40;
                data.realCanvas.height = 40;
                data.ctx3.globalAlpha = 0.25;
                data.ctx3.clearRect(0, 0, data.realCanvas.width, data.realCanvas.height);
                for (let y = 0; y < data.realCanvas.height; y++) 
                {
                    for (let x = 0; x < data.realCanvas.width; x++) 
                    {
                        if ((y + x) % 2 === 0) 
                        {
                            // 深色格子
                            data.ctx3.fillStyle = 'rgba(0, 0, 0, 0.5)';
                        } 
                        else 
                        {
                            // 浅色格子
                            data.ctx3.fillStyle = 'rgba(100, 100, 100, 0.5)';
                        }
                        data.ctx3.fillRect(x * 6, y * 6, 6, 6);
                        
                    }
                }
                return data.realCanvas.toDataURL('image/png');
            },

            handleFrameImg (ctx, isAddHistory = true)
            {
                // let beginX = data.drawAreaList[0][0];
                // let beginY = data.drawAreaList[0][1];
                // const imageData = ctx.getImageData(beginX, beginY, data.canvasWidth * data.scale, data.canvasHeight * data.scale);
                // const dataURL = generateIamge(data.canvasWidth * data.scale, data.canvasHeight * data.scale, imageData);
                console.log('执行了');
                
                let scale = 5;
                let count = 0;
                const imageData = data.drawRecord[data.currentFrameIndex].layer;
                data.realCanvas.width = data.canvasWidth * scale;
                data.realCanvas.height = data.canvasHeight * scale;
                data.ctx3.clearRect(0, 0, data.realCanvas.width, data.realCanvas.height);
                data.ctx3.globalAlpha = 1;
                for (let i = imageData.length - 1; i >= 0; i--)
                {
                    if (imageData[i].isRender)
                    {
                        for (let y = 0; y < data.canvasHeight; y++) 
                        {
                            for (let x = 0; x < data.canvasWidth; x++) 
                            {
                                let color = imageData[i].layerData[x + (y * data.canvasWidth)][2];
                                if (color === data.emptyColor) count++;
                                // 在新的 canvas 上绘制缩小后的像素
                                data.ctx3.fillStyle = color;
                                data.ctx3.fillRect(x * scale, y * scale, scale, scale);
                            }
                        }
                    }
                }
                if (count >= data.canvasHeight * data.canvasHeight * imageData.length) 
                {
                    data.drawRecord[data.currentFrameIndex].currentFrameImg = '';
                }
                else 
                {
                    let dataURL = data.realCanvas.toDataURL('image/png');
                    data.drawRecord[data.currentFrameIndex].currentFrameImg = dataURL;
                }
                methods.handleLayerImg();
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

            handleExportPindou (callback)
            {
                // 导出拼豆图
                const bigCanvas:any = document.createElement('canvas');
                let scale = 30;
                let ruler = 30;
                bigCanvas.width = data.canvasWidth * scale + ruler * 2;
                bigCanvas.height = data.canvasHeight * scale + ruler * 2;
                const bigCtx:any = bigCanvas.getContext('2d');
                bigCtx.imageSmoothingEnabled = true;
                const imageData = data.pinDouData.variables;
                // 先绘制标尺
                for (let y = 0; y < data.canvasHeight; y++) 
                {
                    // 绘制左边
                    let x1 = ruler / 2;
                    let y1 = (scale * y) + (scale / 2) * 3 + 5;
                    let x2 = bigCanvas.width - ruler / 2;
                    let y2 = y1;
                    bigCtx.font = 'bold 14px Arial';
                    bigCtx.textAlign = 'center';
                    bigCtx.fillStyle = 'red';
                    bigCtx.fillText((y + 1).toString(), x1, y1);
                    bigCtx.fillText((y + 1).toString(), x2, y2);
                }
                for (let x = 0; x < data.canvasWidth; x++) 
                {
                    // 绘制上下
                    let x1 = (scale * x) + (scale / 2) * 3;
                    let y1 = ruler / 2 + 5;
                    let x2 = x1;
                    let y2 = bigCanvas.height - ruler / 2;
                    bigCtx.font = 'bold 14px Arial';
                    bigCtx.fillStyle = 'green';
                    bigCtx.textAlign = 'center';
                    bigCtx.fillText((x + 1).toString(), x1, y1);
                    bigCtx.fillText((x + 1).toString(), x2, y2);
                }
                console.log(imageData);
                let fillPixel = new Map();
                console.log(fillPixel);
                
                for (let i = imageData.length - 1; i >= 0; i--)
                {
                    if (imageData[i].isRender)
                    {
                        for (let y = 0; y < data.canvasHeight; y++) 
                        {
                            for (let x = 0; x < data.canvasWidth; x++) 
                            {
                                let color = imageData[i].layerData[x + (y * data.canvasWidth)][2];
                                if (color === data.emptyColor)
                                {
                                    if (!fillPixel.has(`${x}-${y}`))
                                    {
                                        bigCtx.fillStyle = 'black';
                                        bigCtx.beginPath();
                                        bigCtx.arc((x * scale + ruler) + (scale / 2), (y * scale + ruler) + (scale / 2), 3, 0, 2 * Math.PI);
                                        bigCtx.fill();
                                    }
                                    
                                }
                                else
                                {   
                                    if (!fillPixel.has(`${x}-${y}`))
                                    {
                                        fillPixel.set(`${x}-${y}`, true);
                                    }
                                    bigCtx.fillStyle = color;
                                    bigCtx.fillRect(x * scale + ruler, y * scale + ruler, scale, scale);
                                }
                                if (imageData[i].layerData[x + (y * data.canvasWidth)][3])
                                {
                                    let gridX = x * scale + ruler;
                                    let gridY =  y * scale + ruler;
                                    // let textHeight = ~~(scale / 2);
                                    // bigCtx.font = `${textHeight}px sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial Narrow, Times, Arial, "Times New Roman"`;
                                    // let textWidth = ~~(bigCtx.measureText(imageData[i].layerData[x + (y * data.canvasWidth)][3]).width);
                                    // if (textWidth >= 16) textHeight -= 2;
                                    let textHeight = ~~(scale / 2);
                                    bigCtx.font = `${textHeight}px sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial Narrow, Times, Arial, "Times New Roman"`;
                                    let textWidth = ~~(bigCtx.measureText(imageData[i].layerData[x + (y * data.canvasWidth)][3]).width);
                                    textHeight = measureTextHeight(textWidth, textHeight);
                                    bigCtx.font = `${textHeight}px sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial Narrow, Times, Arial, "Times New Roman"`;
                                    textWidth = ~~(bigCtx.measureText(imageData[i].layerData[x + (y * data.canvasWidth)][3]).width);


                                    bigCtx.textAlign = 'start';
                                    bigCtx.fillStyle = getFontColor(imageData[i].layerData[x + (y * data.canvasWidth)][2]);
                                    const x1 = gridX + (scale - textWidth) / 2;
                                    const y1 = gridY + (scale - textHeight) / 2 + textHeight;
                                    bigCtx.fillText(imageData[i].layerData[x + (y * data.canvasWidth)][3], ~~(x1), ~~(y1));
                                }
                            }
                        }
                    }
                }
                console.log(fillPixel);
                
                downloadImage(bigCanvas, '拼豆图 - ' + data.projectData.projectName);
                callback();
            },

            addDrawRecord (value, isUpdate = true)
            {
                console.log(value);
                let color = value[2];
                let newColor = methods.handleTransformColorAsHex(color).toLowerCase();
                let arr = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData;
                let index = value[0] + (value[1] * data.canvasWidth);
                if (index >= data.canvasWidth * data.canvasHeight) return;
                arr[index][2] = newColor;
                // console.log(data.drawRecord);
                if (isUpdate)
                {
                    // 更新帧图片
                    data.FrameTimer && clearTimeout(data.FrameTimer);
                    data.FrameTimer = setTimeout(() => 
                    {
                        methods.handleFrameImg(data.ctx1);
                    }, 300);
                }
                
            },

            removeDrawRecord (value, isRedraw = true)
            {
                // console.log(value);
                
                let arr = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].layerData;
                // console.log(arr);
                let index = value[0] + value[1] * data.canvasWidth;
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
            handlePindouHighlight (value)
            {
                if (!value.isHighlight) 
                {
                    data.pindouHighlight = null;
                    methods.handleDrawPindou(data.ctx1);
                    return;
                }
                data.pindouHighlight = value;
                methods.handleDrawPindou(data.ctx1, data.canvasBeginPos, value);

            },
            handleDrawPindou (ctx, beginPos = data.canvasBeginPos, highlight = data.pindouHighlight)
            {
                // 画拼豆
                ctx.clearRect(0, 0, data.canvas.width, data.canvas.height);
                let arr = data.pinDouData.variables;
                ctx.imageSmoothingEnabled = false;
                for (let i = arr.length - 1; i >= 0; i--)
                {
                    // 从最后一项开始绘制
                    if (arr[i].isRender)
                    {
                        for (let v = 0; v < arr[i].layerData.length; v++)
                        {
                            if (arr[i].layerData[v][0] >= data.canvasWidth || arr[i].layerData[v][1] >= data.canvasHeight || arr[i].layerData[v][0] < 0 || arr[i].layerData[v][1] < 0) continue;
                            if (arr[i].layerData[v][2] !== data.emptyColor) 
                            {
                                let gridX = (arr[i].layerData[v][0] * data.scale) + beginPos.x;
                                let gridY = (arr[i].layerData[v][1] * data.scale) + beginPos.y;
                                ctx.fillStyle = arr[i].layerData[v][2];
                                ctx.fillRect(gridX, gridY, data.scale, data.scale);
                                if (arr[i].layerData[v][3] && !highlight)
                                {
                                    let textHeight = ~~(data.scale / 2);
                                    ctx.font = `${textHeight}px sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial Narrow, Times, Arial, "Times New Roman"`;
                                    let textWidth = ~~(ctx.measureText(arr[i].layerData[v][3]).width);
                                    textHeight = measureTextHeight(textWidth, textHeight);
                                    ctx.font = `${textHeight}px sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial Narrow, Times, Arial, "Times New Roman"`;
                                    textWidth = ~~(ctx.measureText(arr[i].layerData[v][3]).width);
                                    // console.log(textWidth, textHeight);
                                    ctx.fillStyle = getFontColor(arr[i].layerData[v][2]);
                                    // ctx.textBaseline = 'middle';
                                    // ctx.textAlign = 'center';
                                    const x = gridX + (data.scale - textWidth) / 2;
                                    const y = gridY + (data.scale - textHeight) / 2 + textHeight;
                                    ctx.fillText(arr[i].layerData[v][3], ~~(x), ~~(y));
                                }
                                if (arr[i].layerData[v][3] && highlight)
                                {
                                    if (highlight.type === 1)
                                    {
                                        // 单个像素显示
                                        if (arr[i].layerData[v][0] === highlight.selectedObj.col && arr[i].layerData[v][1] === highlight.selectedObj.row)
                                        {
                                            let textHeight = ~~(data.scale / 2);
                                            ctx.font = `${textHeight}px sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial Narrow, Times, Arial, "Times New Roman"`;
                                            let textWidth = ~~(ctx.measureText(arr[i].layerData[v][3]).width);
                                            textHeight = measureTextHeight(textWidth, textHeight);
                                            ctx.font = `${textHeight}px sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial Narrow, Times, Arial, "Times New Roman"`;
                                            textWidth = ~~(ctx.measureText(arr[i].layerData[v][3]).width);
                                            ctx.fillStyle = getFontColor(arr[i].layerData[v][2]);
                                            const x = gridX + (data.scale - textWidth) / 2;
                                            const y = gridY + (data.scale - textHeight) / 2 + textHeight;
                                            ctx.fillText(arr[i].layerData[v][3], ~~(x), ~~(y));
                                        }
                                    }
                                    else if (highlight.type === 2)
                                    {
                                        // 所有像素显示
                                        if (arr[i].layerData[v][3] === highlight.selectedObj.name)
                                        {
                                            let textHeight = ~~(data.scale / 2);
                                            ctx.font = `${textHeight}px sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial Narrow, Times, Arial, "Times New Roman"`;
                                            let textWidth = ~~(ctx.measureText(arr[i].layerData[v][3]).width);
                                            textHeight = measureTextHeight(textWidth, textHeight);
                                            ctx.font = `${textHeight}px sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial Narrow, Times, Arial, "Times New Roman"`;
                                            textWidth = ~~(ctx.measureText(arr[i].layerData[v][3]).width);
                                            ctx.fillStyle = getFontColor(arr[i].layerData[v][2]);
                                            const x = gridX + (data.scale - textWidth) / 2;
                                            const y = gridY + (data.scale - textHeight) / 2 + textHeight;
                                            ctx.fillText(arr[i].layerData[v][3], ~~(x), ~~(y));
                                        }
                                    }
                                    
                                }
                            }
                        }
                    }
                }
                data.loading = false;
                // if (isDownload) downloadImage(isDownload, '拼豆图 - ' + data.projectData.projectName);

            },

            reDraw (isRenderFrameImg = true, isAddHistory = true, beginPos = data.canvasBeginPos, isSelfRender = true)
            {
                // 重新绘制内容
                // console.log(data.drawRecord);
                
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
                        if (isSelfRender) methods.reDrawSelectData(beginPos);
                    }
                }
                // methods.handleDrawReferenceLine();
                // methods.reDrawSelectData(beginPos);
                if (isRenderFrameImg)
                {
                    data.FrameTimer && clearTimeout(data.FrameTimer);
                    data.FrameTimer = setTimeout(() => 
                    {
                        console.log('这里');
                        
                        if (count > 0) methods.handleFrameImg(data.ctx1, isAddHistory);
                        else methods.handleFrameImg(data.ctx2, isAddHistory);
                    }, 300);
                }
                
            },
          
            stop () 
            {
                data.isDrawing = false;
                data.drawList = [];
                data.isErasering = false;
                data.isScale = false;
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
                        let arr = methods.drawCircle(startX, startY, endX, endY, data.scale);
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
                    else if (data.currentDrawShape === 'curve')
                    {
                        // let l = data.drawShapeList.length;
                        let startX = data.drawShapeList[0][0];
                        let startY = data.drawShapeList[0][1];
                        let endX = data.curveEndPos[0];
                        let endY = data.curveEndPos[1];
                        let arr = [] as any;
                        let centerX = 0;
                        let centerY = 0;
                        let numSteps = 0;
                        if (startX === endX && startY === endY) return;
                        if (startX === endX && ['3', '4'].includes(data.curveType.pressKey))
                        {
                            centerY = Math.round(Math.min(startY, endY) + Math.abs(endY - startY) / 2);
                            if (data.curveType.pressKey === '3')
                            {
                                // 左
                                centerX = Math.round(startX - data.curvature) <= 0 ? 0 : Math.round(startX - data.curvature);
                            }
                            else if (data.curveType.pressKey === '4')
                            {
                                centerX = Math.round(startX + data.curvature) >= data.canvasWidth ? data.canvasWidth : Math.round(startX + data.curvature);
                            }
                            // let centerX = Math.round(startX - data.curvature) || 0;
                            // let centerY = Math.round(Math.min(startY, endY) + Math.abs(endY - startY) / 2);
                            // numSteps = Math.round(Math.abs(endY - startY) + Math.abs(centerX - startX));
                            numSteps = Math.abs(endY - startY);
                            
                        }
                        else if (startY === endY && ['1', '2'].includes(data.curveType.pressKey))
                        {
                            centerX = Math.round(Math.abs(endX - startX) / 2 + Math.min(startX, endX));
                            if (data.curveType.pressKey === '1')
                            {
                                // 上
                                centerY = Math.round(startY - data.curvature) <= 0 ? 0 : Math.round(startY - data.curvature); 
                            }
                            else if (data.curveType.pressKey === '2')
                            {
                                centerY = Math.round(startY + data.curvature) >= data.canvasHeight ? data.canvasHeight : Math.round(startY + data.curvature); 
                            }
                            // let centerY = Math.round(startY - data.curvature || 0);
                            // numSteps = Math.round(Math.abs(endX - startX) + Math.abs(centerY - startY));
                            numSteps = Math.abs(endX - startX);

                            
                        }
                        if (centerX === 0 && centerY === 0) return;
                        arr = methods.drawCurve({x:startX, y:startY}, {x:centerX, y:centerY}, {x:endX, y:endY}, 20 + numSteps);
                        for (let i = 0; i < arr.length; i++)
                        {
                            methods.addDrawRecord([arr[i][0], arr[i][1], data.brushColor], false);
                        }
                    }
                    console.log('更新');
                    
                    methods.reDraw();
                    data.drawShapeList = [];
                    data.curveEndPos = [];
                    data.curveType.pressKey = '0';
                    data.isDrawShape = false;
                }
                else
                {
                    data.isDrawShape = false;
                }
            },
            addCursorClass (event = null)
            {
                if (data.currentTool === 0) data.canvas.classList.add('brush-cursor');
                else if (data.currentTool === 1) data.canvas.classList.add('eraser-cursor');
                else if (data.currentTool === 2) data.canvas.classList.add('straw-cursor');
                else if (data.currentTool === 3)
                {
                    if (data.currentDrawShape.toLowerCase().indexOf('rect') !== -1) data.canvas.classList.add('rect-cursor');
                    else if (data.currentDrawShape === 'line' || data.currentDrawShape === 'curve') data.canvas.classList.add('brush-cursor');
                    else if (data.currentDrawShape.toLowerCase().indexOf('circle') !== -1) data.canvas.classList.add('circle-cursor');
                }
                else if (data.currentTool === 4) data.canvas.classList.add('bucket-cursor');
                else if (data.currentTool === 5 && data.pinDouMode) data.canvas.classList.add('pindou-cursor');
                else if (data.currentTool === 7) data.canvas.classList.add('move-cursor');
                else if (data.currentTool === 8) data.canvas.classList.add('select-cursor');
                else if (data.currentTool === 9) 
                {
                    methods.handleChangeMouseStyle(event);
                }
            },
            handleCopyColor ()
            {
                copyText(methods.handleTransformColorAsHex(data.brushColor));
                // if (isHexColor(data.brushColor))
                // {
                //     copyText(data.brushColor);
                //     return;
                // }
                // copyText(rgbaToHex(extractRgbaValues(data.brushColor)));
            },
            handleSaveColor (isAuto = false)
            {
                // 保存颜色
                if (isAuto)
                {
                    data.myColor = methods.handleTransformColorAsHex(data.brushColor);
                    methods.handleAddColor();
                    return;
                }
                data.addMyColorVisible = true;
                data.myColor = methods.handleTransformColorAsHex(data.brushColor);

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
                // data.brushSize = data.scale;
                
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
                if (data.pinDouMode) return proxy.$message.warning('请先退出拼豆预览模式');
                if (data.isScaling) methods.handleCancelScale();
                // 新建图层
                if (data.drawRecord[data.currentFrameIndex].layer.length > data.maxLayer) return proxy.$message.warning('图层数量达到上限');
                let layerArr = JSON.parse(JSON.stringify(data.emptyLayerData));
                let length = data.drawRecord[data.currentFrameIndex].layer.length;
                let obj = {
                    layerId:uuid.v4(),
                    layerName: `图层${length + 1}`,
                    currentLayerImg:methods.handleGridImg(),
                    isRender:true, // 是否渲染
                    layerData:layerArr // 绘画信息
                };
                data.drawRecord[data.currentFrameIndex].layer.unshift(obj);
                methods.handleChangeLayer(0);
                methods.handleAddHistory();
            },
            handleLayerMerge ()
            {
                // 合并图层
                if (data.isScaling) methods.handleCancelScale();
                if (data.selectData.selectList.length) return proxy.$message.warning('请先取消选中区域');
                if (data.selectLayerList.length > 1)
                {
                    data.selectLayerList.sort((a, b) => b - a);
                    // console.log(data.selectLayerList);
                    // let minLayerData = data.drawRecord[data.currentFrameIndex].layer[data.selectLayerList[data.selectLayerList.length - 1]];
                    let maxLayerData = data.drawRecord[data.currentFrameIndex].layer[data.selectLayerList[0]];
                    for (let i = 1; i < data.selectLayerList.length; i++)
                    {
                        let value = data.drawRecord[data.currentFrameIndex].layer[data.selectLayerList[i]].layerData;
                        for (let j = 0; j < value.length; j++)
                        {
                            if (value[j][2] === data.emptyColor) continue;
                            maxLayerData.layerData[j][2] = value[j][2];
                        }
                        data.drawRecord[data.currentFrameIndex].layer.splice(data.selectLayerList[i], 1);
                        // data.selectLayerList.splice(i, 1);
                    }
                    // console.log(maxLayerData);
                    
                    let index = data.drawRecord[data.currentFrameIndex].layer.findIndex((item) => item.layerId === maxLayerData.layerId);
                    // console.log(index);
                    
                    methods.handleChangeLayer(index);
                    methods.reDraw();
                    // methods.handleAddHistory();
                }
            },
            handleChangeLayer (index)
            {
                // 切换图层
                if (data.pinDouMode) return proxy.$message.warning('请先退出拼豆预览模式');
                if (data.isScaling && index !== data.currentLayerIndex) methods.handleCancelScale();
                console.log(index, data.isShift);
                
                if (data.isShift)
                {
                    // 多选状态
                    if (!data.selectLayerList.includes(index))
                    {
                        data.selectLayerList.push(index);
                    }
                    return;
                }
                // if (data.selectData.selectList.length) return proxy.$message.warning('请先取消选中区域');
                console.log(index);
                
                data.currentLayerIndex = index;
                data.currentLayerId = methods.getCurrentLayerId();
                data.selectLayerList = [data.currentLayerIndex];
            },
            handleChangeLayerVisible (index)
            {
                if (data.pinDouMode) return proxy.$message.warning('请先退出拼豆预览模式');
                if (data.isScaling) methods.handleCancelScale();
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
                if (data.selectData.selectList.length) return methods.handleCancelSelect();
                methods.reDraw(true, false);
                // methods.handleAddHistory();
            },
            handleDeleteLayer (index)
            {
                if (data.pinDouMode) return proxy.$message.warning('请先退出拼豆预览模式');
                // if (data.selectData.selectList.length) return proxy.$message.warning('请先取消选中区域');
                if (data.isScaling) methods.handleCancelScale();
                if (data.currentLayerIndex !== index)
                {
                    // if (data.isScaling) methods.handleCancelScale();
                    if (data.selectData.selectList.length) return proxy.$message.warning('请先取消选中区域');
                }
                if (data.currentLayerIndex === index && data.selectData.selectLayerId === data.currentLayerId) methods.handleCancelSelect();
                // if (data.currentLayerIndex === index && data.isScaling) methods.handleCancelScale();
                data.drawRecord[data.currentFrameIndex].layer.splice(index, 1);
                // if (data.selectData.selectList.length) methods.handleCancelSelect();
                // data.drawRecord[data.currentFrameIndex].layer.splice(index, 1);
                let nextIndex = index - 1;
                if (nextIndex < 0) nextIndex = 0;
                data.currentLayerIndex = nextIndex;
                data.currentLayerId = methods.getCurrentLayerId();
                data.selectLayerList = [data.currentLayerIndex];
                methods.reDraw();
                // methods.handleAddHistory();
                
            },
            handleCopyLayer (index)
            {
                if (data.pinDouMode) return proxy.$message.warning('请先退出拼豆预览模式');
                if (data.isScaling) methods.handleCancelScale();
                let copyData = JSON.parse(JSON.stringify(data.drawRecord[data.currentFrameIndex].layer[index]));
                let length = data.drawRecord[data.currentFrameIndex].layer.length;
                copyData.layerId = uuid.v4();
                copyData.layerName = `${copyData.layerName} Copy`;
                // data.drawRecord[data.currentFrameIndex].layer.unshift(copyData);
                // let i = index;
                // console.log(i, data.drawRecord[data.currentFrameIndex].layer);
                
                // if (i <= 0) i = 0;
                data.drawRecord[data.currentFrameIndex].layer.splice(index, 0, copyData);
                // data.currentLayerIndex = index;
                methods.handleChangeLayer(index);
                methods.handleAddHistory();
            },
            handleDoubleClickLayer (index, layerName)
            {
                if (data.pinDouMode) return proxy.$message.warning('请先退出拼豆预览模式');
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
            handleExportLayer (frameIndex = data.currentFrameIndex, layerIndex = data.currentLayerIndex, isDownload = true, scale = 1, options = data.exportStyleOptions)
            {
                let { isShowGrid } = options;
                const imageData = data.drawRecord[frameIndex].layer[layerIndex].layerData;
                if (isShowGrid)
                {
                    methods.handleExportGridFrame(imageData, 'layer', options);
                    return;
                }
                data.realCanvas.width = data.canvasWidth * scale;
                data.realCanvas.height = data.canvasHeight * scale;
                data.ctx3.clearRect(0, 0, data.realCanvas.width, data.realCanvas.height);
                data.ctx3.globalAlpha = 1;
                // console.log(imageData);
                for (let y = 0; y < data.canvasHeight; y++) 
                {
                    for (let x = 0; x < data.canvasWidth; x++) 
                    {
                        let color = imageData[x + (y * data.canvasWidth)][2];
                        
                        // 在新的 canvas 上绘制缩小后的像素
                        data.ctx3.fillStyle = color;
                        data.ctx3.fillRect(x * scale, y * scale, scale, scale);
                    }
                }
                if (isDownload) downloadImage(data.realCanvas, `layer${layerIndex + 1}`);
                
            },
            handleImportLayer (layerIndex = data.currentLayerIndex)
            {
                console.log(layerIndex);
                if (data.selectData.selectList.length) methods.handleCancelSelect();
                if (data.isScaling) methods.handleCancelScale();
                // 导入图片资源，需要保证图片大小与画布大小一致
                const input:any = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/png,image/jpeg';
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
                                // data.loading = false;
                                // URL.revokeObjectURL(url);
                                // return proxy.$message.warning('导入图片尺寸须小于等于画布大小');
                                methods.handleTransfromPngToPixel(img, url, layerIndex, true);
                                return;
                            }
                            methods.handleTransfromPngToPixel(img, url, layerIndex);
                        };
                    }
                });
                document.body.appendChild(input);
                input.click();
                document.body.removeChild(input);
            },
            handleTransfromPngToPixel (img, url, layerIndex, isScale = false)
            {
                console.log(layerIndex);
                
                const imgCanvas = document.createElement('canvas');
                imgCanvas.width = data.canvasWidth;
                imgCanvas.height = data.canvasHeight;
                const imgCtx:any = imgCanvas.getContext('2d');
                if (isScale)
                {
                    let scaleX = data.canvasWidth / img.width;
                    let scaleY = data.canvasHeight / img.height;
                    let scale = Math.min(scaleX, scaleY);
                    imgCanvas.width = img.width * scale;
                    imgCanvas.height =  img.height * scale;
                    pica.resize(img, imgCanvas, {
                        unsharpAmount: 100,
                        unsharpRadius: 0.5,
                        unsharpThreshold: 6
                    })
                        .then((result) =>
                        {
                            console.log('图像缩放完成', result);
                            const imageData = imgCtx.getImageData(0, 0, imgCanvas.width, imgCanvas.height);
                            console.log(imageData);
                            data.worker.postMessage({
                                type:2, 
                                variables:imageData.data, 
                                currentLayerData:JSON.parse(JSON.stringify(data.drawRecord[data.currentFrameIndex].layer[layerIndex].layerData))
                            });
                            data.worker.onmessage = (event) => 
                            {
                                URL.revokeObjectURL(url);
                                data.drawRecord[data.currentFrameIndex].layer[layerIndex].layerData = event.data;
                                data.loading = false;
                                methods.reDraw();
                            };
                        })
                        .catch((err) => 
                        {
                            console.error('图像缩放出错:', err);
                        });
                    return;
                }
                
                imgCtx.drawImage(img, 0, 0);
                const imageData = imgCtx.getImageData(0, 0, imgCanvas.width, imgCanvas.height);
                // console.log(imageData);
                
                // 图片转换为像素数据
                // const worker = new Worker();
                data.worker.postMessage({
                    type:2, 
                    variables:imageData.data, 
                    currentLayerData:JSON.parse(JSON.stringify(data.drawRecord[data.currentFrameIndex].layer[layerIndex].layerData))
                });
                data.worker.onmessage = (event) => 
                {
                    URL.revokeObjectURL(url);
                    data.drawRecord[data.currentFrameIndex].layer[layerIndex].layerData = event.data;
                    data.loading = false;
                    methods.reDraw();
                };
            },
            // 图层结束

            // 帧开始
            handleAddFrame ()
            {
                if (data.pinDouMode) return proxy.$message.warning('请先退出拼豆预览模式');
                if (data.drawRecord.length >= data.maxFrame) return proxy.$message.warning('帧数量达到上限');
                if (data.selectData.selectList.length) return proxy.$message.warning('请先取消选中区域');
                if (data.isScaling) methods.handleCancelScale();
                let layerArr = JSON.parse(JSON.stringify(data.emptyLayerData));
                let obj = {
                    frameId:uuid.v1(),
                    currentFrameImg:null as any,
                    layer:[
                        {
                            layerId:uuid.v4(),
                            layerName: '图层1',
                            currentLayerImg:methods.handleGridImg(),
                            isRender:true, // 是否渲染
                            layerData:layerArr // 绘画信息
                        }
                    ]
                };
                data.drawRecord.push(obj);
                methods.handleChangeFrame(data.drawRecord.length - 1);
                // methods.handleFrameImg(data.ctx2);
            },
            handleChangeFrame (index)
            {
                if (data.pinDouMode) return proxy.$message.warning('请先退出拼豆预览模式');
                // data.selectData.selectList = [];
                if (data.selectData.selectList.length && index !== data.currentFrameIndex) return proxy.$message.warning('请先取消选中区域');
                if (data.isScaling && index !== data.currentFrameIndex) methods.handleCancelScale();
                data.currentFrameIndex = index;
                data.currentFrameId = methods.getCurrentFrameId();
                // data.currentLayerIndex = 0;
                methods.handleChangeLayer(0);
                methods.reDraw(true, false);

            },
            handleCopyFrame (index, type = 'copy')
            {
                if (data.pinDouMode) return proxy.$message.warning('请先退出拼豆预览模式');
                if (data.selectData.selectList.length) return proxy.$message.warning('请先取消选中区域');
                if (data.isScaling) methods.handleCancelScale();
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
                if (data.pinDouMode) return proxy.$message.warning('请先退出拼豆预览模式');
                // if (data.selectData.selectList.length) return proxy.$message.warning('请先取消选中区域');
                // if (data.isScaling) methods.handleCancelScale();
                if (data.selectData.selectList.length) methods.handleCancelSelect(); 
                if (data.isScaling) methods.handleCancelScale();
                data.drawRecord.splice(index, 1);
                methods.handleChangeFrame(index - 1);
                methods.handleAddHistory();

            },
            handleExportGridFrame (imageData, type, options = data.exportStyleOptions)
            {
                let { gridBackgroundColor } = options;
                let scale = 50;
                if (data.canvasWidth >= 56 || data.canvasHeight >= 56) scale = 20;
                else if (data.canvasWidth >= 48 || data.canvasHeight >= 48) scale = 30;
                else if (data.canvasWidth >= 32 || data.canvasHeight >= 32) scale = 40;
                data.realCanvas.width = data.canvasWidth * scale;
                data.realCanvas.height = data.canvasHeight * scale;
                data.ctx3.clearRect(0, 0, data.realCanvas.width, data.realCanvas.height);
                if (gridBackgroundColor !== data.emptyColor)
                {
                    // 绘制背景颜色
                    data.ctx3.fillStyle = gridBackgroundColor;
                    data.ctx3.fillRect(0, 0, data.realCanvas.width, data.realCanvas.height);
                }
                // 绘制网格
                // const cellX = data.realCanvas.width / data.canvasWidth;
                // const cellY = data.realCanvas.height / data.canvasHeight;
                const scaleValue = scale;
                data.ctx3.strokeStyle = 'gray';
                data.ctx3.globalAlpha = 1;
                data.ctx3.lineWidth = 1;
                for (let i = 0; i <= data.canvasHeight; i++)
                {
                    // 绘制水平网格线
                    data.ctx3.beginPath();
                    data.ctx3.moveTo(0, i * scaleValue);
                    data.ctx3.lineTo(data.canvasWidth * scaleValue, i * scaleValue);
                    data.ctx3.stroke();
                }
                for (let j = 0; j <= data.canvasWidth; j++) 
                {
                    // 绘制垂直网格线
                    data.ctx3.beginPath();
                    data.ctx3.moveTo(j * scaleValue, 0);
                    data.ctx3.lineTo(j * scaleValue, data.canvasHeight * scaleValue);
                    data.ctx3.stroke();
                }
                if (type === 'frame')
                {
                    for (let i = imageData.length - 1; i >= 0; i--)
                    {
                        if (imageData[i].isRender)
                        {
                            for (let y = 0; y < data.canvasHeight; y++) 
                            {
                                for (let x = 0; x < data.canvasWidth; x++) 
                                {
                                    let color = imageData[i].layerData[x + (y * data.canvasWidth)][2];
                                    
                                    // 在新的 canvas 上绘制缩小后的像素
                                    data.ctx3.fillStyle = color;
                                    data.ctx3.globalAlpha = 1;
                                    data.ctx3.fillRect(x * scaleValue + 1, y * scaleValue + 1, scaleValue - 2, scaleValue - 2);
                                }
                            }
                        }
                    }
                }
                else
                {
                    for (let y = 0; y < data.canvasHeight; y++) 
                    {
                        for (let x = 0; x < data.canvasWidth; x++) 
                        {
                            let color = imageData[x + (y * data.canvasWidth)][2];
                            
                            // 在新的 canvas 上绘制缩小后的像素
                            data.ctx3.fillStyle = color;
                            data.ctx3.globalAlpha = 1;
                            data.ctx3.fillRect(x * scaleValue + 1, y * scaleValue + 1, scaleValue - 2, scaleValue - 2);
                        }
                    }
                }
                
            },
            handleExportFrame (index, isDownload = true, scale = 1, options = data.exportStyleOptions)
            {
                let { isShowGrid } = options;
                data.ctx3.globalAlpha = 1;
                const imageData = data.drawRecord[index].layer;
                // console.log(imageData);
                if (isShowGrid)
                {
                    methods.handleExportGridFrame(imageData, 'frame', options);
                    return;
                }
                data.realCanvas.width = data.canvasWidth * scale;
                data.realCanvas.height = data.canvasHeight * scale;
                data.ctx3.clearRect(0, 0, data.realCanvas.width, data.realCanvas.height);
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
            async handleExport (type, filename, scale = 1, isBack = false, options = data.exportStyleOptions)
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
                            methods.handleExportLayer(i, j, false, scale);
                            canavsData[i][count] = data.ctx3.getImageData(0, 0, data.canvasWidth * scale, data.canvasHeight * scale);
                            count++;
                            
                        }
                    }
                    for (let l = 0; l < maxLayer; l++)
                    {
                        const bigCanvas = document.createElement('canvas');
                        bigCanvas.width = data.canvasWidth * scale * data.drawRecord.length;
                        bigCanvas.height = data.canvasHeight * scale;
                        const bigCtx:any = bigCanvas.getContext('2d');
                        for (let i = 0; i < canavsData.length; i++)
                        {
                            if (canavsData[i][l])
                            {
                                let newCanvas = document.createElement('canvas');
                                newCanvas.width = data.canvasWidth * scale;
                                newCanvas.height = data.canvasHeight * scale;
                                let newCtx:any = newCanvas.getContext('2d');
                                newCtx.putImageData(canavsData[i][l], 0, 0);
                                bigCtx.drawImage(newCanvas, i * data.canvasWidth * scale, 0);
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
                        methods.handleExportFrame(i, false, scale, options);
                        canavsUrlData.push(data.realCanvas.toDataURL('image/png'));
                    }
                    exportImageForZip(`${filename}`, canavsUrlData);
                }
                else if (type === 4)
                {
                    let canavsUrlData = [] as any;  // 合并后的image数据
                    for (let i = 0; i < data.drawRecord.length; i++)
                    {
                        let currentFrameLayerLength = data.drawRecord[i].layer.length; // 当前帧的图层长度
                        for (let j = currentFrameLayerLength - 1; j >= 0; j--)
                        {
                            if (data.drawRecord[i].layer[j].isRender)
                            {
                                methods.handleExportLayer(i, j, false, scale, options);
                                canavsUrlData.push(data.realCanvas.toDataURL('image/png'));
                            }
                            
                        }
                    }
                    console.log(canavsUrlData);
                    
                    exportImageForZip(`${filename}`, canavsUrlData);
                }
                else if (type === 5)
                {
                    if (!gifshot.isSupported()) return proxy.$message.warning('当前浏览器不支持GIF导出');
                    let canavsUrlData = [] as any;
                    let gif = new GIF({
                        width:data.canvasWidth * scale,
                        height:data.canvasHeight * scale,
                        workers: 2,
                        quality: 0,
                        background: 'rgba(0,0,0,0)',
                        transparent:'#00000000'
                    });
                    for (let i = 0; i < data.drawRecord.length; i++)
                    {
                        methods.handleExportFrame(i, false, scale);
                        canavsUrlData.push(data.realCanvas.toDataURL('image/png'));
                    }
                    for (let i = 0; i < canavsUrlData.length; i++)
                    {
                        const imgElement = document.createElement('img');
                        imgElement.src = canavsUrlData[i];
                        imgElement.width = data.canvasWidth * scale;
                        imgElement.height = data.canvasHeight * scale;
                        gif.addFrame(imgElement, {delay: 200});
                    }
                    gif.on('finished', function (blob) 
                    {
                        downloadImageByDataURL(filename, URL.createObjectURL(blob));
                        gif.abort();
                    });
                    gif.render();
                }
                else if (type === 6)
                {
                    let maxLayer = 0; // 最大图层
                    let canavsData = [] as any; // 每个帧图层的image数据
                    let canavsUrlData = [] as any;  // 合并后的image数据
                    // gif区分图层
                    // let promises = [] as any;
                    const blobToBase64Promise = (value) => 
                    {
                        return new Promise((resolve, reject) => 
                        {
                            blobToBase64(value).then((res) => 
                            {
                                // canavsUrlData.push(res);
                                resolve(res);
                            });
                        });
                    };
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
                            methods.handleExportLayer(i, j, false, scale);
                            canavsData[i][count] = data.ctx3.getImageData(0, 0, data.canvasWidth * scale, data.canvasHeight * scale);
                            count++;
                        }
                    }
                    for (let l = 0; l < maxLayer; l++)
                    {
                        let gif = new GIF({
                            width:data.canvasWidth * scale,
                            height:data.canvasHeight * scale,
                            workers: 2,
                            quality: 10,
                            background: 'rgba(0,0,0,0)',
                            transparent:'rgba(0,0,0,0)'
                        });
                        for (let i = 0; i < canavsData.length; i++)
                        {
                            if (canavsData[i][l])
                            {
                                let newCanvas = document.createElement('canvas');
                                newCanvas.width = data.canvasWidth * scale;
                                newCanvas.height = data.canvasHeight * scale;
                                let newCtx:any = newCanvas.getContext('2d');
                                newCtx.putImageData(canavsData[i][l], 0, 0);
                                gif.addFrame(newCanvas, {delay: 200});
                                continue;
                            }
                        }
                        const gifBlob = await new Promise((resolve) => 
                        {
                            gif.on('finished', function (blob) 
                            {
                                resolve(blob);
                                gif.abort();
                            });
                            gif.render();
                        });

                        let convertedValue = await blobToBase64Promise(gifBlob);
                        canavsUrlData.push(convertedValue);
                    }
                    
                    await Promise.all(canavsUrlData).then(() => 
                    {
                        console.log(canavsUrlData);
                        exportImageForZip(`${filename}`, canavsUrlData, 'gif');
                    });
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
                if (data.pinDouMode) return proxy.$message.warning('请先退出拼豆预览模式');
                if (data.selectData.selectList.length) return proxy.$message.warning('请先取消选中区域');
                if (data.isScaling) methods.handleCancelScale();
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
                if (data.pinDouMode) return proxy.$message.warning('请先退出拼豆预览模式');
                if (data.selectData.selectList.length) return proxy.$message.warning('请先取消选中区域');
                if (data.isScaling) methods.handleCancelScale();
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
                methods.handleCancelKeyboardEvent();
            },
            handleOpenReplaceColorDialog ()
            {
                if (data.pinDouMode) return proxy.$message.warning('请先退出拼豆预览模式');
                if (data.isScaling) methods.handleCancelScale();
                proxy.$refs.ReplaceColorDialog.handleOpen();
                methods.handleCancelKeyboardEvent();
            },
            async handleOpenPreviewDialog ()
            {
                if (data.pinDouMode) return proxy.$message.warning('请先退出拼豆预览模式');
                data.previewLoading = true;
                let scale = 6; // 放大倍数
                // methods.handleExport(1, '1111', false, scale);
                const imgUrl = await methods.handleExport(1, '', scale, true);
                proxy.$refs.PreviewAnimDialog.handleOpen({
                    imgUrl, 
                    width:data.canvasWidth * scale, 
                    height:data.canvasHeight * scale,
                    frame:data.drawRecord.length
                });
                data.previewLoading = false;
            },
            handlekeyDownEvent (event)
            {
                if (!proxy.$route.path.includes('/work')) return;
                if (event.key === ' ')
                {
                    // console.log('空格');
                    
                    event.preventDefault();
                    data.isSpace = true;
                    // data.canvas.style.cursor = 'grabbing';
                    return;
                }
                if (event.shiftKey)
                {
                    data.isShift = true;
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
                else if (event.altKey && event.key === 'd') 
                {
                    event.preventDefault();
                    methods.handleRemoveSelect(); // 删除选择
                }
                else if (event.altKey && event.key === 'n') 
                {
                    methods.handleCancelSelect(); // 取消选择
                }
                else if (event.altKey && event.key === 'z') 
                {
                    methods.handleRevoke(); // 撤销
                } 
                else if (event.altKey && event.key === 'x') 
                {
                    methods.handleRecover(); // 恢复
                }
                else if ((event.metaKey || event.ctrlKey) && event.key === 's')
                {
                    event.preventDefault(); // 保存项目
                    methods.handleSaveProject();
                }
                else if ((event.metaKey || event.ctrlKey) && event.key === 'p')
                {
                    event.preventDefault(); // 打开导出项目
                    methods.handleExportDialog(true);
                }
                else if ((event.metaKey || event.ctrlKey) && event.key === 'i')
                {
                    event.preventDefault(); 
                    methods.handleExportDialog(false);
                }
                else if (event.altKey && event.key === 'p') 
                {
                    methods.handleOpenPreviewDialog(); // 打开预览
                }
                else if (event.altKey && event.key === 'f') 
                {
                    event.preventDefault();
                    methods.handleScreenFull(); // 全屏
                }
                else if ((event.metaKey || event.ctrlKey) && event.key === 'm')
                {
                    event.preventDefault();
                    methods.handleImportLayer();
                }
                else if ((event.metaKey || event.ctrlKey) && event.altKey && event.key === 'c')
                {
                    // 复制颜色
                    event.preventDefault(); 
                    methods.handleCopyColor();
                }
                else if ((event.metaKey || event.ctrlKey) && event.altKey && event.key === 't')
                {
                    // 新建图层
                    event.preventDefault(); 
                    methods.handleAddLayer();
                }
                else if ((event.metaKey || event.ctrlKey) && event.altKey && event.key === 'h')
                {
                    // 合并图层
                    event.preventDefault();
                    methods.handleLayerMerge();
                }
                else if ((event.metaKey || event.ctrlKey) && event.key === 'q')
                {
                    event.preventDefault(); // 缩放
                    methods.drawTransform('scale');
                }
                else if ((event.metaKey || event.ctrlKey) && event.key === 'ArrowUp')
                {
                    // 水平翻转
                    event.preventDefault();
                    methods.drawTransform('hReverse');
                }
                else if ((event.metaKey || event.ctrlKey) && event.key === 'ArrowDown')
                {
                    event.preventDefault();
                    methods.drawTransform('vReverse');
                }
                else if ((event.metaKey || event.ctrlKey) && event.key === 'ArrowLeft')
                {
                    event.preventDefault();
                    methods.drawTransform('nsz');
                }
                else if ((event.metaKey || event.ctrlKey) && event.key === 'ArrowRight')
                {
                    event.preventDefault();
                    methods.drawTransform('ssz');
                }
                else if ((event.metaKey || event.ctrlKey) && event.key === '=')
                {
                    event.preventDefault();
                    methods.handleResizeCanvas(1);
                }
                else if ((event.metaKey || event.ctrlKey) && event.key === '-')
                {
                    event.preventDefault();
                    methods.handleResizeCanvas(-1);
                }
                else if ((event.metaKey || event.ctrlKey) && event.key)
                {
                    //
                }
                else if (event.key === 'q') 
                {
                    // 切换画笔
                    methods.handleChangeTool(0);

                }
                else if (event.key === 'w') 
                {
                    // 切换橡皮
                    methods.handleChangeTool(1);
                }
                else if (event.key === 'e') 
                {
                    // 切换吸管工具
                    // event.preventDefault();
                    methods.handleChangeTool(2);
                }
                else if (event.key === 'r') 
                {
                    // 切换油漆桶
                    methods.handleChangeTool(4);
                }
                else if (event.key === 't') 
                {
                    // 切换移动
                    methods.handleChangeTool(7);
                }
                else if (event.key === 'y') 
                {
                    // 切换手动选择
                    methods.handleChangeTool(8);
                    data.selectType = 'select';
                }
                else if (event.key === 'p') 
                {
                    // 切换快速选择
                    methods.handleChangeTool(8);
                    data.selectType = 'quickSelect';
                }
                else if (event.key === 'u')
                {
                    // 打开颜色替换
                    methods.handleOpenReplaceColorDialog();
                }
                else if (event.altKey && event.key === 's')
                {
                    // 保存当前颜色
                    methods.handleSaveColor(true);
                }
                
                else if (event.key === 'i') 
                {
                    // 清空画布
                    methods.handleChangeTool(6);
                }
                else if (event.key === 'o')
                {
                    // 打开拼豆预览模式
                    methods.handlePindouMode('preview');
                }
                else if (event.key === 'k')
                {
                    // 打开拼豆绘图模式
                    methods.handlePindouMode('draw');
                }
                else if (event.altKey && event.key === 'v') 
                {
                    // 重置画布位置
                    methods.handleResetCanvas();
                }
                else if (event.altKey && event.key === 'g') 
                {
                    // 打开我的颜色
                    proxy.$refs.MyColorDialog.handleOpen();
                }
                else if (event.key === 'a') 
                {
                    methods.handleChangeTool(3);
                    methods.drawShape('rect'); // 打开矩形
                }
                else if (event.key === 's') 
                {
                    methods.handleChangeTool(3);
                    methods.drawShape('circle'); // 打开圆形
                }
                else if (event.key === 'd') 
                {
                    methods.handleChangeTool(3);
                    methods.drawShape('line'); // 打开直线
                }
                else if (event.key === 'f') 
                {
                    methods.handleChangeTool(3);
                    methods.drawShape('fillRect'); // 打开填充矩形
                }
                // else if (event.key === 'g') 
                // {
                //     methods.handleChangeTool(3);
                //     methods.drawShape('curve'); // 打开曲线
                // }
                
                
                else if (event.key === 'ArrowUp')
                {
                    // 切换图层
                    if (data.isShift) return;
                    data.currentLayerIndex--;
                    if (data.currentLayerIndex < 0)
                    {
                        data.currentLayerIndex = 0;
                    }
                    data.selectLayerList = [data.currentLayerIndex];
                }
                else if (event.key === 'ArrowDown')
                {
                    // 切换图层
                    if (data.isShift) return;
                    data.currentLayerIndex++;
                    if (data.currentLayerIndex > data.drawRecord[data.currentFrameIndex].layer.length - 1)
                    {
                        data.currentLayerIndex = data.drawRecord[data.currentFrameIndex].layer.length - 1;
                    }
                    data.selectLayerList = [data.currentLayerIndex];
                }
                else if (event.key === 'ArrowLeft')
                {
                    // 切换帧
                    data.currentFrameIndex--;
                    if (data.currentFrameIndex < 0)
                    {
                        data.currentFrameIndex = 0;
                        return;
                    }
                    methods.handleChangeFrame(data.currentFrameIndex);
                }
                else if (event.key === 'ArrowRight')
                {
                    // 切换帧
                    data.currentFrameIndex++;
                    if (data.currentFrameIndex > data.drawRecord.length - 1)
                    {
                        data.currentFrameIndex = data.drawRecord.length - 1;
                        return;
                    }
                    methods.handleChangeFrame(data.currentFrameIndex);
                }
                // else if (['1', '2', '3', '4'].includes(event.key) && data.isDrawShape)
                // {
                //     data.curveType.isPress = true;
                //     data.curveType.pressKey = event.key;
                // }
                data.canvas.className = '';
                methods.addCursorClass();
            },
            handleKeyUpEvent (event)
            {
                if (!proxy.$route.path.includes('/work')) return;
                if (event.key === ' ')
                {
                    data.isSpace = false;
                    data.canvas.style.cursor = '';
                }
                if (event.key === 'Shift')
                {
                    data.isShift = false;
                }
                if (event.key === 'Shift' && data.isSelecting && data.selectData.selectList.length)
                {
                    data.isShift = false;
                    data.isMoving = false;
                    data.canvas.style.cursor = '';
                }
                // if (['1', '2', '3', '4'].includes(event.key))
                // {
                //     data.curveType.isPress = false;
                    
                // }
            },
            addKeyBoardEvent ()
            {
                window.addEventListener('keydown', methods.handlekeyDownEvent);
                window.addEventListener('keyup', methods.handleKeyUpEvent);
            },
            handleResizeWindowEvent (event)
            {
                methods.computeScale();
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
                if (data.isScaling)
                {
                    methods.handleScaleFrame();
                }
                else
                {
                    if (data.pinDouMode)
                    {
                        methods.handleDrawPindou(data.ctx1);
                    }
                    else
                    {
                        methods.reDraw(false, false);
                    }
                }
                
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
                if (data.isScaling) methods.handleCancelScale();
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
            handleTransformColorAsHex (value)
            {
                let color = value;
                console.log(color);
                
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
                        if (currentLayerData[i][2] === replaceColor)
                        {
                            currentLayerData[i][2] = newColor;
                        }
                        if (i + 1 < currentLayerData.length)
                        {
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
                            if (currentLayerData[i].layerData[j][2] === replaceColor)
                            {
                                currentLayerData[i].layerData[j][2] = newColor;
                            }
                            if (j + 1 < currentLayerData[i].layerData.length)
                            {
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
                data.currentTool = 0;
                data.historyRecord = [];
                data.currentFrameIndex = 0;
                data.currentLayerIndex = 0;
                data.currentFrameId = 0;
                data.currentLayerId = 0;
                data.shapeFillColor = '#000000ff';
                data.brushColor = '#000000ff';
                data.isCheckedRatio = true;
                data.isShowReferenceLine = false;
                data.isVertical = false;
                data.isHorizontal = false;
                data.isCenter = false;
                data.brushSize = 1;
                data.eraserSize = 1;
                data.widthHeightRatio = 1;
                data.tolerance = 0;
                data.selectType = 'select';
                data.currentDrawShape = 'rect';
                data.currentDrawTransform = 'hReverse';
                data.projectData = {
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
                };
                data.pinDouMode = false;
                data.pinDouDrawMode = false;
                data.selectLayerList = [data.currentLayerIndex];
                data.pindouHighlight = null;
                data.pindouBrand = 'mard';
                data.isHidePindouMode = false;
                data.isScaling = false;
                data.scaleWhitePointPos = [];
                data.scaleAreaData = null;
                data.scaleRatio = 0;
                data.colorStatList = [];
                methods.handleCancelSelect();
            },
            handleInitEmptyLayer ()
            {
                data.emptyLayerData = [];
                for (let i = 0; i < data.canvasHeight; i++) 
                {
                    for (let j = 0; j < data.canvasWidth; j++) 
                    {
                        data.emptyLayerData.push([j, i, data.emptyColor]);
                    }
                }
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
                        methods.handleInitEmptyLayer();
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
                                try
                                {
                                    console.log(event.data);
                                    
                                    data.drawRecord = event.data;
                                    editSpaceStore.saveProjectId(data.projectData.projectId);
                                    if (data.drawRecord.length) methods.reDraw();
                                    // methods.handleRenderAllFrameImg(data.ctx1);
                                    data.loading = false;
                                }
                                catch (err)
                                {
                                    console.log(err);
                                    proxy.$message.error('项目异常，请重新刷新');
                                    window.location.reload();
                                }
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
            },
            handleCancelKeyboardEvent ()
            {
                window.removeEventListener('keydown', methods.handlekeyDownEvent);
                window.removeEventListener('keyup', methods.handleKeyUpEvent);
                // data.canvas.removeEventListener('wheel', methods.handleWheelEvent);
            },
            handleExportDialog (flag)
            {
                data.exportVisible = true;
                data.isExportProject = flag;
                methods.handleCancelKeyboardEvent();
            },
            handleCloseDialog (value)
            {
                data[value] = false;
                methods.addKeyBoardEvent();
                // methods.startDrawing();
            },
            closeMenu ()
            {
                data.LayerMenu.visible = false;
            },
            handleMenu (e, key, contextData)
            {
                if (data.pinDouMode) return;
                methods.closeMenu();
                console.log(e);
                
                setTimeout(() => 
                {
                    data[key].visible = true;
                    data[key].left = e.pageX;
                    data[key].top = e.pageY;
                    data[key].contextData = contextData;
                    methods.handleChangeLayer(contextData.index);
                }, 100);
            }
        };

        watch(() => data.isShowReferenceLine, (newValue, oldValue) => 
        {
            methods.handleResizeDraw();
            // methods.drawPixelArea();
            // methods.reDraw(false);
        });

        watch(() => data.pinDouMode, (newValue, oldValue) => 
        {
            if (newValue === false)
            {
                data.currentTool = 0;
                data.pindouHighlight = null;
                methods.reDraw(false);
            }
        });

        watch(() => editSpaceStore.themeValue, (newValue, oldValue) => 
        {
            methods.handleDrawReferenceLine(data.canvasBeginPos.x, data.canvasBeginPos.y);
        });
        
        onMounted(() => 
        {
            data.worker = new Worker();
            document.addEventListener('click', methods.closeMenu);
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
                if (!data.isHidePindouMode && (data.pinDouMode || data.pinDouDrawMode))
                {
                    methods.handleShowPindou();
                    if (data.pinDouMode)
                    {
                        methods.handleCancelKeyboardEvent();
                    }
                }
            }
        });

        onDeactivated(() => 
        {
            if (data.canvas)
            {
                console.log('清空了键盘事件');
                data.canvas.removeEventListener('mousedown', methods.start);
                data.canvas.removeEventListener('mousemove', methods.draw);
                data.canvas.removeEventListener('mouseup', methods.stop);
                data.canvas.removeEventListener('touchstart', methods.mobileStart);
                data.canvas.removeEventListener('touchmove', methods.mobileDraw);
                data.canvas.removeEventListener('touchend', methods.stop);
                data.canvas.removeEventListener('mouseout', methods.leave);
                data.canvas.removeEventListener('wheel', methods.handleWheelEvent);
                window.removeEventListener('keydown', methods.handlekeyDownEvent);
                window.removeEventListener('keyup', methods.handleKeyUpEvent);
                window.removeEventListener('resize', methods.handleResizeWindowEvent);
                proxy.$refs.ReplaceColorDialog.handleClose();
                proxy.$refs.MyColorDialog.handleClose();
                proxy.$refs.PreviewAnimDialog.handleClose();
                proxy.$refs.PindouDialog.dialogVisible = false;
                // if (proxy.$refs.PindouDialog.dialogVisible)
                // {
                //     proxy.$refs.PindouDialog.handleHide();
                // }
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