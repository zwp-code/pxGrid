export const crop = {
    mounted (el, binding)
    {
        el.style = 'width:100%;height:100%;z-index: 9998;position: absolute;left: 0;top: 0;cursor: move;';
        const cropContent:any = document.getElementById('crop-content');
        const control:any = document.getElementById('crop-control');
        let canvasWidth = document.body.clientWidth;
        let canvasHeight = document.body.clientHeight;
        const ctx = el.getContext('2d');
        let isDrag = false;
        let beginX = 0;
        let beginY = 0;
        let moveX = 0;
        let moveY = 0;
        el.width = document.body.clientWidth;
        el.height = document.body.clientHeight;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.strokeStyle = '#00a870';
        let clipArea = {}; // 裁剪范围
        // let app:any = document.getElementById('app');
        // let img:any = document.getElementById('img-content');
        let clipImg:any = document.getElementById('img-clip');
        // let canvasScreenshot = null as any;
        // setTimeout(() =>
        // {
        //     html2canvas(app, 
        //         { 
        //             backgroundColor:null, 
        //             useCORS: true, 
        //             allowTaint: true,
        //             height:document.body.clientHeight,
        //             width:document.body.clientWidth
        //         }).then((canvas) => 
        //     {
        //         console.log(canvas);
        //         canvasScreenshot  = canvas;
        //         img.src = canvas.toDataURL( 'image/png');
        //         console.log(img.src);
                
        //     });
            
        // }, 1000);
        
        el.addEventListener('mousedown', (e) => 
        {
            isDrag = true;
            beginX = e.offsetX;
            beginY = e.offsetY;
            
        });

        el.addEventListener('mousemove', (e) => 
        {
            if (isDrag)
            {
                control.style.display = 'none';
                moveX = e.clientX;
                moveY = e.clientY;
                // 计算与原点的距离
                let rectWidth = moveX - beginX;
                let rectHeight = moveY - beginY;
                

                ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                ctx.beginPath();
                ctx.globalCompositeOperation = 'source-over';
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                // 画框
                ctx.globalCompositeOperation = 'destination-out';
                ctx.fillRect(beginX, beginY, rectWidth, rectHeight);
                // //描边
                ctx.globalCompositeOperation = 'source-over';
                ctx.moveTo(beginX, beginY);
                ctx.lineTo(beginX + rectWidth, beginY);
                ctx.lineTo(beginX + rectWidth, beginY + rectHeight);
                ctx.lineTo(beginX, beginY + rectHeight);
                ctx.lineTo(beginX, beginY);
                ctx.stroke();
                ctx.closePath();

                clipArea = {
                    beginX, beginY, rectWidth, rectHeight
                };

            }
        });

        el.addEventListener('mouseup', (e) => 
        {
            isDrag = false;
            // beginX = 0;
            // beginY = 0;
            control.style.display = 'flex';
            control.style.top = moveY + 10 + 'px';
            control.style.left = (moveX - control.clientWidth) + 'px';
            // let url = startClip(clipArea);
            // clipImg.src = url;
        });


        // function startClip (area)
        // {
        //     let canvas = document.createElement('canvas');
        //     canvas.width = area.w;
        //     canvas.height = area.h;
    
        //     let data = canvasScreenshot.getImageData(area.x, area.y, area.w, area.h);
    
        //     let context:any = canvas.getContext('2d');
        //     context.putImageData(data, 0, 0);
        //     return canvas.toDataURL('image/png', 1);
        // }

    }
};


