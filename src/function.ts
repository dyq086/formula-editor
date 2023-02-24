export default [
  {
    label: "SUM",
    type: "keyword",
    detail: "SUM函数是一个求和函数",
    info: "SUM({语文成绩},{数学成绩}, {英语成绩})返回三门课程的总分",
    example: "SUM(field1,field2,...)",
  },
  {
    label: "PRODUCT",
    type: "keyword",
    detail: "PRODUCT函数是一个求积函数 ",
    info: "PRODUCT({单价}, {数量})获取总价，也就是单价和数量的乘积",
    example: "PRODUCT(field1,field2,...)",
  },

  {
    label: "ROUNDUP",
    type: "keyword",
    detail: "ROUNDUP参数中向上取整数 ",
    info: "ROUNDUP(v)向上取整数，参数v为数值",
    example: "ROUNDUP(field1,field2,...)",
  },
  {
    label: "ROUNDDOWN",
    type: "keyword",
    detail: "ROUNDDOWN参数中向下取整数",
    info: "ROUNDDOWN(v)向下取整数，参数v为数值",
    example: " ROUNDDOWN(field1,field2,...)",
  },
];
