const url = require('url')

exports.resolveUrl = function(path) {

    //取消忽略网址编码的字符（必须显式替换空格，因为它们不会自动解码）
    path = decodeURIComponent(path.replace(/\+/g, ' '))

    //规范化斜杠
    path = path.replace(/\\/g, '/')

    //剥离双斜杠
    path = path.replace(/[/]{2,}/g, '/')

    //剥离前置和尾部的斜杠
    path = path.replace(/^[/]|[/]$/g, '')

    //剥离任何路径遍历
    path = path.replace(/\.\.\//g, '/')

    return url.parse(path)
}


exports.resolveControllerPath = function(ctrlString, ctrlRootPath) {

    if (ctrlString) {

        let arr = ctrlString.split('.')

        let ctrlClass = require(ctrlRootPath + arr[0] + '.js')

        return ctrlClass[arr[1]].bind(ctrlClass)
    }

    return null
}

exports.isAsyncFunction = function(fn) {

    if (!fn) return false

    return fn[Symbol.toStringTag] === 'AsyncFunction'
}