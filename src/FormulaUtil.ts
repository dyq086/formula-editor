import { ceil, floor, isNumber } from "lodash";
import { evalExpression, flatten } from "@/utils";

const FormulaUtil = {
  /**
   * 函数使所有以参数形式给出的数字相乘并返回乘积。
   */
  PRODUCT: (...argument: number[]) => {
    const args = flatten(argument, (a: number) => {
      return isNumber(a);
    });
    let b = 1;
    for (let i = 0; i < args.length; i++) {
      b = evalExpression("*", b, args[i]);
    }
    return b;
  },

  /**
   * 函数使所有以参数形式给出的数字相加并返回和。
   */
  SUM: (...argument: number[]) => {
    const args = flatten(argument, (a: number) => {
      return isNumber(a);
    });
    let v = 0;
    for (let i = 0, d = args.length; i < d; ++i) {
      v = evalExpression("+", v, Number(args[i]));
    }
    return v;
  },
  /**
   *返回回将参数 number 向上舍入（沿绝对值增大的方向）为最接近的指定基数的倍数。
   *number: 必需。 要舍入的值。
   *significance: 必需。 要舍入到的倍数。
   */

  ROUNDUP: (n: number, precision?: number | undefined) => {
    if (n === 0) {
      return 0;
    }
    return ceil(n, precision);
  },
  /**
   * 将参数number向下舍入（沿绝对值减小的方向）为最接近的significance的倍数。
   * number: 必需。 要舍入的数值。
   * significance: 必需。 要舍入到的倍数。
   */
  ROUNDDOWN: (n: number, precision?: number | undefined) => {
    if (n === 0) {
      return 0;
    }
    return floor(n, precision);
  },
};
//@ts-ignore
window.FormulaUtil = FormulaUtil;
export default FormulaUtil;
