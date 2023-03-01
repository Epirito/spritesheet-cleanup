import {rectOnRect, findNonTransparentPixels, groupTogetherAdjacentPixels, rectFromGroup, joinIntersectingRectsUntilNoMore, frameAlignmentStrategies, cleanedUpSheet} from './logic.ts'


window.onload = ()=>{
  const input = document.getElementById('input-file')
  const img = new Image()
  const canvas = document.createElement('canvas')
  const sourceCanvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const sourceCtx = sourceCanvas.getContext('2d')
  sourceCtx.imageSmoothingEnabled = false
  document.body.appendChild(canvas)
  input.addEventListener("change",(e)=>{
    img.src = URL.createObjectURL(e.target.files[0])
    img.onload = async ()=>{
      sourceCanvas.width = img.width
      sourceCanvas.height = img.height
      canvas.width = img.width
      canvas.height = img.height
      sourceCtx.drawImage(img, 0, 0)
      const imageData = sourceCtx.getImageData(0, 0, img.width, img.height)
      const pixels = findNonTransparentPixels(imageData)
      
      ctx.drawImage(img, 0, 0, img.width, img.height)
      const groups = groupTogetherAdjacentPixels(pixels, img.width)
      const rects = groups.map(group => rectFromGroup([...group], img.width))
      const rects2 = joinIntersectingRectsUntilNoMore(rects)
      rects2.forEach(rect => {
        ctx.strokeStyle = 'red'
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h)
      })
      const groupsAfterJoining = rects2.map(rect => {
        const group = new Set()
        groups.forEach((g,i)=>{
          if (rectOnRect(rect, rects[i])) {
            g.forEach(p => group.add(p))
          }
        })
        return group
      })
      document.body.appendChild(
        cleanedUpSheet(groupsAfterJoining.map((x)=>([...x])), rects2, sourceCanvas, 
        frameAlignmentStrategies.mixed))
    }
  })
}