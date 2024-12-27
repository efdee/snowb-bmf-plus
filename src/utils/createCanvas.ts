export function createCanvas(width: number, height: number) {
  if (typeof window === 'undefined') {
    //console.log('creating canvas using node-canvas')
    //console.log('dims: ', width, height)
    const { createCanvas, loadImage } = require('canvas')
    return createCanvas(width, height)
  } else {
    //console.log('getting canvas from browser')
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  }
}
