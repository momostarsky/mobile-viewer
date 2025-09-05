import {createApp} from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import {configManager} from './configManager';
import {createPinia} from 'pinia'
import initCornerstone from './cornerstone/helper/initCornerstone'
async function initApp() {
    // 创建并挂载应用
    const app = createApp(App)
        .use(createPinia())
        .use(router);
    // 全局注册 Element Plus
    app.use(ElementPlus)

    // 在应用启动时加载配置
    console.log('Loading application configuration...');
    let inijx=  initCornerstone();
    const config = await configManager.loadConfig();
    if (config) {
        // 将配置设置为全局变量
        (window as any).APP_CONFIG = config;
        // 也可以通过 provide 提供配置给 Vue 组件
        app.provide('appConfig', config);
    }
    inijx.then(()=>{
        console.log('Cornerstone initialized');
    })
    app.mount('#app');

}

// 启动应用
initApp().then(_ => {

});
