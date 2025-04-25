import './style.css';
import { Renderer } from './renderers/simple-face'

// Canvas要素を生成
const canvas = document.createElement('canvas');
canvas.width = 320;
canvas.height = 240;
canvas.style.display = 'block';
canvas.style.margin = 'auto';
canvas.style.background = '#000';
document.body.innerHTML = '';
document.body.appendChild(canvas);

const renderer = new Renderer({ canvas });

const TICK = 1000 / 60;

let lastUpdate = Date.now();
function animate() {
  if (Date.now() - lastUpdate > TICK) {
    renderer.update();
    lastUpdate = Date.now();
  }
  requestAnimationFrame(animate);
}

animate();
