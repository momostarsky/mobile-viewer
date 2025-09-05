// src/router/routes.js
const routes = [
  {
    path: "/",
    redirect: "/dicomViewer2d"
  },
  {
    path: "/dicomViewer2d",
    name: 'DicomViewer2d',
    component: () => import('../components/MainContent.vue'),
    props: route => ({
      studyUid: route.query.study_uid,
      studyUidCamel: route.query.studyUid
    })
  },
  // 添加一个通用路径匹配器，处理带参数的情况
  {
    path: '/dicomViewer2d/:subPath(.*)',
    component: () => import('../components/MainContent.vue'),
    props: route => ({
      studyUid: route.query.study_uid,
      studyUidCamel: route.query.studyUid,
      subPath: route.params.subPath
    })
  },
  // 添加通配符路由处理所有未匹配的路径
  {
    path: '/:pathMatch(.*)*',
    redirect: "/dicomViewer2d"
  }
];

export default routes;
