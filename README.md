# DSH Provider Model Picker / 供应商模型选择器

把 DeepSeek Harness 输入框右下角的模型列表，改成**按供应商折叠**的形式：先选供应商，再展开选模型；模型搜索保留。

A DSH Web UI plugin that turns the composer's model list into a provider accordion: pick a provider first, expand it to see its models, and keep model search.

---

## 中文

### 它解决什么问题

通过填入提供商 API Key 的方式接入多个供应商后，原来的模型选择面板会把所有供应商的模型平铺在一个列表里，模型一多就很难翻。这个插件把这一层改成：

- 点右下角 → 仍然是「模型 / 推理等级」两行（和原来一致）；
- 点「模型」→ 只显示供应商列表，每个供应商右侧有一个箭头；
- 点供应商整行（或箭头）→ 就地展开该供应商的模型，再点模型完成切换；
- 搜索框保留：输入后跨供应商匹配，自动展开有结果的供应商，清空后恢复折叠；
- 点「推理等级」→ 仍然是原来的等级列表（和原来一致）。

默认所有供应商都是折叠的。

### 安装

本仓库没有发布到 npm。把仓库克隆到本地后，用 DSH 的插件管理安装这个目录：

1. 克隆仓库，例如 `git clone https://github.com/The-Mr-Bosco/dsh-model-provider-picker.git`；
2. 在 DSH 的「设置 → 插件」里从本地目录安装；或者让 DSH 里的 agent 调用 `plugin_manager install_bundle`，目标填该目录的绝对路径；
3. 插件会出现在插件列表里，启用即可。安装后刷新一次页面。

> 这是 profile 级插件：启用后对当前 DSH profile 的所有会话生效，禁用后原控件自动回来。

### 兼容性

- 在 DeepSeek Harness Desktop `0.2.1-rc.3` 上开发和验证；
- 依赖官方 `@deepseek-ai/dsh-client-ui-model-selection` 与 `@deepseek-ai/dsh-client-ui-conversation` 已启用；
- 只替换输入框里的模型控件；`/model` 命令弹出的选择器保持官方实现。

### 工作原理

模型控件是槽位 `conversation.input.model`（`single`）。官方插件以 `priority: 0` 注册；本插件以 `priority: -1` 注册，按槽位规则「优先级最低者渲染」，从而盖住官方控件。数据仍走官方通道：

- `ctx.remote.session.modelCatalog()` 读取供应商分组、模型和推理等级；
- `ctx.remote.session.selectModel()` 写回当前会话的选择；
- 当前选择来自会话投影 `modelSelection`，通过槽位的 `useProjection` 读取。

因此切换模型的行为、权限和失败提示与官方一致，插件本身不保存任何模型状态。

### 目录

| 文件 | 作用 |
|---|---|
| `client.js` | 浏览器半：注册并渲染模型控件 |
| `index.js` | Host 半：仅让 Loader 能挂载这个 bundle |
| `cordis.patch.yml` | bundle 的插入行 |
| `locale/*.json` | 插件管理页显示的名称和描述 |
| `icon.svg` | 插件图标 |
| `tools/` | 开发时用来查看安装包源码的小脚本，不参与运行 |

### 已知限制

- 只改输入框里的控件，不改 `/model` 弹窗；
- 键盘操作只保留了 Escape、上下方向键和 Enter/Tab 的基本路径，没有完整复刻官方的焦点陷阱；
- 供应商行右侧不显示模型数量，只标出「当前模型所在供应商」。

### 许可证

MIT。

---

## English

### What it changes

When several providers are configured through API keys, the stock composer model list flattens every provider's models into one long list. This plugin changes that layer:

- Clicking the composer control still opens the same **Model / Effort** rows;
- **Model** now lists providers only, each with a chevron on the right;
- Clicking the provider row (or its chevron) expands that provider's models in place;
- **Search is kept**: a query matches across providers, expands the matching providers automatically, and clearing it restores the accordion;
- **Effort** keeps the original level list.

Every provider starts collapsed.

### Install

Not published to npm. Clone the repository and install the directory through DSH's plugin manager:

1. `git clone https://github.com/The-Mr-Bosco/dsh-model-provider-picker.git`
2. Install that directory from Settings → Plugins, or have a DSH agent call `plugin_manager install_bundle` with the absolute path.
3. Enable the plugin and refresh the page once.

This is a profile-level plugin: it applies to every session in the current DSH profile and disappears when disabled.

### Compatibility

- Developed and verified on DeepSeek Harness Desktop `0.2.1-rc.3`;
- Requires the shipped `@deepseek-ai/dsh-client-ui-model-selection` and `@deepseek-ai/dsh-client-ui-conversation` plugins;
- Replaces only the composer seat; the `/model` command popup stays stock.

### How it works

`conversation.input.model` is a `single` slot. The shipped seat registers at `priority: 0`; this plugin registers at `priority: -1`, and the slot renders the lowest priority. Data still flows through the official channel:

- `ctx.remote.session.modelCatalog()` for provider groups, models, and reasoning levels;
- `ctx.remote.session.selectModel()` to persist the session's selection;
- the current selection comes from the session's `modelSelection` projection via the slot's `useProjection`.

The plugin stores no model state of its own, so switching behavior, authorization, and failures match the shipped control.

### Known limitations

- Only the composer control; the `/model` popup is unchanged;
- Keyboard support covers Escape, arrow keys, and the basic Enter/Tab path, not the full shipped focus trap;
- Provider rows do not show model counts, only a marker for the provider holding the current model.

### License

MIT.
