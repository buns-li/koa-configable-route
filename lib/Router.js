const debug = require('debug')('router')

const pathToRegexp = require('path-to-regexp')

const RouteControl = require('./RouteControl')

const routers = []

class Router {

    constructor(options) {

        if (options.path) {

            this.paramNames = []

            this.origPath = options.path

            this.regexp = pathToRegexp(this.origPath, this.paramNames)
        }

        this.m = options.method || 'GET'

        this.view = options.view

        this.redirect = options.redirect

        this.globalContext = options.globalContext

        this.ctrls = []
    }

    /**
     * options:
     *  `viewRoot`:[`String`] 视图根目录的绝对地址 *Optional*
     *  `ctrlRoot`: [`String`] 控制器所在目录的绝对地址 *Optional*
     *  `proxy`: [`Object`]路由代理全局配置
     *      `host`: [`String`] 主机名
     *      `port`: [`Number`] 端口号
     *      `headers`:[`Object`] 代理请求头
     *  `routes`: [`Array`] 所有路由配置
     *      `path`:[`String|RegExp`] 路由地址 demo: /users,/users/:id, ^\/users\/(:.+)$
     *      `method`:[`String|Array`] GET | POST | PUT | DELETE | HEAD | OPTIONS |
     *      `redirect`: [`String`|`Function`] 跳转路由 function(srvData,reqData,origPath){}
     *      `view`:[`String`] 视图路径地址--基于viewRoot的地址
     *      `ctrls`:[`Array`] 控制器
     *          `renderName`:[`String`] 数据对应的身份名称
     *          `type`: [`String`] 控制器类型 remote、local(Default:`local`)
     *          `path`: [`String`] 控制器调用位置 格式:`user.m1`
     *          `proxy`:[Object`] 控制器的远程代理对象
     *              `host`: [`String`] 主机名
     *              `port`: [`Number`] 端口号
     *              `headers`:[`Object`] 代理请求头
     *      `subs`: [`Array`] 组路由下的子路由
     *          `path`:[`String`] 子路由--基于组路由
     *          `method`:[`String`] GET | POST | PUT | DELETE | HEAD | OPTION
     *          `view`:[`String`] 视图路径地址--基于viewRoot的地址
     *          `ctrls`:[`Array`] 控制器
     *              `renderName`:[`String`] 数据对应的身份名称
     *              `type`: [`String`] 控制器类型 remote、local(Default:`local`)
     *              `path`: [`String`] 控制器调用位置 格式:`user.m1`
     *              `proxy`:[Object`] 控制器的远程代理对象
     *                  `host`: [`String`] 主机名
     *                  `port`: [`Number`] 端口号
     *                  `headers`:[`Object`] 代理请求头
     */
    static init(routesConfig) {

        let routes = routesConfig.routes,
            routerInst

        routes.forEach(route => {

            if (route.isgroup) {

                if (route.subs && route.subs.length) {

                    route.subs.forEach(subRoute => {

                        routerInst = new Router({
                            path: route.path + subRoute.path,
                            method: subRoute.method || 'GET',
                            view: subRoute.view,
                            redirect: subRoute.redirect,
                            globalContext: subRoute.globalContext
                        })

                        subRoute.ctrls && subRoute.ctrls.length && subRoute.ctrls.forEach(ctrl => {

                            ctrl.proxy = Object.assign({}, routesConfig.proxy, ctrl.proxy)

                            routerInst.ctrls.push(new RouteControl(ctrl, routesConfig.ctrlRoot))

                        })

                        routers.push(routerInst)
                    })
                }

            } else {

                routerInst = new Router({
                    path: route.path,
                    method: route.method || 'GET',
                    view: route.view,
                    redirect: route.redirect,
                    globalContext: route.globalContext
                })

                route.ctrls.forEach(ctrl => {

                    ctrl.proxy = Object.assign({}, routesConfig.proxy, ctrl.proxy)

                    routerInst.ctrls.push(new RouteControl(ctrl, routesConfig.ctrlRoot))

                })

                routers.push(routerInst)
            }
        })
    }

    /**
     * 寻找匹配的路由对象
     *
     * @static
     * @param {any} path 客户端请求访问地址
     * @param {string} [method='GET'] http请求动作
     * @returns 路由对象
     * @memberof Router
     */
    static find(path, method = 'GET') {

        let router

        for (let l = routers.length; l--;) {

            router = routers[l]

            if (router.m === method.toUpperCase()) {

                let matches = path.match(router.regexp)

                if (matches && matches.length) {
                    let params = router.params = {}
                    router.paramNames.forEach((item, idx) => {
                        params[item.name] = matches[idx + 1]
                    })

                    return router
                }
            }

            continue
        }

        return null
    }

    async flow(ctx) {

        let httpContext = ctx

        ctx.params = this.params

        /**
         * 当路由没有定义视图`view`配置,或者是没有提供ctx.render的视图呈现方法
         *  采用默认json数据输出的形式
         *
         *  用户可以在全局配置的`render`绑定自定义实现的render操作
         *
         * @param {any} context 当前待输出的数据上下文
         */
        function render(context) {

            httpContext.type = 'application/json'

            if (context instanceof Error) {
                httpContext.status = 500
            } else {
                httpContext.status = 200
            }

            httpContext.body = context
        }

        let renderFn = httpContext.render && this.view
            ? async function(context) {
                httpContext.body = await httpContext.render(this.view, context)
            }.bind(this)
            : render

        let context = this.globalContext || {}

        if (this.ctrls.length > 0) {

            for (let ctrl, l = this.ctrls.length; l--;) {

                ctrl = this.ctrls[l]

                let ctrlOutput = await ctrl.invoke(ctx)

                if (ctrlOutput instanceof Error) {

                    renderFn(ctrlOutput)

                    break
                }

                debug('%s control output is : %O', (ctrl.renderName || ('proxyData_' + l)), ctrlOutput)

                context[ctrl.renderName || ('proxyData_' + l)] = ctrlOutput
            }
        }

        if (this.redirect) {
            //当前路由需要执行跳转的

            let redirectUrl = this.redirect

            if (typeof this.redirect === 'function') {
                redirectUrl = this.redirect(context, ctx, this.origPath)
            }

            return ctx.redirect(redirectUrl)
        }

        await renderFn(context)
    }
}

module.exports = Router