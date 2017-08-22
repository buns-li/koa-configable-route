const nunjucks = require('nunjucks')

const Koa = require('koa')

const path = require('path')

const app = new Koa()

const middleware = require('../index')

function render(root, opts) {

    root = root || path.join(__dirname, './views')

    let env = nunjucks.configure(root, opts)

    env.addGlobal('env', process.env.NODE_ENV || 'dev')

    return (ctx, next) => {
        if (!ctx.render) {
            ctx.render = (view, context = {}) => {
                let template = view + '.html'
                return new Promise((resolve, reject) => {
                    env.render(template, context, (err, res) => err ? reject(err) : resolve(res))
                })
            }
        }
        return next()
    }
}

app.use(render())

app.use(middleware({
    ctrlRoot: path.join(__dirname, './controller/'),
    proxy: {
        host: 'coding.net',
        headers: {
            '__bbh_agent': 'MicroMessenger'
        },
        time: true
    },
    routes: [

        {
            path: '/account',
            isgroup: true,
            subs: [{
                    path: '/sign-in',
                    view: 'account/sign-in',
                    globalContext: {
                        title: '登录',
                        description: ''
                    }
                },

                {
                    path: '/sign-up',
                    view: 'account/sign-up',
                    globalContext: {
                        title: '注册',
                        description: '用户注册'
                    }
                },

                {
                    path: '/forget',
                    view: 'account/forget',
                    globalContext: {
                        title: '找回密码',
                        description: 'freeing平台用户找回密码'
                    }
                }
            ]
        }
    ]
}))


app.use(async(ctx, next) => {
    ctx.throw(404, 'Not Found')
})

module.exports = app.listen()