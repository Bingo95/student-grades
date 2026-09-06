### web 拆分部分代码实现

- app 通过 webView 打开跳转

#### 基本目录结构

```bash
┌─config                配置文件
│  ├─native.router      桥接路由配置
│  ├─router.config      页面路由配置
│  └─config.js          
│─public                静态资源（图标，外部js）
└─src                   
   ├─assert             代码内
   │  ├─constant        统一参数配置&枚举&常量
   │  └─img             代码内图片
   ├─components         通用组件
   ├─layouts            布局
   ├─models             数据流
   ├─pages              页面
   │   ├─Page           全部页面方便调试
   │   └─404             
   ├─services           请求
   └─utils              工具
       ├─utils          工具
       └─bridge         桥接             
```

#### pages/Recharge

支付模块
