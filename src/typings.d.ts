declare module 'slash2';
declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.sass';
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.bmp';
declare module '*.tiff';
declare module 'omit.js';
declare module 'numeral';
declare module 'mockjs';
declare module 'react-fittext';
declare module 'classnames';
declare module '*.svga';
declare module '*.mp3';
declare module '*.mp4';
declare module '*.json';
declare module '*.atlas';
declare module '*.tiff';
declare module 'howler';
declare module '@esotericsoftware/*';
declare module '@images/*';

declare const UMI_ENV: string;

// 请求路径
declare const API_BASE_URL: string;
// 图片资源路径
declare const OSS_FILE_URL: string;
// logo资源路径
declare const LOGO_LINE: string;
// 网站标题
declare const HTML_TITLE: string;
// 首页路径
declare const HOME_URL: string;
// 登录地址
declare const LOGIN_URL: string;
// 设计稿宽度
declare const DESIGN_WIDTH: number;
// 礼池管理后台地址
declare const ADMIN_URL: string;

declare namespace API {
  type CurrentUser = {
    username: string;
    avatar?: string;
    userKey?: string;
    userStatus?: number;
    [key: string]: any;
  };
}
