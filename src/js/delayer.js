// updateすると
// objectがtargetの姿勢に近づくやつ
// カメラの追尾とかに
// delayは0〜1

export default class Delayer {
  constructor({object, target, delay}) {
    this.object = object
    this.target = target
    this.delay = delay
  }

  update() {
    const diff = (
        Math.abs(this.object.position.x - this.target.position.x)
      + Math.abs(this.object.position.y - this.target.position.y)
      + Math.abs(this.object.position.z - this.target.position.z)
    )

    if(diff < .1) {
      return
    }

    this.object.position.multiplyScalar(-1 + 1 / this.delay)
    this.object.position.add(this.target.position)
    this.object.position.multiplyScalar(this.delay)
    this.object.quaternion.slerp(this.target.quaternion, this.delay)
  }
}
