# 深圳儿童疫苗接种指南

一个帮助家长了解深圳社康儿童疫苗接种信息的交互式页面。

## 功能特性

- **月龄筛选** - 输入宝宝月龄，获取当前应接种的疫苗
- **接种时间轴** - 可视化展示 0-6 岁完整接种时间线
- **免费 vs 自费对比** - 清晰对比一类/二类疫苗，展示替代关系
- **疫苗详情** - 点击查看预防疾病、接种程序、价格、建议等
- **搜索筛选** - 按名称、疾病、分类快速查找
- **响应式设计** - 支持手机、平板、电脑

## 数据来源

- [深圳市卫生健康委员会](https://wjw.sz.gov.cn/ztzl/ymjz/)
- [广东省非免疫规划疫苗接种方案（2024年版）](https://www.yantian.gov.cn/cn/service/yljk/jbyf/ymjzymygh/content/post_11087138.html)
- [国家免疫规划疫苗儿童免疫程序（2021年版）](https://www.nhc.gov.cn/)
- [中华医学会科普文章](https://www.cma.org.cn/)

## 技术栈

- 纯 HTML5 + CSS3 + Vanilla JavaScript
- 无需构建工具，静态部署
- Vercel 风格设计

## 本地开发

```bash
# 使用任意静态服务器
npx serve .
# 或
python -m http.server 8080
```

访问 http://localhost:8080

## 部署

项目已配置 Vercel，直接推送即可自动部署。

## 文件结构

```
├── index.html          # 主页面
├── styles.css          # 样式文件
├── app.js              # 交互逻辑
├── data/
│   └── vaccines.json   # 疫苗数据
├── vercel.json         # Vercel 配置
└── README.md
```

## 免责声明

本页面信息仅供参考，具体接种方案请咨询当地社康中心或医生。

## License

MIT
