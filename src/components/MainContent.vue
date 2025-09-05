<!-- src/components/MainContent.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useStudyStore } from '../stores/studyStore'; // 引入 store
import { ElMessage } from 'element-plus'
import {
  volumeLoader,
  RenderingEngine,
  Enums as csEnums,
  setVolumesForViewports,
  getRenderingEngine,
} from "@cornerstonejs/core";
import {
  ToolGroupManager,
  addTool,
  Enums as cstEnums,
  synchronizers,
  SynchronizerManager,
  PanTool,
  DragProbeTool,
  WindowLevelTool,
  ZoomTool,
  StackScrollTool,
  PlanarRotateTool,
} from "@cornerstonejs/tools";
import initCornerstone from "../cornerstone/helper/initCornerstone";
import getTestImageId from "../cornerstone/helper/getTestImageId";
import destoryCS from "../cornerstone/helper/destoryCS";
import useLoading from "../hooks/useLoading";

// 使用 store 获取 studyUid
const studyStore = useStudyStore();

const {
  createCameraPositionSynchronizer,
  createVOISynchronizer,
  createZoomPanSynchronizer,
  createImageSliceSynchronizer,
} = synchronizers;

const volumeId = "my_volume_id";
const renderingEngineId = "my_renderingEngine";
const viewportId1 = "CT_AXIAL";
const viewportId2 = "CT_SAGITTAL";
const viewportId3 = "CT_CORONAL";
const viewportId4 = 'STACK'
const groupId = "group_id";
const cameraSynchronizerId = 'cameraSynchronizerId';
const voiSynchronizerId = 'voiSynchronizerId';
const zoomSynchronizerId = 'zoomSynchronizerId';
const imageSliceSynchronizerId = 'imageSliceSynchronizerId';

const baseTools = [
  {
    tool: PanTool,
    zh: '平移工具',
  }, {
    tool: DragProbeTool,
    zh: '探针工具',
  }, {
    tool: WindowLevelTool,
    zh: '窗宽窗距调整工具',
  }, {
    tool: ZoomTool,
    zh: '缩放',
  }, {
    tool: StackScrollTool,
    zh: '鼠标点击及拖动切换层级',
  }, {
    tool: PlanarRotateTool,
    zh: '2D旋转工具',
  },
]
const syncTools = [
  {
    id: cameraSynchronizerId,
    label: '相机同步',
  }, {
    id: voiSynchronizerId,
    label: '窗宽窗位同步',
  }, {
    id: zoomSynchronizerId,
    label: '缩放同步',
  }, {
    id: imageSliceSynchronizerId,
    label: '滚动同步',
  },
]

const checkedTool = ref(PanTool.toolName)
const checkedSync = ref('');
const syncVPList = ref([false, false, false, false]);

onMounted(() => {
  init();
});

onBeforeUnmount(() => {
  destoryCS(renderingEngineId, groupId);
});
async function init() {
  try {


    // 显示加载状态
    ElMessage({
      message: '正在初始化图像数据...',
      type: 'info',
    });

    console.log('Study UID from store:', studyStore.studyUid);

    // 获取图像ID
    let imageIds =await getTestImageId();

    console.log('Image IDs count:', imageIds ? imageIds.length : 0);

    // 检查 imageIds 是否有效
    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      const errorMsg = '未能加载任何图像数据，请检查数据源配置';
      console.error(errorMsg);
      ElMessage({
        message: errorMsg,
        type: 'error',
      });
      return;
    }

    // 注册同步器
    createSynchronizer();

    // 全局注册工具
    // addTools();
    // step1: 准备一个渲染引擎 => renderingEngine
    const renderingEngine = new RenderingEngine(renderingEngineId);


    // 激活默认激动的工具
    // activeDefaultTools();
    //
    // // step7: 渲染图像
    // renderingEngine.renderViewports([viewportId1, viewportId2, viewportId3, viewportId4]);

    // 初始化成功提示
    ElMessage({
      message: '图像加载成功',
      type: 'success',
    });
  } catch (error) {
    console.error('Initialization error:', error);
    ElMessage({
      message: `初始化失败: ${error.message || '未知错误'}`,
      type: 'error',
    });
  }
}

