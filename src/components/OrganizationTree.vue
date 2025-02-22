<template>
  <div class="org-tree">
    <!-- 部门节点 -->
    <div 
      class="flex p-2 hover:bg-slate-100 cursor-pointer"
      @click="handleClick"
    >
      <!-- 展开/收起图标 -->
      <div class="flex items-center flex-shrink-0">
        <component
          :is="expanded ? ChevronDown : ChevronRight"
          class="w-4 h-4 mr-2 flex-shrink-0"
          v-if="node.children && node.children.length > 0"
        />
        <div v-else class="w-4 h-4 mr-2 flex-shrink-0"></div>
      </div>

      <!-- 部门图标和信息 -->
      <div class="flex-1 min-w-0" :class="{'flex flex-col': node.type !== 2}">
        <div class="flex items-start">
          <div class="flex-shrink-0 w-4 h-4 mr-2 mt-0.5">
            <component 
              :is="getIcon"
              class="w-full h-full"
              :class="{
                'text-purple-500': node.type === 2,
                'text-blue-500': node.type !== 2
              }"
            />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium break-all">{{ node.name }}</div>
            
            <!-- 根节点显示总人数 -->
            <template v-if="node.type === 2">
              <div class="text-xs text-slate-400 flex-shrink-0 mt-0.5" v-if="node.totalUserCount > 0">
                (共{{ node.totalUserCount }}人)
              </div>
            </template>
          </div>
        </div>
        
        <!-- 非根节点显示详细人数信息 -->
        <div v-if="node.type !== 2" class="text-xs text-slate-400 mt-1 ml-6">
          <template v-if="node.userCount > 0">
            <span class="flex-shrink-0">{{ node.userCount }}名成员</span>
            <span v-if="node.totalUserCount > node.userCount" class="flex-shrink-0">
              (含子部门共{{ node.totalUserCount }}人)
            </span>
          </template>
        </div>
      </div>
    </div>

    <!-- 子部门列表 -->
    <div v-if="expanded" class="ml-6 border-l border-slate-200">
      <template v-if="node.children && node.children.length > 0">
        <OrganizationTree
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          @select-department="(node, isExpanded) => $emit('select-department', node, isExpanded)"
          class="relative before:absolute before:w-4 before:h-px before:bg-slate-200 before:left-0 before:top-1/2"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  ChevronDown, 
  ChevronRight, 
  Building2,
  Users 
} from 'lucide-vue-next';
import type { OrganizationNode } from '@/types/api';

const props = defineProps<{
  node: OrganizationNode;
}>();

const emit = defineEmits<{
  (e: 'select-department', department: OrganizationNode, isExpanded: boolean): void;
}>();

const expanded = ref(false);

// 根据节点类型返回不同的图标
const getIcon = computed(() => {
  // 根节点使用 Building2 图标
  if (props.node.type === 2) {
    return Building2;
  }
  // 其他节点统一使用 Users 图标
  return Users;
});

// 处理点击事件
const handleClick = () => {
  // 切换展开状态
  expanded.value = !expanded.value;
  // 触发选择事件，并传递展开状态
  emit('select-department', props.node, expanded.value);
};
</script>

<style scoped>
.org-tree {
  position: relative;
}

/* 子节点的连接线样式 */
.org-tree .org-tree {
  position: relative;
  margin-left: 1rem;
}

.org-tree .org-tree::before {
  content: '';
  position: absolute;
  left: -1rem;
  top: 50%;
  width: 1rem;
  height: 1px;
  background-color: rgb(226, 232, 240);
}
</style> 