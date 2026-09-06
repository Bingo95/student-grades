export default [
  { path: '/', redirect: '/home' },
  {
    name: 'Page',
    path: '/page',
    component: './Page',
  },
  {
    path: '/home',
    name: '考试成绩记录',
    component: 'Home',
  },
  { path: '*', layout: false, component: './404' },
];
