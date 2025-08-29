import {createApp} from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import {configManager} from './configManager';


async function initApp() {
    try {
        // 在应用启动时加载配置
        console.log('Loading application configuration...');
        const config = await configManager.loadConfig();
        // 将配置设置为全局变量
        (window as any).APP_CONFIG = config;
        // 创建并挂载应用
        const app = createApp(App).use(router);
        // 也可以通过 provide 提供配置给 Vue 组件
        app.provide('appConfig', config);
        app.mount('#app');
    } catch (_) {
        // 即使配置加载失败也启动应用
        const app = createApp(App).use(router);
        app.mount('#app');
    }
}

// 启动应用
initApp().then(_ => {
});
