import _ from "lodash"

export default class RendererStats {
  constructor(renderer) {
    this.dom = document.createElement("div")
    this.renderer = renderer
    this.dom.style.position = "fixed"
    this.dom.style.left = "0"
    this.dom.style.bottom = "0"
    this.dom.style.backgroundColor = "#000"
    this.dom.style.color = "#fff"
    this.dom.style.fontSize = "10px"
    this.dom.style.fontSize = "10px"
    this.dom.style.lineHeight = "12px"
    this.dom.style.padding = "6px"
    this.dom.style.whiteSpace = "pre-wrap"
    this.dom.style.pointerEvents = "none"
    this.dom.style.opacity = "0.5"
    this.lastTime = 0
  }  

  update(time) {
    this.dom.textContent = `fps: ${(100 / (time - this.lastTime) * 1000 | 0) / 100}
memory: 
${_.map(this.renderer.info.memory, (v, key) => `  ${key}: ${v}`).join("\n")}
render:
${_.map(this.renderer.info.render, (v, key) => `  ${key}: ${v}`).join("\n")}
`
    this.lastTime = time
  }
}