function addTools() {
  const toolGroup = ToolGroupManager.createToolGroup(groupId);

  baseTools.forEach(item => {
    // 向全局中添加工具
    addTool(item.tool);

    // 像工具组中新增工具
    toolGroup.addTool(item.tool.toolName);
  })

  addTool(StackScrollTool);
  toolGroup.addTool(StackScrollTool.toolName);

  // 将工具组与视图绑定
  toolGroup.addViewport(viewportId1, renderingEngineId);
  toolGroup.addViewport(viewportId2, renderingEngineId);
  toolGroup.addViewport(viewportId3, renderingEngineId);
  toolGroup.addViewport(viewportId4, renderingEngineId);

  // step4：禁用默认菜单
  ['element1', 'element2', 'element3'].forEach(id => {
    const dom = document.querySelector(`#${id}`);
    dom.oncontextmenu = () => false;
  })
}

function activeDefaultTools() {
  const toolGroup = ToolGroupManager.getToolGroup(groupId);
  toolGroup.setToolActive(PanTool.toolName, {
    bindings: [{mouseButton: cstEnums.MouseBindings.Primary}],
  });
  toolGroup.setToolActive(StackScrollTool.toolName, {
    bindings: [{mouseButton: cstEnums.MouseBindings.Wheel}],
  })
}

function createSynchronizer() {
  createCameraPositionSynchronizer(cameraSynchronizerId);
  createVOISynchronizer(voiSynchronizerId, {
    syncInvertState: false,
  });
  createZoomPanSynchronizer(zoomSynchronizerId);
  createImageSliceSynchronizer(imageSliceSynchronizerId);
}

function handleChange(toolName) {
  // 切换工具时清空同步器
  checkedSync.value = '';
  syncVPList.value = [false, false, false, false];
  clearSynchronizer();

  if (toolName === ZoomTool.toolName){
    checkedSync.value = zoomSynchronizerId;
  }

  if (toolName === WindowLevelTool.toolName){
    checkedSync.value = voiSynchronizerId;
  }

  const toolGroup = ToolGroupManager.getToolGroup(groupId);

  // 获取当前左键已激活的工具
  const activePrimaryToolName = toolGroup.getActivePrimaryMouseButtonTool();
  if (activePrimaryToolName === toolName) {
    ElMessage({
      message: '当前工具处已于激活状态，点击左键尝试操作',
      type: 'warning',
    })
    return;
  }

  // 禁用掉已激活的工具
  if (activePrimaryToolName) {
    toolGroup.setToolDisabled(activePrimaryToolName);
  }

  // 启用当前选中的工具
  toolGroup.setToolActive(toolName, {
    bindings: [{mouseButton: csEnums.MouseBindings.Primary}],
  });
}

function handleRest() {
  const vps = getRenderingEngine(renderingEngineId)
      .getViewports();
  vps.forEach(item => {
    item.resetProperties();
    item.resetCamera();
    item.render();
  })
}

function handleSyncChange(value) {
}

function handleSyncVPChange(toggle, event) {
  const synchronizer = SynchronizerManager.getSynchronizer(checkedSync.value);
  console.log(toggle)
  console.log(event.target.value)

  if (!synchronizer) {
    return;
  }

  if (toggle) {
    synchronizer.add({
      renderingEngineId,
      viewportId: event.target.value,
    });
  } else {
    synchronizer.remove({
      renderingEngineId,
      viewportId: event.target.value,
    });
  }

}

