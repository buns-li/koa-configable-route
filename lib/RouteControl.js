const RoueProxy = require('./RouteProxy')

const util = require('./util')

module.exports = class RouteControl {

    constructor(options, root) {

        this.root = root

        this.type = options.type || 'local'

        this.renderName = options.renderName

        if (this.type === 'local') {

            this._resolveControlPath(options.path, root)

        } else if (this.type === 'remote' && options.proxy) {

            this.proxy = new RoueProxy(options.proxy, this)
        }
    }

    /**
     * 解析控制器方法字符串
     *
     *   格式: 控制器类名称.控制器方法
     *
     * @param {any} ctrlString 控制器字符串
     * @param {any} ctrlRootPath 控制器类文件根目录
     */
    _resolveControlPath(ctrlString, ctrlRootPath) {

        let result = util.resolveControllerPath(ctrlString, ctrlRootPath)

        if (result) {
            this.fnRef = result.bind(this)
        }
    }

    /**
     * 调用内部所有有效控制器方法
     *
     * @param {any} ctx 当前http上下文对象
     * @returns 操作结果
     */
    async invoke(ctx) {

        let result

        if (this.type === 'local') {
            if (Object.getPrototypeOf(this.fnRef).constructor.name === 'AsyncFunction') {
                result = await this.fnRef(ctx).catch(err => err)
            } else {
                result = this.fnRef(ctx)
                if (result instanceof Promise) {
                    result = await Promise.resolve(result)
                }
            }
        } else if (this.type === 'remote') {
            result = await this.proxy.fetch(ctx).catch(err => err)
        }

        if (!result) return null

        if (result instanceof Error) {
            return result
        }
        return result
    }

}