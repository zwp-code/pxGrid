class Sprite 
{
    constructor ({
        ctx,
        position,
        image,
        frames = { max: 1, hold: 10, val:0 },
        animate = false,
        rotation = 0,
        scale = 1
    }) 
    {
        this.ctx = ctx;
        this.position = position;
        this.image = new Image();
        this.frames = { ...frames, elapsed: 0 };
        this.image.onload = () => 
        {
            this.width = (this.image.width / this.frames.max) * scale;
            this.height = this.image.height * scale;
        };
        this.image.src = image;
    
        this.animate = animate;
        this.opacity = 1;
    
        this.rotation = rotation;
        this.scale = scale;
    }
  
    draw () 
    {
    //   if (!this.animate && this.isBorn) this.frames.val = 1;
        this.ctx.save();
        this.ctx.translate(
            this.position.x + this.width / 2,
            this.position.y + this.height / 2
        );
        this.ctx.rotate(this.rotation);
        this.ctx.translate(
            -this.position.x - this.width / 2,
            -this.position.y - this.height / 2
        );
        this.ctx.globalAlpha = this.opacity;
    
        const crop = {
            position: {
                x: this.frames.val * (this.width / this.scale),
                y: 0
            },
            width: this.image.width / this.frames.max,
            height: this.image.height
        };
  
        const image = {
            position: {
                x: this.position.x,
                y: this.position.y
            },
            width: this.image.width / this.frames.max,
            height: this.image.height
        };
  
        this.ctx.drawImage(
            this.image,
            crop.position.x,
            crop.position.y,
            crop.width,
            crop.height,
            image.position.x,
            image.position.y,
            image.width * this.scale,
            image.height * this.scale
        );
  
        this.ctx.restore();
  
        if (!this.animate) return;
    
        if (this.frames.max > 1) 
        {
            this.frames.elapsed++;
        }
    
        if (this.frames.elapsed % this.frames.hold === 0) 
        {
            if (this.frames.val < this.frames.max - 1) this.frames.val++;
            else this.frames.val = 0;
        }
    }
}

export default Sprite;