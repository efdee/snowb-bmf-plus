import { Rectangle, packing } from './autopacker'

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as unknown as Worker
ctx.addEventListener(
  'message',
  function converter(msg) {
    const { data } = msg
    if (data.length > 1) {
      const list = packing(data as Rectangle[])
      ctx.postMessage(list)
    } else {
      ctx.postMessage(data || [])
    }
  },
  false,
)
