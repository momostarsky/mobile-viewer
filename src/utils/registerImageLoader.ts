import { registerImageLoader } from '@cornerstonejs/core';
import { customDicomLoader } from './customDicomLoader';

// 注册你的 loader
registerImageLoader('rawdicom', customDicomLoader);