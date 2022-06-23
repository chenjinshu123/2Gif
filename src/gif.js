import EventEmitter from './utils/EventEmitter.js'
import GIFEncoder from './utils/GIFEncoder.js'
export default class Gif extends EventEmitter {
    constructor(options) {
        super()
        let fixedOption = {
            dither: false,
            repeat: 0,
            transparent: null,
            background: undefined,
        }
        let mustOptionArr = ['quality', 'width', 'height', 'delay']
        mustOptionArr.forEach(key => {
            if (!options[key]) {
                throw `Missing parameter ${key}`;
            }
        })
        this.running = false
        this._canvas = null
        this.options = {
            quality: 10,
            width: undefined,
            height: undefined,
            ...options,
            ...fixedOption
        }
        this.frameArr = []
        this.okFrame = []

    }
    addFrame(image, options = {}) {
        let frame = {
            delay: this.options.delay,
            copy: false,
            dispose: -1
        }
        if (ImageData && image instanceof ImageData) {
            frame.data = image.data
        }
        else if ((CanvasRenderingContext2D && image instanceof CanvasRenderingContext2D) || (WebGLRenderingContext && image instanceof WebGLRenderingContext)) {
            frame.context = image
        } else if (image.childNodes) {
            frame.image = image
        } else {
            throw new Error('Invalid image')
        }
        this.frameArr.push(frame)
    }
    getContextData(ctx) {
        return ctx.getImageData(0, 0, this.options.width, this.options.height).data
    }
    getImageData(image) {
        if (!this._canvas) {
            this._canvas = document.createElement('canvas')
            this._canvas.width = this.options.width
            this._canvas.height = this.options.height
        }
        let ctx = this._canvas.getContext('2d')
        ctx.fillStyle = this.options.background
        ctx.fillRect(0, 0, this.options.width, this.options.height)
        ctx.drawImage(image, 0, 0)
        console.log(image)
        return this.getContextData(ctx)
    }
    getTask(frame, index) {
        let task = {
            index,
            last: index === (this.frameArr.length - 1),
            delay: this.options.delay,
            dispose: frame.dispose,
            transparent: frame.transparent,
            width: this.options.width,
            height: this.options.height,
            quality: this.options.quality,
            dither: this.options.dither,
            globalPalette: this.options.globalPalette,
            repeat: this.options.repeat,
        }
        if (frame.data) {
            task.data = frame.data
        } else if (frame.context) {
            task.data = this.getContextData(frame.context)
        } else if (frame.image) {
            task.data = this.getImageData(frame.image)
        } else {
            throw new Error('Invalid frame')
        }
        return task
    }
    render() {
        if (this.running) {
            throw new Error('Already running')
        }
        this.frameArr.forEach((item, index) => {
            let task = this.getTask(item, index)
            let okTask = this.renderFrame(task)
            this.okFrame.push(okTask)
            if (this.okFrame.length === this.frameArr.length) {
                this.finishRendering()
            }
        })
    }
    finishRendering() {
        let len = 0
        this.okFrame.forEach(frame => {
            len += (frame.data.length - 1) * frame.pageSize + frame.cursor
            len += frame.pageSize - frame.cursor
        })
        let data = new Uint8Array(len)
        let offset = 0
        this.okFrame.forEach(frame => {
            frame.data.forEach((page, i) => {
                data.set(page, offset)
                if (i === (frame.data.length - 1)) {
                    offset += frame.cursor
                } else {
                    offset += frame.pageSize
                }
            })
        })
        console.log(data)
        let image = new Blob([data], {
            type: 'image/gif'
        })
        var el = document.createElement('a');
        el.href = URL.createObjectURL(image);
        el.download = 'demo-name'; //设置下载文件名称
        document.body.appendChild(el);
        var evt = document.createEvent("MouseEvents");
        evt.initEvent("click", false, false);
        el.dispatchEvent(evt);
        document.body.removeChild(el);

    }
    renderFrame(frame) {
        let encoder = new GIFEncoder(frame.width, frame.height)
        if (frame.index === 0) {
            encoder.writeHeader()
        } else {
            encoder.firstFrame = false
        }
        encoder.setTransparent(frame.transparent)
        encoder.setDispose(frame.dispose)
        encoder.setRepeat(frame.repeat)
        encoder.setDelay(frame.delay)
        encoder.setQuality(frame.quality)
        encoder.setDither(frame.dither)
        encoder.setGlobalPalette(frame.globalPalette)
        encoder.addFrame(frame.data)
        if (frame.last) {
            encoder.finish()
        }
        // if (frame.globalPalette == true) {
        //     frame.globalPalette = encoder.getGlobalPalette()
        // }
        let stream = encoder.stream()
        frame.data = stream.pages
        frame.cursor = stream.cursor
        frame.pageSize = stream.constructor.pageSize

        return frame
    }
}