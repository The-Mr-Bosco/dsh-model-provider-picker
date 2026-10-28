/**
 * Provider Model Picker — browser half.
 *
 * Replaces the composer's `conversation.input.model` seat with the same root menu
 * (Model / Effort) and effort list as the shipped control, but the model pane lists
 * providers as collapsible rows instead of one flat grouped list.
 *
 * Data comes from `ctx.remote.session.modelCatalog()` / `selectModel()`; the current
 * selection is the session's `modelSelection` projection, read through the seat's
 * standard `useProjection` prop.
 */
window.__ModuleLoader__.load({
  id: 'dsh-model-provider-picker',
  factory(require) {
    const React = require('react')
    const ReactDOM = require('react-dom')
    const h = React.createElement
    const NS = 'model-picker'
    const MENU_MARGIN = 12
    const MEASURE_STYLE = { visibility: 'hidden', left: 0, top: 0 }

    const zh = {
      'provider.account': 'DeepSeek 账号',
      'trigger.fallback': '请选择模型',
      'trigger.loading': '正在加载模型…',
      'trigger.selectAria': '请选择模型',
      'trigger.aria': '选择模型，当前 {model}',
      'trigger.ariaEffort': '选择模型，当前 {model}，推理等级 {effort}',
      'menu.aria': '模型与推理等级',
      'menu.model': '模型',
      'menu.effort': '推理等级',
      'effort.providerDefault': 'Default',
      'status.loading': '正在刷新模型列表…',
      'status.selecting': '正在切换模型…',
      'error.action': '模型操作失败：{message}',
      'error.sessionInUse': '当前会话已被占用，可能是其他正在运行的 DSH 导致的（如其他 dsh web、桌面端），请退出其他正在运行的 DSH 后重试。',
      'action.reload': '重新加载',
      'warning.groupLoad': '{name} 加载失败：{message}',
      'search.placeholder': '搜索模型…',
      'search.clear': '清除搜索',
      'search.empty': '没有匹配的模型。',
      'empty.models': '暂无可用模型',
      'empty.efforts': '当前模型未提供推理等级。'
    }

    const en = {
      'provider.account': 'DeepSeek Account',
      'trigger.fallback': 'Select model',
      'trigger.loading': 'Loading models…',
      'trigger.selectAria': 'Select model',
      'trigger.aria': 'Select model, current {model}',
      'trigger.ariaEffort': 'Select model, current {model}, reasoning effort {effort}',
      'menu.aria': 'Model and reasoning effort',
      'menu.model': 'Model',
      'menu.effort': 'Effort',
      'effort.providerDefault': 'Default',
      'status.loading': 'Refreshing model list…',
      'status.selecting': 'Switching model…',
      'error.action': 'Model operation failed: {message}',
      'error.sessionInUse': 'This session is already in use, possibly by another running DSH instance (such as dsh web or the desktop app). Quit other running DSH instances and try again.',
      'action.reload': 'Reload',
      'warning.groupLoad': '{name} failed to load: {message}',
      'search.placeholder': 'Search models…',
      'search.clear': 'Clear search',
      'search.empty': 'No matching models.',
      'empty.models': 'No models available.',
      'empty.efforts': 'This model provides no reasoning effort levels.'
    }

    const CSS = `
.dsh-mpp-root{min-width:0;position:relative}
.dsh-mpp-trigger{display:flex;align-items:center;gap:4px;min-width:0;max-width:min(360px,45cqw);height:28px;padding:0 4px 0 8px;border:none;border-radius:var(--dsw-radius-sm);background:0 0;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;font-weight:400;line-height:20px;cursor:pointer;outline:none}
.dsh-mpp-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dsh-mpp-trigger:focus-visible{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.dsh-mpp-trigger:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.dsh-mpp-triggerLabel{display:var(--dsh-composer-model-text-display,block);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-mpp-triggerEffort{display:var(--dsh-composer-model-text-display,block);flex-shrink:1000;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-caption)}
.dsh-mpp-triggerIcon{display:var(--dsh-composer-model-icon-display,none);flex:none}
.dsh-mpp-chevron{flex:none;color:var(--dsw-alias-label-caption);transition:transform .12s}
.dsh-mpp-chevronOpen{transform:rotate(180deg)}
.dsh-mpp-menu{position:fixed;z-index:1100;display:flex;flex-direction:column;width:max-content;min-width:min(268px,100vw - 32px);max-width:min(420px,100vw - 32px);max-height:min(380px,100vh - 96px);padding:4px;overflow:hidden;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-lg,12px);background:var(--dsw-alias-bg-overlay,var(--dsw-alias-bg-layer-1));box-shadow:var(--dsw-elevation-prominent,0 12px 32px rgba(0,0,0,.24));color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px}
.dsh-mpp-status,.dsh-mpp-empty{padding:8px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.dsh-mpp-error,.dsh-mpp-warning{display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin-bottom:3px;padding:6px 7px;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-interactive-bg-hover-danger,rgba(220,50,50,.1));color:var(--dsw-alias-state-error-primary);font-size:11px;line-height:16px}
.dsh-mpp-warning{background:var(--dsw-alias-bg-module-platform,var(--dsw-alias-bg-layer-2));color:var(--dsw-alias-state-warn-label,var(--dsw-alias-state-warn-primary))}
.dsh-mpp-retry{flex:none;padding:0;border:none;background:0 0;color:inherit;font:inherit;font-weight:600;cursor:pointer}
.dsh-mpp-searchRow{position:relative;flex-shrink:0;margin:2px 0 3px}
.dsh-mpp-search{box-sizing:border-box;width:100%;padding:5px 7px;border:0 solid transparent;border-radius:var(--dsw-radius-md);background:0 0;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;outline:none}
.dsh-mpp-searchWithQuery{padding-right:34px}
.dsh-mpp-search::placeholder{color:var(--dsw-alias-label-caption)}
.dsh-mpp-search:focus-visible{box-shadow:inset 0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.dsh-mpp-searchClear{position:absolute;top:50%;right:4px;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:none;border-radius:50%;background:0 0;color:var(--dsw-alias-label-secondary);cursor:pointer;transform:translateY(-50%)}
.dsh-mpp-searchClear:hover,.dsh-mpp-searchClear:focus-visible{background:var(--dsw-alias-interactive-bg-hover);outline:none}
.dsh-mpp-groups{display:flex;flex-direction:column;min-height:0;overflow-y:auto}
.dsh-mpp-group{display:flex;flex-direction:column;flex:none}
.dsh-mpp-provider{display:flex;align-items:center;gap:6px;box-sizing:border-box;width:100%;min-height:34px;padding:5px 7px;border:none;border-radius:var(--dsw-radius-md);background:0 0;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;font-weight:500;line-height:20px;text-align:left;cursor:pointer}
.dsh-mpp-provider:hover:not(:disabled),.dsh-mpp-provider:focus-visible,.dsh-mpp-providerCurrent{background:var(--dsw-alias-interactive-bg-hover)}
.dsh-mpp-provider:focus-visible{outline:none}
.dsh-mpp-providerName{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-mpp-providerCheck{display:grid;flex:none;place-items:center;color:var(--dsw-alias-label-primary)}
.dsh-mpp-providerChevron{flex:none;color:var(--dsw-alias-menu-icon);transition:transform .12s}
.dsh-mpp-providerChevronOpen{transform:rotate(90deg)}
.dsh-mpp-models{display:flex;flex-direction:column;margin:0 0 3px 13px;padding-left:4px;border-left:1px solid var(--dsw-alias-border-l1)}
.dsh-mpp-model{display:flex;align-items:center;gap:6px;box-sizing:border-box;width:100%;min-height:32px;padding:4px 7px;border:none;border-radius:var(--dsw-radius-md);background:0 0;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;font-weight:400;line-height:18px;text-align:left;cursor:pointer}
.dsh-mpp-model:hover:not(:disabled),.dsh-mpp-model:focus-visible{background:var(--dsw-alias-interactive-bg-hover);outline:none}
.dsh-mpp-model:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.dsh-mpp-modelSelected{background:var(--dsw-alias-interactive-bg-hover)}
.dsh-mpp-check{display:grid;flex:0 0 14px;place-items:center}
.dsh-mpp-checkIcon{width:14px;height:14px}
.dsh-mpp-modelName{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-mpp-modelName .dsh-mpp-labelFallback{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-mpp-cell{display:flex;align-items:center;gap:6px;box-sizing:border-box;width:100%;height:34px;padding:0 8px;border:none;border-radius:var(--dsw-radius-md);background:0 0;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px;text-align:left;cursor:pointer}
.dsh-mpp-cell:hover:not(:disabled),.dsh-mpp-cell:focus-visible{background:var(--dsw-alias-interactive-bg-hover);outline:none}
.dsh-mpp-cellLabel{flex:none;white-space:nowrap}
.dsh-mpp-cellValue{flex:auto;min-width:0;overflow:hidden;text-align:right;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary)}
.dsh-mpp-cellChevron{flex:none;width:12px;height:12px;color:var(--dsw-alias-menu-icon)}
.dsh-mpp-spinner{display:inline-block;flex:none;width:12px;height:12px;border:1.5px solid var(--dsw-alias-border-l2,currentColor);border-top-color:transparent;border-radius:50%;animation:dsh-mpp-spin .7s linear infinite}
@keyframes dsh-mpp-spin{to{transform:rotate(360deg)}}
`

    function cx() {
      let out = ''
      for (let i = 0; i < arguments.length; i += 1) {
        const part = arguments[i]
        if (!part) continue
        out = out === '' ? part : `${out} ${part}`
      }
      return out
    }

    function orderProviders(groups) {
      return groups.slice().sort((left, right) => {
        const rank = (id) => (id === 'deepseek-account' ? 0 : id === 'deepseek-official' ? 1 : 2)
        return rank(left.id) - rank(right.id)
      })
    }

    function normalize(text) {
      return String(text === undefined || text === null ? '' : text).trim().toLowerCase()
    }

    /** Case-insensitive ordered-subsequence match; prefix hits rank first, catalog order breaks ties. */
    function rankModels(models, query) {
      const needle = normalize(query)
      if (needle === '') return models.slice()
      const scored = []
      for (let index = 0; index < models.length; index += 1) {
        const name = normalize(models[index].name || models[index].id)
        let cursor = 0
        let first = -1
        let gaps = 0
        for (let q = 0; q < needle.length; q += 1) {
          const found = name.indexOf(needle[q], cursor)
          if (found === -1) { first = -1; break }
          if (first === -1) first = found
          else gaps += found - cursor
          cursor = found + 1
        }
        if (first === -1) continue
        scored.push({ model: models[index], index, prefix: first === 0 ? 0 : 1, gaps })
      }
      scored.sort((left, right) => left.prefix - right.prefix || left.gaps - right.gaps || left.index - right.index)
      return scored.map((entry) => entry.model)
    }

    function iconChevronDown(className) {
      return h('svg', {
        className, viewBox: '0 0 16 16', width: 12, height: 12, 'aria-hidden': 'true', focusable: 'false'
      }, h('path', {
        d: 'M4 6.5 8 10.5 12 6.5', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round'
      }))
    }

    function iconChevronRight(className) {
      return h('svg', {
        className, viewBox: '0 0 16 16', width: 12, height: 12, 'aria-hidden': 'true', focusable: 'false'
      }, h('path', {
        d: 'M6 3.5 10.5 8 6 12.5', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round'
      }))
    }

    function iconCheck(className) {
      return h('svg', {
        className, viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true', focusable: 'false'
      }, h('path', {
        d: 'M3 8.5 6.4 12 13 4.6', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round'
      }))
    }

    function iconClose(className) {
      return h('svg', {
        className, viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true', focusable: 'false'
      }, h('path', {
        d: 'M4.5 4.5l7 7M11.5 4.5l-7 7', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round'
      }))
    }

    function iconModels(className) {
      return h('svg', {
        className, viewBox: '0 0 16 16', width: 16, height: 16, 'aria-hidden': 'true', focusable: 'false'
      }, [
        h('path', { key: 'top', d: 'M8 2.3 13.2 4.9 8 7.5 2.8 4.9Z', fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinejoin: 'round' }),
        h('path', { key: 'mid', d: 'M2.8 7.5 8 10.1l5.2-2.6', fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        h('path', { key: 'low', d: 'M2.8 10.1 8 12.7l5.2-2.6', fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round' })
      ])
    }

    function pickSelection(projected) {
      if (!projected || typeof projected !== 'object') return null
      if (typeof projected.provider === 'string' && typeof projected.model === 'string') return projected
      const next = projected.next
      if (next && typeof next === 'object' && typeof next.provider === 'string' && typeof next.model === 'string') return next
      return null
    }

    function apply(ctx) {
      ctx.effect(() => {
        const style = document.createElement('style')
        style.dataset.plugin = 'dsh-model-provider-picker'
        style.textContent = CSS
        document.head.appendChild(style)
        return () => { style.remove() }
      }, 'model-provider-picker: styles')

      ctx.effect(() => {
        const disposeZh = ctx.locale.register(NS, 'zh', zh)
        const disposeEn = ctx.locale.register(NS, 'en', en)
        return () => { disposeEn(); disposeZh() }
      }, 'model-provider-picker: dictionaries')

      function ModelSeat(props) {
        const { locked, useProjection, sessionId, t, renderSlot } = props
        const tr = React.useCallback((key, vars) => {
          if (typeof t !== 'function') return key
          return vars === undefined ? t(key) : t(key, vars)
        }, [t])

        const projected = useProjection('modelSelection')
        const [catalog, setCatalog] = React.useState({ status: 'idle', value: null, error: null })
        const inflight = React.useRef(null)
        const [open, setOpen] = React.useState(false)
        const [pane, setPane] = React.useState('root')
        const [query, setQuery] = React.useState('')
        const [expanded, setExpanded] = React.useState(() => new Set())
        const [pending, setPending] = React.useState(null)
        const [failure, setFailure] = React.useState(null)
        const [menuPos, setMenuPos] = React.useState(null)
        const rootRef = React.useRef(null)
        const triggerRef = React.useRef(null)
        const menuRef = React.useRef(null)
        const searchRef = React.useRef(null)
        const id = React.useId()

        const load = React.useCallback(() => {
          if (inflight.current !== null) return inflight.current
          setCatalog((prev) => ({ status: 'loading', value: prev.value, error: null }))
          let op
          try {
            op = ctx.remote.session.modelCatalog()
          } catch (error) {
            op = Promise.reject(error)
          }
          const tracked = op.then((result) => {
            if (!result || result.ok !== true) {
              const detail = result && result.error ? `${result.error.code}: ${result.error.message}` : 'modelCatalog failed'
              throw new Error(detail)
            }
            setCatalog({ status: 'ready', value: result.value, error: null })
            return result.value
          }).catch((error) => {
            setCatalog((prev) => ({ status: 'error', value: prev.value, error: String((error && error.message) || error) }))
            throw error
          }).finally(() => { inflight.current = null })
          inflight.current = tracked
          return tracked
        }, [])

        React.useEffect(() => { load().catch(() => {}) }, [load])

        const catalogValue = catalog.value
        const groups = React.useMemo(() => {
          const raw = catalogValue && Array.isArray(catalogValue.groups) ? catalogValue.groups : []
          return orderProviders(raw).map((group) => ({
            ...group,
            provider: { id: group.id, name: group.id === 'deepseek-account' ? tr('provider.account') : group.name }
          }))
        }, [catalogValue, tr])

        const current = pickSelection(projected)
        const currentGroup = current === null ? undefined : groups.find((group) => group.id === current.provider)
        const currentModel = currentGroup === undefined || current === null
          ? undefined
          : currentGroup.models.find((model) => model.id === current.model)
        const reasoning = currentModel === undefined ? undefined : currentModel.reasoning
        const effectiveEffort = current === null
          ? undefined
          : current.reasoningEffort !== undefined
            ? current.reasoningEffort
            : reasoning && reasoning.defaultEffort
        const effortLabel = React.useMemo(() => {
          if (currentModel === undefined) return undefined
          if (reasoning === undefined) return undefined
          if (effectiveEffort === undefined) return tr('effort.providerDefault')
          const found = reasoning.efforts.find((effort) => effort.id === effectiveEffort)
          return found === undefined ? String(effectiveEffort) : found.name
        }, [currentModel, reasoning, effectiveEffort, tr])

        const loading = catalog.status === 'loading' && catalogValue === null
        const modelLabel = currentModel === undefined
          ? (loading ? tr('trigger.loading') : tr('trigger.fallback'))
          : currentModel.name
        const triggerLabel = effortLabel === undefined ? modelLabel : `${modelLabel} · ${effortLabel}`
        const triggerAria = currentModel === undefined
          ? (loading ? tr('trigger.loading') : tr('trigger.selectAria'))
          : effortLabel === undefined
            ? tr('trigger.aria', { model: modelLabel })
            : tr('trigger.ariaEffort', { model: modelLabel, effort: effortLabel })

        const totalModels = groups.reduce((count, group) => count + group.models.length, 0)
        const showSearch = totalModels > 4
        const needle = query.trim()
        const filteredGroups = React.useMemo(() => {
          if (needle === '') return groups
          return groups
            .map((group) => ({ ...group, models: rankModels(group.models, needle) }))
            .filter((group) => group.models.length > 0)
        }, [groups, needle])
        const visibleGroups = needle === '' ? groups : filteredGroups
        const searching = needle !== ''

        const close = React.useCallback((restoreFocus) => {
          setOpen(false)
          setPane('root')
          setQuery('')
          setFailure(null)
          if (restoreFocus === true) {
            queueMicrotask(() => { if (triggerRef.current !== null) triggerRef.current.focus() })
          }
        }, [])

        const show = () => {
          setFailure(null)
          setQuery('')
          setExpanded(new Set())
          setOpen(true)
          setPane(currentModel === undefined ? 'model' : 'root')
          load().catch(() => {})
        }

        React.useEffect(() => {
          if (!open) { setMenuPos(null); return }
          const place = () => {
            const rect = triggerRef.current === null ? null : triggerRef.current.getBoundingClientRect()
            if (rect === null) return
            const menu = menuRef.current
            const width = menu === null ? 0 : menu.offsetWidth
            const height = menu === null ? 0 : menu.offsetHeight
            let left = rect.right - width
            let top = rect.top - 8 - height
            if (width > 0) left = Math.min(Math.max(left, MENU_MARGIN), window.innerWidth - width - MENU_MARGIN)
            if (height > 0) top = Math.min(Math.max(top, MENU_MARGIN), window.innerHeight - height - MENU_MARGIN)
            setMenuPos({ left, top })
          }
          place()
          window.addEventListener('scroll', place, true)
          window.addEventListener('resize', place)
          let observer = null
          if (typeof ResizeObserver !== 'undefined' && menuRef.current !== null) {
            observer = new ResizeObserver(place)
            observer.observe(menuRef.current)
          }
          return () => {
            window.removeEventListener('scroll', place, true)
            window.removeEventListener('resize', place)
            if (observer !== null) observer.disconnect()
          }
        }, [open, pane, query, expanded, catalog.status])

        React.useEffect(() => {
          if (!open) return undefined
          const onPointerDown = (event) => {
            const target = event.target
            if (!(target instanceof Node)) return
            if (rootRef.current !== null && rootRef.current.contains(target)) return
            if (menuRef.current !== null && menuRef.current.contains(target)) return
            close(false)
          }
          document.addEventListener('mousedown', onPointerDown)
          return () => document.removeEventListener('mousedown', onPointerDown)
        }, [open, close])

        React.useEffect(() => {
          if (!open) return
          if (pane === 'model' && showSearch && searchRef.current !== null) {
            searchRef.current.focus()
            return
          }
          const menu = menuRef.current
          if (menu === null) return
          const first = menu.querySelector('[data-mpp-item]:not([disabled])')
          if (first !== null) first.focus()
        }, [open, pane, showSearch])

        const submit = async (selection) => {
          if (sessionId === undefined || sessionId === null) return
          setFailure(null)
          setPending(selection)
          try {
            const request = {
              sessionId,
              provider: selection.provider,
              model: selection.model
            }
            if (selection.reasoningEffort !== undefined) request.reasoningEffort = selection.reasoningEffort
            const result = await ctx.remote.session.selectModel(request)
            if (result && result.ok === true) {
              close(true)
            } else {
              const error = result && result.error
              if (error && error.code === 'session/writer-held') {
                setFailure(tr('error.sessionInUse'))
              } else {
                setFailure(tr('error.action', { message: error ? `${error.code}: ${error.message}` : 'unknown error' }))
              }
            }
          } catch (error) {
            setFailure(tr('error.action', { message: String((error && error.message) || error) }))
          } finally {
            setPending(null)
          }
        }

        const chooseModel = (group, model) => {
          if (current !== null && current.provider === group.id && current.model === model.id) {
            close(true)
            return
          }
          const effort = model.reasoning && model.reasoning.defaultEffort
          const selection = { provider: group.id, model: model.id }
          if (effort !== undefined) selection.reasoningEffort = effort
          submit(selection)
        }

        const chooseEffort = (effort) => {
          if (current === null) return
          if (effectiveEffort === effort) {
            close(true)
            return
          }
          const selection = { provider: current.provider, model: current.model }
          if (effort !== undefined) selection.reasoningEffort = effort
          submit(selection)
        }

        const onKeyDown = (event) => {
          if (event.nativeEvent && event.nativeEvent.isComposing) return
          if (event.key === 'Escape') {
            event.preventDefault()
            if (pane !== 'root' && currentModel !== undefined) {
              setPane('root')
              setQuery('')
            } else {
              close(true)
            }
            return
          }
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            const menu = menuRef.current
            if (menu === null) return
            const items = Array.prototype.slice.call(menu.querySelectorAll('[data-mpp-item]:not([disabled])'))
            if (items.length === 0) return
            event.preventDefault()
            const active = items.indexOf(document.activeElement)
            const offset = event.key === 'ArrowDown' ? 1 : -1
            const next = active === -1
              ? (offset > 0 ? 0 : items.length - 1)
              : (active + offset + items.length) % items.length
            items[next].focus()
          }
        }

        const renderModelLabel = (provider, model, placement, selected) => h('span', {
          'data-provider-id': provider.id,
          'data-model-id': model.id
        }, typeof renderSlot === 'function'
          ? renderSlot('conversation.input.model.label', { provider, model, placement, selected }, { fallback: model.name })
          : model.name)

        const renderCheck = (active, busyRow) => h('span', { className: 'dsh-mpp-check' },
          busyRow ? h('span', { className: 'dsh-mpp-spinner' }) : active ? iconCheck('dsh-mpp-checkIcon') : null)

        const renderProvider = (group) => {
          const opened = searching || expanded.has(group.id)
          const containsCurrent = current !== null && current.provider === group.id
          const modelRows = opened
            ? group.models.map((model) => {
              const selected = containsCurrent && current.model === model.id
              const busyRow = pending !== null && pending.provider === group.id && pending.model === model.id
              return h('button', {
                key: model.id,
                type: 'button',
                role: 'menuitemradio',
                'aria-checked': selected ? 'true' : 'false',
                className: cx('dsh-mpp-model', selected && 'dsh-mpp-modelSelected'),
                'data-mpp-item': '',
                disabled: pending !== null,
                onClick: () => chooseModel(group, model)
              }, [
                renderCheck(selected, busyRow),
                h('span', { key: 'name', className: 'dsh-mpp-modelName' }, renderModelLabel(group.provider, model, 'option', selected))
              ])
            })
            : null
          return h('div', { key: group.id, className: 'dsh-mpp-group' }, [
            h('button', {
              key: 'provider',
              type: 'button',
              'data-mpp-item': '',
              'aria-expanded': opened ? 'true' : 'false',
              className: cx('dsh-mpp-provider', containsCurrent && 'dsh-mpp-providerCurrent'),
              disabled: pending !== null,
              onClick: () => {
                if (searching) return
                setExpanded((prev) => {
                  const next = new Set(prev)
                  if (next.has(group.id)) next.delete(group.id)
                  else next.add(group.id)
                  return next
                })
              }
            }, [
              h('span', { key: 'name', className: 'dsh-mpp-providerName' }, group.provider.name),
              containsCurrent ? h('span', { key: 'check', className: 'dsh-mpp-providerCheck' }, iconCheck('dsh-mpp-checkIcon')) : null,
              h('span', { key: 'chevron', className: cx('dsh-mpp-providerChevron', opened && 'dsh-mpp-providerChevronOpen') }, iconChevronRight())
            ]),
            modelRows === null ? null : h('div', { key: 'models', className: 'dsh-mpp-models', role: 'group', 'aria-label': group.provider.name }, modelRows)
          ])
        }

        const rootPane = [
          h('button', {
            key: 'model',
            type: 'button',
            role: 'menuitem',
            'data-mpp-item': '',
            className: 'dsh-mpp-cell',
            disabled: pending !== null,
            onClick: () => { setQuery(''); setPane('model') }
          }, [
            h('span', { key: 'label', className: 'dsh-mpp-cellLabel' }, tr('menu.model')),
            h('span', { key: 'value', className: 'dsh-mpp-cellValue' },
              currentModel === undefined ? modelLabel : renderModelLabel(currentGroup.provider, currentModel, 'menu', true)),
            h('span', { key: 'chevron', className: 'dsh-mpp-cellChevron' }, iconChevronRight())
          ]),
          reasoning === undefined ? null : h('button', {
            key: 'effort',
            type: 'button',
            role: 'menuitem',
            'data-mpp-item': '',
            className: 'dsh-mpp-cell',
            disabled: pending !== null,
            onClick: () => setPane('effort')
          }, [
            h('span', { key: 'label', className: 'dsh-mpp-cellLabel' }, tr('menu.effort')),
            h('span', { key: 'value', className: 'dsh-mpp-cellValue' }, effortLabel),
            h('span', { key: 'chevron', className: 'dsh-mpp-cellChevron' }, iconChevronRight())
          ])
        ]

        const effortChoices = reasoning === undefined
          ? []
          : (reasoning.defaultEffort === undefined
            ? [{ key: 'provider-default', effort: undefined, label: tr('effort.providerDefault') }]
            : []).concat(reasoning.efforts.map((effort) => ({ key: `effort:${effort.id}`, effort: effort.id, label: effort.name })))

        const effortPane = h('div', { className: 'dsh-mpp-groups', role: 'menu', 'aria-label': tr('menu.effort') },
          effortChoices.length === 0
            ? [h('div', { key: 'empty', className: 'dsh-mpp-empty', role: 'status' }, tr('empty.efforts'))]
            : effortChoices.map((choice) => {
              const selected = effectiveEffort === choice.effort
              const busyRow = pending !== null && current !== null && pending.provider === current.provider && pending.model === current.model && pending.reasoningEffort === choice.effort
              return h('button', {
                key: choice.key,
                type: 'button',
                role: 'menuitemradio',
                'aria-checked': selected ? 'true' : 'false',
                className: cx('dsh-mpp-model', selected && 'dsh-mpp-modelSelected'),
                'data-mpp-item': '',
                disabled: pending !== null,
                onClick: () => chooseEffort(choice.effort)
              }, [
                renderCheck(selected, busyRow),
                h('span', { key: 'name', className: 'dsh-mpp-modelName' }, choice.label)
              ])
            }))

        const modelPane = [
          showSearch ? h('div', { key: 'search', className: 'dsh-mpp-searchRow' }, [
            h('input', {
              key: 'input',
              ref: searchRef,
              type: 'text',
              role: 'searchbox',
              className: cx('dsh-mpp-search', query !== '' && 'dsh-mpp-searchWithQuery'),
              'aria-label': tr('search.placeholder'),
              'aria-controls': `${id}-models`,
              placeholder: tr('search.placeholder'),
              value: query,
              disabled: pending !== null,
              onChange: (event) => setQuery(event.target.value)
            }),
            query === '' ? null : h('button', {
              key: 'clear',
              type: 'button',
              className: 'dsh-mpp-searchClear',
              'aria-label': tr('search.clear'),
              disabled: pending !== null,
              onClick: () => {
                setQuery('')
                if (searchRef.current !== null) searchRef.current.focus()
              }
            }, iconClose('dsh-mpp-closeIcon'))
          ]) : null,
          pending !== null
            ? h('div', { key: 'selecting', className: 'dsh-mpp-status', role: 'status' }, tr('status.selecting'))
            : loading
              ? h('div', { key: 'loading', className: 'dsh-mpp-status', role: 'status' }, tr('status.loading'))
              : null,
          catalog.status === 'error' && catalogValue === null
            ? h('div', { key: 'load-error', className: 'dsh-mpp-error', role: 'alert' }, [
              h('span', { key: 'text' }, tr('error.action', { message: catalog.error })),
              h('button', { key: 'retry', type: 'button', className: 'dsh-mpp-retry', onClick: () => load().catch(() => {}) }, tr('action.reload'))
            ])
            : null,
          h('div', {
            key: 'groups',
            id: `${id}-models`,
            className: 'dsh-mpp-groups',
            role: 'menu',
            'aria-label': tr('menu.model')
          }, visibleGroups.length === 0
            ? []
            : visibleGroups.map(renderProvider)),
          visibleGroups.length === 0 && catalog.status !== 'loading'
            ? h('div', { key: 'empty', className: 'dsh-mpp-empty', role: 'status' }, searching ? tr('search.empty') : tr('empty.models'))
            : null,
          catalogValue !== null && Array.isArray(catalogValue.failures)
            ? catalogValue.failures.map((item) => h('div', { key: `failure:${item.id}`, className: 'dsh-mpp-warning', role: 'status' }, [
              h('span', { key: 'text' }, tr('warning.groupLoad', {
                name: item.id === 'deepseek-account' ? tr('provider.account') : item.name,
                message: item.message
              })),
              h('button', { key: 'retry', type: 'button', className: 'dsh-mpp-retry', onClick: () => load().catch(() => {}) }, tr('action.reload'))
            ]))
            : null
        ]

        const menu = open
          ? ReactDOM.createPortal(h('div', {
            ref: menuRef,
            id: `${id}-menu`,
            className: 'dsh-mpp-menu',
            style: menuPos === null ? MEASURE_STYLE : menuPos,
            role: pane === 'root' ? 'menu' : 'group',
            'aria-label': tr('menu.aria'),
            'aria-busy': pending !== null || catalog.status === 'loading',
            onKeyDown
          }, [
            failure === null ? null : h('div', { key: 'failure', className: 'dsh-mpp-error', role: 'alert' }, [
              h('span', { key: 'text' }, failure),
              h('button', {
                key: 'retry',
                type: 'button',
                className: 'dsh-mpp-retry',
                onClick: () => { setFailure(null); load().catch(() => {}) }
              }, tr('action.reload'))
            ]),
            pane === 'root' ? rootPane : null,
            pane === 'model' ? modelPane : null,
            pane === 'effort' ? effortPane : null
          ]), document.body)
          : null

        return h('div', { ref: rootRef, className: 'dsh-mpp-root' }, [
          h('button', {
            key: 'trigger',
            ref: triggerRef,
            type: 'button',
            className: 'dsh-mpp-trigger',
            'aria-label': triggerAria,
            'aria-haspopup': 'menu',
            'aria-expanded': open ? 'true' : 'false',
            'aria-controls': open ? `${id}-menu` : undefined,
            'aria-busy': pending !== null ? 'true' : 'false',
            title: triggerLabel,
            disabled: Boolean(locked),
            onClick: () => { if (open) close(true); else show() }
          }, [
            iconModels('dsh-mpp-triggerIcon'),
            h('span', { key: 'label', className: 'dsh-mpp-triggerLabel' },
              currentModel === undefined ? modelLabel : renderModelLabel(currentGroup.provider, currentModel, 'trigger', true)),
            effortLabel === undefined ? null : h('span', { key: 'effort', className: 'dsh-mpp-triggerEffort' }, effortLabel),
            pending !== null
              ? h('span', { key: 'busy', className: 'dsh-mpp-spinner' })
              : h('span', { key: 'chevron', className: cx('dsh-mpp-chevron', open && 'dsh-mpp-chevronOpen') }, iconChevronDown())
          ]),
          menu
        ])
      }

      ctx.slots.inject('conversation.input.model', () => ctx.slots.register({
        name: 'conversation.input.model',
        locale: NS,
        // A single slot renders the lowest priority; the shipped seat registers at 0,
        // so a negative priority shadows it without touching its child declaration.
        priority: -1
      }, ModelSeat))
    }

    return { inject: ['slots', 'locale', 'remote', 'remote.session'], apply }
  }
})
