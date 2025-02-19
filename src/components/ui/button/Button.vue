<script setup lang="ts">
import type { PrimitiveProps } from 'radix-vue'
import type { HTMLAttributes } from 'vue'
import type { ButtonVariants } from '.'
import { cn } from '@/lib/utils'
import { Primitive } from 'radix-vue'
import { buttonVariants } from '.'
import { computed } from 'vue'

interface Props extends PrimitiveProps {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
  type: 'button',
  variant: 'default',
  size: 'default'
});

const emit = defineEmits<{
  click: [event: MouseEvent]
}>();

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', event);
  }
};

// 计算 class
const computedClass = computed(() => {
  return cn(buttonVariants({ variant: props.variant, size: props.size }), props.class);
});
</script>

<template>
  <Primitive
    :as="as"
    :type="type"
    :class="computedClass"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot />
  </Primitive>
</template>
