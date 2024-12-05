import { reactive, toRefs, onMounted, defineComponent, getCurrentInstance, computed, watch, onDeactivated, onActivated, onBeforeUnmount } from 'vue';

import { useEditSpaceStore } from '@/store';
import { blobToBase64, copyText, downloadFile, downloadIamgeByUrl, downloadImage, downloadImageByDataURL, exportImageForZip, extractRgbaValues, formatTime, generateIamge, getFontColor, getOrderedRectangleCoordinates, getProjectTemplate, getRequestUrl, hexToRgba, isHexColor, measureTextHeight, nearestNeighborColorZoom, nearestNeighborCoordZoom, removeNullArray, removeNullFrom2DArray, rgbaToHex, unique2DArray } from '@/utils/utils';
import axios from 'axios';
import { uuid } from 'vue-uuid';
import Worker from '@/utils/worker.js?worker';
import FileSaver from 'file-saver';
import { ElMessageBox } from 'element-plus';
export default defineComponent({
    name:'preview',
    components: {
    },
    props:{},
    emits:[],
    setup (props, context)
    {
        const { proxy }:any = getCurrentInstance();
        const editSpaceStore = useEditSpaceStore();
        let data = reactive({
            projectData:getProjectTemplate(),
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
            currentHistoryIndex:0,
            historyTimer:null as any,
            
            lastX:0,
            lastY:0,

            // MyColorDialogVisible:false,
            // donateVisible:false,
            // noticeVisible:false,
            // notice:{
            //     title:'',
            //     content:''
            // },

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
            removeDrawList:[] as any,

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
            },
            layerAlpha:100,
            isHideLinmoMode:false, // 是否隐藏临摹模式
            linmoMode:false, // 是否启用临摹模式
            linmoPhoto:null as any, // 临摹的图片URL
            linmoPhotoStyle:{
                transform: 'translate(0px, 0px) rotate(0deg) scale(1, 1)',
                opacity:1,
                zIndex:0,
                display:'block'
            }, // 临摹的图片的样式
            linmoPhotoDom:null as any, // 临摹的图片dom
            dragLinmoPhoto:{
                enable:false,
                startX:0,
                startY:0,
                translateX:0,
                translateY:0
            }, // 是否拖动临摹的图片
            scaleTimer:null as any,
            loadingText:'正在加载项目...'

            
        });


        const computedApi = {
            
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
            handleBack ()
            {
                proxy.$router.replace('/module');
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
            handleWheelEvent (event)
            {
                event.preventDefault();
                const delta = event.deltaY > 0 ? -1 : 1;
                data.scale += delta;
                data.scale = Math.max(1, data.scale);
                if (data.scale > 60) data.scale = 60;
                console.log(data.scale);
                methods.handleResizeDraw();
                
            },
            handleResizeCanvas (delta)
            {
                data.scale += delta;
                data.scale = Math.max(1, data.scale);
                if (data.scale > 60) data.scale = 60;
                methods.handleResizeDraw();
            },
            handleResizeDraw ()
            {
                methods.drawPixelArea();
                methods.reDraw(false);
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
                    // data.ctx1.restore();
                    const row = Math.floor((event.offsetY - data.drawAreaList[0][1]) / data.scale);
                    const col = Math.floor((event.offsetX - data.drawAreaList[0][0]) / data.scale);
                    if (data.isSpace)
                    {
                        data.isDragging = true;
                        let gridX = (col * data.scale) + data.canvasBeginPos.x;
                        let gridY = (row * data.scale) + data.canvasBeginPos.y;
                        data.dragData.x = gridX;
                        data.dragData.y = gridY;
                    }
                }
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
                    }
                    
                }
                else
                {
                    data.canvas.classList = '';
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
                }
                
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
            },

            reDraw (isRenderFrameImg = true, isAddHistory = true, beginPos = data.canvasBeginPos, isSelfRender = true)
            {
                // 重新绘制内容 优化
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
                    }
                }
                if (isRenderFrameImg)
                {
                    data.FrameTimer && clearTimeout(data.FrameTimer);
                    data.FrameTimer = setTimeout(() => 
                    {
                        if (count > 0) methods.handleFrameImg(data.ctx1, isAddHistory);
                        else methods.handleFrameImg(data.ctx2, isAddHistory);
                    }, 300);
                }
                
            },
          
            stop () 
            {
                
                if (data.isDragging)
                {
                    data.isDragging = false;
                    data.canvasBeginPos.x = data.drawAreaList[0][0];
                    data.canvasBeginPos.y = data.drawAreaList[0][1];
                }
            },
            leave ()
            {
                methods.stop();
                data.canvas.className = '';
                
            },
            computeScale ()
            {
                if (data.canvasWidth > data.canvasHeight) data.scale = Math.max(1, (data.canvas.width / data.canvasWidth / 2) * 2);
                else data.scale = Math.max(1, (data.canvas.height / data.canvasHeight / 2) * 2);
                data.scale = Math.round(data.scale) - 2;
                console.log(data.scale);
                // data.brushSize = data.scale;
                
            },
            handleChangeLayer (index)
            {
                // 切换图层
                data.currentLayerIndex = index;
                data.currentLayerId = methods.getCurrentLayerId();
                data.layerAlpha = data.drawRecord[data.currentFrameIndex].layer[data.currentLayerIndex].alpha || 100;
                data.selectLayerList = [data.currentLayerIndex];
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
            },
            // 图层结束

            // 帧开始
            handleChangeFrame (index)
            {
                data.currentFrameIndex = index;
                data.currentFrameId = methods.getCurrentFrameId();
                // data.currentLayerIndex = 0;
                methods.handleChangeLayer(0);
                methods.reDraw(true, false);

            },
            // 帧结束
            handlekeyDownEvent (event)
            {
                if (event.key === ' ')
                {
                    event.preventDefault();
                    data.isSpace = true;
                    return;
                }
                data.canvas.className = '';
            },
            handleKeyUpEvent (event)
            {
                if (event.key === ' ')
                {
                    data.isSpace = false;
                    data.canvas.style.cursor = '';
                }
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
                methods.drawPixelArea();
                methods.reDraw(false, false);
                
            },
            handleResizeWindow ()
            {
                window.addEventListener('resize', methods.handleResizeWindowEvent);
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
                data.projectData = getProjectTemplate();
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
                data.layerAlpha = 100;
                data.isHideLinmoMode = false;
                data.linmoMode = false;
                data.linmoPhoto = null;
                data.currentHistoryIndex = 0;
            },
            handleImportProject ()
            {
                if (!data.projectData) return proxy.$message.error(proxy.$t('message.importFailed'));
                let jsonData = JSON.parse(JSON.stringify(data.projectData));
                jsonData.createAt = formatTime();
                jsonData.updateAt = jsonData.createAt;
                jsonData.projectId = uuid.v1();
                jsonData.tip = '新项目';
                jsonData.isTop = 0;
                // jsonData.frameImg = projectData.frameImg;
                editSpaceStore.saveProject(jsonData).then((res1) => 
                {
                    if (res1) 
                    {
                        proxy.$message.success(proxy.$t('message.importSucceeded') + '，请在我的项目中查看');
                        // proxy.$router.push({
                        //     name:'work',
                        //     params:{
                        //         projectId:data.itemInfo.projectId
                        //     }
                        // });
                        // editSpaceStore.saveProjectId(data.itemInfo.projectId);
                    }
                }).catch((err) => 
                {
                    console.log(err);
                    proxy.$message.error(proxy.$t('message.importFailed'));
                });
            },
            handleDownloadProject ()
            {
                if (!data.projectData) return proxy.$message.error(proxy.$t('message.downloadFailed'));
                let projectData = JSON.parse(JSON.stringify(data.projectData));
                downloadFile(JSON.stringify(projectData), 'application/json', projectData.projectName);
            },
            handleReadProjectData ()
            {
                // 效验id是否为项目id
                methods.handleInitData();
                data.loading = true;
                let projectId = proxy.$route.params.projectId;
                // 根据id获取项目数据
                axios.get(`${getRequestUrl()}project/${projectId}.json`)
                    .then((res) => 
                    {
                        let jsonData = res.data;
                        methods.handleProjectData(jsonData);
                    })
                    .catch((err) => 
                    {
                        // proxy.$message.error('加载失败 - ' + err);
                        methods.handleProjectData(null);
                        console.error(err);
                    });
                
            },
            handleProjectData (projectData)
            {
                if (projectData)
                {
                    data.projectData.projectId = projectData.projectId;
                    data.projectData.projectName = projectData.projectName;
                    data.projectData.updateAt = projectData.updateAt;
                    data.projectData.createAt = projectData.createAt;
                    data.projectData.desc = projectData.desc;
                    data.canvasWidth = Number(projectData.width);
                    data.canvasHeight = Number(projectData.height);
                    data.projectData.width = projectData.width;
                    data.projectData.height = projectData.height;
                    data.projectData.frameImg = projectData.frameImg;
                    data.projectData.tip = projectData.tip;
                    data.projectData.isTop = projectData.isTop;
                    data.projectData.data = projectData.data;
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
                    data.ctx1.lineCap = 'square';
                    data.ctx1.save();
                    data.canvasBeginPos.x = ((data.bgCanvas.width / 2) - data.canvasWidth * data.scale / 2);
                    data.canvasBeginPos.y = ((data.bgCanvas.height / 2) - data.canvasHeight * data.scale / 2);
                    data.canvasBeginPos.centerX = data.canvasBeginPos.x + data.scale * data.canvasWidth / 2;
                    data.canvasBeginPos.centerY = data.canvasBeginPos.y + data.scale * data.canvasHeight / 2;
                    console.log(data.canvasBeginPos, data.scale);
                    
                    methods.drawPixelArea();
                    methods.startDrawing();
                    methods.addKeyBoardEvent();
                    methods.handleResizeWindow();
                    
                    if (data.projectData.data)
                    {
                        data.worker.postMessage({
                            type:4,
                            variables:JSON.parse(JSON.stringify(projectData.data)),
                            canvasWidth:data.canvasWidth
                        });
                        data.worker.onmessage = (event) => 
                        {
                            try
                            {
                                data.drawRecord = event.data;
                                if (data.drawRecord.length) methods.reDraw();
                                methods.handleChangeLayer(data.currentLayerIndex);
                                data.loading = false;
                            }
                            catch (err)
                            {
                                console.log(err);
                                proxy.$message.error('项目预览失败');
                                window.location.reload();
                            }
                        };
                    }
                    else
                    {
                        proxy.$message.error('项目预览失败');
                        proxy.$router.replace('/module');
                        
                    }
                    
                }
                else
                {
                    proxy.$message.error('项目异常');
                    proxy.$router.replace('/module');
                }
            }
        };

        
        onMounted(() => 
        {
            data.worker = new Worker();
            methods.handleReadProjectData();
        });

        onBeforeUnmount(() => 
        {
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
        });

        return {
            ...toRefs(data),
            ...methods,
            ...computedApi,
            editSpaceStore,
            copyText
        };
    }
});