function clearSynchronizer(){
  [cameraSynchronizerId, voiSynchronizerId, zoomSynchronizerId, imageSliceSynchronizerId].forEach(item => {
    const synchronizer = SynchronizerManager.getSynchronizer(item)
    synchronizer.remove({renderingEngineId, viewportId: viewportId1})
    synchronizer.remove({renderingEngineId, viewportId: viewportId2})
    synchronizer.remove({renderingEngineId, viewportId: viewportId3})
    synchronizer.remove({renderingEngineId, viewportId: viewportId4})
  })
}
</script>

<template>
  <div>
    <h3>基础交互工具及同步器演示<span class="sub-tip"> ( 🔥🔥🔥 如果多次操作后存在无响应的情况，先按 ESC 键，再拖动鼠标 )</span></h3>
    <div id="tip">
      <p>先选择同步器的种类，再选择需要同步的视图，反之则视图无法进行同步</p>
      <p v-if="checkedSync === imageSliceSynchronizerId">
        ‼️说明1：滚动同步只能在相同方向的视图中进行同步
      </p>
    </div>
    <div class="form">
      <div class="form-item">
        <el-button
            type="primary"
            @click="handleRest"
        >
          重置视图
        </el-button>
      </div>
      <div class="form-item">
        <label>交互工具：</label>
        <el-radio-group
            v-model="checkedTool"
            @change="handleChange"
        >
          <el-radio
              v-for="(item, index) in baseTools"
              :key="index"
              class="radio-item"
              :value="item.tool.toolName"
          >
            {{ item.zh }}（{{ item.tool.toolName }}）
          </el-radio>
        </el-radio-group>
      </div>
      <div class="form-item">
        <label>同步器种类：</label>
        <el-radio-group
            v-model="checkedSync"
            @change="handleSyncChange"
        >
          <el-radio
              v-for="(item, index) in syncTools"
              :key="index"
              class="radio-item"
              :value="item.id"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </div>
      <div
          id="syncVp"
          class="form-item"
      >
        <label>同步视图：</label>
        <el-checkbox
            v-model="syncVPList[0]"
            label="Volume CT_AXIAL"
            :value="viewportId1"
            @change="handleSyncVPChange"
        />
        <el-checkbox
            v-model="syncVPList[1]"
            label="Volume CT_SAGITTAL"
            :value="viewportId2"
            :disabled="checkedSync === 'imageSliceSynchronizerId'"
            @change="handleSyncVPChange"
        />
        <el-checkbox
            v-model="syncVPList[2]"
            label="Volume CT_CORONAL"
            :value="viewportId3"
            :disabled="checkedSync === 'imageSliceSynchronizerId'"
            @change="handleSyncVPChange"
        />
        <el-checkbox
            v-model="syncVPList[3]"
            label="STACK"
            :value="viewportId4"
            @change="handleSyncVPChange"
        />
      </div>
    </div>

    <div>
      <div class="title">
        Stack 视图
        <span class="sub-tip">（蓝色背景影像）</span>
      </div>
      <div>
        <div
            id="element4"
            class="cornerstone-item"
            :class="{'checked': syncVPList[3]}"
            element-loading-text="Loading..."
            element-loading-background="rgba(6, 28, 73, 0.2)"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cornerstone-item {
  display: inline-block;
  width: 300px;
  height: 300px;
  margin-top: 20px;
  margin-right: 20px;
  border: 2px solid #96CDF2;
  border-radius: 10px;

  &.checked{
    border: 2px solid #5CC94D;
  }
}

.sub-tip {
  font-size: 14px;
  color: #fff;
}

.title {
  margin-top: 40px;
  font-weight: bold;
}

#tip {
  margin-top: 20px;
  font-size: 14px;
  background: #2c3e50;
  display: inline-block;
  padding: 5px 10px;

  p {
    line-height: 30px;
    color: #eee;
  }
}

.form {
  margin-top: 20px;

  .form-item {
    margin-bottom: 20px;

    label {
      margin-right: 10px;
    }
  }
}
</style>
