const PIXEL = 4
const ALPHA = 3
type Rect = {
    x: number,
    y: number,
    w: number,
    h: number
}

function findNonTransparentPixels(imageData) {
    const pixels: number[] = []
    for (let i = 0; i < imageData.data.length / PIXEL; i += 1) {
        if (imageData.data[i*PIXEL+ALPHA] !== 0) {
        pixels.push(i)
        }
    }
    return pixels
}

function fastGroupTogether<T>(things: T[], shouldBelongTo) {
    let groups: Set<T>[] = []
    for(const thing of things) {
      const matchingGroups = groups.filter(group => 
        shouldBelongTo(thing, group))
      const nonMatchingGroups = groups.filter(group => 
        !matchingGroups.includes(group))
      if (matchingGroups.length >= 1) {
        groups = nonMatchingGroups
        const newGroup = matchingGroups.reduce((a, b) => new Set([...a, ...b]), new Set())
        newGroup.add(thing)
        groups.push(newGroup)
      }else {
        groups.push(new Set([thing]))
      }
    }
    return groups
  }

function groupTogetherAdjacentPixels(pixels, width) {
    function above(pixel) {
      return pixel - width
    }
    function below(pixel) {
      return pixel + width
    }
    function left(pixel) {
      return pixel%width===0 ? null : pixel - 1
    }
    function right(pixel) {
      return (pixel+1)%width===0 ? null : pixel + 1
    }
    function neighbors(pixel, allowDiagonal=true) {
      const n = [above(pixel), below(pixel), left(pixel), right(pixel)]
      if (allowDiagonal) {
        n.push(above(left(pixel)), above(right(pixel)), below(left(pixel)), below(right(pixel)))
      }
      return n.filter(n => n !== null)
    }
    return fastGroupTogether(pixels, (pixel, group)=> 
      neighbors(pixel).some(n => group.has(n)))
}
function rectFromGroup(group, width) {
    const x = group.reduce((min, pixel) => Math.min(min, pixel%width), Infinity)
    const y = group.reduce((min, pixel) => 
      Math.min(min, Math.floor(pixel/width)), Infinity)
    const w = group.reduce((max, pixel) => 
      Math.max(max, pixel%width), -Infinity) - x + 1
    const h = group.reduce((max, pixel) => 
      Math.max(max, Math.floor(pixel/width)), -Infinity) - y + 1
    return {x, y, w, h}
}
function rectOnRect(rect0: Rect, rect1: Rect) {
    return !(rect0.x >= rect1.x + rect1.w || 
        rect0.x + rect0.w <= rect1.x ||
        rect0.y >= rect1.y + rect1.h ||
        rect0.y + rect0.h <= rect1.y)
}
function joinIntersectingRects(rects: Rect[]) {
  function groupRect(rectGroup):Rect {
    rectGroup = [...rectGroup]
    if (rectGroup.length === 0) {
      return {x: Infinity, y: Infinity, w: 0, h: 0}
    }
    return rectGroup.reduce((a,b) => {
      const x = Math.min(a.x, b.x)
      const y = Math.min(a.y, b.y)
      const w = Math.max(a.x + a.w, b.x + b.w) - x
      const h = Math.max(a.y + a.h, b.y + b.h) - y
      return {x, y, w, h}
    })
  }
    const groups = fastGroupTogether(rects, (rect, group) => rectOnRect(groupRect(group), rect))
    return groups.map(groupRect)
}

