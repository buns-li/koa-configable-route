const request = require('request')

const util = require('./util')

const debug = require('debug')('route-proxy')

const AllowHooks = ['params', 'qs', 'form', 'formData', 'headers']

/**
 * 路由代理对象
 */
module.exports = class RouteProxy {

    constructor(options, belongsControl) {

        this.belongsControl = belongsControl

        this.config = options

        this._resolveConfigOptions()

        this._resolveRemoteUrl()
    }

    /**
     * 解析远程路由配置
     *
     * @param {any} config 配置对象
     */
    _resolveRemoteUrl() {

        let config = this.config

        let parsedUrl = util.resolveUrl(config.url)

        parsedUrl.search = parsedUrl.search || ''

        if (config.ssl && (config.protocol === 'https:')) {
            config.cert = config.ssl.cert
            config.key = config.ssl.key
            config.ca = config.ssl.ca
            config.passphrase = config.ssl.passphrase
            delete config.ssl
        }

        if (config.host) {
            config.url = `${config.protocol}//${config.host}:${config.port || 80}/${parsedUrl.path}${parsedUrl.search}`
        } else {
            config.url = parsedUrl.path + parsedUrl.search
        }

        debug('really remote url:', config.url)
    }

    /**
     * 解析hooks
     *
     * @param {any} propName 可hook的属性名称
     */
    _resolveHooks(propName) {

        let conf = this.config

        let hooks = this.hooks

        /**
         * 调整params参数---用于远程地址替换
         *
         * 三种形式: 同header
         *
         */
        let typeofStr = typeof conf[propName]

        switch (typeofStr) {
            case 'function':
                hooks[propName] = conf[propName]
                break
            case 'string':
                hooks[propName] = util.resolveControllerPath(conf[propName], this.belongsControl.root)
                break
            case 'object':
            default:
                conf[propName] = conf[propName] || {}
                break
        }
    }

    /**
     * 解析传入的配置选项
     *
     * @param {any} options 配置选项
     * @memberof RouteProxy
     */
    _resolveConfigOptions() {

        //如果是post、put、patch请求的

        let conf = this.config

        conf.method = conf.method ? conf.method.toUpperCase() : 'GET'

        conf.protocol = conf.protocol || 'http:'

        /**
         * hooks
         *
         *  可以hooks的操作有 params、qs、form、formData、headers
         *
         * hooks有如下三种模式:
         *
         *  1. 自定义Function操作:  function headersGet(ctx){  doSomeThines() }
         *  2. 自定义控制器方法操作
         *      like : "user.getResponseHeaders"
         *  3. 自定义键值对象
         *      like:
         *      {
         *          "content-type":"application/json",
         *          "X-Flag":"xxxxx"
         *      }
         */

        this.hooks = {}

        AllowHooks.forEach(prop => {
            this._resolveHooks(prop)
        })

        if (typeof conf.headers === 'object') {
            /**
             * 新增跨域请求可允许字段,可能需要目标服务器配置此字段可接受
             */
            if (/POST|PUT|PATCH|DELETE/i.test(conf.method)) {
                conf.headers['x-http-method-override'] = conf.method
            }

            /**
             * 确保所有的headers键值都小写/大写
             */
            for (let header in conf.headers) {

                let value = conf.headers[header]

                delete conf.headers[header]

                conf.headers[header.toLowerCase()] = value
            }
        }

        return conf
    }

    /**
     * 每次请求之后,都讲不能重用的信息全部清除掉
     *
     *   如果headers、qs、form、formData都是动态拼接得到的,那么每次请求得到响应之后,都需要将此次传输的值全部清空
     *
     */
    clearUnReuseProp() {

        let config = this.config,
            hookFn

        for (let hook in this.hooks) {
            hookFn = this.hooks[hook]
            if (hookFn) {
                config[hook] = {}
            }
        }

        if (this.originUrl) {
            config.url = this.originUrl
            this.originUrl = null
        }
    }

    /**
     * 请求远程地址的数据
     *
     * @param {any} ctx 当前http上下文对象
     * @returns {Promise} 得到数据的Promise对象
     */
    async fetch(ctx) {

        let hookFn,
            scope = this,
            config = scope.config

        if (scope.hooks) {

            for (let hook in scope.hooks) {

                hookFn = scope.hooks[hook]

                if (!hookFn) continue

                if (util.isAsyncFunction(hookFn)) {

                    config[hook] = await hookFn(ctx)

                } else {

                    let promiseResult = hookFn(ctx)

                    config[hook] = promiseResult instanceof Promise ? await Promise.resolve(promiseResult) : promiseResult
                }
            }
        }

        if (config.params) {

            let url = this.originUrl = config.url

            for (let key in config.params) {
                url = url.replace(':' + key, config.params[key])
            }

            config.url = url
        }

        debug('Starting Remote-Proxy: %s %s ', config.method, config.url)

        return new Promise((resolve, reject) => {

            request(scope.config, (err, res, body) => {

                scope.clearUnReuseProp()

                if (err) return reject(err)

                debug('Had Recieved Remote Response: %s %s, cost time: %s %s %s', scope.config.method, scope.config.url, res.elapsedTime, res.timingStart, res.responseStartTime)

                if (res && res.statusCode) {

                    if (res.statusCode < 200 || res.statusCode >= 400) {
                        return reject(new Error('Server 500 error'))
                    }

                    let contentType = res.headers['content-type']

                    return resolve(~contentType.indexOf('application/json') ? JSON.parse(body) : body)
                }

                return reject(new Error('Server Response error'))
            })
        })
    }
}