/*
 * @Description:
 * @Author: zhangdexian
 * @Date: 2022-06-08 07:20:05
 * @LastEditTime: 2022-06-08 07:53:14
 * @LastEditors: VS Code
 */
'use strict'
import assert from 'assert'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import type { Compiler, Compilation } from 'webpack'

interface HtmlWebpackPreconnectPluginOptions {
  /** 需要建立预连接的url */
  preconnect?: string[]
  /** 需要预先进行dns解析的url */
  dnsPrefetch?: string[]
}

class HtmlWebpackPreconnectPlugin {
  options: HtmlWebpackPreconnectPluginOptions
  constructor(options: HtmlWebpackPreconnectPluginOptions) {
    assert.equal(
      options,
      undefined,
      'The HtmlWebpackPreconnectPlugin does not accept any options'
    )
    this.options = options
  }

  apply(compiler: Compiler) {
    // Webpack 4
    if (compiler.hooks) {
      compiler.hooks.compilation.tap(
        'htmlWebpackPreconnectPlugin',
        (compilation: Compilation) => {
          // Hook into the html-webpack-plugin processing
          var hook
          if (
            // @ts-ignore
            typeof compilation.hooks.htmlWebpackPluginAlterAssetTags !==
            'undefined'
          ) {
            // @ts-ignore
            hook = compilation.hooks.htmlWebpackPluginAlterAssetTags
          } else {
            hook = HtmlWebpackPlugin.getHooks(compilation).alterAssetTags
          }

          if (hook) {
            hook.tapAsync(
              'htmlWebpackPreconnectPlugin',
              this.addPreconnectLinks.bind(this)
            )
          } else {
            console.error(
              'The html-webpack-preconect-plugin not work because it is not compatible with current html-webpack-plugin.'
            )
          }
        }
      )

      // Webpack 3
    } else {
      // @ts-ignore
      compiler.plugin('compilation', compilation => {
        // Hook into the html-webpack-plugin processing
        compilation.plugin(
          'html-webpack-plugin-alter-asset-tags',
          this.addPreconnectLinks.bind(this)
        )
      })
    }
  }

  addPreconnectLinks(htmlPluginData: any, callback: Function) {
    // var preconnectedOrigins = htmlPluginData.plugin.options.preconnect
    const preconnectedOrigins = this.options.preconnect || []
    const dnsPrefetchOrigins = this.options.dnsPrefetch || []

    if (preconnectedOrigins.length === 0 || dnsPrefetchOrigins.length === 0) {
      return callback(null, htmlPluginData)
    }

    function insertTag(
      origins: string[],
      relType: 'preconnect' | 'dns-prefetch'
    ) {
      assert.equal(
        origins instanceof Array,
        true,
        new TypeError(`${relType} option needs an array`)
      )
      preconnectedOrigins.forEach(function (origin) {
        const href = origin.replace(/['"]+/g, '')
        const tag = {
          tagName: 'link',
          selfClosingTag: false,
          attributes: {
            rel: relType,
            href: href,
            crossorigin: '',
          },
        }

        if (htmlPluginData.head) {
          // html-webpack-plugin v3
          htmlPluginData.head.push(tag)
        } else if (htmlPluginData.assetTags) {
          // html-webpack-plugin v4
          htmlPluginData.assetTags.meta.push(tag)
        }
      })
    }

    insertTag(preconnectedOrigins, 'preconnect')
    insertTag(dnsPrefetchOrigins, 'dns-prefetch')
    callback(null, htmlPluginData)
  }
}

export default HtmlWebpackPreconnectPlugin
