import { S } from '@/lib/scene';
import { SceneView } from '@/components/pitch/SceneView';

const demo = S('half', 'A:a:48:34 B:a:68:14 C:a:66:52 D:b:72:30 E:b:80:44 G:k:103:34', [
  ['Başlangıç: A topla, D önünde.', null, 'A'],
  ['A, B\'ye açılan pası verir; B koşusuna başlar.', { B: [78, 12] }, 'B', { z: [{ x: 84, y: 22, w: 16, h: 20, k: 'free', l: 'boş alan' }] }],
  ['C içe koşar, B ortaya çıkar.', { C: [88, 40], A: [58, 34] }, 'C'],
  ['C şutunu çeker.', null, [105, 34], { shot: true }],
]);
const demo2 = S('full', 'A:a:30:34 B:a:55:20 D:b:45:30 E:b:70:40', [
  ['Yerden pas', null, 'A'],
  ['Kaldırarak pas', { B: [62, 18] }, 'B', { air: true }],
  ['B top sürer', { B: [80, 24] }, 'B'],
]);
const demo3 = S('grid', 'A:a:4:10 B:a:16:10 D:b:10:10 c1:c:1:1 c2:c:19:1 c3:c:1:19 c4:c:19:19', [
  ['Başlangıç', null, 'A'],
  ['Pas', null, 'B', { curve: 3 }],
], { w: 20, h: 20 });

export default function Dev() {
  return (
    <div className="container section" style={{ display: 'grid', gap: 40 }}>
      <div style={{ maxWidth: 480 }}><SceneView scene={demo} title="demo" /></div>
      <div style={{ maxWidth: 900 }}><SceneView scene={demo2} title="demo2" /></div>
      <div style={{ maxWidth: 420 }}><SceneView scene={demo3} title="demo3" /></div>
    </div>
  );
}