function joinIntersectingRectsUntilNoMore(rects: Rect[]) {
    let newRects = rects
    let oldRects: Rect[] = []
    while (newRects.length !== oldRects.length) {
        oldRects = newRects
        newRects = joinIntersectingRects(newRects)
    }
    return newRects
}
function centerOfMass(pixels: number[], width: number) {
    const pixelPositions = pixels.map(pixel => ({x: pixel%width, y: Math.floor(pixel/width)}))
    const x = Math.round(pixelPositions.reduce((sum, pixel) => sum + pixel.x, 0) / pixels.length)
    const y = Math.round(pixelPositions.reduce((sum, pixel) => sum + pixel.y, 0) / pixels.length)
    return {x, y}
}
type FrameAlignment = {
    frameXs: number[],
    frameYs: number[],
    frameW: number,
    frameH: number
}
/*
const frameAlignmentStrategies = {
    centerOfMass(pixelGroups: number[][], rects: Rect[], width: number): FrameAlignment {
        const centers = pixelGroups.map(x=>centerOfMass(x, width))

        const lefts = centers.map((center,i)=>center.x - rects[i].x)
        const rights = centers.map((center,i)=>rects[i].x + rects[i].w - center.x)
        const tops = centers.map((center,i)=>center.y - rects[i].y)
        const bottoms = centers.map((center,i)=>rects[i].y + rects[i].h - center.y)

        return (function(frameLeft, frameRight, frameTop, frameBottom) {
            return ({
                frameXs: lefts.map(left => frameLeft - left),
                frameYs: tops.map(top => frameTop - top),
                frameW: frameLeft + frameRight,
                frameH: frameTop + frameBottom
            })
        })(Math.max(...lefts), Math.max(...rights), 
            Math.max(...tops), Math.max(...bottoms))
    }
}
*/
const singleDimensionFrameAlignmentStrategies = {
  centerOfMass(pixelGroups: number[][], rects: Rect[], width: number, dimension: 'x' | 'y'): {positions: number[], size: number} {
    const centers = pixelGroups.map(x=>centerOfMass(x, width))
    const befores = centers.map((center,i)=>center[dimension] - rects[i][dimension])
    const afters = centers.map((center,i)=>rects[i][dimension] + rects[i][dimension === 'x' ? 'w' : 'h'] - center[dimension])
    return (function(before, after) {
      return ({positions: befores.map(x=> before - x), size: before + after})
    })(Math.max(...befores), Math.max(...afters))
  },
  absolute(_: number[][], rects: Rect[], _2: number, dimension: 'x' | 'y'): {positions: number[], size: number} {
    const start = Math.min(...rects.map(rect => rect[dimension]))
    const end = Math.max(...rects.map(rect => rect[dimension] + (dimension === 'x' ? rect.w : rect.h)))
    return {positions: rects.map(rect => rect[dimension] - start), size: end - start}
  }
}
const frameAlignmentStrategies = {
  centerOfMass(pixelGroups: number[][], rects: Rect[], width: number): FrameAlignment {
    const h = singleDimensionFrameAlignmentStrategies.centerOfMass(pixelGroups, rects, width, 'x')
    const v = singleDimensionFrameAlignmentStrategies.centerOfMass(pixelGroups, rects, width, 'y')
    return {
      frameXs: h.positions,
      frameYs: v.positions,
      frameW: h.size,
      frameH: v.size
    }
  },
  mixed(pixelGroups: number[][], rects: Rect[], width: number): FrameAlignment {
    const h = singleDimensionFrameAlignmentStrategies.centerOfMass(pixelGroups, rects, width, 'x')
    const v = singleDimensionFrameAlignmentStrategies.absolute(pixelGroups, rects, width, 'y')
    return {
      frameXs: h.positions,
      frameYs: v.positions,
      frameW: h.size,
      frameH: v.size
    }
  }
}

function cleanedUpSheet(pixelGroups: number[][], rects: Rect[], input, frameAlignmentStrategy: (pixelGroups: number[][], rects: Rect[], width: number) => FrameAlignment) {
    const width = input.width
    const alignment = frameAlignmentStrategy(pixelGroups, rects, width)
    const output = document.createElement('canvas')
    output.width = alignment.frameW * rects.length
    output.height = alignment.frameH
    const ctx = output.getContext('2d')
    rects.forEach(({x,y,w,h}, i) => {
        const frameX = alignment.frameXs[i]
        const frameY = alignment.frameYs[i]
        ctx!.drawImage(input, x, y, w, h, frameX + alignment.frameW * i, frameY, w, h)
    })
    return output
}
export {findNonTransparentPixels, rectOnRect, fastGroupTogether, rectFromGroup, groupTogetherAdjacentPixels, joinIntersectingRectsUntilNoMore, cleanedUpSheet, frameAlignmentStrategies}