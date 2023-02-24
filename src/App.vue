<template>
  <div class="tc">
    <a-modal
      v-model:visible="visible"
      title="计算公式"
      @ok="visible = false"
      width="80%"
    >
      <div class="formula-code-content">
        <div class="entity-props-block">
          <a-collapse
            v-model:activeKey="entityActiveKey"
            :bordered="false"
            accordion
          >
            <template #expandIcon="{ isActive }">
              <caret-right-outlined :rotate="isActive ? 90 : 0" />
            </template>
            <a-collapse-panel key="1" header="实体属性">
              <div class="collapse-list-block">
                <div
                  class="collapse-list-item"
                  v-for="item in entityFields"
                  @click="insertEntity(item)"
                  :key="item.code"
                >
                  {{ item.name }}
                </div>
              </div>
            </a-collapse-panel>
          </a-collapse>
        </div>

        <div class="code-mirror-block">
          <code-mirror
            @ready="onReady"
            :extensions="extensions"
            ref="mirrorRef"
            placeholder="例如:SUM(数值1,数值2)"
          >
            <pre></pre>
          </code-mirror>
          <div v-if="funInfo?.detail" class="desc">
            <p>函数示例:{{ funInfo?.example }}</p>
            <p>函数说明:{{ funInfo?.info }}</p>
          </div>
          <a-button @click="getResult">获取结果</a-button>
        </div>
        <div class="formula-block">
          <a-collapse
            v-model:activeKey="formulaActiveKey"
            :bordered="false"
            accordion
          >
            <template #expandIcon="{ isActive }">
              <caret-right-outlined :rotate="isActive ? 90 : 0" />
            </template>
            <a-collapse-panel key="1" header="函数列表">
              <div class="collapse-list-block">
                <div
                  class="collapse-list-item"
                  v-for="item in formulaFunctions"
                  :key="item.label"
                  @mouseover="getFunDesc(item)"
                  @click="insertFormula(item)"
                >
                  {{ item.label }}
                </div>
              </div>
            </a-collapse-panel>
          </a-collapse>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, type Ref } from "vue";
import CodeMirror from "vue-codemirror6";
import { CaretRightOutlined } from "@ant-design/icons-vue";
import {
  autocompletion,
  closeBrackets,
  type Completion,
  pickedCompletion,
} from "@codemirror/autocomplete";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  MatchDecorator,
  WidgetType,
} from "@codemirror/view";
import { entityFields } from "./entityFields";
import formulaFunctions from "./function";
import { getCalFormulaValue } from "./utils";
let editView = ref<EditorView>();
const visible = ref(true);
const entityActiveKey = ref(["1"]);
const formulaActiveKey = ref(["1"]);
const funInfo = ref();
const mirrorRef = ref();

function onReady({ view }: { view: Ref<EditorView> }) {
  editView.value = view.value;
}
let formModel: Record<string, any> = {
  product_price: 10,
  product_shuliang: 2,
  order_number: "No124",
};

function getResult() {
  let range = mirrorRef.value.getRange();
  let abc = getCalFormulaValue(range, formModel);

  console.log(abc);
}
/**
 * 插入实体属性
 * @param item
 */
function insertEntity(item: any) {
  mirrorRef.value.replaceSelection(`{${item.code}}`);
  editView.value?.focus();
}

function insertFormula(item: any) {
  mirrorRef.value.replaceSelection(`${item.label}()`);
  let cursor = getCursor();
  mirrorRef.value.setSelection(cursor - 1);
  editView.value?.focus();
}
/***
 * 获取光标位置
 */
function getCursor() {
  return editView.value?.state.selection.main.head || 0;
}

function getFunDesc(item: Completion) {
  funInfo.value = item;
}

//公式
let formulaCompletions: Completion[] = formulaFunctions.map((item) => {
  return {
    ...item,
    apply: (
      view: EditorView,
      completion: Completion,
      from: number,
      to: number
    ) => {
      view.dispatch({
        changes: {
          from,
          to,
          insert: `${completion.label}()`,
        },
      });
      let cursor = getCursor();
      view.dispatch({
        selection: { anchor: cursor - 1 },
        annotations: pickedCompletion.of(completion),
      });
    },
  };
});

//实体
let entityCompletions: Completion[] = entityFields.map((item) => {
  return {
    label: item.code,
    type: "variable",
    detail: item.name,
    apply: `{${item.code}}`,
  };
});

/**
 * code自动提示
 * @param context
 */
function autoCompletions(context: any) {
  let before = context.matchBefore(/\w+/);
  if (!context.explicit && !before) return null;

  return {
    from: before ? before.from : context.pos,
    options: [...formulaCompletions, ...entityCompletions],
    validFor: /^\w*$/,
  };
}

class PlaceholderWidget extends WidgetType {
  name: string;
  constructor(name: any) {
    super();
    this.name = name;
  }
  eq(other: any) {
    return this.name == other.name;
  }
  toDOM() {
    let elt = document.createElement("span");
    elt.style.cssText = `
      box-sizing: border-box;
      margin: 0 6px 0 0;
      color: #000000d9;
      list-style: none;
      display: inline-block;
      height: auto;
      padding: 0 6px;
      font-size: 14px;
      line-height: 20px;
      white-space: nowrap;
      border: 1px solid #d9d9d9;
      border-radius: 2px;
      color: #096dd9;
      background: #e6f7ff;
      border-color: #91d5ff;
    `;
    elt.textContent = this.name;
    return elt;
  }
  ignoreEvent() {
    return false;
  }
}

const placeholderMatcher = new MatchDecorator({
  regexp: /\{(\w+)\}/g,
  decoration: (match) => {
    let label = match[1];
    let res = entityFields.find((item) => item.code == match[1]);
    if (res) {
      label = res.name;
    }
    return Decoration.replace({
      widget: new PlaceholderWidget(label),
    });
  },
});

const placeholders = ViewPlugin.fromClass(
  class {
    placeholders: DecorationSet;
    constructor(view: EditorView) {
      this.placeholders = placeholderMatcher.createDeco(view);
    }
    update(update: ViewUpdate) {
      this.placeholders = placeholderMatcher.updateDeco(
        update,
        this.placeholders
      );
    }
  },
  {
    decorations: (instance) => instance.placeholders,
    provide: (plugin) =>
      EditorView.atomicRanges.of((view) => {
        return view.plugin(plugin)?.placeholders || Decoration.none;
      }),
  }
);

const extensions = [
  autocompletion({ override: [autoCompletions] }),
  closeBrackets(),
  placeholders,
];
</script>
<style lang="less">
.ant-collapse-content {
  background-color: #fff !important;
}
.formula-code-content {
  display: flex;
  height: 550px;
  .entity-props-block {
    width: 250px;
  }
  .code-mirror-block {
    flex: 1;
    margin: 0 10px;
    .desc {
      margin-top: 10px;
      font-size: 12px;
      p {
        color: #999;
        margin: 0;
        padding: 2px;
      }
    }
  }
  .formula-block {
    width: 200px;
  }

  .collapse-list-block {
    height: 500px;
    overflow: scroll;
    .collapse-list-item {
      padding: 8px 10px;
      cursor: pointer;
      &:hover {
        background: #e6f7ff;
        color: #1890ff;
      }
    }
  }
}

.cm-editor {
  height: 100px;
}
.vue-codemirror {
  border: 1px solid #efefef;
  height: 100px;
}
</style>
