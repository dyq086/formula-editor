/**
 * 将array递归为一维数组。
 * @param {*} ary
 * @param {*} predicate
 * @param {*} result
 */
import { isNumber, memoize } from "lodash";
import Big from "big.js";
import FormulaUtil from "./FormulaUtil";
import { message, notification } from "ant-design-vue";
/**
 * 数组拍平
 * @param ary
 * @param predicate
 * @param result
 * @returns
 */
export function flatten(
  ary: Array<number>,
  predicate?: Function,
  result?: Array<any>
) {
  result = result || [];
  if (ary) {
    for (let i = 0; i < ary.length; i++) {
      const value = ary[i];
      if (Array.isArray(value)) {
        flatten(value, predicate, result);
      } else {
        (predicate && !predicate(value)) || result.push(value);
      }
    }
  }
  return result;
}
/**
 * 表达式执行器
 * @param op
 * @param left
 * @param right
 * @returns
 */
export function evalExpression(op: string, left: number, right: number) {
  const calcOps = ["+", "-", "*", "/"];
  let result: any;
  if (op === "!") {
    return window.eval(op + "left");
  }
  if (calcOps.indexOf(op) > -1 && isNumber(left) && isNumber(right)) {
    switch (op) {
      case "+":
        result = new Big(left).plus(right);
        break;
      case "-":
        result = new Big(left).minus(right);
        break;
      case "*":
        result = new Big(left).times(right);
        break;
      case "/":
        result = right === 0 ? "" : new Big(left).div(right);
    }
    return result === "" ? null : Number(result.toString());
  }
  return window.eval("left" + op + "right");
}

/**
 * 判断符号是否闭合
 * @param params
 * @param keyCollection
 * @returns
 */
function isCloseBrackets(
  params: string,
  keyCollection = [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
    ["<", ">"],
  ]
) {
  const array = params.split("");
  // 过滤掉不符合要求的单括号
  keyCollection = keyCollection.filter(
    (item) => Array.isArray(item) && item.length === 2
  );
  if (!array.length || !keyCollection.length) return;
  const keyObj: any = {};
  const stack = [];
  const leftKey = [];
  const rightKey = [];
  for (let i = 0; i < keyCollection.length; i++) {
    const [left, right] = keyCollection[i];
    let index = i;
    keyObj[left] = index + 1;
    keyObj[right] = -(index + 1);
    leftKey.push(left);
    rightKey.push(right);
  }
  for (let index = 0; index < array.length; index++) {
    const element = array[index];
    if (keyObj.hasOwnProperty(element) && leftKey.includes(element)) {
      stack.push(keyObj[element]);
    } else if (keyObj.hasOwnProperty(element) && rightKey.includes(element)) {
      const currentKeyObj = keyObj[element];
      const currentLength = stack.length;
      if (currentLength > 0 && stack[currentLength - 1] + currentKeyObj === 0) {
        stack.pop();
      } else {
        stack.push(currentKeyObj);
      }
    }
  }
  return stack.length === 0;
}

/**
 * 公式校验
 * @param formula
 * @returns
 */
export function validateFormula(formula: string): boolean {
  let result = true;
  // 空值
  if (!formula || formula.length === 0) {
    message.error("请输入公式");
    result = false;
    return false;
  }

  if (!isCloseBrackets(formula)) {
    message.error("在字符串符号是否成对输入");
    result = false;
    return false;
  }
  return result;
}

/**
 * 通过公式计算得出结果
 */
export function getCalFormulaValue(
  formula: string,
  formModel?: Record<string, any>
) {
  let verity = true;
  verity = validateFormula(formula);
  if (!verity) {
    return false;
  }
  if (formModel) {
    let reg = /\{(\w+)\}/;
    formula = formula.replace(new RegExp(reg, "g"), (replacer) => {
      let match = replacer.match(new RegExp(reg));
      if (match) {
        let value = formModel[match[1]];
        if (!value) {
          notification.error({
            message: "温馨提示",
            description: `实体不存在该属性:【${match[1]}】`,
          });
          verity = false;
        }

        if (typeof value === "number") {
          return value || 0;
        } else if (typeof value === "string") {
          return JSON.stringify(value) || "";
        }

        return value;
      } else {
        return "";
      }
    });
    if (!verity) {
      return false;
    }
  }
  const d = formula.split(/(\$[0-9a-zA-Z\._]+#[0-9A-Fa-f]*)/g);
  const e: string[] = [];
  let v = "";
  d.forEach((n: string) => e.push(n));
  try {
    v = evalFormula(e.join(""));
  } catch (e) {
    v = "";
  }
  return v;
}

/**
 * 缓存
 */
let evalFormulaMemoize = memoize(() => {
  const b: any = [];
  Object.keys(FormulaUtil).forEach((n) => {
    b.push("var " + n + "=FormulaUtil." + n);
  });
  return b.join(";") + ";";
});
/**
 * 获取eval 执行后结果
 * @returns
 */
export function getEvalFormula() {
  return evalFormulaMemoize();
}

export function evalFormula(a: string) {
  let c = null;
  let env = null;
  try {
    env = getEvalFormula();
    c = new Function(env + "return " + a + ";")();
  } catch (e) {
    message.error("执行公式有误，请检查公式格式");
    console.error(e);
    c = null;
  }
  return c;
}
